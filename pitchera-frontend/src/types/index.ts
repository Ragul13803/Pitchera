// export interface User {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   avatarUrl?: string;
//   currentJobTitle?: string;
// }

// export interface Profile {
//   phone?: string;
//   location?: string;
//   currentJobTitle?: string;
//   currentCompany?: string;
//   totalExperience?: string;
//   relevantExperience?: string;
//   noticePeriod?: string;
//   currentSalary?: string;
//   expectedSalary?: string;
//   preferredLocations?: string;
//   employmentType?: string;
//   summary?: string;
// }

// export interface SocialLinks {
//   linkedin?: string;
//   github?: string;
//   portfolio?: string;
// }

// export interface Skill {
//   id?: number;
//   type: "technical" | "soft" | "language";
//   name: string;
// }

// export interface Education {
//   id?: number;
//   level: "10th" | "12th" | "diploma" | "bachelor" | "master" | "other";
//   institution: string;
//   degree?: string;
//   fieldOfStudy?: string;
//   startDate?: string;
//   endDate?: string;
//   grade?: string;
// }

// export interface Experience {
//   id?: number;
//   company: string;
//   designation: string;
//   startDate: string;
//   endDate?: string;
//   currentlyWorking: boolean;
//   description?: string;
//   technologies?: string;
// }

// export interface Project {
//   id?: number;
//   name: string;
//   description?: string;
//   technologies?: string;
//   projectUrl?: string;
//   githubUrl?: string;
// }

// export interface Certification {
//   id?: number;
//   name: string;
//   organization: string;
//   issueDate?: string;
//   credentialUrl?: string;
// }

// export interface Resume {
//   id: number;
//   originalFilename: string;
//   fileSize: number;
//   mimeType: string;
//   isPrimary: boolean;
//   createdAt: string;
// }

// export interface JobApplication {
//   id: number;
//   companyName: string;
//   jobTitle: string;
//   jobUrl?: string;
//   jobDescription?: string;
//   status: JobStatus;
//   appliedAt?: string;
//   createdAt: string;
//   emailCount?: number;
//   recruiterName?: string;
//   recruiterEmail?: string;
// }

// export type JobStatus =
//   | "draft"
//   | "scheduled"
//   | "sent"
//   | "failed"
//   | "interview"
//   | "rejected"
//   | "selected"
//   | "offer";

// export interface EmailLog {
//   id: number;
//   recipientName?: string;
//   recipientEmail: string;
//   subject: string;
//   body?: string;
//   status: EmailStatus;
//   sentAt?: string;
//   createdAt: string;
//   errorMessage?: string;
//   companyName?: string;
//   jobTitle?: string;
// }

// export type EmailStatus =
//   | "pending"
//   | "sending"
//   | "sent"
//   | "failed"
//   | "cancelled";

// export interface ScheduledEmail {
//   id: number;
//   recipientName?: string;
//   recipientEmail: string;
//   subject: string;
//   status: string;
//   scheduledAt: string;
//   sentAt?: string;
//   retryCount: number;
//   companyName?: string;
//   jobTitle?: string;
// }

// export interface Recruiter {
//   name: string;
//   email: string;
// }

// export interface GmailStatus {
//   connected: boolean;
//   gmailAddress: string | null;
// }

// export interface ProfileCompletion {
//   percentage: number;
//   sections: {
//     basic: boolean;
//     professional: boolean;
//     contact: boolean;
//     skills: boolean;
//     education: boolean;
//     experience: boolean;
//     projects: boolean;
//     certifications: boolean;
//     socialLinks: boolean;
//     resume: boolean;
//   };
//   weights: Record<string, number>;
// }

// export interface DashboardStats {
//   stats: {
//     totalApplications: number;
//     emailsSent: number;
//     scheduledEmails: number;
//     failedEmails: number;
//   };
//   recentApplications: JobApplication[];
//   upcomingScheduled: ScheduledEmail[];
//   gmailStatus: GmailStatus;
// }

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  gmailConnected?: boolean;
  gmailEmail?: string;
  createdAt?: string;
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

// Profile Types
export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  grade?: string;
  description?: string;
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Profile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  totalExperience?: number;
  relevantExperience?: number;
  noticePeriod?: string;
  currentSalary?: string;
  expectedSalary?: string;
  preferredLocations?: string[];
  employmentType?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  languages?: string[];
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  certifications?: Certification[];
  resumeUrl?: string;
  resumeFilename?: string;
  resumeSize?: number;
  resumeUploadedAt?: string;
  completionPercentage?: number;
  missingSections?: string[];
}

// Job Application Types
export interface Recruiter {
  id?: string;
  name: string;
  email: string;
}

export interface JobApplication {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl?: string;
  jobDescription?: string;
  recruiters?: Recruiter[];
  recruiterName?: string;
  recruiterEmail?: string;
  status: string;
  appliedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  emailTemplate?: string;
  customEmail?: string;
}

// Email Types
export interface EmailRecord {
  id: string;
  jobApplicationId?: string;
  recipientEmail: string;
  recipientName?: string;
  company: string;
  position: string;
  subject: string;
  body?: string;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt?: string;
  error?: string;
}

export interface ScheduledEmail {
  id: string;
  jobApplicationId?: string;
  recipientEmail: string;
  recipientName?: string;
  company: string;
  position: string;
  scheduledAt: string;
  status: string;
  timezone?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalApplications?: number;
  jobsApplied?: number;
  emailsSent?: number;
  scheduledEmails?: number;
  failedEmails?: number;
  profileCompletion?: number;
  recentApplications?: JobApplication[];
  upcomingScheduled?: ScheduledEmail[];
  gmailConnected?: boolean;
  gmailEmail?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Email Template Types
export interface EmailTemplate {
  id?: string;
  subject: string;
  body: string;
  isDefault?: boolean;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';