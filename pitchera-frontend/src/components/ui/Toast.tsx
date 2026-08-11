import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  visible,
  message,
  type = 'info',
  onHide,
  duration = 3500,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onHide);
  };

  if (!visible) return null;

  const config = {
    success: { bg: Colors.successLight, color: Colors.success, icon: 'checkmark-circle' as const },
    error: { bg: Colors.errorLight, color: Colors.error, icon: 'alert-circle' as const },
    warning: { bg: Colors.warningLight, color: Colors.warning, icon: 'warning' as const },
    info: { bg: Colors.infoLight, color: Colors.info, icon: 'information-circle' as const },
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }], backgroundColor: config.bg },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
      <TouchableOpacity onPress={hide}>
        <Ionicons name="close" size={18} color={config.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast Manager Hook
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const show = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hide = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return { toast, show, hide };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});