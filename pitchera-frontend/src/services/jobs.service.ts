import api from './api';
import { JobApplication, PaginatedResponse } from '../types';

export interface JobsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const jobsService = {
  async getJobs(query?: JobsQuery): Promise<JobApplication[] | PaginatedResponse<JobApplication>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    const endpoint = qs ? `/jobs?${qs}` : '/jobs';

    const response = await api.get<{ data: JobApplication[] | PaginatedResponse<JobApplication> } | JobApplication[] | PaginatedResponse<JobApplication>>(endpoint);
    
    if ('data' in response && response.data) return response.data as JobApplication[] | PaginatedResponse<JobApplication>;
    return response as JobApplication[] | PaginatedResponse<JobApplication>;
  },

  async getJob(id: string): Promise<JobApplication> {
    const response = await api.get<{ data: JobApplication } | JobApplication>(`/jobs/${id}`);
    if ('data' in response && response.data) return response.data;
    return response as JobApplication;
  },

  async createJob(data: Partial<JobApplication>): Promise<JobApplication> {
    const response = await api.post<{ data: JobApplication } | JobApplication>('/jobs', data);
    if ('data' in response && response.data) return response.data;
    return response as JobApplication;
  },

  async updateJob(id: string, data: Partial<JobApplication>): Promise<JobApplication> {
    const response = await api.put<{ data: JobApplication } | JobApplication>(`/jobs/${id}`, data);
    if ('data' in response && response.data) return response.data;
    return response as JobApplication;
  },

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async getDefaultTemplate(): Promise<{ subject: string; body: string }> {
    const response = await api.get<{ data: { subject: string; body: string } } | { subject: string; body: string }>('/jobs/email-template/default');
    if ('data' in response && response.data) return response.data;
    return response as { subject: string; body: string };
  },
};