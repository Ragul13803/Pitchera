import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen }: LoadingProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={Colors.primary} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
}

export function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width,
          height: height || 16,
          backgroundColor: Colors.gray200,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    justifyContent: 'center',
  },
  inlineMessage: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});