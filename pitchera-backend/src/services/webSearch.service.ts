// src/services/webSearch.service.ts
//
// Real web search for Google mode — no API key required. Fetches
// DuckDuckGo's public HTML results page (html.duckduckgo.com/html/) and
// parses real titles/URLs/snippets with cheerio. This is an unofficial,
// keyless endpoint (not a documented API with an SLA) — the tradeoff for
// needing zero signup/credentials.
//
// KNOWN FAILURE MODE (this is what broke in production): DuckDuckGo can
// respond 200 OK with a bot-check/anomaly page instead of real results —
// this happens far more often from shared/datacenter IPs (e.g. Render,
// AWS, GCP) than from a home/dev IP, since those ranges are heavily used
// by scrapers and get flagged. A 200 with zero `.result` elements used to
// be silently treated as "no results found", which is indistinguishable
// from a genuine empty search from the caller's point of view. This file
// now explicitly detects that case, logs the raw signal, and throws a
// distinct, loud error instead of returning an empty array.

import * as cheerio from 'cheerio';
import { WebSearchResult } from '../types/chat.types';

const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';
const SEARCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Substrings DuckDuckGo's bot-check / anomaly page is known to contain.
// Checked case-insensitively against the raw HTML when zero results are
// parsed, to distinguish "we got blocked" from "genuinely no results".
const BLOCK_PAGE_MARKERS = [
  'anomaly',
  'unusual traffic',
  'detected automated',
  'automated requests',
  'captcha',
  'verify you are a human',
  'access denied',
  'blocked',
];

// DuckDuckGo's own legitimate "nothing matched your query" markers —
// presence of these (with zero .result elements) means it's a real empty
// search, not a block, so we should NOT throw in that case.
const GENUINE_NO_RESULTS_MARKERS = [
  'no results',
  "didn't return any results",
];

function log(...args: unknown[]) {
  console.log('[webSearch]', ...args);
}

/** DuckDuckGo's HTML results wrap outbound links in a /l/?uddg=<encoded> redirect. */
function resolveResultUrl(href: string): string | null {
  try {
    const absolute = href.startsWith('//') ? `https:${href}` : href;
    const url = new URL(absolute, 'https://duckduckgo.com');

    if (url.hostname.endsWith('duckduckgo.com') && url.pathname === '/l/') {
      const real = url.searchParams.get('uddg');
      return real ? decodeURIComponent(real) : null;
    }

    return /^https?:\/\//i.test(absolute) ? absolute : null;
  } catch {
    return null;
  }
}

export async function searchWeb(
  query: string,
  maxResults = 6,
): Promise<WebSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  const startedAt = Date.now();

  try {
    let response: Response;
    try {
      response = await fetch(`${DDG_HTML_URL}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
    } catch (networkErr: any) {
      // Network-level failure (DNS, TLS, connection refused, egress
      // blocked, abort/timeout) — never silently swallow this.
      log(
        `NETWORK ERROR for query="${query}" after ${Date.now() - startedAt}ms:`,
        networkErr.name,
        networkErr.message,
      );
      const err: any = new Error(
        `Web search request failed: ${networkErr.name === 'AbortError' ? 'timed out' : networkErr.message}`,
      );
      err.code = 'SEARCH_NETWORK_ERROR';
      err.cause = networkErr;
      throw err;
    }

    log(
      `response for query="${query}": status=${response.status} ok=${response.ok} ` +
        `content-type=${response.headers.get('content-type')} elapsedMs=${Date.now() - startedAt}`,
    );

    if (!response.ok) {
      const bodySnippet = await response.text().catch(() => '');
      log(`non-OK response body snippet (first 300 chars):`, bodySnippet.slice(0, 300));
      const err: any = new Error(
        `Web search responded with ${response.status}: ${response.statusText}`,
      );
      err.status = response.status;
      err.code = 'SEARCH_HTTP_ERROR';
      throw err;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: WebSearchResult[] = [];

    $('.result').each((_, el) => {
      if (results.length >= maxResults) return;

      const titleEl = $(el).find('.result__title a.result__a').first();
      const href = titleEl.attr('href');
      const title = titleEl.text().trim();
      if (!href || !title) return;

      const url = resolveResultUrl(href);
      if (!url) return;

      const content = $(el).find('.result__snippet').first().text().trim();
      results.push({ title, url, content });
    });

    log(
      `parsed query="${query}": htmlLength=${html.length} resultElements=${$('.result').length} ` +
        `usableResults=${results.length}`,
    );

    if (results.length === 0) {
      const lowerHtml = html.toLowerCase();
      const isGenuineEmpty = GENUINE_NO_RESULTS_MARKERS.some((m) => lowerHtml.includes(m));
      const blockMarker = BLOCK_PAGE_MARKERS.find((m) => lowerHtml.includes(m));

      if (!isGenuineEmpty && (blockMarker || html.length < 2000)) {
        // Either an explicit bot-check marker was found, or the response
        // is suspiciously short for a real results page (DDG's normal
        // results page is tens of KB) — almost certainly a soft block,
        // not a real empty search. Log the evidence and fail loudly
        // instead of reporting "no results" as if the search succeeded.
        log(
          `SUSPECTED BLOCK/CAPTCHA for query="${query}": htmlLength=${html.length}, ` +
            `matchedMarker=${blockMarker ?? '(none — html too short to be a real results page)'}`,
        );
        log(`blocked-response HTML snippet (first 500 chars):`, html.slice(0, 500));

        const err: any = new Error(
          'Web search appears to be blocked (received an unexpected page instead of search results). ' +
            'This commonly happens when the search provider blocks requests from a hosting/datacenter IP.',
        );
        err.code = 'SEARCH_BLOCKED';
        throw err;
      }

      log(`genuine zero-results for query="${query}" (no block markers found).`);
    }

    return results;
  } finally {
    clearTimeout(timer);
  }
}
