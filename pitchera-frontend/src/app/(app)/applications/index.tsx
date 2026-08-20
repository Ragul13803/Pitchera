// src/app/(app)/applications.tsx

import React, { useState, useEffect, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import api from "@/services/api";
import { useTheme } from "@/context/ThemeContext";

import type { AppStatus, JobApplication } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STATUS: Record<
  AppStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: string;
  }
> = {
  draft: {
    label: "Draft",
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "document-outline",
  },

  scheduled: {
    label: "Scheduled",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline",
  },

  sent: {
    label: "Sent",
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: "mail-outline",
  },

  failed: {
    label: "Failed",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "alert-circle-outline",
  },
};

const ALL_STATUSES = Object.keys(STATUS) as AppStatus[];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? "?";
}

const AVATAR_COLORS = [
  "#6366F1",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

function avatarColor(name: string): string {
  let h = 0;

  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }

  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const item = STATUS[status] ?? STATUS.draft;

  return (
    <View
      style={[
        sb.wrap,
        {
          backgroundColor: item.bg,
        },
      ]}
    >
      <Ionicons name={item.icon as any} size={11} color={item.color} />

      <Text
        style={[
          sb.text,
          {
            color: item.color,
          },
        ]}
      >
        {item.label}
      </Text>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ colors }: { colors: any }) {
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            sk.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              sk.circle,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View
            style={{
              flex: 1,
              gap: 8,
            }}
          >
            <View
              style={[
                sk.line,
                {
                  width: "60%",
                  backgroundColor: colors.border,
                },
              ]}
            />

            <View
              style={[
                sk.line,
                {
                  width: "40%",
                  backgroundColor: colors.border,
                },
              ]}
            />

            <View
              style={[
                sk.line,
                {
                  width: "30%",
                  backgroundColor: colors.border,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },

  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  line: {
    height: 12,
    borderRadius: 6,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION DETAIL
// ─────────────────────────────────────────────────────────────────────────────

function relevantDetail(item: JobApplication): {
  icon: string;
  text: string;
  color?: string;
} {
  if (item.status === "scheduled" && item.scheduledAt) {
    return {
      icon: "time-outline",
      text: `Scheduled ${fmtDateTime(item.scheduledAt)}`,
      color: "#D97706",
    };
  }

  if (item.status === "sent" && item.sentAt) {
    return {
      icon: "checkmark-done-outline",
      text: `Sent ${fmtDateTime(item.sentAt)}`,
      color: "#2563EB",
    };
  }

  if (item.status === "failed" && item.errorMessage) {
    return {
      icon: "alert-circle-outline",
      text: item.errorMessage,
      color: "#DC2626",
    };
  }

  return {
    icon: "calendar-outline",
    text: fmtDate(item.appliedAt || item.createdAt),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION CARD
// ─────────────────────────────────────────────────────────────────────────────

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
  const bg = avatarColor(item.companyName);

  // Only already-sent applications
  // cannot be sent again.
  const canSend = item.status !== "sent";

  const detail = relevantDetail(item);

  const primaryRecipient = item.recipients[0];

  return (
    <TouchableOpacity
      style={[
        card.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* TOP ROW */}
      <View style={card.topRow}>
        <View
          style={[
            card.avatar,
            {
              backgroundColor: bg,
            },
          ]}
        >
          <Text style={card.avatarText}>{getInitial(item.companyName)}</Text>
        </View>

        <View style={card.info}>
          <Text
            style={[
              card.company,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {item.companyName}
          </Text>

          <Text
            style={[
              card.role,
              {
                color: colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {item.jobTitle}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      {/* RECIPIENT */}
      {primaryRecipient && (
        <Text
          style={[
            card.recipient,
            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {primaryRecipient.name || primaryRecipient.email}

          {item.recipientCount > 1 ? ` + ${item.recipientCount - 1} more` : ""}
        </Text>
      )}

      {/* DIVIDER */}
      <View
        style={[
          card.divider,
          {
            backgroundColor: colors.border,
          },
        ]}
      />

      {/* BOTTOM ROW */}
      <View style={card.bottomRow}>
        <View style={card.meta}>
          <Ionicons
            name={detail.icon as any}
            size={12}
            color={detail.color ?? colors.textSecondary}
          />

          <Text
            style={[
              card.metaText,
              {
                color: detail.color ?? colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {detail.text}
          </Text>
        </View>

        {canSend && (
          <TouchableOpacity
            style={[
              card.sendBtn,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();

              console.log("📧 SEND MAIL CLICKED");

              onSendEmail();
            }}
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
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },

      android: {
        elevation: 2,
      },

      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      } as any,
    }),
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  info: {
    flex: 1,
  },

  company: {
    fontSize: 15,
    fontWeight: "700",
  },

  role: {
    fontSize: 13,
    marginTop: 2,
  },

  recipient: {
    fontSize: 12,
    marginTop: 8,
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },

  metaText: {
    fontSize: 12,
    flexShrink: 1,
  },

  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },

  sendBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// FILTER PILL
// ─────────────────────────────────────────────────────────────────────────────

function Pill({
  label,
  active,
  color,
  bg,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        pill.wrap,
        {
          backgroundColor: active ? bg : colors.card,

          borderColor: active ? color : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          pill.text,
          {
            color: active ? color : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const pill = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function Empty({ colors, onAdd }: { colors: any; onAdd: () => void }) {
  return (
    <View style={em.wrap}>
      <View
        style={[
          em.iconWrap,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <Ionicons name="mail-outline" size={52} color={colors.primary} />
      </View>

      <Text
        style={[
          em.title,
          {
            color: colors.text,
          },
        ]}
      >
        No Applications Yet
      </Text>

      <Text
        style={[
          em.sub,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Start sending cold emails to recruiters and track every application
        here.
      </Text>

      <TouchableOpacity
        style={[
          em.btn,
          {
            backgroundColor: colors.primary,
          },
        ]}
        onPress={() => {
          console.log("🔥 EMPTY NEW APPLICATION CLICKED");

          onAdd();
        }}
      >
        <Ionicons name="add" size={18} color="#fff" />

        <Text style={em.btnText}>New Application</Text>
      </TouchableOpacity>
    </View>
  );
}

const em = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },

  sub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },

  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function ApplicationScreen() {
  const router = useRouter();

  const { colors } = useTheme();

  const [applications, setApplications] = useState<JobApplication[]>([]);

  const [filtered, setFiltered] = useState<JobApplication[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [activeStatus, setActiveStatus] = useState<AppStatus | "all">("all");

  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  // ───────────────────────────────────────────────────────────────────────────
  // FETCH
  // ───────────────────────────────────────────────────────────────────────────

  const fetchApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      console.log("📡 Fetching applications...");

      const res: any = await api.get("/applications/getAllApplications");

      const data = (res?.data ?? res ?? []) as JobApplication[];

      console.log("📡 Applications:", data.length);

      setApplications(data);
    } catch (e: any) {
      console.error("❌ Application fetch error:", e);

      setError(e?.message ?? "Failed to load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ───────────────────────────────────────────────────────────────────────────
  // FILTER
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let result = [...applications];

    if (activeStatus !== "all") {
      result = result.filter((a) => a.status === activeStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (a) =>
          a.companyName?.toLowerCase().includes(q) ||
          a.jobTitle?.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();

      const db = new Date(b.createdAt).getTime();

      return sort === "newest" ? db - da : da - db;
    });

    setFiltered(result);
  }, [applications, search, activeStatus, sort]);

  // ───────────────────────────────────────────────────────────────────────────
  // ADD APPLICATION
  // ───────────────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    router.push({
      pathname: "/(app)/applications/AddApplication",
    });
  }, [router]);

  // ───────────────────────────────────────────────────────────────────────────
  // SEND EMAIL
  // ───────────────────────────────────────────────────────────────────────────

  const handleSendEmail = useCallback(
    (app: JobApplication) => {
      console.log("📧 Send email:", app.id);

      router.push({
        pathname: "/(app)/applications/AddApplication",

        params: {
          applicationId: String(app.id),

          companyName: app.companyName,

          jobTitle: app.jobTitle,
        },
      });
    },
    [router],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // COUNT
  // ───────────────────────────────────────────────────────────────────────────

  const count = (status: AppStatus) =>
    applications.filter((a) => a.status === status).length;

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        s.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* HEADER */}

      <View
        style={[
          s.header,
          {
            backgroundColor: colors.card,

            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={s.headerLeft}>
          <Text
            style={[
              s.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Applications
          </Text>

          <View
            style={[
              s.countBadge,
              {
                backgroundColor: colors.primary + "20",
              },
            ]}
          >
            <Text
              style={[
                s.countBadgeText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {applications.length}
            </Text>
          </View>
        </View>

        {/* ADD NEW */}

        <TouchableOpacity
          style={[
            s.addBtn,
            {
              backgroundColor: colors.primary,
            },
          ]}
          activeOpacity={0.6}
          onPress={handleAdd}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />

          <Text style={s.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}

      <View
        style={[
          s.searchRow,
          {
            backgroundColor: colors.card,

            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            s.searchBox,
            {
              backgroundColor: colors.background,

              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.textSecondary}
          />

          <TextInput
            style={[
              s.searchInput,
              {
                color: colors.text,
              },
            ]}
            placeholder="Search company or role…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* SORT */}

        <TouchableOpacity
          style={[
            s.sortBtn,
            {
              backgroundColor: colors.background,

              borderColor: colors.border,
            },
          ]}
          onPress={() =>
            setSort((prev) => (prev === "newest" ? "oldest" : "newest"))
          }
        >
          <Ionicons
            name={sort === "newest" ? "arrow-down" : "arrow-up"}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* FILTERS */}

      <View
        style={[
          s.filtersWrap,
          {
            backgroundColor: colors.card,

            borderBottomColor: colors.border,
          },
        ]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["all", ...ALL_STATUSES] as (AppStatus | "all")[]}
          keyExtractor={(item) => item}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
          renderItem={({ item: status }) => {
            const cfg =
              status === "all"
                ? {
                    label: `All (${applications.length})`,
                    color: colors.primary,
                    bg: colors.primary + "20",
                  }
                : {
                    label: `${STATUS[status].label} (${count(status)})`,

                    color: STATUS[status].color,

                    bg: STATUS[status].bg,
                  };

            return (
              <Pill
                label={cfg.label}
                active={activeStatus === status}
                color={cfg.color}
                bg={cfg.bg}
                colors={colors}
                onPress={() => setActiveStatus(status)}
              />
            );
          }}
        />
      </View>

      {/* CONTENT */}

      {error ? (
        <View style={s.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={44} color="#EF4444" />

          <Text
            style={[
              s.errorTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Failed to load
          </Text>

          <Text
            style={[
              s.errorMsg,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {error}
          </Text>

          <TouchableOpacity
            style={[
              s.retryBtn,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => fetchApplications()}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />

            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <Skeleton colors={colors} />
      ) : (
        <FlatList
          style={s.mainList}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            s.list,

            filtered.length === 0 && {
              flex: 1,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApplications(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 12,
              }}
            />
          )}
          ListEmptyComponent={<Empty colors={colors} onAdd={handleAdd} />}
          renderItem={({ item }) => (
            <AppCard
              item={item}
              colors={colors}
              onPress={() =>
                router.push({
                  pathname: "/(app)/applications/AddApplication",

                  params: {
                    applicationId: String(item.id),
                  },
                })
              }
              onSendEmail={() => handleSendEmail(item)}
            />
          )}
        />
      )}

      {/* MOBILE FAB */}

      {Platform.OS !== "web" && (
        <TouchableOpacity
          style={[
            s.fab,
            {
              backgroundColor: colors.primary,
            },
          ]}
          activeOpacity={0.7}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 16,

    paddingTop: Platform.OS === "ios" ? 56 : 16,

    paddingBottom: 14,

    borderBottomWidth: 1,

    ...(Platform.OS === "web"
      ? ({
          pointerEvents: "auto",
        } as any)
      : {}),
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    flexShrink: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ADD BUTTON

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 10,

    flexShrink: 0,

    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          pointerEvents: "auto",
          userSelect: "none",
        } as any)
      : {}),
  },

  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // SEARCH

  searchRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,

    paddingHorizontal: 16,
    paddingVertical: 12,

    borderBottomWidth: 1,

    position: "relative",
    zIndex: 100,
  },

  searchBox: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    borderWidth: 1,
    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  sortBtn: {
    width: 40,
    height: 40,

    borderRadius: 10,
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  // FILTERS

  filtersWrap: {
    borderBottomWidth: 1,

    position: "relative",
    zIndex: 50,
  },

  // LIST

  mainList: {
    flex: 1,

    position: "relative",

    zIndex: 1,
  },

  list: {
    paddingTop: 16,
    paddingBottom: 100,
  },

  // ERROR

  errorWrap: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    padding: 40,

    gap: 10,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  errorMsg: {
    fontSize: 13,
    textAlign: "center",
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    paddingHorizontal: 20,
    paddingVertical: 10,

    borderRadius: 10,

    marginTop: 8,
  },

  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // FAB

  fab: {
    position: "absolute",

    bottom: 28,
    right: 20,

    width: 58,
    height: 58,

    borderRadius: 29,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 10,
    elevation: 8,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
});
