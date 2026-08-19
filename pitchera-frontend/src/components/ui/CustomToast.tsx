import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  text1?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  icon?: React.ReactNode;
};

export default function CustomToast({
  text1,
  type = 'success',
  duration = 3000, // 3 seconds,
  icon
}: Props) {
  const { colors: themeColors } = useTheme();

  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#eda82f',
  };

  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.stopAnimation();

    // RESET EVERY TIME
    progress.setValue(1);

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        Toast.hide();
      }
    });

    return () => {
      animation.stop();
    };
  }); // <- REMOVE DEPENDENCY ARRAY

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
  style={{
    width: Platform.OS === 'web' ? 380 : '92%',
    alignSelf: Platform.OS === 'web' ? 'flex-end' : 'center',
    minHeight: 60,
    backgroundColor: themeColors.card,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: colors[type],
    overflow: 'hidden',
    position: 'relative',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 12,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  }}
>
  {/* Left Section */}
  <View
    style={{
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
    }}
  >
    {icon}

    <Text
      numberOfLines={2}
      style={{
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '700',
        color: themeColors.text,
      }}
    >
      {text1}
    </Text>
  </View>

  {/* Close Button */}
  <TouchableOpacity
    onPress={() => Toast.hide()}
    style={{
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    }}
  >
    <MaterialCommunityIcons
      name="close"
      size={20}
      color={themeColors.textSecondary}
    />
  </TouchableOpacity>

  {/* Progress Bar */}
  <View
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: themeColors.border,
    }}
  >
    <Animated.View
      style={{
        height: '100%',
        width,
        backgroundColor: colors[type],
      }}
    />
  </View>
</View>
  );
}