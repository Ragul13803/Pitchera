import { useAuth } from "@/context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  email?: string;
  status: "sent" | "scheduled" | "draft" | "failed";
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
}

export default function Dashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const greeting = () => {
    const h = new Date().getHours();

    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";

    return "Good Evening";
  };

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

      setApplications(Array.isArray(data) ? data : []);
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

  // --------------------------------------------------
  // Stats
  // --------------------------------------------------

  const stats = {
    sent: applications.filter((app) => app.status === "sent").length,
    scheduled: applications.filter((app) => app.status === "scheduled").length,
    draft: applications.filter((app) => app.status === "draft").length,
    failed: applications.filter((app) => app.status === "failed").length,
  };

  // --------------------------------------------------
  // Activity Message
  // --------------------------------------------------

  const getActivityMessage = (app: JobApplication) => {
    switch (app.status) {
      case "sent": {
        const email = app.email?.trim() || "";

        // If email ends with gmail.com
        const isGmail = email.toLowerCase().endsWith("@gmail.com");

        return {
          icon: "checkmark-circle",
          color: "#10B981",

          text: isGmail
            ? `You sent a cold email to ${app.companyName}`
            : email
            ? `You sent a cold email to ${app.companyName} through ${email}`
            : `You sent a cold email to ${app.companyName}`,

          time: app.sentAt || app.createdAt,
        };
      }

      case "scheduled":
        return {
          icon: "time-outline",
          color: "#F59E0B",

          text: `Email to ${
            app.companyName
          } scheduled for ${new Date(
            app.scheduledFor || ""
          ).toLocaleDateString()}`,

          time: app.createdAt,
        };

      case "draft":
        return {
          icon: "document-text-outline",
          color: "#6B7280",

          text: `Draft created for ${app.companyName} (${app.position})`,

          time: app.createdAt,
        };

      case "failed": {
        const email = app.email?.trim() || "";

        return {
          icon: "close-circle",
          color: "#EF4444",

          text: email
            ? `Failed to send email to ${app.companyName} at ${email}`
            : `Failed to send email to ${app.companyName}`,

          time: app.createdAt,
        };
      }

      default:
        return {
          icon: "mail-outline",
          color: "#6B7280",
          text: `Application to ${app.companyName}`,
          time: app.createdAt,
        };
    }
  };

  // --------------------------------------------------
  // Format Time
  // --------------------------------------------------

  const formatTime = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const diff = now.getTime() - date.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-24"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchApplications(true)}
        />
      }
    >
      {/* ===================================================== */}
      {/* Header */}
      {/* ===================================================== */}

      <View className="px-6 pt-12 pb-6 ios:pt-16">
        <Text
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
        >
          {greeting()},
        </Text>

        <Text
          className="text-3xl font-bold mt-1"
          style={{ color: colors.textSecondary }}
        >
          {fullName} 👋
        </Text>
      </View>

      {/* ===================================================== */}
      {/* Stats Cards */}
      {/* ===================================================== */}

{/* Stats Cards */}
<View className="px-6 mb-6">
  <View className="flex-row flex-wrap -mx-2">

    {/* Sent Card */}
    <View className="w-1/2 md:w-1/4 px-2 mb-4">
      <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800 min-h-[140px]">
        <View className="flex-row items-center justify-between mb-2">
          <Ionicons
            name="checkmark-circle"
            size={24}
            color="#10B981"
          />

          <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.sent}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Sent
        </Text>

        <Text className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
          Successfully delivered
        </Text>
      </View>
    </View>

    {/* Scheduled Card */}
    <View className="w-1/2 md:w-1/4 px-2 mb-4">
      <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800 min-h-[140px]">
        <View className="flex-row items-center justify-between mb-2">
          <Ionicons
            name="time-outline"
            size={24}
            color="#F59E0B"
          />

          <Text className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.scheduled}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Scheduled
        </Text>

        <Text className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
          Queued to send
        </Text>
      </View>
    </View>

    {/* Draft Card */}
    <View className="w-1/2 md:w-1/4 px-2 mb-4">
      <View className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 min-h-[140px]">
        <View className="flex-row items-center justify-between mb-2">
          <Ionicons
            name="document-text-outline"
            size={24}
            color="#6B7280"
          />

          <Text className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {stats.draft}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Drafts
        </Text>

        <Text className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-1">
          Pending completion
        </Text>
      </View>
    </View>

    {/* Failed Card */}
    <View className="w-1/2 md:w-1/4 px-2 mb-4">
      <View className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-800 min-h-[140px]">
        <View className="flex-row items-center justify-between mb-2">
          <Ionicons
            name="close-circle"
            size={24}
            color="#EF4444"
          />

          <Text className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.failed}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
          Failed
        </Text>

        <Text className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
          Requires attention
        </Text>
      </View>
    </View>

  </View>
</View>

      {/* ===================================================== */}
      {/* Activity Feed */}
      {/* ===================================================== */}

      <View className="px-6">
        {/* Activity Header */}

        <View className="flex-row items-center justify-between mb-4">
          <Text
            className="text-xl font-bold"
            style={{ color: colors.textSecondary }}
          >
            Recent Activity
          </Text>

          {applications.length > 0 && (
            <TouchableOpacity
              onPress={() => fetchApplications(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ================================================= */}
        {/* Loading */}
        {/* ================================================= */}

        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text
              className="mt-4 text-sm"
              style={{ color: colors.textSecondary }}
            >
              Loading applications...
            </Text>
          </View>
        ) : error ? (
          /* ================================================= */
          /* Error */
          /* ================================================= */

          <View className="py-12 px-6 items-center bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <Ionicons
              name="alert-circle"
              size={48}
              color="#EF4444"
            />

            <Text className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </Text>

            <TouchableOpacity
              onPress={() => fetchApplications()}
              className="mt-4 bg-red-100 dark:bg-red-800 px-6 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-red-700 dark:text-red-300 font-semibold">
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : applications.length === 0 ? (
          /* ================================================= */
          /* Empty State */
          /* ================================================= */

          <View className="py-16 items-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <Ionicons
              name="mail-outline"
              size={64}
              color={colors.textSecondary}
              style={{ opacity: 0.3 }}
            />

            <Text
              className="mt-4 text-lg font-semibold"
              style={{ color: colors.textSecondary }}
            >
              No applications yet
            </Text>

            <Text
              className="mt-2 text-sm text-center px-8"
              style={{
                color: colors.textSecondary,
                opacity: 0.7,
              }}
            >
              Start sending cold emails to track your job applications here
            </Text>
          </View>
        ) : (
          /* ================================================= */
          /* Activity List */
          /* ================================================= */

          <View className="gap-3">
            {applications.map((app, index) => {
              const activity = getActivityMessage(app);

              return (
                <View
                  key={app.id || index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex-row"
                >
                  {/* --------------------------------------- */}
                  {/* Icon */}
                  {/* --------------------------------------- */}

                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: `${activity.color}15`,
                    }}
                  >
                    <Ionicons
                      name={activity.icon as any}
                      size={20}
                      color={activity.color}
                    />
                  </View>

                  {/* --------------------------------------- */}
                  {/* Content */}
                  {/* --------------------------------------- */}

                  <View className="flex-1 pr-2">
                    <Text
                      className="text-sm font-medium leading-5"
                      style={{
                        color: colors.textSecondary,
                      }}
                    >
                      {activity.text}
                    </Text>

                    <Text
                      className="text-xs mt-1"
                      style={{
                        color: colors.textSecondary,
                        opacity: 0.6,
                      }}
                    >
                      {formatTime(activity.time)}
                    </Text>
                  </View>

                  {/* --------------------------------------- */}
                  {/* Status Badge */}
                  {/* --------------------------------------- */}

                  <View
                    className="px-2 py-1 rounded-lg self-start"
                    style={{
                      backgroundColor: `${activity.color}15`,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{
                        color: activity.color,
                      }}
                    >
                      {app.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}