// src/services/webSearch.service.ts
//
// Real web search for Google mode — no API key required. Fetches
// DuckDuckGo's public HTML results page (html.duckduckgo.com/html/) and
// parses real titles/URLs/snippets with cheerio. This is an unofficial,
// keyless endpoint (not a documented API with an SLA) — the tradeoff for
// needing zero signup/credentials. If DuckDuckGo changes its markup or
// blocks a request, searchWeb() throws and Google mode reports a clear
// "search unavailable" error rather than guessing.

import * as cheerio from 'cheerio';
import { WebSearchResult } from '../types/chat.types';

const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';
const SEARCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

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

  try {
    const response = await fetch(`${DDG_HTML_URL}?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      const err: any = new Error(
        `Web search responded with ${response.status}: ${response.statusText}`,
      );
      err.status = response.status;
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

    return results;
  } finally {
    clearTimeout(timer);
  }
}
