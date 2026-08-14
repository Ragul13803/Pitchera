import React, { FC, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ToggleProps {
  isOpen: boolean;
  unread: number;
  onPress: () => void;
}

// const BOT_IMAGE = require('../../assets/bluebot.png');

const ChatToggle: FC<ToggleProps> = ({
  isOpen,
  unread,
  onPress,
}) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      return;
    }

    const animation1 = Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    );

    const animation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation1.start();
    animation2.start();

    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, [isOpen]);

  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.wrapper}>
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
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        {/* <Image
           source={BOT_IMAGE}
          style={styles.image}
          resizeMode="contain"
        /> */}

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
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,

    elevation: 8,
  },

  pressed: {
    transform: [{ scale: 0.94 }],
  },

  image: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  pulse: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.45)',
  },

  pulseOuter: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(102,126,234,0.25)',
  },
});

export default ChatToggle;