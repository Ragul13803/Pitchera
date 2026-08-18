// src/app/(app)/applications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

// ─── Types (matching DB schema) ───────────────────────────────────────────────

type AppStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'interview'
  | 'rejected'
  | 'selected'
  | 'offer';

interface EmailLog {
  id: number;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
}

interface JobApplication {
  id: number;
  company_name: string;
  job_title: string;
  job_url: string | null;
  status: AppStatus;
  applied_at: string | null;
  created_at: string;
  email_logs?: EmailLog[];
  recruiter_count?: number;
  emails_sent?: number;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS: Record<AppStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: 'Draft',     color: '#6B7280', bg: '#F3F4F6', icon: 'document-outline' },
  scheduled: { label: 'Scheduled', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  sent:      { label: 'Sent',      color: '#2563EB', bg: '#DBEAFE', icon: 'mail-outline' },
  failed:    { label: 'Failed',    color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle-outline' },
  interview: { label: 'Interview', color: '#7C3AED', bg: '#EDE9FE', icon: 'people-outline' },
  rejected:  { label: 'Rejected',  color: '#9CA3AF', bg: '#F9FAFB', icon: 'close-circle-outline' },
  selected:  { label: 'Selected',  color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  offer:     { label: 'Offer',     color: '#065F46', bg: '#A7F3D0', icon: 'trophy-outline' },
};

const ALL_STATUSES = Object.keys(STATUS) as AppStatus[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitial(name: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

// Deterministic color from company name
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const s = STATUS[status] ?? STATUS.draft;
  return (
    <View style={[sb.wrap, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon as any} size={11} color={s.color} />
      <Text style={[sb.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ colors }: { colors: any }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[sk.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[sk.circle, { backgroundColor: colors.border }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[sk.line, { width: '60%', backgroundColor: colors.border }]} />
            <View style={[sk.line, { width: '40%', backgroundColor: colors.border }]} />
            <View style={[sk.line, { width: '30%', backgroundColor: colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  circle: { width: 44, height: 44, borderRadius: 22 },
  line: { height: 12, borderRadius: 6 },
});

// ─── Application Card ─────────────────────────────────────────────────────────

function AppCard({
  item,
  colors,
  onPress,
  onSendEmail,
}: {
  item: JobApplication;
  colors: any;
  onPress: () => void;
  onSendEmail: () => void;
}) {
  const bg = avatarColor(item.company_name);
  const date = item.applied_at || item.created_at;
  const emailsSent = item.emails_sent ?? 0;
  const canSend = item.status !== 'sent' && item.status !== 'selected' && item.status !== 'offer';

  return (
    <TouchableOpacity
      style={[card.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top Row */}
      <View style={card.topRow}>
        <View style={[card.avatar, { backgroundColor: bg }]}>
          <Text style={card.avatarText}>{getInitial(item.company_name)}</Text>
        </View>

        <View style={card.info}>
          <Text style={[card.company, { color: colors.text }]} numberOfLines={1}>
            {item.company_name}
          </Text>
          <Text style={[card.role, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.job_title}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      {/* Divider */}
      <View style={[card.divider, { backgroundColor: colors.border }]} />

      {/* Bottom Row */}
      <View style={card.bottomRow}>
        <View style={card.metaGroup}>
          <View style={card.meta}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={[card.metaText, { color: colors.textSecondary }]}>{fmtDate(date)}</Text>
          </View>
          <View style={card.meta}>
            <Ionicons name="mail-outline" size={12} color={emailsSent > 0 ? '#2563EB' : colors.textSecondary} />
            <Text style={[card.metaText, { color: emailsSent > 0 ? '#2563EB' : colors.textSecondary }]}>
              {emailsSent} email{emailsSent !== 1 ? 's' : ''} sent
            </Text>
          </View>
        </View>

        {/* Send Email Button */}
        {canSend && (
          <TouchableOpacity
            style={[card.sendBtn, { backgroundColor: colors.primary }]}
            onPress={(e) => { e.stopPropagation?.(); onSendEmail(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="send-outline" size={13} color="#fff" />
            <Text style={card.sendBtnText}>Send Mail</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' } as any,
    }),
  },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  info:       { flex: 1 },
  company:    { fontSize: 15, fontWeight: '700' },
  role:       { fontSize: 13, marginTop: 2 },
  divider:    { height: 1, marginVertical: 12 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaGroup:  { gap: 4 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:   { fontSize: 12 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sendBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function Pill({
  label, active, color, bg, onPress, colors,
}: { label: string; active: boolean; color: string; bg: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[pill.wrap, {
        backgroundColor: active ? bg : colors.card,
        borderColor: active ? color : colors.border,
      }]}
      onPress={onPress}
    >
      <Text style={[pill.text, { color: active ? color : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const pill = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '600' },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function Empty({ colors, onAdd }: { colors: any; onAdd: () => void }) {
  return (
    <View style={em.wrap}>
      <View style={[em.iconWrap, { backgroundColor: colors.card }]}>
        <Ionicons name="mail-outline" size={52} color={colors.primary} />
      </View>
      <Text style={[em.title, { color: colors.text }]}>No Applications Yet</Text>
      <Text style={[em.sub, { color: colors.textSecondary }]}>
        Start sending cold emails to recruiters and track every application here.
      </Text>
      <TouchableOpacity style={[em.btn, { backgroundColor: colors.primary }]} onPress={onAdd}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={em.btnText}>New Application</Text>
      </TouchableOpacity>
    </View>
  );
}
const em = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  sub:      { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  btnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ApplicationScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filtered, setFiltered]         = useState<JobApplication[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [activeStatus, setActiveStatus] = useState<AppStatus | 'all'>('all');
  const [sort, setSort]                 = useState<'newest' | 'oldest'>('newest');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetch = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res: any  = await api.get('/applications/getAllApplications');
      const data = (res?.data ?? res ?? []) as JobApplication[];
      setApplications(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // ── Filter ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let r = [...applications];
    if (activeStatus !== 'all') r = r.filter(a => a.status === activeStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(a =>
        a.company_name?.toLowerCase().includes(q) ||
        a.job_title?.toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === 'newest' ? db - da : da - db;
    });
    setFiltered(r);
  }, [applications, search, activeStatus, sort]);

  // ── Quick send (navigate to applications/AddApplication with pre-filled id) ───────────────────

  const handleSendEmail = (app: JobApplication) => {
    router.push({ pathname: '/(app)/applications/AddApplication', params: { applicationId: String(app.id), companyName: app.company_name, jobTitle: app.job_title } });
  };

  const handleAdd = () => router.push('/(app)/applications/AddApplication');

  // ── Counts ─────────────────────────────────────────────────────────────────

  const count = (s: AppStatus) => applications.filter(a => a.status === s).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerLeft}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Applications</Text>
          <View style={[s.countBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[s.countBadgeText, { color: colors.primary }]}>{applications.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search + Sort ───────────────────────────────────────────────────── */}
      <View style={[s.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[s.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Search company or role…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.sortBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => setSort(p => p === 'newest' ? 'oldest' : 'newest')}
        >
          <Ionicons name={sort === 'newest' ? 'arrow-down' : 'arrow-up'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Status Filters ──────────────────────────────────────────────────── */}
      <View style={[s.filtersWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={(['all', ...ALL_STATUSES] as (AppStatus | 'all')[])}
          keyExtractor={i => i}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          renderItem={({ item: st }) => {
            const cfg = st === 'all'
              ? { label: `All (${applications.length})`, color: colors.primary, bg: colors.primary + '20' }
              : { label: `${STATUS[st].label} (${count(st)})`, color: STATUS[st].color, bg: STATUS[st].bg };
            return (
              <Pill
                label={cfg.label}
                active={activeStatus === st}
                color={cfg.color}
                bg={cfg.bg}
                onPress={() => setActiveStatus(st)}
                colors={colors}
              />
            );
          }}
        />
      </View>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error ? (
        <View style={s.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={44} color="#EF4444" />
          <Text style={[s.errorTitle, { color: colors.text }]}>Failed to load</Text>
          <Text style={[s.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => fetch()}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <Skeleton colors={colors} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetch(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Empty colors={colors} onAdd={handleAdd} />}
          renderItem={({ item }) => (
            <AppCard
              item={item}
              colors={colors}
              onPress={() => router.push({ pathname: '/(app)/applications/AddApplication', params: { applicationId: String(item.id) } })}
              onSendEmail={() => handleSendEmail(item)}
            />
          )}
        />
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.primary }]} onPress={handleAdd}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14, borderBottomWidth: 1,
  },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 22, fontWeight: '800' },
  countBadge:      { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  countBadgeText:  { fontSize: 12, fontWeight: '700' },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText:      { color: '#fff', fontSize: 14, fontWeight: '700' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 14 },
  sortBtn:     { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  filtersWrap: { borderBottomWidth: 1 },

  list: { paddingTop: 16, paddingBottom: 100 },

  errorWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  errorMsg:   { fontSize: 13, textAlign: 'center' },
  retryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryText:  { color: '#fff', fontSize: 14, fontWeight: '600' },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10,
  },
});