import React, { FC, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface ChatWindowProps {
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

// const BOT_IMAGE = require('../../assets/bluebot.png');
// const BANNER_IMAGE = require('../../assets/Telliepact_Banner.png');

const MOCK_RESPONSES = [
  'Thanks for your message! I’m here to help you.',
  'That’s a great question. Let me help you with that.',
  'Sure! I can help you with that. This is a mock response for now.',
  'Got it! Your request has been received successfully.',
  'Thanks for reaching out. How else can I assist you?',
];

const SUGGESTIONS = [
  {
    icon: '📊',
    label: 'Track my order',
    text: 'I want to track my order',
  },
  {
    icon: '❓',
    label: 'Help',
    text: 'I need some help',
  },
  {
    icon: '📦',
    label: 'My shipment',
    text: 'Where is my shipment?',
  },
  {
    icon: '💬',
    label: 'Contact support',
    text: 'I want to contact support',
  },
];

const ChatWindow: FC<ChatWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! 👋 I’m Pitchera AI Assistant. How can I help you today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages, isLoading]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock AI response
    setTimeout(() => {
      const response =
        MOCK_RESPONSES[
          Math.floor(Math.random() * MOCK_RESPONSES.length)
        ];

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: response,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* <Image
          source={BANNER_IMAGE}
          style={styles.headerBackground}
          resizeMode="cover"
        /> */}

        <View style={styles.headerOverlay} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
              {/* <Image
                source={BOT_IMAGE}
                style={styles.avatar}
                resizeMode="contain"
              /> */}
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>
                Pitchera - AI Assistant
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isLoading
                        ? '#facc15'
                        : '#4ade80',
                    },
                  ]}
                />

                <Text style={styles.statusText}>
                  {isLoading ? 'Thinking...' : 'Online'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.sender === 'user'
                ? styles.userRow
                : styles.botRow,
            ]}
          >
            {/* {message.sender === 'bot' && (
              <Image
                source={BOT_IMAGE}
                style={styles.messageAvatar}
              />
            )} */}

            <View
              style={[
                styles.bubble,
                message.sender === 'user'
                  ? styles.userBubble
                  : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'user'
                    ? styles.userMessageText
                    : styles.botMessageText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Suggestions */}
        {messages.length === 1 && !isLoading && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionTitle}>
              💡 QUICK QUESTIONS
            </Text>

            <View style={styles.suggestionList}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion.text}
                  onPress={() => sendMessage(suggestion.text)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    pressed && styles.suggestionPressed,
                  ]}
                >
                  <Text style={styles.suggestionIcon}>
                    {suggestion.icon}
                  </Text>

                  <Text style={styles.suggestionText}>
                    {suggestion.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Typing */}
        {isLoading && (
          <View style={styles.messageRow}>
            {/* <Image
              source={BOT_IMAGE}
              style={styles.messageAvatar}
            /> */}

            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              isLoading
                ? 'AI is thinking...'
                : 'Ask me a question or type a message...'
            }
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            editable={!isLoading}
            style={styles.input}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />

          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={({ pressed }) => [
              styles.sendButton,
              !input.trim() || isLoading
                ? styles.sendDisabled
                : styles.sendActive,
              pressed && styles.sendPressed,
            ]}
          >
            <Text style={styles.sendIcon}>
              {isLoading ? '⏳' : '➤'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // HEADER
  header: {
    height: 94,
    position: 'relative',
    overflow: 'hidden',
  },

  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(102, 80, 190, 0.68)',
  },

  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#d1d1d1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 7,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(41,41,41,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: 'rgba(192,49,49,0.95)',
    fontSize: 17,
    fontWeight: '700',
  },

  // MESSAGES
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  messagesContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 10,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },

  botRow: {
    justifyContent: 'flex-start',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 7,
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
  },

  botBubble: {
    backgroundColor: '#f2f4ff',
    borderBottomLeftRadius: 4,
  },

  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },

  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },

  botMessageText: {
    color: '#25253a',
  },

  userMessageText: {
    color: '#fff',
  },

  // SUGGESTIONS
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },

  suggestionTitle: {
    fontSize: 10.5,
    color: '#aeb7c3',
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e4ff',
    backgroundColor: '#fff',
  },

  suggestionPressed: {
    backgroundColor: '#667eea',
  },

  suggestionIcon: {
    fontSize: 13,
    marginRight: 4,
  },

  suggestionText: {
    color: '#667eea',
    fontSize: 11.5,
    fontWeight: '500',
  },

  // TYPING
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: '#f2f4ff',
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667eea',
  },

  // INPUT
  inputSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#ebebf5',
    backgroundColor: '#fafbff',
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e4ff',
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },

  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    color: '#1a1a2e',
    fontSize: 13.5,
    lineHeight: 20,
    paddingTop: 7,
    paddingBottom: 7,
    paddingRight: 8,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendActive: {
    backgroundColor: '#667eea',
  },

  sendDisabled: {
    backgroundColor: '#f3f4f6',
  },

  sendPressed: {
    opacity: 0.75,
  },

  sendIcon: {
    fontSize: 19,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChatWindow;