// src/types/chat.types.ts

export type ChatMode = 'ai' | 'google';

export interface ChatMessagePayload {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

export interface StoredMessage {
  role:      'user' | 'assistant';
  content:   string;
  mode:      ChatMode;
  timestamp: string; // ISO-8601
}

export interface ChatRequest {
  mode:    ChatMode;
  message: string;
  history?: ChatMessagePayload[];
  userProfile?: {
    name?:       string;
    skills?:     string[];
    experience?: string;
    location?:   string;
  };
}

export interface RateLimitRow {
  id:            number;
  user_id:       number;
  window_start:  Date;
  request_count: number;
  created_at:    Date;
  updated_at:    Date;
}

/* ── Google (web search) mode ── */

export interface WebSearchResult {
  title:   string;
  url:     string;
  content: string;
}

export interface GoogleSearchAnswer {
  type:    'search';
  query:   string;
  answer:  string;
  sources: Array<{ title: string; url: string }>;
}

export interface GoogleJobsAnswer {
  type:    'jobs';
  query:   string;
  answer:  string;
  jobs: Array<{
    title:      string;
    company:    string;
    location:   string;
    experience: string;
    url:        string;
    source:     string;
  }>;
}

export type GoogleModeResult = GoogleSearchAnswer | GoogleJobsAnswer;

