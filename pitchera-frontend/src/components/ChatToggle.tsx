import React, { FC, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BOT_IMAGE from '@/assets/images/bluebot.png';
import { useDeviceType } from '@/hooks/useDeviceType';

interface ToggleProps {
  isOpen: boolean;
  unread: number;
  onPress: () => void;
}

const COLORS = {
  primary: '#5B5FEF',
  primaryDark: '#4548C8',
  white: '#FFFFFF',
  danger: '#F0445F',
};

const ChatToggle: FC<ToggleProps> = ({
  isOpen,
  unread,
  onPress,
}) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const { isMobile } = useDeviceType();

  useEffect(() => {
    if (isOpen) {
      pulse1.stopAnimation();
      pulse2.stopAnimation();

      pulse1.setValue(0);
      pulse2.setValue(0);

      return;
    }

    const animation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const animation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation1.start();
    animation2.start();

    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, [isOpen, pulse1, pulse2]);

  /*
   * MOBILE:
   * When chat is open, completely hide the floating toggle.
   *
   * DESKTOP/TABLET:
   * Keep the toggle visible and show X instead of bot.
   */
  if (isMobile && isOpen) {
    return null;
  }

  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <View
      style={[
        styles.wrapper,
        isMobile && styles.mobileWrapper,
      ]}
    >
      {/* Pulse only when closed */}
      {!isOpen && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulse,
              {
                transform: [{ scale: scale1 }],
                opacity: opacity1,
              },
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseOuter,
              {
                transform: [{ scale: scale2 }],
                opacity: opacity2,
              },
            ]}
          />
        </>
      )}

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          isOpen ? 'Close chat' : 'Open chat'
        }
        style={({ pressed }) => [
          styles.button,
          isOpen && styles.openButton,
          pressed && styles.pressed,
        ]}
      >
        {isOpen ? (
          /*
           * DESKTOP/TABLET:
           * Show X in the same place where bot normally appears.
           */
          <View style={styles.closeIconWrapper}>
            <Text style={styles.closeIcon}>×</Text>
          </View>
        ) : (
          /*
           * CLOSED:
           * Show bot image.
           */
          <View style={styles.imageContainer}>
            <Image
              source={BOT_IMAGE}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Unread badge only when closed */}
        {!isOpen && unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 78,
    height: 78,

    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileWrapper: {
    width: 70,
    height: 70,
  },

  button: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: 'rgba(91,95,239,0.12)',

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,

    elevation: 10,
  },

  openButton: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primaryDark,

    shadowColor: COLORS.primary,
    shadowOpacity: 0.32,
  },

  pressed: {
    transform: [{ scale: 0.92 }],
  },

  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,

    overflow: 'hidden',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F1F2FF',
  },

  image: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  /*
   * X shown on desktop/tablet when chat is open.
   */
  closeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  closeIcon: {
    color: COLORS.white,

    fontSize: 38,
    fontWeight: '300',

    lineHeight: 42,

    marginTop: -3,
  },

  badge: {
    position: 'absolute',

    top: 0,
    right: 0,

    minWidth: 21,
    height: 21,

    paddingHorizontal: 5,

    borderRadius: 11,

    backgroundColor: COLORS.danger,

    borderWidth: 2,
    borderColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.danger,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    elevation: 3,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  pulse: {
    position: 'absolute',

    width: 62,
    height: 62,

    borderRadius: 31,

    borderWidth: 2,
    borderColor: 'rgba(91,95,239,0.45)',
  },

  pulseOuter: {
    position: 'absolute',

    width: 62,
    height: 62,

    borderRadius: 31,

    borderWidth: 1.5,
    borderColor: 'rgba(91,95,239,0.28)',
  },
});

export default ChatToggle;