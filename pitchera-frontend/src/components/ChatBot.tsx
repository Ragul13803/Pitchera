import React, { FC, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  // useSafeAreaInsets,
  useWindowDimensions,
} from 'react-native';

import ChatWindow from './ChatWindow';
import ChatToggle from './ChatToggle';

interface Props {}

const COLORS = {
  primary: '#5B5FEF',
  white: '#FFFFFF',
};

const ChatBot: FC<Props> = () => {
  const { width, height } = useWindowDimensions();
  // const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const slideAnim = useRef(
    new Animated.Value(0),
  ).current;

  const isMobile = width <= 480;
  const isTablet =
    width > 480 && width <= 900;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,

      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();

    if (isOpen) {
      setUnread(0);
    }
  }, [isOpen, slideAnim]);

  const desktopChatWidth = isTablet
    ? Math.min(390, width - 32)
    : Math.min(420, width - 48);

  const desktopChatHeight = isTablet
    ? Math.min(600, height - 90)
    : Math.min(650, height - 100);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const toggleBottom = isMobile
    ? 80
    : 20;

  return (
    <View
      pointerEvents="box-none"
      style={styles.root}
    >
      {/* CHAT WINDOW */}
      {isOpen && (
        <Animated.View
          style={[
            styles.chatContainer,

            isMobile
              ? [
                  styles.mobileChat,
                  {
                    width,
                    height:
                      height +
                      (Platform.OS === 'ios'
                        ? 20
                        : 10),
                  },
                ]
              : {
                  width: desktopChatWidth,
                  height: desktopChatHeight,
                },

            {
              opacity,
              transform: [
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          <ChatWindow
            onClose={() => setIsOpen(false)}
          />
        </Animated.View>
      )}

      {/* FLOATING TOGGLE */}
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
          onPress={() =>
            setIsOpen((prev) => !prev)
          }
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

    right: 24,
    bottom: 94,

    backgroundColor: COLORS.white,

    borderRadius: 24,

    overflow: 'hidden',

    shadowColor: '#20234A',
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.22,
    shadowRadius: 28,

    elevation: 18,
  },

  mobileChat: {
    left: 0,
    right: 0,
    bottom: 0,

    borderRadius: 0,

    shadowOpacity: 0,
    elevation: 0,
  },

  toggleContainer: {
    position: 'absolute',

    right: 16,

    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatBot;