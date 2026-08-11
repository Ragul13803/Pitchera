import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { StatusColors, StatusBgColors } from '@/constants/theme';

interface BadgeProps {
  label: string;
  status?: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export function Badge({ label, status, color, bgColor, style }: BadgeProps) {
  const resolvedColor = color || (status ? StatusColors[status.toLowerCase()] : '#6B7280');
  const resolvedBg = bgColor || (status ? StatusBgColors[status.toLowerCase()] : '#F3F4F6');

  return (
    <View style={[styles.badge, { backgroundColor: resolvedBg }, style]}>
      <Text style={[styles.text, { color: resolvedColor }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return <Badge label={label} status={status} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});