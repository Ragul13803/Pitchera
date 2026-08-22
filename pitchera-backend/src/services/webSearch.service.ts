// src/services/webSearch.service.ts
//
// Real web search for Google mode — no API key required.
//
// ── WHY THIS FILE CHANGED ──
// This used to scrape DuckDuckGo's HTML results page
// (html.duckduckgo.com/html/) with cheerio. That page is meant for
// browsers, not servers: DuckDuckGo now gates it behind an interactive
// image CAPTCHA ("select all squares containing a duck") for automated
// traffic. Confirmed live: the exact endpoint this file called returns
// that CAPTCHA challenge, not a "no results" page, regardless of
// User-Agent/headers/retries — from cloud IPs (like Render's) AND from
// unrelated non-residential networks in general. No request-shaping can
// solve an image CAPTCHA server-side, so scraping that page can never be
// made reliable in production. It was not a config/env/CORS problem.
//
// This now calls two official, keyless, unlimited-for-reasonable-use JSON
// APIs instead of scraping an HTML page:
//   1. DuckDuckGo's Instant Answer API (api.duckduckgo.com) — a real,
//      documented, bot-tolerant JSON endpoint (different from the HTML
//      page above). Strong for "who/what is X" / company / person
//      queries, backed mostly by Wikipedia's abstract data.
//   2. Wikipedia's search API (en.wikipedia.org/w/api.php) — free,
//      unlimited, no key, no CAPTCHA. Broadens coverage for general
//      knowledge queries.
//
// KNOWN LIMITATION: neither source indexes the general web or job boards,
// so job-listing queries (JOB_QUERY_PATTERN in googleSearch.service.ts)
// will usually return few or no real openings — that is a genuine
// capability gap of every free/unlimited/keyless search API, not a bug
// here. A real job-search result set would require a paid/rate-limited
// provider (Google Custom Search JSON API, Bing, SerpAPI, etc.).

import { WebSearchResult } from '../types/chat.types';

const DDG_IA_URL = 'https://api.duckduckgo.com/';
const WIKIPEDIA_URL = 'https://en.wikipedia.org/w/api.php';
const SEARCH_TIMEOUT_MS = 10_000;
const USER_AGENT = 'PitcheraApp/1.0 (+https://pitchera.netlify.app)';

function log(...args: unknown[]) {
  console.log('[webSearch]', ...args);
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

async function fetchJson(url: string, label: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (networkErr: any) {
      log(
        `${label} NETWORK ERROR after ${Date.now() - startedAt}ms:`,
        networkErr.name,
        networkErr.message,
      );
      const err: any = new Error(
        `${label} request failed: ${networkErr.name === 'AbortError' ? 'timed out' : networkErr.message}`,
      );
      err.code = 'SEARCH_NETWORK_ERROR';
      err.cause = networkErr;
      throw err;
    }

    log(
      `${label} response: status=${response.status} ok=${response.ok} elapsedMs=${Date.now() - startedAt}`,
    );

    if (!response.ok) {
      const bodySnippet = await response.text().catch(() => '');
      log(`${label} non-OK body (first 300 chars):`, bodySnippet.slice(0, 300));
      const err: any = new Error(`${label} responded with ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.code = 'SEARCH_HTTP_ERROR';
      throw err;
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchInstantAnswer(query: string): Promise<WebSearchResult[]> {
  const url = `${DDG_IA_URL}?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const data = await fetchJson(url, 'DuckDuckGo Instant Answer');
  const results: WebSearchResult[] = [];

  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL,
      content: data.AbstractText,
    });
  }

  const topics: any[] = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  for (const topic of topics) {
    // RelatedTopics can nest a "Topics" group instead of being a leaf entry.
    const entries = Array.isArray(topic.Topics) ? topic.Topics : [topic];
    for (const entry of entries) {
      if (entry.FirstURL && entry.Text) {
        results.push({
          title: entry.Text.split(' - ')[0].slice(0, 120),
          url: entry.FirstURL,
          content: entry.Text,
        });
      }
    }
  }

  return results;
}

async function fetchWikipedia(query: string, limit: number): Promise<WebSearchResult[]> {
  const url =
    `${WIKIPEDIA_URL}?action=query&list=search&format=json&srlimit=${limit}` +
    `&srsearch=${encodeURIComponent(query)}`;
  const data = await fetchJson(url, 'Wikipedia search');
  const hits: any[] = data?.query?.search ?? [];

  return hits.map((hit) => ({
    title: hit.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
    content: stripHtml(hit.snippet || ''),
  }));
}

export async function searchWeb(
  query: string,
  maxResults = 6,
): Promise<WebSearchResult[]> {
  const [instantAnswer, wikipedia] = await Promise.allSettled([
    fetchInstantAnswer(query),
    fetchWikipedia(query, maxResults),
  ]);

  if (instantAnswer.status === 'rejected') {
    log(`Instant Answer source failed for query="${query}":`, instantAnswer.reason?.message);
  }
  if (wikipedia.status === 'rejected') {
    log(`Wikipedia source failed for query="${query}":`, wikipedia.reason?.message);
  }

  // Both real sources failed outright (network/HTTP error) — a genuine
  // provider-availability failure, not a "no results" case. Surface it
  // loudly instead of returning an empty array as if the search succeeded.
  if (instantAnswer.status === 'rejected' && wikipedia.status === 'rejected') {
    const err: any = new Error(
      `All web search sources failed: ${instantAnswer.reason?.message}; ${wikipedia.reason?.message}`,
    );
    err.code = instantAnswer.reason?.code || wikipedia.reason?.code || 'SEARCH_HTTP_ERROR';
    throw err;
  }

  const combined = [
    ...(instantAnswer.status === 'fulfilled' ? instantAnswer.value : []),
    ...(wikipedia.status === 'fulfilled' ? wikipedia.value : []),
  ];

  const seen = new Set<string>();
  const deduped = combined.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  log(
    `query="${query}": instantAnswer=${instantAnswer.status} wikipedia=${wikipedia.status} ` +
      `combined=${combined.length} deduped=${deduped.length}`,
  );

  return deduped.slice(0, maxResults);
}
