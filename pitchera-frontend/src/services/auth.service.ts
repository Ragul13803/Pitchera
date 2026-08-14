import api from './api';
import { AuthTokens, User, LoginRequest, SignupRequest } from '../types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'pitchera_access_token';
const REFRESH_TOKEN_KEY = 'pitchera_refresh_token';
const USER_KEY = 'pitchera_user';

// ✅ This matches your backend's actual response wrapper
interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface GoogleAuthRequest {
  idToken: string;
}

const storage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

async function saveAuthData(tokens: AuthTokens, user: User): Promise<void> {
  console.log('💾 Saving auth data:', { 
    hasToken: !!tokens.accessToken, 
    hasUser: !!user 
  });

  if (!tokens.accessToken) {
    console.error('⚠️ No access token to save!');
    return;
  }

  await storage.set(TOKEN_KEY, tokens.accessToken);
  
  if (tokens.refreshToken) {
    await storage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
  
  if (user) {
    await storage.set(USER_KEY, JSON.stringify(user));
  }

  console.log('✅ Auth data saved successfully');
}

export const authService = {
  async login(
    data: LoginRequest
  ): Promise<{ tokens: AuthTokens; user: User }> {
    // ✅ Unwrap the response properly
    const response = await api.post<ApiWrapper<AuthData>>('/auth/(auth)/login', data);
    
    const authData = response.data;
    const tokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    };

    await saveAuthData(tokens, authData.user);

    return { tokens, user: authData.user };
  },

  async signup(
    data: SignupRequest
  ): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<ApiWrapper<AuthData>>('/auth/register', data);
    
    const authData = response.data;
    const tokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    };

    await saveAuthData(tokens, authData.user);

    return { tokens, user: authData.user };
  },

  // ===== Google Mobile/Web Auth =====
  async googleMobileAuth(
    data: GoogleAuthRequest
  ): Promise<{ tokens: AuthTokens; user: User }> {
    console.log('🔵 Calling Google mobile auth endpoint...');
    
    // ✅ Unwrap the response properly
    const response = await api.post<ApiWrapper<AuthData>>(
      '/auth/google/mobile',
      data
    );

    console.log('📦 Raw response:', response);

    const authData = response.data;
    
    if (!authData || !authData.accessToken) {
      console.error('❌ Invalid auth data structure:', response);
      throw new Error('Invalid response from server');
    }

    const tokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    };

    await saveAuthData(tokens, authData.user);

    return { tokens, user: authData.user };
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/(auth)/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await storage.get(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      await storage.remove(TOKEN_KEY);
      await storage.remove(REFRESH_TOKEN_KEY);
      await storage.remove(USER_KEY);
    }
  },

  async getGoogleAuthUrl(): Promise<string> {
    const response = await api.get<ApiWrapper<{ url: string }>>('/auth/google');
    return response.data.url;
  },

  async handleGoogleCallback(
    code: string
  ): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<ApiWrapper<AuthData>>(
      '/auth/google/callback',
      { code }
    );

    const authData = response.data;
    const tokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    };

    await saveAuthData(tokens, authData.user);

    return { tokens, user: authData.user };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiWrapper<User>>('/auth/me');
    return response.data;
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const userStr = await storage.get(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.get(TOKEN_KEY);
    return !!token;
  },
};