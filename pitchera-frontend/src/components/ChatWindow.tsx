import React, {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
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

import { Ionicons } from '@expo/vector-icons';

import BOT_IMAGE    from '@/assets/images/bluebot.png';
import GOOGLE_IMAGE from '@/assets/images/google.png';

import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { useDeviceType } from '@/hooks/useDeviceType';

/* =========================================================
   API BASE URL
   Derived from the same EXPO_PUBLIC_API_URL every other screen
   uses (src/services/api.ts), so this works in dev and prod alike.
   ========================================================= */
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  '',
);

/* =========================================================
   TYPES
   ========================================================= */

interface ChatWindowProps {
  onClose: () => void;
}

type SenderType = 'user' | 'bot' | 'system';

interface Message {
  id:     string;
  text:   string;
  sender: SenderType;
  mode?:  'ai' | 'google';
}

interface ApiHistoryMessage {
  role:    'user' | 'assistant';
  content: string;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const COLORS = {
  primary:       '#5B5FEF',
  primaryDark:   '#4548C8',
  primaryLight:  '#EEF0FF',
  background:    '#F7F8FE',
  surface:       '#FFFFFF',
  surfaceSoft:   '#F4F5FF',
  text:          '#171A2B',
  textSecondary: '#6F7485',
  textMuted:     '#A2A7B7',
  border:        '#E7E9F5',
  success:       '#35C878',
  warning:       '#F5B83D',
  danger:        '#F0445F',
  white:         '#FFFFFF',
} as const;

const SUGGESTIONS = [
  {
    icon:  'document-text-outline' as const,
    label: 'Improve my resume',
    text:  'How can I improve my resume?',
  },
  {
    icon:  'briefcase-outline' as const,
    label: 'Find suitable jobs',
    text:  'Help me find jobs that match my profile',
  },
  {
    icon:  'mail-outline' as const,
    label: 'Write application email',
    text:  'Write a personalized job application email for me',
  },
  {
    icon:  'checkmark-circle-outline' as const,
    label: 'Track applications',
    text:  'Show me how I can track my job applications',
  },
  {
    icon:  'person-outline' as const,
    label: 'Improve my profile',
    text:  'How can I improve my Pitchera profile?',
  },
  {
    icon:  'logo-google' as const,
    label: 'Search for jobs',
    text:  'Search Google for relevant job openings',
  },
] as const;

/* =========================================================
   COMPONENT
   ========================================================= */

const ChatWindow: FC<ChatWindowProps> = ({ onClose }) => {

  const { width,isMobile }             = useDeviceType();
  const { user, accessToken } = useAuth();

  const isSmallPhone = width < 380;
  const isPhone      = width <= 480;

  console.log('user?.avatarUrl',user?.avatarUrl);
  

  /* ── STATE ── */

  const [messages, setMessages] = useState<Message[]>([
    {
      id:     'welcome',
      sender: 'bot',
      text:   "Hi! 👋 I'm Pitchera AI Assistant. I can help you improve your resume, find relevant jobs, manage applications, and write personalized application emails.",
      mode:   'ai',
    },
  ]);

  const [input,              setInput]              = useState('');
  const [isLoading,          setIsLoading]          = useState(false);
  const [searchMode,         setSearchMode]         = useState<'ai' | 'google'>('ai');
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [rateLimitResetAt,   setRateLimitResetAt]   = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  /* ── TYPING DOTS ── */

  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!isLoading) {
      dot1.setValue(0.35);
      dot2.setValue(0.35);
      dot3.setValue(0.35);
      return;
    }

    const makeDot = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1, duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.35, duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ]),
      );

    const a1 = makeDot(dot1, 0);
    const a2 = makeDot(dot2, 130);
    const a3 = makeDot(dot3, 260);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [isLoading, dot1, dot2, dot3]);

  /* ── AUTO SCROLL ── */

  useEffect(() => {
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  /* ── FETCH RATE LIMIT ON MOUNT ── */

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/rate-limit`, {
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setRateLimitRemaining(json.data.remaining);
            setRateLimitResetAt(json.data.resetAt);
          }
        }
      } catch {
        /* non-critical — ignore */
      }
    })();
  }, [accessToken]);

  /* ── HELPERS ── */

  const buildHeaders = useCallback(
    () => ({
      Authorization:  `Bearer ${accessToken ?? ''}`,
      'Content-Type': 'application/json',
    }),
    [accessToken],
  );

  const pushSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-system`, sender: 'system', text },
    ]);
  }, []);

  /* Google mode returns {type, query, answer, sources?, jobs?} instead of
     {reply}; AI mode is untouched and still returns {reply}. */
  const formatBotReply = (data: any): string => {
    if (typeof data.reply === 'string') return data.reply;

    let text = data.answer ?? "Sorry, I couldn't find an answer.";

    if (Array.isArray(data.sources) && data.sources.length > 0) {
      text += '\n\nSources:\n' + data.sources
        .map((s: { title: string; url: string }) => `- ${s.title}: ${s.url}`)
        .join('\n');
    }

    if (Array.isArray(data.jobs) && data.jobs.length > 0) {
      text += '\n\nJobs found:\n' + data.jobs
        .map((j: { title: string; company: string; location: string; url: string }) =>
          `- ${j.title}${j.company ? ` at ${j.company}` : ''}${j.location ? ` (${j.location})` : ''} — ${j.url}`)
        .join('\n');
    }

    return text;
  };

  const minutesUntilReset = (): number => {
    if (!rateLimitResetAt) return 60;
    return Math.max(
      1,
      Math.ceil((new Date(rateLimitResetAt).getTime() - Date.now()) / 60_000),
    );
  };

  /* ── SEND MESSAGE ── */

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      if (!accessToken) {
        pushSystemMessage('⚠️ You must be logged in to use the AI assistant.');
        return;
      }

      /* Optimistic user bubble */
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-user`, sender: 'user', text: trimmed, mode: searchMode },
      ]);
      setInput('');
      setIsLoading(true);

      /* Build history from current state (last 10 turns) */
      const history: ApiHistoryMessage[] = messages
        .filter((m) => m.sender === 'user' || m.sender === 'bot')
        .slice(-10)
        .map((m) => ({
          role:    m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
          method:  'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            mode:    searchMode,
            message: trimmed,
            history,
            userProfile: {
              name:       (user as any)?.name         ?? undefined,
              skills:     (user as any)?.skills     ?? undefined,
              experience: (user as any)?.experience ?? undefined,
              location:   (user as any)?.location   ?? undefined,
            },
          }),
        });

        /* Read rate-limit headers */
        const hRemaining = res.headers.get('X-RateLimit-Remaining');
        const hReset     = res.headers.get('X-RateLimit-Reset');
        if (hRemaining !== null) setRateLimitRemaining(parseInt(hRemaining, 10));
        if (hReset     !== null) setRateLimitResetAt(hReset);

        const json = await res.json();

        /* 429 rate limit */
        if (res.status === 429) {
          pushSystemMessage(
            json.error?.message ||
            `⚠️ You have used all 5 AI requests for this hour. ` +
            `Please try again in ${minutesUntilReset()} minute(s).`,
          );
          setIsLoading(false);
          return;
        }

        /* Other errors */
        if (!res.ok || !json.success) {
          pushSystemMessage(
            `⚠️ ${json.error?.message || 'Something went wrong. Please try again.'}`,
          );
          setIsLoading(false);
          return;
        }

        /* Success */
        setMessages((prev) => [
          ...prev,
          {
            id:     `${Date.now()}-bot`,
            sender: 'bot',
            text:   formatBotReply(json.data),
            mode:   searchMode,
          },
        ]);
      } catch (err) {
        console.error('[ChatWindow] Network error:', err);
        pushSystemMessage(
          '⚠️ Network error. Please check your connection and try again.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading, accessToken, searchMode,
      messages, user, buildHeaders, pushSystemMessage,
    ],
  );

  /* ── MODE CHANGE ── */

  const handleModeChange = (mode: 'ai' | 'google') => {
    if (isLoading || searchMode === mode) return;
    setSearchMode(mode);
    setMessages((prev) => [
      ...prev,
      {
        id:     `${Date.now()}-mode`,
        sender: 'bot',
        text:   mode === 'ai'
          ? '🤖 Pitchera AI is ready. I can help with your resume, job applications, profile, and application emails.'
          : '🔎 Google Search is ready. I can help you search for current job opportunities and company career pages.',
        mode,
      },
    ]);
  };

  /* ── RATE LIMIT LABEL (header status text) ── */

  const rateLimitLabel = (() => {
    if (rateLimitRemaining === null) return null;
    if (rateLimitRemaining === 0)
      return `⚠️ Limit reached – resets in ${minutesUntilReset()} min`;
    return `${rateLimitRemaining} of 5 left`;
  })();

  const isExhausted = rateLimitRemaining === 0;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* ═══════════════════════ HEADER ═══════════════════════ */}

      <View style={styles.header}>
        <View style={styles.headerGlowLarge} />
        <View style={styles.headerGlowSmall} />

        <View style={styles.headerContent}>

          {/* LEFT */}
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
                  searchMode === 'google' && styles.googleIndicator,
                  isExhausted && styles.exhaustedIndicator,
                ]}
              />
            </View>

            <View style={styles.headerText}>
              <Text
                style={[styles.title, isSmallPhone && styles.titleSmall]}
                numberOfLines={1}
              >
                {searchMode === 'ai' ? 'Pitchera AI' : 'Google Search'}
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isExhausted
                        ? COLORS.danger
                        : isLoading
                          ? COLORS.warning
                          : COLORS.success,
                    },
                  ]}
                />
                <Text style={styles.statusText} numberOfLines={1}>
                  {isLoading
                    ? searchMode === 'ai' ? 'Thinking...' : 'Searching...'
                    : searchMode === 'ai'
                      ? rateLimitLabel
                        ? `AI • ${rateLimitLabel}`
                        : 'AI • Ready to help'
                      : 'Search • Ready'}
                </Text>
              </View>
            </View>
          </View>

          {/* RIGHT */}
          <View
            style={[
              styles.headerActions,
              isSmallPhone && styles.headerActionsSmall,
            ]}
          >
            {/* MODE TOGGLE */}
            <View
              style={[
                styles.modeToggle,
                isSmallPhone && styles.modeToggleSmall,
              ]}
            >
              {(['ai', 'google'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => handleModeChange(m)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.modeButton,
                    searchMode === m   && styles.modeButtonActive,
                    pressed && !isLoading && styles.modeButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      searchMode === m && styles.modeTextActive,
                    ]}
                  >
                    {m === 'ai' ? 'AI' : 'Google'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* CLOSE */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close chat"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Ionicons name="close" size={23} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ═══════════════════════ MESSAGES ═══════════════════════ */}

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          isPhone && styles.messagesContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* TODAY SEPARATOR */}
        <View style={styles.welcomeLabel}>
          <View style={styles.welcomeLine} />
          <View style={styles.todayPill}>
            <Text style={styles.welcomeText}>TODAY</Text>
          </View>
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
                : message.sender === 'system'
                  ? styles.systemRow
                  : styles.botRow,
            ]}
          >
            {/* BOT */}
            {message.sender === 'bot' && (
              <>
                <View style={styles.messageAvatarWrapper}>
                  <Image
                    source={BOT_IMAGE}
                    style={styles.messageAvatar}
                    resizeMode="contain"
                  />
                </View>
                <View style={[styles.bubble, styles.botBubble]}>
                  <Text style={[styles.messageText, styles.botMessageText]}>
                    {message.text}
                  </Text>
                </View>
              </>
            )}

            {/* SYSTEM / ERROR */}
            {message.sender === 'system' && (
              <View style={[styles.bubble, styles.systemBubble]}>
                <Text style={[styles.messageText, styles.systemMessageText]}>
                  {message.text}
                </Text>
              </View>
            )}

            {/* USER */}
            {message.sender === 'user' && (
              <>
                <View style={[styles.bubble, styles.userBubble]}>
                  <Text style={[styles.messageText, styles.userMessageText]}>
                    {message.text}
                  </Text>
                </View>

                <View style={styles.userAvatarWrapper}>
                  {user?.avatarUrl ? (
                    <Avatar
                          uri={user.avatarUrl}
                          size={isMobile ? 36 : 38}
                        />
                  ) : (
                    <View style={styles.userAvatarFallback}>
                      <Ionicons
                        name="person"
                        size={19}
                        color={COLORS.primary}
                      />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ))}

        {/* SUGGESTIONS — shown only on the welcome message */}
        {messages.length === 1 && !isLoading && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionHeader}>
              <View style={styles.sparkle}>
                <Text style={styles.sparkleText}>✦</Text>
              </View>
              <Text style={styles.suggestionTitle}>
                {searchMode === 'ai' ? 'QUICK QUESTIONS' : 'QUICK SEARCHES'}
              </Text>
            </View>

            <View style={styles.suggestionList}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s.text}
                  onPress={() => sendMessage(s.text)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    pressed && styles.suggestionPressed,
                  ]}
                >
                  <View style={styles.suggestionIconBox}>
                    <Ionicons
                      name={s.icon}
                      size={17}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {s.label}
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

        {/* TYPING INDICATOR */}
        {isLoading && (
          <View style={[styles.messageRow, styles.botRow]}>
            <View style={styles.messageAvatarWrapper}>
              <Image
                source={BOT_IMAGE}
                style={styles.messageAvatar}
                resizeMode="contain"
              />
            </View>
            <View style={styles.typingBubble}>
              {([dot1, dot2, dot3] as Animated.Value[]).map((dot, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.typingDot,
                    { opacity: dot, transform: [{ scale: dot }] },
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══════════════════════ INPUT ═══════════════════════ */}

      <View style={styles.inputSection}>

        {/* Rate-limit warning bar — visible when ≤ 1 request remains */}
        {rateLimitRemaining !== null && rateLimitRemaining <= 1 && (
          <View
            style={[
              styles.rateLimitBar,
              isExhausted && styles.rateLimitBarExhausted,
            ]}
          >
            <Ionicons
              name={isExhausted ? 'ban-outline' : 'warning-outline'}
              size={13}
              color={isExhausted ? COLORS.danger : COLORS.warning}
            />
            <Text
              style={[
                styles.rateLimitBarText,
                isExhausted && styles.rateLimitBarTextDanger,
              ]}
            >
              {isExhausted
                ? `Rate limit reached – resets in ${minutesUntilReset()} min`
                : '1 AI request remaining this hour'}
            </Text>
          </View>
        )}

        {/* INPUT ROW */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name={searchMode === 'ai' ? 'sparkles-outline' : 'search-outline'}
            size={18}
            color={isExhausted ? COLORS.danger : COLORS.primary}
            style={styles.inputIcon}
          />

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              isExhausted
                ? 'Rate limit reached. Try again next hour...'
                : isLoading
                  ? searchMode === 'ai'
                    ? 'Pitchera AI is thinking...'
                    : 'Searching for jobs...'
                  : searchMode === 'ai'
                    ? 'Ask about your resume, jobs or applications...'
                    : 'Search jobs, companies or openings...'
            }
            placeholderTextColor={
              isExhausted ? COLORS.danger : COLORS.textMuted
            }
            multiline={false}
            numberOfLines={1}
            maxLength={1000}
            editable={!isLoading && !isExhausted}
            style={styles.input}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage(input)}
          />

          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || isExhausted}
            accessibilityRole="button"
            accessibilityLabel={
              searchMode === 'ai' ? 'Send message' : 'Search'
            }
            style={({ pressed }) => [
              styles.sendButton,
              !input.trim() || isLoading || isExhausted
                ? styles.sendDisabled
                : styles.sendActive,
              pressed && styles.sendPressed,
            ]}
          >
            <Ionicons
              name={isLoading ? 'ellipsis-horizontal' : 'arrow-up'}
              size={20}
              color={
                !input.trim() || isLoading || isExhausted
                  ? '#AEB2C1'
                  : COLORS.white
              }
            />
          </Pressable>
        </View>

        {/* HINT */}
        <Text style={styles.inputHint}>
          {searchMode === 'ai'
            ? rateLimitLabel
              ? `Pitchera AI • ${rateLimitLabel}`
              : 'Pitchera AI • Resume & job application assistant'
            : 'Google Search • Find current job opportunities'}
        </Text>
      </View>

    </KeyboardAvoidingView>
  );
};

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.background,
  },

  /* ── HEADER ── */
  header: {
    height:          88,
    overflow:        'hidden',
    backgroundColor: COLORS.primary,
  },
  headerGlowLarge: {
    position:        'absolute',
    width:           280, height: 280,
    borderRadius:    140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -100, top: -150,
  },
  headerGlowSmall: {
    position:        'absolute',
    width:           130, height: 130,
    borderRadius:    65,
    backgroundColor: 'rgba(255,255,255,0.055)',
    left: -65, top: 35,
  },
  headerContent: {
    flex:             1,
    paddingHorizontal: 12,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
  },
  headerLeft: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    marginRight:   7,
    minWidth:      0,
  },
  avatarWrapper: {
    width:           50, height: 50,
    borderRadius:    25,
    backgroundColor: COLORS.white,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     10,
    borderWidth:     2,
    borderColor:     'rgba(255,255,255,0.35)',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.14,
    shadowRadius:    8,
    elevation:       5,
  },
  avatar: {
    width: 45, height: 45, borderRadius: 23,
  },
  onlineIndicator: {
    position:        'absolute',
    right: -1, bottom: 1,
    width:           13, height: 13,
    borderRadius:    7,
    backgroundColor: COLORS.success,
    borderWidth:     2,
    borderColor:     COLORS.white,
  },
  googleIndicator: {
    backgroundColor: '#4285F4',
  },
  exhaustedIndicator: {
    backgroundColor: COLORS.danger,
  },
  headerText: {
    flex: 1, minWidth: 0,
  },
  title: {
    color:         COLORS.white,
    fontSize:      16,
    fontWeight:    '800',
    letterSpacing: -0.2,
    marginBottom:  5,
  },
  titleSmall: { fontSize: 13.5 },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    minWidth:      0,
  },
  statusDot: {
    width:        7, height: 7,
    borderRadius: 4,
    marginRight:  6,
  },
  statusText: {
    flex:       1,
    color:      'rgba(255,255,255,0.78)',
    fontSize:   10,
    fontWeight: '500',
  },

  /* ── HEADER ACTIONS ── */
  headerActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           7,
  },
  headerActionsSmall: { gap: 4 },
  modeToggle: {
    height:          35,
    flexDirection:   'row',
    alignItems:      'center',
    padding:         3,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.18)',
  },
  modeToggleSmall: { height: 32 },
  modeButton: {
    height:           29,
    paddingHorizontal: 9,
    borderRadius:     15,
    alignItems:       'center',
    justifyContent:   'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor:     '#282A7A',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.15,
    shadowRadius:    4,
    elevation:       2,
  },
  modeButtonPressed: {
    opacity:   0.75,
    transform: [{ scale: 0.96 }],
  },
  modeText: {
    color:      'rgba(255,255,255,0.76)',
    fontSize:   9.5,
    fontWeight: '800',
  },
  modeTextActive: { color: COLORS.primary },
  closeButton: {
    width:           37, height: 37,
    borderRadius:    19,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    transform:       [{ scale: 0.92 }],
  },

  /* ── MESSAGES ── */
  messagesContainer: {
    flex:            1,
    backgroundColor: COLORS.background,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingTop:        15,
    paddingBottom:     14,
  },
  messagesContentMobile: { paddingHorizontal: 12 },
  welcomeLabel: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  17,
  },
  welcomeLine: {
    flex:            1,
    height:          1,
    backgroundColor: COLORS.border,
  },
  todayPill: {
    marginHorizontal:  9,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      10,
    backgroundColor:   '#F0F1F8',
  },
  welcomeText: {
    color:         COLORS.textMuted,
    fontSize:      8.5,
    fontWeight:    '900',
    letterSpacing: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom:  13,
    alignItems:    'center',
  },
  botRow:    { justifyContent: 'flex-start', alignItems: 'center' },
  userRow:   { justifyContent: 'flex-end',   alignItems: 'center' },
  systemRow: { justifyContent: 'center',     alignItems: 'center' },

  /* ── AVATARS ── */
  messageAvatarWrapper: {
    width:           31, height: 31,
    borderRadius:    16,
    backgroundColor: COLORS.white,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     7,
    borderWidth:     1,
    borderColor:     COLORS.border,
    shadowColor:     '#343765',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    4,
    elevation:       1,
  },
  messageAvatar: {
    width: 27, height: 27, borderRadius: 14,
  },
  userAvatarWrapper: {
    width:           40, height: 40,
    borderRadius:    20,
    marginLeft:      8,
    backgroundColor: COLORS.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     '#E0E2FF',
    overflow:        'hidden',
    shadowColor:     '#343765',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    4,
    elevation:       2,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
  },
  userAvatarFallback: {
    width:           40, height: 40,
    borderRadius:    20,
    backgroundColor: COLORS.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
  },

  /* ── BUBBLES ── */
  bubble: {
    maxWidth:          '79%',
    paddingHorizontal: 14,
    paddingVertical:   11,
    borderRadius:      18,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 5,
    borderWidth:     1,
    borderColor:     COLORS.border,
    shadowColor:     '#4B4F70',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.045,
    shadowRadius:    6,
    elevation:       1,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.16,
    shadowRadius:    8,
    elevation:       2,
  },
  systemBubble: {
    backgroundColor: '#FFF8E7',
    borderWidth:     1,
    borderColor:     '#FFE0B2',
    borderRadius:    12,
    maxWidth:        '92%',
  },
  messageText: {
    fontSize: 13.5, lineHeight: 20,
  },
  botMessageText:    { color: COLORS.text },
  userMessageText:   { color: COLORS.white },
  systemMessageText: { color: '#B45309', fontSize: 12.5 },

  /* ── SUGGESTIONS ── */
  suggestionsContainer: { marginTop: 3, marginBottom: 10 },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  10,
  },
  sparkle: {
    width:           23, height: 23,
    borderRadius:    8,
    backgroundColor: COLORS.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     7,
  },
  sparkleText:    { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  suggestionTitle: {
    color:         COLORS.textSecondary,
    fontSize:      9.5,
    fontWeight:    '900',
    letterSpacing: 0.8,
  },
  suggestionList: { gap: 8 },
  suggestionChip: {
    minHeight:         50,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 9,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       COLORS.border,
    backgroundColor:   COLORS.white,
    shadowColor:       '#33375E',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.035,
    shadowRadius:      5,
    elevation:         1,
  },
  suggestionPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor:     '#D7D9FF',
    transform:       [{ scale: 0.985 }],
  },
  suggestionIconBox: {
    width:           33, height: 33,
    borderRadius:    10,
    backgroundColor: COLORS.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     9,
  },
  suggestionText: {
    flex:       1,
    color:      COLORS.text,
    fontSize:   12.5,
    fontWeight: '600',
  },

  /* ── TYPING ── */
  typingBubble: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 15,
    paddingVertical:   13,
    minWidth:          58,
    height:            42,
    borderRadius:      18,
    borderBottomLeftRadius: 5,
    backgroundColor:   COLORS.white,
    borderWidth:       1,
    borderColor:       COLORS.border,
    shadowColor:       '#44486C',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.04,
    shadowRadius:      5,
    elevation:         1,
  },
  typingDot: {
    width:            6, height: 6,
    borderRadius:     3,
    backgroundColor:  COLORS.primary,
    marginHorizontal: 2,
  },

  /* ── INPUT ── */
  inputSection: {
    paddingHorizontal: 12,
    paddingTop:        9,
    paddingBottom:     10,
    backgroundColor:   COLORS.white,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
  },
  rateLimitBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   '#FFFBEB',
    borderWidth:       1,
    borderColor:       '#FDE68A',
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   6,
    marginBottom:      7,
  },
  rateLimitBarExhausted: {
    backgroundColor: '#FFF1F2',
    borderColor:     '#FECDD3',
  },
  rateLimitBarText: {
    flex:       1,
    color:      '#92400E',
    fontSize:   11,
    fontWeight: '600',
  },
  rateLimitBarTextDanger: { color: COLORS.danger },
  inputWrapper: {
    height:           50,
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.background,
    borderWidth:      1,
    borderColor:      COLORS.border,
    borderRadius:     17,
    paddingLeft:      12,
    paddingRight:     5,
    shadowColor:      '#3A3E66',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.035,
    shadowRadius:     5,
    elevation:        1,
  },
  inputIcon: { marginRight: 6 },
  input: {
    flex:              1,
    height:            44,
    minHeight:         44,
    maxHeight:         44,
    color:             COLORS.text,
    fontSize:          13,
    lineHeight:        18,
    paddingVertical:   0,
    paddingHorizontal: 2,
    textAlignVertical: 'center',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  sendButton: {
    width:          40, height: 40,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     5,
  },
  sendActive: {
    backgroundColor: COLORS.primary,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.2,
    shadowRadius:    6,
    elevation:       3,
  },
  sendDisabled:  { backgroundColor: '#E9EAF1' },
  sendPressed:   { opacity: 0.75, transform: [{ scale: 0.93 }] },
  inputHint: {
    textAlign:  'center',
    color:      COLORS.textMuted,
    fontSize:   8.5,
    marginTop:  6,
  },
});

export default ChatWindow;