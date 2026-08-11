import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, AuthTokens } from '../types';

const TOKEN_KEY = 'pitchera_access_token';
const REFRESH_TOKEN_KEY = 'pitchera_refresh_token';
const USER_KEY = 'pitchera_user';

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await secureGet(TOKEN_KEY);
      const userJson = await secureGet(USER_KEY);

      if (token && userJson) {
        setAccessToken(token);
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (tokens: AuthTokens, userData: User) => {
    await secureSet(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      await secureSet(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    await secureSet(USER_KEY, JSON.stringify(userData));
    setAccessToken(tokens.accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await secureDelete(TOKEN_KEY);
    await secureDelete(REFRESH_TOKEN_KEY);
    await secureDelete(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (userData: User) => {
    await secureSet(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return await secureGet(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken && !!user,
        login,
        logout,
        updateUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}