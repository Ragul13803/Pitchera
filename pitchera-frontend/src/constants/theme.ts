/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#EEF2FF',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  white: '#FFFFFF',
  black: '#000000',
  
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Dark mode
  darkBackground: '#0F172A',
  darkSurface: '#1E293B',
  darkBorder: '#334155',
  darkText: '#F1F5F9',
  darkTextSecondary: '#94A3B8',
};

export const StatusColors: Record<string, string> = {
  draft: '#6B7280',
  scheduled: '#F59E0B',
  sent: '#10B981',
  failed: '#EF4444',
  interview: '#3B82F6',
  rejected: '#EF4444',
  selected: '#10B981',
  offer: '#8B5CF6',
  pending: '#F59E0B',
  sending: '#3B82F6',
  cancelled: '#6B7280',
};

export const StatusBgColors: Record<string, string> = {
  draft: '#F3F4F6',
  scheduled: '#FEF3C7',
  sent: '#D1FAE5',
  failed: '#FEE2E2',
  interview: '#DBEAFE',
  rejected: '#FEE2E2',
  selected: '#D1FAE5',
  offer: '#EDE9FE',
  pending: '#FEF3C7',
  sending: '#DBEAFE',
  cancelled: '#F3F4F6',
};

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
