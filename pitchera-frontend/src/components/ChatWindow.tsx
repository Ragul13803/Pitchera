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
  useWindowDimensions,
} from 'react-native';

import BOT_IMAGE from '@/assets/images/bluebot.png';
import GOOGLE_IMAGE from '@/assets/images/google.png';
import { Ionicons } from '@expo/vector-icons';

interface ChatWindowProps {
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const COLORS = {
  primary: '#5B5FEF',
  primaryDark: '#4548C8',
  primaryLight: '#EEF0FF',

  background: '#F8F9FF',
  surface: '#FFFFFF',
  surfaceSoft: '#F4F5FF',

  text: '#171A2B',
  textSecondary: '#6F7485',
  textMuted: '#A2A7B7',

  border: '#E7E9F5',

  success: '#35C878',
  warning: '#F5B83D',
  danger: '#F0445F',

  white: '#FFFFFF',
};

const MOCK_AI_RESPONSES = [
  'I can help you improve your resume, optimize your professional profile, and make your job applications stronger.',

  'Based on your Pitchera profile, I can help you identify areas that may need improvement before you apply for jobs.',

  'I can help you create a personalized job application email that highlights your skills and experience for a specific position.',

  'I can help you organize and track your job applications so you can easily see which applications are pending, submitted, or completed.',

  'If you share the job description with me, I can help you tailor your resume and application email to better match the role.',

  'I can help you prepare for your job search by improving your resume, profile, application emails, and interview preparation.',

  'Your Pitchera profile is the foundation of your job search. I can help you make your skills, experience, and achievements stand out to employers.',

  'I can help you write a professional application email that you can send directly through your connected Gmail account.',
];

const MOCK_GOOGLE_RESPONSES = [
  '🔎 I can search the web for current job openings that match your skills and experience once Google Search API integration is connected.',

  '🔎 I can help you find relevant job postings from companies and job boards based on your profile.',

  '🔎 Search mode is ready. Try something like “React Native developer jobs in Bangalore” or “remote frontend developer jobs”.',

  '🔎 I can search for recent job opportunities, company career pages, and relevant openings once the Google Search API is connected.',

  '🔎 Looking for a specific role? Tell me the job title, location, experience level, or remote preference and I can search for matching opportunities.',
];

const SUGGESTIONS = [
  {
    icon: 'document-text-outline' as const,
    label: 'Improve my resume',
    text: 'How can I improve my resume?',
  },
  {
    icon: 'briefcase-outline' as const,
    label: 'Find suitable jobs',
    text: 'Help me find jobs that match my profile',
  },
  {
    icon: 'mail-outline' as const,
    label: 'Write application email',
    text: 'Write a personalized job application email for me',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    label: 'Track applications',
    text: 'Show me how I can track my job applications',
  },
  {
    icon: 'person-outline' as const,
    label: 'Improve my profile',
    text: 'How can I improve my Pitchera profile?',
  },
  {
    icon: 'logo-google' as const,
    label: 'Search for jobs',
    text: 'Search Google for relevant job openings',
  },
];

const ChatWindow: FC<ChatWindowProps> = ({ onClose }) => {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 380;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! 👋 I’m Pitchera AI Assistant. I can help you improve your resume, find relevant jobs, manage applications, and write personalized application emails.',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [searchMode, setSearchMode] = useState<'ai' | 'google'>('ai');

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timer);
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

    setTimeout(() => {
      let response: string;

      if (searchMode === 'google') {
        response =
          MOCK_GOOGLE_RESPONSES[
            Math.floor(
              Math.random() * MOCK_GOOGLE_RESPONSES.length,
            )
          ];
      } else {
        response =
          MOCK_AI_RESPONSES[
            Math.floor(
              Math.random() * MOCK_AI_RESPONSES.length,
            )
          ];
      }

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: response,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 900);
  };

  const handleModeChange = (mode: 'ai' | 'google') => {
    if (isLoading) {
      return;
    }

    setSearchMode(mode);

    setMessages((prev) => [
      ...prev,
      {
      id: `${Date.now()}-mode`,
      sender: 'bot',
      text:
        mode === 'ai'
          ? '🤖 Pitchera AI is ready. I can help with your resume, job applications, profile, and application emails.'
          : '🔎 Google Search is ready. I can help you search for current job opportunities and company career pages.',
    },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerGlow} />

        <View style={styles.headerContent}>
          {/* LEFT SIDE */}
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
              <Image
                source={searchMode === 'google' ? GOOGLE_IMAGE : BOT_IMAGE}
                style={styles.avatar}
                resizeMode="contain"
              />

              <View
                style={[
                  styles.onlineIndicator,
                  searchMode === 'google' &&
                    styles.googleIndicator,
                ]}
              />
            </View>

            <View style={styles.headerText}>
              <Text
                style={[
                  styles.title,
                  isSmallPhone && styles.titleSmall,
                ]}
                numberOfLines={1}
              >
                {searchMode === 'ai'
                  ? 'Pitchera AI'
                  : 'Google Search'}
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isLoading
                        ? COLORS.warning
                        : COLORS.success,
                    },
                  ]}
                />

                <Text
                  style={styles.statusText}
                  numberOfLines={1}
                >
                  {isLoading
                    ? searchMode === 'ai'
                      ? 'Thinking...'
                      : 'Searching...'
                    : searchMode === 'ai'
                      ? 'AI • Ready to help'
                      : 'Search • Ready'}
                </Text>
              </View>
            </View>
          </View>

          {/* RIGHT SIDE */}
          <View style={styles.headerActions}>
            {/* AI / GOOGLE TOGGLE */}
            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => handleModeChange('ai')}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Use Pitchera AI"
                style={({ pressed }) => [
                  styles.modeButton,
                  searchMode === 'ai' &&
                    styles.modeButtonActive,
                  pressed &&
                    !isLoading &&
                    styles.modeButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    searchMode === 'ai' &&
                      styles.modeTextActive,
                  ]}
                >
                  AI
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  handleModeChange('google')
                }
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Use Google Search"
                style={({ pressed }) => [
                  styles.modeButton,
                  searchMode === 'google' &&
                    styles.modeButtonActive,
                  pressed &&
                    !isLoading &&
                    styles.modeButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    searchMode === 'google' &&
                      styles.modeTextActive,
                  ]}
                >
                  Google
                </Text>
              </Pressable>
            </View>

            {/* CLOSE BUTTON */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close chat"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closePressed,
              ]}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* MESSAGES */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* TODAY */}
        <View style={styles.welcomeLabel}>
          <View style={styles.welcomeLine} />

          <Text style={styles.welcomeText}>
            TODAY
          </Text>

          <View style={styles.welcomeLine} />
        </View>

        {/* MESSAGE LIST */}
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
            {message.sender === 'bot' && (
              <View style={styles.messageAvatarWrapper}>
                <Image
                  source={BOT_IMAGE}
                  style={styles.messageAvatar}
                  resizeMode="contain"
                />
              </View>
            )}

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

        {/* SUGGESTIONS */}
        {messages.length === 1 && !isLoading && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionHeader}>
              <View style={styles.sparkle}>
                <Text style={styles.sparkleText}>
                  ✦
                </Text>
              </View>

              <Text style={styles.suggestionTitle}>
                {searchMode === 'ai'
                  ? 'QUICK QUESTIONS'
                  : 'QUICK SEARCHES'}
              </Text>
            </View>

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
                  <View style={styles.suggestionIconBox}>
                    <Ionicons
                      name={suggestion.icon}
                      size={17}
                      color={COLORS.primary}
                    />
                  </View>

                  <Text style={styles.suggestionText}>
                    {suggestion.label}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* TYPING / SEARCHING */}
        {isLoading && (
          <View style={styles.messageRow}>
            <View style={styles.messageAvatarWrapper}>
              <Image
                source={BOT_IMAGE}
                style={styles.messageAvatar}
                resizeMode="contain"
              />
            </View>

            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* INPUT */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
  isLoading
    ? searchMode === 'ai'
      ? 'Pitchera AI is thinking...'
      : 'Searching for jobs...'
    : searchMode === 'ai'
      ? 'Ask about your resume, jobs or applications...'
      : 'Search for jobs, companies or openings...'
}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={1000}
            editable={!isLoading}
            style={styles.input}
            onSubmitEditing={() =>
              sendMessage(input)
            }
            returnKeyType="send"
          />

          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel={
              searchMode === 'ai'
                ? 'Send message'
                : 'Search Google'
            }
            style={({ pressed }) => [
              styles.sendButton,
              !input.trim() || isLoading
                ? styles.sendDisabled
                : styles.sendActive,
              pressed && styles.sendPressed,
            ]}
          >
            <Text style={styles.sendIcon}>
              {isLoading ? '⋯' : '↑'}
            </Text>
          </Pressable>
        </View>

          <Text style={styles.inputHint}>
  {searchMode === 'ai'
    ? 'Pitchera AI • Resume & job application assistant'
    : 'Google Search • Find current job opportunities'}
</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    height: 88,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },

  headerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -70,
    top: -110,
  },

  headerContent: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    minWidth: 0,
  },

  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,

    elevation: 4,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  onlineIndicator: {
    position: 'absolute',
    right: -1,
    bottom: 1,

    width: 13,
    height: 13,
    borderRadius: 7,

    backgroundColor: COLORS.success,

    borderWidth: 2,
    borderColor: COLORS.white,
  },

  googleIndicator: {
    backgroundColor: '#4285F4',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 5,
  },

  titleSmall: {
    fontSize: 14,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10.5,
    fontWeight: '500',
  },

  // =========================================================
  // HEADER ACTIONS
  // =========================================================

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  modeToggle: {
    height: 34,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 3,

    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.14)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  modeButton: {
    height: 28,

    paddingHorizontal: 9,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  modeButtonActive: {
    backgroundColor: COLORS.white,
  },

  modeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  modeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '700',
  },

  modeTextActive: {
    color: COLORS.primary,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.12)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  closePressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ scale: 0.94 }],
  },

  closeText: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '300',
    lineHeight: 27,
  },

  // =========================================================
  // MESSAGES
  // =========================================================

  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  messagesContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },

  welcomeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  welcomeLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  welcomeText: {
    marginHorizontal: 9,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 13,
    alignItems: 'flex-end',
  },

  botRow: {
    justifyContent: 'flex-start',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  messageAvatarWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  messageAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
  },

  bubble: {
    maxWidth: '79%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
  },

  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 5,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#4B4F70',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 1,
  },

  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    elevation: 2,
  },

  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },

  botMessageText: {
    color: COLORS.text,
  },

  userMessageText: {
    color: COLORS.white,
  },

  // =========================================================
  // SUGGESTIONS
  // =========================================================

  suggestionsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },

  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  sparkle: {
    width: 22,
    height: 22,
    borderRadius: 7,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,
  },

  sparkleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  suggestionTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  suggestionList: {
    gap: 8,
  },

  suggestionChip: {
    minHeight: 48,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 9,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.white,
  },

  suggestionPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: '#D7D9FF',
    transform: [{ scale: 0.985 }],
  },

  suggestionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  suggestionIcon: {
    fontSize: 15,
  },

  suggestionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '600',
  },

  suggestionArrow: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 5,
  },

  // =========================================================
  // TYPING
  // =========================================================

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 15,
    paddingVertical: 13,

    borderRadius: 17,
    borderBottomLeftRadius: 5,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,

    backgroundColor: COLORS.primary,

    marginHorizontal: 2,
  },

  // =========================================================
  // INPUT
  // =========================================================

  inputSection: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,

    backgroundColor: COLORS.white,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  inputWrapper: {
    minHeight: 52,

    flexDirection: 'row',
    alignItems: 'flex-end',

    backgroundColor: COLORS.background,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 17,

    paddingLeft: 13,
    paddingRight: 6,
    paddingVertical: 5,
  },

  input: {
    flex: 1,

    minHeight: 40,
    maxHeight: 100,

    color: COLORS.text,

    fontSize: 13.5,
    lineHeight: 20,

    paddingTop: 8,
    paddingBottom: 7,
    paddingRight: 8,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',
  },

  sendActive: {
    backgroundColor: COLORS.primary,
  },

  sendDisabled: {
    backgroundColor: '#E9EAF1',
  },

  sendPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },

  sendIcon: {
    fontSize: 21,
    color: COLORS.white,
    fontWeight: '700',
    marginTop: -2,
  },

  inputHint: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 8.5,
    marginTop: 6,
  },
});

export default ChatWindow;