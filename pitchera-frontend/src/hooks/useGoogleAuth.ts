import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
};

export function useGoogleAuth() {
  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: GOOGLE_CONFIG.webClientId,
      iosClientId: GOOGLE_CONFIG.iosClientId,
      androidClientId: GOOGLE_CONFIG.androidClientId,
    });

  return {
    request,
    response,
    promptAsync,
    isWeb: Platform.OS === 'web',
  };
}

export { GOOGLE_CONFIG };