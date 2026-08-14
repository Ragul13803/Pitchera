import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { Colors } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

interface GoogleLoginButtonProps {
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
}

export default function GoogleLoginButton({
  onLoading,
  disabled,
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response) {
      handleResponse();
    }
  }, [response]);

  const handleResponse = async () => {
    if (response?.type === 'success') {
      setLoading(true);
      onLoading?.(true);

      try {
        const { id_token } = response.params;

        if (!id_token) {
          Alert.alert('Error', 'No ID token received from Google');
          return;
        }

        const result = await authService.googleMobileAuth({
          idToken: id_token,
        });

        console.log('✅ Google auth successful:', result.user.email);
        router.replace('/(app)/dashboard');
      } catch (error: any) {
        console.error('Google auth error:', error);

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
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google authentication failed');
    }
  };

  const handlePress = async () => {
    if (!request) {
      Alert.alert('Error', 'Google Sign-In is not ready yet');
      return;
    }
    await promptAsync();
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
        <ActivityIndicator size="small" color={Colors.primary} />
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
    backgroundColor: '#FFFFFF',
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