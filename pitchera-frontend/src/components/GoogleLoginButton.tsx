import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';

interface GoogleLoginButtonProps {
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
}

export default function GoogleLoginButton({ onLoading, disabled }: GoogleLoginButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { request, response, promptAsync } = useGoogleAuth();

  React.useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
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

        console.log('Google auth successful:', result.user.email);
        router.replace('/(app)/dashboard');
      } catch (error: any) {
        console.error('Google auth error:', error);
        Alert.alert('Authentication Failed', error?.message || 'Failed to authenticate');
      } finally {
        setLoading(false);
        onLoading?.(false);
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Error', 'Google authentication failed');
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert('Error', 'Google Sign-In is not ready yet');
      return;
    }

    try {
      await promptAsync();
    } catch (error) {
      console.error('Error initiating Google login:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        pressed && !loading && !disabled && styles.buttonPressed,
        (loading || disabled || !request) && styles.buttonDisabled,
      ]}
      onPress={handleGoogleLogin}
      disabled={loading || disabled || !request}
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