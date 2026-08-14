import React, { FC, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import ChatWindow from './ChatWindow';
import ChatToggle from './ChatToggle';

interface Props {}

const ChatBot: FC<Props> = () => {
  const { width, height } = useWindowDimensions();

  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const isMobile = width <= 480;
  const isTablet = width > 480 && width <= 768;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();

    if (isOpen) {
      setUnread(0);
    }
  }, [isOpen]);

  const chatWidth = isMobile
    ? width
    : isTablet
    ? 350
    : 400;

  const chatHeight = isMobile
    ? height
    : isTablet
    ? 540
    : 520;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {isOpen && (
        <Animated.View
          style={[
            styles.chatContainer,
            {
              width: chatWidth,
              height: chatHeight,
              opacity,
              transform: [{ translateY }, { scale }],
            },
            isMobile && styles.mobileChat,
          ]}
        >
          <ChatWindow
            onClose={() => setIsOpen(false)}
          />
        </Animated.View>
      )}

      <ChatToggle
        isOpen={isOpen}
        unread={unread}
        onPress={() => setIsOpen((prev) => !prev)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 99999,
    alignItems: 'flex-end',
  },

  chatContainer: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 25,

    elevation: 15,
  },

  mobileChat: {
    position: 'absolute',
    right: -24,
    bottom: -24,
    borderRadius: 0,
  },
});

export default ChatBot;