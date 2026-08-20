// Auth Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Job Application Types (matches GET /applications/getAllApplications)
export type AppStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'failed'
  // | 'interview'
  // | 'rejected'
  // | 'selected'
  // | 'offer'
  ;

export interface ApplicationRecipient {
  name: string | null;
  email: string;
  status: string;
}

export interface JobApplication {
  id: number;
  companyName: string;
  jobTitle: string;
  jobUrl: string | null;
  status: AppStatus;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: ApplicationRecipient[];
  recipientCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  errorMessage: string | null;
}

// Email Template Types (matches GET/POST /emails/templates)
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  is_default: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';
