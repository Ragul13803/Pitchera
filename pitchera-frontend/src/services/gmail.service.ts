import api from './api';

export interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export const gmailService = {
  async getStatus(): Promise<GmailStatus> {
    const response = await api.get<{ data: GmailStatus } | GmailStatus>('/gmail/status');
    if ('data' in response && response.data) return response.data;
    return response as GmailStatus;
  },

  async getAuthUrl(): Promise<string> {
    const response = await api.get<{ url: string } | { data: { url: string } }>('/gmail/auth');
    if ('data' in response && response.data) return (response.data as { url: string }).url;
    return (response as { url: string }).url;
  },

  async handleCallback(code: string): Promise<GmailStatus> {
    const response = await api.post<{ data: GmailStatus } | GmailStatus>('/gmail/callback', { code });
    if ('data' in response && response.data) return response.data;
    return response as GmailStatus;
  },

  async disconnect(): Promise<void> {
    await api.delete('/gmail/disconnect');
  },
};