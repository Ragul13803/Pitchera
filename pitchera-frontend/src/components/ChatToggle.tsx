import React, { FC, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const openRotate = useRef(new Animated.Value(0)).current;

  const { isMobile } = useDeviceType();

  /*
   * =========================================================
   * CLOSED BUTTON ANIMATIONS
   * =========================================================
   */

  useEffect(() => {
    if (isOpen) {
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      floatAnim.stopAnimation();
      glowAnim.stopAnimation();

      pulse1.setValue(0);
      pulse2.setValue(0);
      floatAnim.setValue(0);
      glowAnim.setValue(0);

      return;
    }

    const pulseAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, {
          toValue: 1,
          duration: 2100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(pulse1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(950),

        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(pulse2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation1.start();
    pulseAnimation2.start();
    floatingAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation1.stop();
      pulseAnimation2.stop();
      floatingAnimation.stop();
      glowAnimation.stop();
    };
  }, [
    isOpen,
    pulse1,
    pulse2,
    floatAnim,
    glowAnim,
  ]);

  /*
   * =========================================================
   * OPEN/CLOSE ICON ANIMATION
   * =========================================================
   */

  useEffect(() => {
    Animated.spring(openRotate, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 180,
      mass: 0.7,
    }).start();
  }, [isOpen, openRotate]);

  /*
   * =========================================================
   * PRESS ANIMATION
   * =========================================================
   */

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.90,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 250,
    }).start();
  };

  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.65],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.65],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.13],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.38],
  });

  const rotate = openRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  /*
   * Mobile:
   * hide toggle when chat is open.
   */
  if (isMobile && isOpen) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isMobile && styles.mobileWrapper,
        {
          transform: [
            { translateY: floatAnim },
            { scale: pressScale },
          ],
        },
      ]}
    >
      {/* =====================================================
          GLOW
      ===================================================== */}

      {!isOpen && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      {/* =====================================================
          PULSE RINGS
      ===================================================== */}

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

      {/* =====================================================
          BUTTON
      ===================================================== */}

      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
           * Ionicons gives the X a perfectly centered
           * visual box instead of using the × text glyph.
           */
          <Animated.View
            style={[
              styles.closeIconWrapper,
              {
                transform: [
                  { rotate },
                ],
              },
            ]}
          >
            <Ionicons
              name="close"
              size={30}
              color={COLORS.white}
            />
          </Animated.View>
        ) : (
          <View style={styles.imageContainer}>
            <Image
              source={BOT_IMAGE}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {/* =================================================
            UNREAD BADGE
        ================================================= */}

        {!isOpen && unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 82,
    height: 82,

    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileWrapper: {
    width: 74,
    height: 74,
  },

  /*
   * Soft outer glow.
   */
  glow: {
    position: 'absolute',

    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor: COLORS.primary,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,

    elevation: 10,
  },

  /*
   * Main button.
   */
  button: {
    width: 64,
    height: 64,

    borderRadius: 32,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: 'rgba(91,95,239,0.14)',

    shadowColor: '#3D40A0',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 16,

    elevation: 12,
  },

  openButton: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primaryDark,

    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,

    shadowRadius: 18,
  },

  pressed: {
    opacity: 0.96,
  },

  imageContainer: {
    width: 56,
    height: 56,

    borderRadius: 28,

    overflow: 'hidden',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F0F1FF',
  },

  image: {
    width: 54,
    height: 54,

    borderRadius: 27,
  },

  /*
   * The X now uses a fixed-size flex container,
   * so it is mathematically centered.
   */
  closeIconWrapper: {
    width: 56,
    height: 56,

    borderRadius: 28,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  badge: {
    position: 'absolute',

    top: -1,
    right: -1,

    minWidth: 22,
    height: 22,

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
    shadowOpacity: 0.28,
    shadowRadius: 5,

    elevation: 4,
  },

  badgeText: {
    color: COLORS.white,

    fontSize: 10,
    fontWeight: '900',
  },

  pulse: {
    position: 'absolute',

    width: 64,
    height: 64,

    borderRadius: 32,

    borderWidth: 2,

    borderColor: 'rgba(91,95,239,0.45)',
  },

  pulseOuter: {
    position: 'absolute',

    width: 64,
    height: 64,

    borderRadius: 32,

    borderWidth: 1.5,

    borderColor: 'rgba(91,95,239,0.28)',
  },
});

export default ChatToggle;
