import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import api from '@/services/api';
import { ApiError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Loading } from './ui/Loading';
import Toast from 'react-native-toast-message';

interface GoogleLoginButtonProps {
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
}

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AuthData {
  accessToken: string;
  refreshToken?: string;
  user: any;
}

export default function GoogleLoginButton({
  onLoading,
  disabled,
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // ✅ Get login function from context

  const redirectUri = makeRedirectUri({
    scheme: 'pitcherafrontend',
    path: '/',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      handleSuccess(response.params.id_token);
    } else if (response.type === 'error') {
      console.error('❌ Google OAuth error:', response.error);
      Alert.alert('Authentication Error', 'Google sign-in failed. Please try again.');
    } else if (response.type === 'cancel') {
      console.log('ℹ️ Google sign-in cancelled by user');
    }
  }, [response]);

  const handleSuccess = async (idToken: string | undefined) => {
    if (!idToken) {
      Alert.alert('Error', 'No ID token received from Google');
      return;
    }

    setLoading(true);
    onLoading?.(true);

    try {
      console.log('🔵 Sending ID token to backend...');

      // ✅ Call API directly and properly unwrap response
      const response = await api.post<ApiWrapper<AuthData>>(
        '/auth/google/mobile',
        { idToken }
      );

      console.log('📦 Backend response:', response);

      const authData = response.data;

      if (!authData?.accessToken || !authData?.user) {
        throw new Error('Invalid response from server');
      }

      // ✅ Use AuthContext's login method - this updates BOTH storage AND React state
      await login(
        {
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
        },
        authData.user
      );

      console.log('✅ Google auth successful for web:', authData.user.email);

      Toast.show({
        type: "success",
        text1: "Login Successful",
      });
      
      // Navigate to dashboard
      router.replace('/(app)/dashboard');
    } catch (error: any) {
      console.error('Google auth backend error:', error);

      let errorMessage = 'Failed to authenticate with Google';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Authentication Failed', errorMessage);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  const handlePress = async () => {
    if (!request) {
      Alert.alert('Not Ready', 'Google Sign-In is not ready yet. Please wait.');
      return;
    }

    try {
      console.log('🚀 Starting Google auth...');
      await promptAsync();
    } catch (error) {
      console.error('Error starting Google auth:', error);
      Alert.alert('Error', 'Failed to start Google Sign-In');
    }
  };

  const isDisabled = loading || disabled || !request;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {loading ? (
        <Loading message="Loading..." />
       ) : (
        <>
          <Image
            source={require('@/assets/images/google.png')}
            style={styles.googleLogo}
            resizeMode="contain"
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    backgroundColor: '#2666ddff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  googleLogo: {
    width: 22,
    height: 22,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});