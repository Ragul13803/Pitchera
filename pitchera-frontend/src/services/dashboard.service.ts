import api from './api';
import { DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<{ data: DashboardStats } | DashboardStats>('/dashboard');
    if ('data' in response && response.data) return response.data;
    return response as DashboardStats;
  },
};