import api from './api';
import { ApiResponse, AuthTokens, User, LoginRequest, SignupRequest } from '../types';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  token?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    const token = response.accessToken || response.token || '';
    return {
      tokens: {
        accessToken: token,
        refreshToken: response.refreshToken,
      },
      user: response.user,
    };
  },

  async signup(data: SignupRequest): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    const token = response.accessToken || response.token || '';
    return {
      tokens: {
        accessToken: token,
        refreshToken: response.refreshToken,
      },
      user: response.user,
    };
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },

  async getGoogleAuthUrl(): Promise<string> {
    const response = await api.get<{ url: string }>('/auth/google');
    return response.url;
  },

  async handleGoogleCallback(code: string): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<LoginResponse>('/auth/google/callback', { code });
    const token = response.accessToken || response.token || '';
    return {
      tokens: {
        accessToken: token,
        refreshToken: response.refreshToken,
      },
      user: response.user,
    };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User } | User>('/auth/me');
    if ('user' in response) return response.user;
    return response as User;
  },
};