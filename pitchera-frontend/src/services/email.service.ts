import api from './api';
import { EmailRecord, ScheduledEmail, PaginatedResponse } from '../types';

export interface SendEmailRequest {
  jobApplicationId: string;
  recruiters?: Array<{ name: string; email: string }>;
  subject?: string;
  body?: string;
  useDefaultTemplate?: boolean;
}

export interface ScheduleEmailRequest extends SendEmailRequest {
  scheduledAt: string;
  timezone: string;
}

export const emailService = {
  async sendEmail(data: SendEmailRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/emails/send', data);
    return response;
  },

  async scheduleEmail(data: ScheduleEmailRequest): Promise<{ success: boolean; message: string; scheduled: ScheduledEmail }> {
    const response = await api.post<{ success: boolean; message: string; scheduled: ScheduledEmail }>('/emails/schedule', data);
    return response;
  },

  async getEmailHistory(query?: { page?: number; limit?: number; status?: string }): Promise<EmailRecord[] | PaginatedResponse<EmailRecord>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.status) params.append('status', query.status);

    const qs = params.toString();
    const endpoint = qs ? `/emails?${qs}` : '/emails';

    const response = await api.get<{ data: EmailRecord[] | PaginatedResponse<EmailRecord> } | EmailRecord[] | PaginatedResponse<EmailRecord>>(endpoint);
    if ('data' in response && response.data) return response.data as EmailRecord[] | PaginatedResponse<EmailRecord>;
    return response as EmailRecord[] | PaginatedResponse<EmailRecord>;
  },

  async getEmail(id: string): Promise<EmailRecord> {
    const response = await api.get<{ data: EmailRecord } | EmailRecord>(`/emails/${id}`);
    if ('data' in response && response.data) return response.data;
    return response as EmailRecord;
  },

  async getScheduledEmails(): Promise<ScheduledEmail[]> {
    const response = await api.get<{ data: ScheduledEmail[] } | ScheduledEmail[]>('/emails/scheduled');
    if ('data' in response && response.data) return response.data;
    return response as ScheduledEmail[];
  },

  async cancelScheduledEmail(id: string): Promise<void> {
    await api.delete(`/emails/scheduled/${id}`);
  },

  async rescheduleEmail(id: string, scheduledAt: string, timezone: string): Promise<ScheduledEmail> {
    const response = await api.put<{ data: ScheduledEmail } | ScheduledEmail>(`/emails/scheduled/${id}`, { scheduledAt, timezone });
    if ('data' in response && response.data) return response.data;
    return response as ScheduledEmail;
  },

  async previewEmail(data: SendEmailRequest): Promise<{ subject: string; body: string; to: string }> {
    const response = await api.post<{ data: { subject: string; body: string; to: string } } | { subject: string; body: string; to: string }>('/emails/preview', data);
    if ('data' in response && response.data) return response.data;
    return response as { subject: string; body: string; to: string };
  },
};