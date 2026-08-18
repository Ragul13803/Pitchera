import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useForm,
  Controller,
  useFieldArray,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/context/ThemeContext";
import { api } from "@/services/api";
import DateField from "@/components/ui/DateField";

// ─────────────────────────────────────────────────────────────────────────────
// Default template
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SUBJECT =
  "Application for {{position}} - {{firstName}} {{lastName}}";

const DEFAULT_BODY = `Dear {{recruiterName}},

I am writing to express my interest in the {{position}} position.

I have {{experience}} of experience in {{skills}}.

Please find my resume attached for your consideration.

I would appreciate the opportunity to discuss my profile with you.

Thank you for your time and consideration.

Best regards,
{{firstName}} {{lastName}}
{{email}}
{{phone}}
{{linkedin}}`;

const TEMPLATE_VARS = [
  "{{recruiterName}}",
  "{{position}}",
  "{{firstName}}",
  "{{lastName}}",
  "{{email}}",
  "{{phone}}",
  "{{experience}}",
  "{{skills}}",
  "{{linkedin}}",
  "{{github}}",
  "{{portfolio}}",
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const recruiterSchema = z.object({
  name: z.string().trim().optional(),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email"),

  position: z
    .string()
    .trim()
    .min(1, "Position is required"),
});

const formSchema = z.object({
  recruiters: z
    .array(recruiterSchema)
    .min(1, "Add at least one recruiter")
    .refine(
      (recruiters) => {
        const emails = recruiters.map((r) =>
          r.email.toLowerCase().trim()
        );

        return emails.length === new Set(emails).size;
      },
      {
        message:
          "Duplicate recruiter emails are not allowed",
      }
    ),

  useDefaultTemplate: z.boolean(),

  customSubject: z.string().optional(),

  customBody: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
  colors,
}: {
  label: string;
  required?: boolean;
  colors: any;
}) {
  return (
    <Text
      style={[
        styles.fieldLabel,
        {
          color: colors.textSecondary,
        },
      ]}
    >
      {label}

      {required && (
        <Text style={{ color: "#EF4444" }}>
          {" "}
          *
        </Text>
      )}
    </Text>
  );
}

function FieldError({
  message,
  visible,
}: {
  message?: string;
  visible: boolean;
}) {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={styles.errorRow}>
      <Ionicons
        name="alert-circle-outline"
        size={12}
        color="#EF4444"
      />

      <Text style={styles.fieldError}>
        {message}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AddJobScreen() {
  const router = useRouter();

  const { colors } = useTheme();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 700;

  const [submitting, setSubmitting] =
    useState(false);

  const [submitMode, setSubmitMode] = useState<
    "now" | "schedule" | null
  >(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Schedule
  // ─────────────────────────────────────────────────────────────────────────

  /*
   * IMPORTANT:
   *
   * This uses your other project's DateField.
   *
   * DateField returns an ISO string:
   *
   * 2026-08-20T14:30:00.000Z
   *
   * No browser input.
   * No native DateTimePicker in this screen.
   * No webDate/webTime state.
   */
  const [scheduledFor, setScheduledFor] =
    useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // Gmail status
  // ─────────────────────────────────────────────────────────────────────────

  const [gmailStatus, setGmailStatus] =
    useState<{
      checked: boolean;
      connected: boolean;
      gmailAddress: string | null;
    }>({
      checked: false,
      connected: false,
      gmailAddress: null,
    });

  useEffect(() => {
    api
      .get("/gmail/status")
      .then((res: any) => {
        const data = res?.data ?? res;

        setGmailStatus({
          checked: true,
          connected: data?.connected === true,
          gmailAddress:
            data?.gmailAddress ?? null,
        });
      })
      .catch(() => {
        setGmailStatus({
          checked: true,
          connected: false,
          gmailAddress: null,
        });
      });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Form
  // ─────────────────────────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: {
      errors,
      isSubmitted,
    },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      recruiters: [
        {
          name: "",
          email: "",
          position: "",
        },
      ],

      useDefaultTemplate: true,

      customSubject: "",

      customBody: "",
    },
  });

  const { fields, append, remove } =
    useFieldArray({
      control,
      name: "recruiters",
    });

  const useDefault = watch(
    "useDefaultTemplate"
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  function parseError(err: any): string {
    const raw: string =
      err?.message ??
      err?.error ??
      "Something went wrong. Please try again.";

    const lower = raw.toLowerCase();

    if (
      lower.includes("gmail") &&
      lower.includes("not connected")
    ) {
      return (
        "Your Gmail account is not connected.\n\n" +
        "Go to Settings → Connect Gmail."
      );
    }

    if (
      lower.includes("token") ||
      lower.includes("auth")
    ) {
      return (
        "Your Gmail authorisation has expired.\n\n" +
        "Please reconnect Gmail in Settings."
      );
    }

    if (
      lower.includes("quota") ||
      lower.includes("rate limit")
    ) {
      return (
        "Gmail sending limit reached. " +
        "Please wait and try again."
      );
    }

    if (
      lower.includes("network") ||
      lower.includes("fetch")
    ) {
      return (
        "Network error. Check your internet connection."
      );
    }

    return raw;
  }

  function formatScheduledDisplay(
    isoDate: string
  ) {
    if (!isoDate) {
      return "";
    }

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function clearSchedule() {
    setScheduledFor("");
  }

  function validateSchedule(
    isoDate: string
  ): boolean {
    if (!isoDate) {
      Alert.alert(
        "No Schedule Set",
        "Please pick a date and time to schedule the email."
      );

      return false;
    }

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      Alert.alert(
        "Invalid Time",
        "Please select a valid date and time."
      );

      return false;
    }

    if (
      date.getTime() <=
      Date.now() + 60 * 1000
    ) {
      Alert.alert(
        "Invalid Time",
        "Please select a time at least 1 minute in the future."
      );

      return false;
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────

  const onSubmit = async (
    data: FormValues,
    mode: "now" | "schedule"
  ) => {
    if (submitting) {
      return;
    }

    // Schedule validation
    if (mode === "schedule") {
      if (!scheduledFor) {
        Alert.alert(
          "No Schedule Set",
          "Please pick a date and time to schedule the email."
        );

        return;
      }

      if (!validateSchedule(scheduledFor)) {
        return;
      }
    }

    const emailSubject =
      data.useDefaultTemplate
        ? DEFAULT_SUBJECT
        : data.customSubject?.trim() ||
          DEFAULT_SUBJECT;

    const emailBody =
      data.useDefaultTemplate
        ? DEFAULT_BODY
        : data.customBody?.trim() || "";

    if (!emailBody) {
      Alert.alert(
        "Email Body Required",
        "Please write your custom email body or switch to the default template."
      );

      return;
    }

    const payload: Record<string, any> = {
      recruiters: data.recruiters.map(
        (r) => ({
          name:
            r.name?.trim() || null,

          email:
            r.email.trim().toLowerCase(),

          position:
            r.position.trim(),
        })
      ),

      emailBody,

      emailSubject,

      useDefaultTemplate:
        data.useDefaultTemplate,
    };

    if (
      mode === "schedule" &&
      scheduledFor
    ) {
      const scheduleDate =
        new Date(scheduledFor);

      payload.scheduledFor =
        scheduleDate.toISOString();

      payload.timezone =
        Intl.DateTimeFormat().resolvedOptions()
          .timeZone;
    }

    try {
      setSubmitting(true);

      setSubmitMode(mode);

      const endpoint =
        mode === "schedule"
          ? "/applications/schedule"
          : "/applications/send";

      const response: any =
        await api.post(
          endpoint,
          payload
        );

      const resData =
        response?.data ??
        response ??
        {};

      const count =
        data.recruiters.length;

      // ─────────────────────────────────────────────────────────────────────
      // SEND NOW
      // ─────────────────────────────────────────────────────────────────────

      if (mode === "now") {
        const sent: number =
          resData?.sent ?? count;

        const failed: number =
          resData?.failed ?? 0;

        const errorDetails: string[] =
          resData?.errors ?? [];

        if (failed === 0) {
          Alert.alert(
            "🎉 Email Sent!",

            sent === 1
              ? "Your cold email was sent successfully via Gmail."
              : `${sent} cold emails sent successfully via Gmail.`,

            [
              {
                text: "View Applied Jobs",

                onPress: () =>
                  router.push(
                    "/(app)/applications"
                  ),
              },

              {
                text: "Send Another",

                style: "cancel",
              },
            ]
          );
        } else if (sent === 0) {
          Alert.alert(
            "❌ Send Failed",

            `Failed to send.\n\n${errorDetails.join(
              "\n"
            )}`,

            [
              {
                text: "OK",
              },
            ]
          );
        } else {
          Alert.alert(
            "⚠️ Partially Sent",

            `${sent} sent, ${failed} failed.\n\nFailed:\n${errorDetails.join(
              "\n"
            )}`,

            [
              {
                text: "View Applied Jobs",

                onPress: () =>
                  router.push(
                    "/(app)/applications"
                  ),
              },

              {
                text: "OK",

                style: "cancel",
              },
            ]
          );
        }

        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // SCHEDULE
      // ─────────────────────────────────────────────────────────────────────

      const scheduled: number =
        resData?.scheduled ?? count;

      Alert.alert(
        "📅 Email Scheduled!",

        `${scheduled} email${
          scheduled > 1 ? "s" : ""
        } scheduled for ${formatScheduledDisplay(
          scheduledFor
        )}.\n\nWill be sent from your Gmail automatically.`,

        [
          {
            text: "View Applied Jobs",

            onPress: () =>
              router.push(
                "/(app)/applications"
              ),
          },

          {
            text: "OK",

            style: "cancel",
          },
        ]
      );

      clearSchedule();
    } catch (err: any) {
      const message = parseError(err);

      const isGmail =
        message
          .toLowerCase()
          .includes("gmail");

      Alert.alert(
        isGmail
          ? "Gmail Not Connected"
          : "Error",

        message,

        isGmail
          ? [
              {
                text: "Cancel",

                style: "cancel",
              },

              {
                text: "Go to Settings",

                onPress: () =>
                  router.push(
                    "/(app)/connect-gmail"
                  ),
              },
            ]
          : [
              {
                text: "OK",
              },
            ]
      );
    } finally {
      setSubmitting(false);

      setSubmitMode(null);
    }
  };

  const onSendNow =
    handleSubmit((data) =>
      onSubmit(data, "now")
    );

  const onSchedule =
    handleSubmit((data) =>
      onSubmit(data, "schedule")
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,

          isDesktop &&
            styles.desktopContent,
        ]}
      >
        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Gmail status */}
        {/* ──────────────────────────────────────────────────────────────── */}

        {gmailStatus.checked &&
          !gmailStatus.connected && (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/(app)/connect-gmail"
                )
              }
              style={styles.gmailBanner}
              activeOpacity={0.85}
            >
              <View
                style={styles.gmailBannerLeft}
              >
                <View
                  style={
                    styles.gmailBannerIconBox
                  }
                >
                  <Ionicons
                    name="mail-unread-outline"
                    size={20}
                    color="#DC2626"
                  />
                </View>

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={
                      styles.gmailBannerTitle
                    }
                  >
                    Gmail Not Connected
                  </Text>

                  <Text
                    style={
                      styles.gmailBannerDesc
                    }
                  >
                    Tap to connect Gmail —
                    emails are sent from your
                    real account.
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#DC2626"
              />
            </TouchableOpacity>
          )}

        {gmailStatus.checked &&
          gmailStatus.connected && (
            <View
              style={[
                styles.gmailBannerConnected,
                {
                  borderColor:
                    "#BBF7D0",

                  backgroundColor:
                    "#F0FDF4",
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#16A34A"
              />

              <Text
                style={
                  styles.gmailBannerConnectedText
                }
              >
                Sending from{" "}
                <Text
                  style={{
                    fontWeight: "700",
                  }}
                >
                  {
                    gmailStatus.gmailAddress
                  }
                </Text>
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    "/(app)/connect-gmail"
                  )
                }
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Ionicons
                  name="settings-outline"
                  size={15}
                  color="#16A34A"
                />
              </TouchableOpacity>
            </View>
          )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Recruiters */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Recruiters
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Add recruiters you want to
            contact
          </Text>
        </View>

        {isSubmitted &&
          errors.recruiters?.root
            ?.message && (
            <View
              style={styles.rootError}
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color="#DC2626"
              />

              <Text
                style={
                  styles.rootErrorText
                }
              >
                {
                  errors.recruiters
                    .root.message
                }
              </Text>
            </View>
          )}

        {isDesktop && (
          <View
            style={[
              styles.desktopRow,
              styles.columnHeader,
            ]}
          >
            <Text
              style={[
                styles.columnHeaderText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              NAME (optional)
            </Text>

            <Text
              style={[
                styles.columnHeaderText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              EMAIL *
            </Text>

            <Text
              style={[
                styles.columnHeaderText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              POSITION *
            </Text>

            <View
              style={{ width: 40 }}
            />
          </View>
        )}

        {fields.map(
          (field, index) => (
            <View
              key={field.id}
              style={[
                styles.recruiterCard,

                {
                  backgroundColor:
                    colors.card,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              {!isDesktop && (
                <View
                  style={
                    styles.mobileCardHeader
                  }
                >
                  <View
                    style={[
                      styles.numberBadge,

                      {
                        backgroundColor:
                          colors.primary +
                          "18",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.numberBadgeText,
                        {
                          color:
                            colors.primary,
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.recruiterTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Recruiter{" "}
                    {index + 1}
                  </Text>

                  {fields.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        remove(index)
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {isDesktop ? (
                <View
                  style={styles.desktopRow}
                >
                  {/* Name */}
                  <View
                    style={[
                      styles.desktopField,
                      {
                        flex: 1,
                      },
                    ]}
                  >
                    <Controller
                      control={control}
                      name={`recruiters.${index}.name`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder="John Smith (optional)"
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,
                              borderColor:
                                colors.border,
                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />
                  </View>

                  {/* Email */}
                  <View
                    style={[
                      styles.desktopField,
                      {
                        flex: 1.3,
                      },
                    ]}
                  >
                    <Controller
                      control={control}
                      name={`recruiters.${index}.email`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder="john@company.com"
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,

                              borderColor:
                                errors
                                  .recruiters?.[
                                  index
                                ]?.email
                                  ? "#EF4444"
                                  : colors.border,

                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />

                    <FieldError
                      message={
                        errors.recruiters?.[
                          index
                        ]?.email?.message
                      }
                      visible={isSubmitted}
                    />
                  </View>

                  {/* Position */}
                  <View
                    style={[
                      styles.desktopField,
                      {
                        flex: 1,
                      },
                    ]}
                  >
                    <Controller
                      control={control}
                      name={`recruiters.${index}.position`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder="Software Engineer"
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,

                              borderColor:
                                errors
                                  .recruiters?.[
                                  index
                                ]?.position
                                  ? "#EF4444"
                                  : colors.border,

                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />

                    <FieldError
                      message={
                        errors.recruiters?.[
                          index
                        ]?.position?.message
                      }
                      visible={isSubmitted}
                    />
                  </View>

                  {fields.length > 1 ? (
                    <TouchableOpacity
                      onPress={() =>
                        remove(index)
                      }
                      style={
                        styles.desktopDelete
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{ width: 40 }}
                    />
                  )}
                </View>
              ) : (
                <>
                  {/* Mobile Name */}
                  <View
                    style={
                      styles.mobileField
                    }
                  >
                    <FieldLabel
                      label="Name (for salutation only)"
                      colors={colors}
                    />

                    <Controller
                      control={control}
                      name={`recruiters.${index}.name`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder='e.g. "Sarah" → Dear Sarah,'
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,

                              borderColor:
                                colors.border,

                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />

                    <Text
                      style={[
                        styles.fieldHint,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Optional — if empty,
                      salutation is chosen
                      from email address
                    </Text>
                  </View>

                  {/* Mobile Email */}
                  <View
                    style={
                      styles.mobileField
                    }
                  >
                    <FieldLabel
                      label="Email"
                      required
                      colors={colors}
                    />

                    <Controller
                      control={control}
                      name={`recruiters.${index}.email`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder="john@company.com"
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,

                              borderColor:
                                errors
                                  .recruiters?.[
                                  index
                                ]?.email
                                  ? "#EF4444"
                                  : colors.border,

                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />

                    <FieldError
                      message={
                        errors.recruiters?.[
                          index
                        ]?.email?.message
                      }
                      visible={isSubmitted}
                    />
                  </View>

                  {/* Mobile Position */}
                  <View
                    style={
                      styles.mobileField
                    }
                  >
                    <FieldLabel
                      label="Position"
                      required
                      colors={colors}
                    />

                    <Controller
                      control={control}
                      name={`recruiters.${index}.position`}
                      render={({
                        field: {
                          onChange,
                          value,
                        },
                      }) => (
                        <TextInput
                          value={value}
                          onChangeText={
                            onChange
                          }
                          placeholder="Software Engineer"
                          placeholderTextColor={
                            colors.textSecondary
                          }
                          style={[
                            styles.input,
                            {
                              backgroundColor:
                                colors.background,

                              borderColor:
                                errors
                                  .recruiters?.[
                                  index
                                ]?.position
                                  ? "#EF4444"
                                  : colors.border,

                              color:
                                colors.text,
                            },
                          ]}
                        />
                      )}
                    />

                    <FieldError
                      message={
                        errors.recruiters?.[
                          index
                        ]?.position?.message
                      }
                      visible={isSubmitted}
                    />
                  </View>

                  {fields.length > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        remove(index)
                      }
                      style={[
                        styles.mobileRemoveButton,
                        {
                          borderColor:
                            "#FCA5A5",
                        },
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#EF4444"
                      />

                      <Text
                        style={
                          styles.mobileRemoveText
                        }
                      >
                        Remove Recruiter
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )
        )}

        {/* Add recruiter */}
        <TouchableOpacity
          onPress={() =>
            append({
              name: "",
              email: "",
              position: "",
            })
          }
          style={[
            styles.addButton,
            {
              borderColor:
                colors.primary,
            },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={19}
            color={colors.primary}
          />

          <Text
            style={[
              styles.addButtonText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Add Another Recruiter
          </Text>
        </TouchableOpacity>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Email Template */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 8,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Email Template
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Choose default or write your
            own
          </Text>
        </View>

        <View
          style={[
            styles.templateToggleRow,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={
              styles.templateToggleLeft
            }
          >
            <View
              style={[
                styles.templateIconBox,
                {
                  backgroundColor:
                    colors.primary +
                    "15",
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={17}
                color={colors.primary}
              />
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.templateToggleTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Use Default Template
              </Text>

              <Text
                style={[
                  styles.templateToggleSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Variables filled from your
                profile on send
              </Text>
            </View>
          </View>

          <Controller
            control={control}
            name="useDefaultTemplate"
            render={({
              field: {
                onChange,
                value,
              },
            }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{
                  false: colors.border,
                  true:
                    colors.primary +
                    "70",
                }}
                thumbColor={
                  value
                    ? colors.primary
                    : "#9CA3AF"
                }
              />
            )}
          />
        </View>

        {/* Default template */}
        {useDefault ? (
          <View
            style={[
              styles.templateReadonlyCard,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.templateSubjectRow,
                {
                  backgroundColor:
                    colors.background,

                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={[
                    styles.templateTag,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  SUBJECT
                </Text>

                <Text
                  style={[
                    styles.templateSubjectText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {DEFAULT_SUBJECT}
                </Text>
              </View>

              <View
                style={[
                  styles.readonlyPill,
                  {
                    backgroundColor:
                      colors.primary +
                      "15",
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={10}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.readonlyPillText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  Read-only
                </Text>
              </View>
            </View>

            <View
              style={
                styles.templateBodySection
              }
            >
              <Text
                style={[
                  styles.templateTag,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                BODY
              </Text>

              <Text
                style={[
                  styles.templateBodyText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {DEFAULT_BODY}
              </Text>
            </View>

            <View
              style={[
                styles.templateVarsHint,
                {
                  borderTopColor:
                    colors.border,

                  backgroundColor:
                    colors.primary +
                    "06",
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={
                  colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.templateVarsHintText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {"{{variables}} are replaced with your profile data when the email is sent"}
              </Text>
            </View>
          </View>
        ) : (
          /* Custom template */
          <View
            style={[
              styles.templateEditCard,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={
                styles.customSubjectSection
              }
            >
              <Text
                style={[
                  styles.templateTag,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                SUBJECT
              </Text>

              <Controller
                control={control}
                name="customSubject"
                render={({
                  field: {
                    onChange,
                    value,
                  },
                }) => (
                  <TextInput
                    value={value}
                    onChangeText={
                      onChange
                    }
                    placeholder={
                      DEFAULT_SUBJECT
                    }
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    style={[
                      styles.customSubjectInput,
                      {
                        backgroundColor:
                          colors.background,

                        borderColor:
                          colors.border,

                        color:
                          colors.text,
                      },
                    ]}
                  />
                )}
              />
            </View>

            <View
              style={[
                styles.templateDivider,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            />

            <View
              style={
                styles.varChipsSection
              }
            >
              <Text
                style={[
                  styles.varChipsLabel,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Tap to insert:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                <View
                  style={{
                    flexDirection:
                      "row",
                    gap: 6,
                    paddingVertical: 4,
                  }}
                >
                  {TEMPLATE_VARS.map(
                    (variable) => (
                      <TouchableOpacity
                        key={variable}
                        onPress={() => {
                          const current =
                            getValues(
                              "customBody"
                            ) ?? "";

                          setValue(
                            "customBody",
                            current +
                              variable
                          );
                        }}
                        style={[
                          styles.varChip,
                          {
                            backgroundColor:
                              colors.primary +
                              "12",

                            borderColor:
                              colors.primary +
                              "35",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.varChipText,
                            {
                              color:
                                colors.primary,
                            },
                          ]}
                        >
                          {variable}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </ScrollView>
            </View>

            <View
              style={[
                styles.templateDivider,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            />

            <View
              style={
                styles.customBodySection
              }
            >
              <Text
                style={[
                  styles.templateTag,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                BODY
              </Text>

              <Controller
                control={control}
                name="customBody"
                render={({
                  field: {
                    onChange,
                    value,
                  },
                }) => (
                  <TextInput
                    value={value}
                    onChangeText={
                      onChange
                    }
                    placeholder={`Dear {{recruiterName}},\n\nI am writing to express my interest...`}
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    multiline
                    numberOfLines={12}
                    textAlignVertical="top"
                    style={[
                      styles.customBodyInput,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  />
                )}
              />
            </View>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Schedule */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 8,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Schedule
          </Text>

          <Text
            style={[
              styles.sectionSubtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Choose when your email should
            be sent
          </Text>
        </View>

        {/* YOUR OTHER PROJECT'S DATE FIELD */}
        <View
          style={[
            styles.scheduleFieldCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <DateField
            label="Schedule Date & Time"
            value={scheduledFor}
            onChange={setScheduledFor}
          />

          <Text
            style={[
              styles.scheduleHint,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Select a date and time at least
            1 minute in the future.
          </Text>
        </View>

        {/* Scheduled banner */}
        {!!scheduledFor && (
          <View
            style={styles.scheduledBanner}
          >
            <Ionicons
              name="time-outline"
              size={17}
              color="#D97706"
            />

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.scheduledTitle
                }
              >
                Scheduled For
              </Text>

              <Text
                style={
                  styles.scheduledText
                }
              >
                {formatScheduledDisplay(
                  scheduledFor
                )}
              </Text>
            </View>

            <TouchableOpacity
              onPress={clearSchedule}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#D97706"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Action buttons */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <View
          style={styles.actionRow}
        >
          <TouchableOpacity
            disabled={submitting}
            onPress={onSchedule}
            style={[
              styles.scheduleButton,

              {
                borderColor:
                  colors.primary,
              },

              submitting &&
                submitMode ===
                  "schedule" &&
                styles.disabledButton,
            ]}
            activeOpacity={0.75}
          >
            {submitting &&
            submitMode ===
              "schedule" ? (
              <ActivityIndicator
                color={
                  colors.primary
                }
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={[
                    styles.scheduleButtonText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {scheduledFor
                    ? "Send Scheduled"
                    : "Schedule"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={submitting}
            onPress={onSendNow}
            style={[
              styles.sendButton,

              {
                backgroundColor:
                  colors.primary,
              },

              submitting &&
                submitMode ===
                  "now" &&
                styles.disabledButton,
            ]}
            activeOpacity={0.85}
          >
            {submitting &&
            submitMode === "now" ? (
              <ActivityIndicator
                color="#fff"
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="send-outline"
                  size={18}
                  color="#fff"
                />

                <Text
                  style={
                    styles.sendButtonText
                  }
                >
                  Send Now
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{ height: 50 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
  },

  desktopContent: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  rootError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  rootErrorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 12,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  fieldError: {
    flex: 1,
    color: "#EF4444",
    fontSize: 11,
  },

  columnHeader: {
    marginBottom: 6,
    paddingHorizontal: 14,
  },

  columnHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    flex: 1,
  },

  desktopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  desktopField: {
    minWidth: 0,
  },

  desktopDelete: {
    width: 40,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  recruiterCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  mobileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 9,
  },

  numberBadge: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  numberBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  recruiterTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  deleteButton: {
    padding: 5,
  },

  mobileField: {
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
    letterSpacing: 0.2,
  },

  fieldHint: {
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  mobileRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    marginTop: 2,
  },

  mobileRemoveText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },

  addButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 9,
    marginBottom: 16,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  templateToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },

  templateToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  templateIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  templateToggleTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  templateToggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  templateReadonlyCard: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },

  templateSubjectRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    gap: 10,
  },

  templateTag: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  templateSubjectText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  readonlyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },

  readonlyPillText: {
    fontSize: 9,
    fontWeight: "700",
  },

  templateBodySection: {
    padding: 12,
    gap: 6,
  },

  templateBodyText: {
    fontSize: 13,
    lineHeight: 22,
  },

  templateVarsHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  templateVarsHintText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },

  templateEditCard: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },

  customSubjectSection: {
    padding: 12,
    gap: 6,
  },

  customSubjectInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  templateDivider: {
    height:
      StyleSheet.hairlineWidth,
  },

  varChipsSection: {
    padding: 12,
    gap: 6,
  },

  varChipsLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  varChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },

  varChipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  customBodySection: {
    padding: 12,
    gap: 6,
  },

  customBodyInput: {
    fontSize: 13,
    lineHeight: 22,
    minHeight: 200,
    textAlignVertical: "top",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Schedule
  // ─────────────────────────────────────────────────────────────────────────

  scheduleFieldCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },

  scheduleHint: {
    fontSize: 10,
    marginTop: 7,
    lineHeight: 15,
  },

  scheduledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 9,
    padding: 11,
    marginBottom: 14,
  },

  scheduledTitle: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
  },

  scheduledText: {
    color: "#92400E",
    fontSize: 11,
    marginTop: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  scheduleButton: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  scheduleButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  sendButton: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Gmail banners
  // ─────────────────────────────────────────────────────────────────────────

  gmailBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },

  gmailBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  gmailBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  gmailBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },

  gmailBannerDesc: {
    fontSize: 11,
    color: "#991B1B",
    marginTop: 2,
    lineHeight: 15,
  },

  gmailBannerConnected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },

  gmailBannerConnectedText: {
    flex: 1,
    fontSize: 12,
    color: "#15803D",
  },
});