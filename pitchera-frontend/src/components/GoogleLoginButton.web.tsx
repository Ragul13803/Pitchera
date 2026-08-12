import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
}

export default function GoogleLoginButton({ onLoading, disabled }: GoogleLoginButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [googleLoaded, setGoogleLoaded] = React.useState(false);

  React.useEffect(() => {
    loadGoogleScript();
  }, []);

  const loadGoogleScript = () => {
    // Check if already loaded
    if (window.google?.accounts) {
      setGoogleLoaded(true);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
      initializeGoogle();
    };
    document.body.appendChild(script);
  };

  const initializeGoogle = () => {
    if (!window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  };

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    onLoading?.(true);

    try {
      const { credential } = response;

      if (!credential) {
        Alert.alert('Error', 'No credential received from Google');
        return;
      }

      // Authenticate with backend
      const result = await authService.googleMobileAuth({
        idToken: credential,
      });

      console.log('Google auth successful:', result.user.email);
      
      // Navigate to dashboard
      router.replace('/(app)/dashboard');
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      const errorMessage = error?.message || 'Failed to authenticate with Google';
      Alert.alert('Authentication Failed', errorMessage);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleLoaded || !window.google?.accounts) {
      Alert.alert('Error', 'Google Sign-In is not ready yet');
      return;
    }

    try {
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Error showing Google prompt:', error);
      Alert.alert('Error', 'Failed to open Google Sign-In');
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        pressed && !loading && !disabled && styles.buttonPressed,
        (loading || disabled || !googleLoaded) && styles.buttonDisabled,
      ]}
      onPress={handleGoogleLogin}
      disabled={loading || disabled || !googleLoaded}
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