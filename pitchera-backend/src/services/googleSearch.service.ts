// src/services/googleSearch.service.ts
//
// Google-mode pipeline:
//   query -> searchWeb() (real web search) -> build a results context
//         -> callNvidiaForSearch() (same existing NVIDIA model, grounded
//            in the search results, no conversation history) -> structured
//            response.
//
// Source URLs in the response ALWAYS come straight from the raw search
// results, never from the model's own text — this is what guarantees
// "never invent facts, companies, people, jobs, or URLs" even if the
// model tries to.

import { searchWeb } from './webSearch.service';
import { callNvidiaForSearch } from './nvidia.service';
import { SYSTEM_PROMPTS } from '../config/nvidia';
import {
  WebSearchResult,
  GoogleModeResult,
  GoogleSearchAnswer,
  GoogleJobsAnswer,
} from '../types/chat.types';

const JOB_QUERY_PATTERN =
  /\b(job|jobs|developer|engineer|hiring|vacanc(y|ies)|opening|openings|position|role|intern|internship|recruiter)\b/i;

function isJobQuery(query: string): boolean {
  return JOB_QUERY_PATTERN.test(query);
}

function buildResultsContext(results: WebSearchResult[]): string {
  if (results.length === 0) {
    return 'No web search results were found for this query.';
  }
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`.trim())
    .join('\n\n');
}

/* ─────────────────────────────────────────────────────────
   General "who/what/company/person" queries
───────────────────────────────────────────────────────── */
async function answerGeneralQuery(
  query:   string,
  results: WebSearchResult[],
): Promise<GoogleSearchAnswer> {
  const context = buildResultsContext(results);

  const { reply } = await callNvidiaForSearch(
    SYSTEM_PROMPTS.google,
    `User query: "${query}"\n\nWeb search results:\n${context}\n\nAnswer the user's query using only the results above.`,
  );

  return {
    type: 'search',
    query,
    answer: reply,
    sources: results.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
  };
}

/* ─────────────────────────────────────────────────────────
   Job-search queries — ask the model to extract structured
   listings, then verify every URL against the real results
   before returning anything (defense in depth against a
   hallucinated URL, on top of the system prompt's own rule).
───────────────────────────────────────────────────────── */
async function answerJobQuery(
  query:   string,
  results: WebSearchResult[],
): Promise<GoogleJobsAnswer> {
  const context = buildResultsContext(results);
  const validUrls = new Set(results.map((r) => r.url));

  const { reply } = await callNvidiaForSearch(
    SYSTEM_PROMPTS.google,
    `User is searching for jobs: "${query}"\n\nWeb search results:\n${context}\n\n` +
      `Extract real job openings from the results above. Respond with ONLY a JSON array ` +
      `(no prose, no markdown fences) of objects shaped like:\n` +
      `{"title": "...", "company": "...", "location": "...", "experience": "...", "url": "..."}\n` +
      `The "url" field must be copied EXACTLY from one of the result URLs above — never invent one. ` +
      `Use "" for any field you cannot determine. If no real openings are in the results, return [].`,
  );

  let parsed: any[] = [];
  try {
    const cleaned = reply.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const candidate = JSON.parse(cleaned);
    if (Array.isArray(candidate)) parsed = candidate;
  } catch {
    parsed = [];
  }

  const jobs = parsed
    .filter((j) => j && typeof j.url === 'string' && validUrls.has(j.url))
    .slice(0, 8)
    .map((j) => ({
      title:      String(j.title ?? ''),
      company:    String(j.company ?? ''),
      location:   String(j.location ?? ''),
      experience: String(j.experience ?? ''),
      url:        j.url as string,
      source:     new URL(j.url).hostname.replace(/^www\./, ''),
    }));

  // No raw-results fallback here: `results` now comes from knowledge
  // sources (DuckDuckGo Instant Answer + Wikipedia), not a general web
  // index, so an unmatched raw result is rarely an actual job posting —
  // presenting it as one would be misleading rather than merely
  // low-detail. If the model found nothing that matches a real result
  // URL, that honestly means no job openings were found.
  const finalJobs = jobs;

  return {
    type: 'jobs',
    query,
    answer: finalJobs.length > 0
      ? `Found ${finalJobs.length} relevant listing${finalJobs.length === 1 ? '' : 's'}.`
      : 'No matching job openings were found in the search results.',
    jobs: finalJobs,
  };
}

/* ─────────────────────────────────────────────────────────
   Entry point used by chat.controller.ts for mode === 'google'
───────────────────────────────────────────────────────── */
export async function performGoogleSearch(query: string): Promise<GoogleModeResult> {
  const results = await searchWeb(query, 6);

  return isJobQuery(query)
    ? answerJobQuery(query, results)
    : answerGeneralQuery(query, results);
}
