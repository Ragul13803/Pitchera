import api from './api';
import { Profile } from '../types';

export const profileService = {
  async getProfile(): Promise<Profile> {
    const response = await api.get<{ data: Profile } | Profile>('/profile');
    if ('data' in response && response.data) return response.data;
    return response as Profile;
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await api.put<{ data: Profile } | Profile>('/profile', data);
    if ('data' in response && response.data) return response.data;
    return response as Profile;
  },

  async patchProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await api.patch<{ data: Profile } | Profile>('/profile', data);
    if ('data' in response && response.data) return response.data;
    return response as Profile;
  },

  async getProfileCompletion(): Promise<{ percentage: number; missingSections: string[] }> {
    const response = await api.get<{ percentage: number; missingSections: string[] } | { data: { percentage: number; missingSections: string[] } }>('/profile/completion');
    if ('data' in response && response.data) return response.data;
    return response as { percentage: number; missingSections: string[] };
  },

  async uploadResume(formData: FormData): Promise<{ url: string; filename: string; size: number; uploadedAt: string }> {
    const response = await api.upload<{ data: { url: string; filename: string; size: number; uploadedAt: string } } | { url: string; filename: string; size: number; uploadedAt: string }>('/profile/resume', formData);
    if ('data' in response && response.data) return response.data;
    return response as { url: string; filename: string; size: number; uploadedAt: string };
  },

  async deleteResume(): Promise<void> {
    await api.delete('/profile/resume');
  },

  async extractResume(formData: FormData): Promise<Partial<Profile>> {
    const response = await api.upload<{ data: Partial<Profile> } | Partial<Profile>>('/profile/resume/extract', formData);
    if ('data' in response && response.data) return response.data;
    return response as Partial<Profile>;
  },

  async uploadProfilePhoto(formData: FormData): Promise<{ url: string }> {
    const response = await api.upload<{ data: { url: string } } | { url: string }>('/profile/photo', formData);
    if ('data' in response && response.data) return response.data;
    return response as { url: string };
  },
};