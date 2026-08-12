import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  // For web, we'll use a different approach
};

export function useGoogleAuth() {
  // For native platforms (won't use this on web yet)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CONFIG.webClientId,
  });

  return {
    request,
    response,
    promptAsync,
    isWeb: Platform.OS === 'web',
  };
}

export { GOOGLE_CONFIG };