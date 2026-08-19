import React, { FC, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import ChatWindow from './ChatWindow';
import ChatToggle from './ChatToggle';
import { useAuth } from '@/context/AuthContext';

interface Props {}

const COLORS = {
  primary: '#5B5FEF',
  white: '#FFFFFF',
};

const ChatBot: FC<Props> = () => {
  const { width, height } = useWindowDimensions();

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const isMobile = width <= 480;
  const isTablet = width > 480 && width <= 900;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 190,
      mass: 0.75,
    }).start();

    if (isOpen) {
      setUnread(0);
    }
  }, [isOpen, slideAnim]);

  const desktopChatWidth = isTablet
    ? Math.min(400, width - 28)
    : Math.min(450, width - 42);

  const desktopChatHeight = isTablet
    ? Math.min(600, height - 72)
    : Math.min(640, height - 82);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.5, 1],
  });

  const toggleBottom = isMobile
    ? Platform.OS === 'web'
      ? 18
      : 20
    : 20;

    const { user } = useAuth();

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {/* =====================================================
          CHAT WINDOW
      ===================================================== */}

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.chatContainer,

          isMobile
            ? [
                styles.mobileChat,
                {
                  width,
                  height,
                },
              ]
            : {
                width: desktopChatWidth,
                height: desktopChatHeight,
              },

          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <ChatWindow onClose={() => setIsOpen(false)} />
      </Animated.View>

      {/* =====================================================
          FLOATING TOGGLE
      ===================================================== */}

      <View
        pointerEvents="box-none"
        style={[
          styles.toggleContainer,
          {
            bottom: toggleBottom,
          },
        ]}
      >
        <ChatToggle
          isOpen={isOpen}
          unread={unread}
          onPress={() => setIsOpen(prev => !prev)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 99999,

    pointerEvents: 'box-none',
  },

  chatContainer: {
    position: 'absolute',

    right: 20,
    bottom: 94,

    backgroundColor: COLORS.white,

    borderRadius: 26,

    overflow: 'hidden',

    shadowColor: '#171A3D',
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.25,
    shadowRadius: 35,

    elevation: 22,

    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E4E6F5',
  },

  mobileChat: {
    left: 0,
    right: 0,
    bottom: 0,

    borderRadius: 0,

    borderWidth: 0,

    shadowOpacity: 0,
    elevation: 0,
  },

  toggleContainer: {
    position: 'absolute',

    right: 14,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 100000,
  },
});

export default ChatBot;
