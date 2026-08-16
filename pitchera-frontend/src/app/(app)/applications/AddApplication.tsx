import React, { useState } from "react";
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
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

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

  position: z.string().trim().min(1, "Position is required"),
});

const addRecruiterSchema = z.object({
  recruiters: z
    .array(recruiterSchema)
    .min(1, "Add at least one recruiter")
    .refine(
      (recruiters) => {
        const emails = recruiters.map((r) => r.email.toLowerCase().trim());

        return emails.length === new Set(emails).size;
      },
      {
        message: "Duplicate recruiter emails are not allowed",
      },
    ),
});

type RecruiterForm = z.infer<typeof addRecruiterSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Field Label
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
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
      {label}
      {required && <Text style={{ color: "#EF4444" }}> *</Text>}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Error
// ─────────────────────────────────────────────────────────────────────────────

function FieldError({
  message,
  visible,
}: {
  message?: string;
  visible: boolean;
}) {
  if (!visible || !message) return null;

  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />

      <Text style={styles.fieldError}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Modal
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleModal({
  visible,
  onClose,
  onConfirm,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string, timezone: string) => void;
  colors: any;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const validate = () => {
    let valid = true;

    setDateError("");
    setTimeError("");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    if (!date.trim()) {
      setDateError("Date is required.");
      valid = false;
    } else if (!dateRegex.test(date.trim())) {
      setDateError("Use YYYY-MM-DD.");
      valid = false;
    }

    if (!time.trim()) {
      setTimeError("Time is required.");
      valid = false;
    } else if (!timeRegex.test(time.trim())) {
      setTimeError("Use HH:MM (24h).");
      valid = false;
    }

    if (!valid) return false;

    const selected = new Date(`${date.trim()}T${time.trim()}:00`);

    if (isNaN(selected.getTime())) {
      setDateError("Invalid date/time.");
      return false;
    }

    if (selected.getTime() <= Date.now() + 60_000) {
      setTimeError("Schedule must be at least 1 minute in the future.");
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;

    onConfirm(date.trim(), time.trim(), timezone);

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Schedule Cold Email
          </Text>

          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scheduleContent}>
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.primary}
            />

            <Text style={[styles.infoText, { color: colors.primary }]}>
              The cold email will be scheduled using your connected Gmail
              account.
            </Text>
          </View>

          {/* Date */}
          <View>
            <FieldLabel label="Date" required colors={colors} />

            <TextInput
              value={date}
              onChangeText={(value) => {
                setDate(value);
                setDateError("");
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: dateError ? "#EF4444" : colors.border,
                },
              ]}
            />

            <FieldError message={dateError} visible={!!dateError} />
          </View>

          {/* Time */}
          <View>
            <FieldLabel label="Time" required colors={colors} />

            <TextInput
              value={time}
              onChangeText={(value) => {
                setTime(value);
                setTimeError("");
              }}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: timeError ? "#EF4444" : colors.border,
                },
              ]}
            />

            <FieldError message={timeError} visible={!!timeError} />
          </View>

          {/* Timezone */}
          <View>
            <FieldLabel label="Timezone" colors={colors} />

            <View
              style={[
                styles.input,
                styles.timezoneBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                }}
              >
                {timezone}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="time-outline" size={18} color="#fff" />

            <Text style={styles.confirmButtonText}>Confirm Schedule</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
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

  const [submitting, setSubmitting] = useState(false);

  const [submitMode, setSubmitMode] = useState<"now" | "schedule" | null>(null);

  const [scheduleVisible, setScheduleVisible] = useState(false);

  const [scheduledFor, setScheduledFor] = useState<{
    date: string;
    time: string;
    timezone: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<RecruiterForm>({
    resolver: zodResolver(addRecruiterSchema),

    defaultValues: {
      recruiters: [
        {
          name: "",
          email: "",
          position: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "recruiters",
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Send / Schedule
  // ───────────────────────────────────────────────────────────────────────────

  const onSubmit = async (data: RecruiterForm, mode: "now" | "schedule") => {
    if (submitting) return;

    if (mode === "schedule" && !scheduledFor) {
      setScheduleVisible(true);
      return;
    }

    const payload = {
      mode,

      recruiters: data.recruiters.map((recruiter) => ({
        name: recruiter.name?.trim() || null,

        email: recruiter.email.trim().toLowerCase(),

        position: recruiter.position.trim(),
      })),

      ...(mode === "schedule"
        ? {
            scheduledFor: `${scheduledFor!.date}T` + `${scheduledFor!.time}:00`,

            timezone: scheduledFor!.timezone,
          }
        : {}),
    };

    console.log("==============================");

    console.log(`[RecruiterColdMail] MODE: ${mode.toUpperCase()}`);

    console.log(
      "[RecruiterColdMail] Payload:",
      JSON.stringify(payload, null, 2),
    );

    console.log("==============================");

    try {
      setSubmitting(true);
      setSubmitMode(mode);

      // Replace this with your Gmail API/backend call.
      await new Promise((resolve) => setTimeout(resolve, 800));

      const count = data.recruiters.length;

      Alert.alert(
        mode === "now" ? "Ready to Send" : "Scheduled",
        mode === "now"
          ? `${count} cold email${
              count > 1 ? "s" : ""
            } ready to send through Gmail.`
          : `${count} cold email${count > 1 ? "s" : ""} scheduled for ${
              scheduledFor!.date
            } at ${scheduledFor!.time}.`,
        [{ text: "OK" }],
      );
    } finally {
      setSubmitting(false);
      setSubmitMode(null);
    }
  };

  const onSendNow = handleSubmit((data) => onSubmit(data, "now"));

  const onSchedule = handleSubmit((data) => onSubmit(data, "schedule"));

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        {/* Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recruiters
            </Text>

            <Text
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
            >
              Add recruiters you want to contact
            </Text>
          </View>
        </View>

        {/* Root validation error */}
        {isSubmitted && errors.recruiters?.root?.message && (
          <View style={styles.rootError}>
            <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />

            <Text style={styles.rootErrorText}>
              {errors.recruiters.root.message}
            </Text>
          </View>
        )}

        {/* Desktop column headers */}
        {isDesktop && (
          <View style={[styles.desktopRow, styles.columnHeader]}>
            <Text
              style={[
                styles.columnHeaderText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              NAME
            </Text>

            <Text
              style={[
                styles.columnHeaderText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              EMAIL *
            </Text>

            <Text
              style={[
                styles.columnHeaderText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              POSITION *
            </Text>

            <View style={{ width: 40 }} />
          </View>
        )}

        {/* Recruiters */}
        {fields.map((field, index) => (
          <View
            key={field.id}
            style={[
              styles.recruiterCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Mobile card header */}
            {!isDesktop && (
              <View style={styles.mobileCardHeader}>
                <View
                  style={[
                    styles.numberBadge,
                    {
                      backgroundColor: colors.primary + "18",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.numberBadgeText,
                      {
                        color: colors.primary,
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
                      color: colors.text,
                    },
                  ]}
                >
                  Recruiter {index + 1}
                </Text>

                {fields.length > 1 && (
                  <TouchableOpacity
                    onPress={() => remove(index)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Desktop */}
            {isDesktop ? (
              <View style={styles.desktopRow}>
                {/* Name */}
                <View style={[styles.desktopField, { flex: 1 }]}>
                  <Controller
                    control={control}
                    name={`recruiters.${index}.name`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="John Smith"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />
                </View>

                {/* Email */}
                <View style={[styles.desktopField, { flex: 1.3 }]}>
                  <Controller
                    control={control}
                    name={`recruiters.${index}.email`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="john@company.com"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: errors.recruiters?.[index]?.email
                              ? "#EF4444"
                              : colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />

                  <FieldError
                    message={errors.recruiters?.[index]?.email?.message}
                    visible={isSubmitted}
                  />
                </View>

                {/* Position */}
                <View style={[styles.desktopField, { flex: 1 }]}>
                  <Controller
                    control={control}
                    name={`recruiters.${index}.position`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Software Engineer"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: errors.recruiters?.[index]?.position
                              ? "#EF4444"
                              : colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />

                  <FieldError
                    message={errors.recruiters?.[index]?.position?.message}
                    visible={isSubmitted}
                  />
                </View>

                {/* Delete */}
                {fields.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => remove(index)}
                    style={styles.desktopDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      width: 40,
                    }}
                  />
                )}
              </View>
            ) : (
              /* ─────────────────────────────────────────────────────────────
                 Mobile
                 ───────────────────────────────────────────────────────────── */
              <>
                {/* Name */}
                <View style={styles.mobileField}>
                  <FieldLabel label="Name" colors={colors} />

                  <Controller
                    control={control}
                    name={`recruiters.${index}.name`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="John Smith"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />
                </View>

                {/* Email */}
                <View style={styles.mobileField}>
                  <FieldLabel label="Email" required colors={colors} />

                  <Controller
                    control={control}
                    name={`recruiters.${index}.email`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="john@company.com"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: errors.recruiters?.[index]?.email
                              ? "#EF4444"
                              : colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />

                  <FieldError
                    message={errors.recruiters?.[index]?.email?.message}
                    visible={isSubmitted}
                  />
                </View>

                {/* Position */}
                <View style={styles.mobileField}>
                  <FieldLabel label="Position" required colors={colors} />

                  <Controller
                    control={control}
                    name={`recruiters.${index}.position`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Software Engineer"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background,
                            borderColor: errors.recruiters?.[index]?.position
                              ? "#EF4444"
                              : colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    )}
                  />

                  <FieldError
                    message={errors.recruiters?.[index]?.position?.message}
                    visible={isSubmitted}
                  />
                </View>

                {/* Mobile delete */}
                {fields.length > 1 && (
                  <TouchableOpacity
                    onPress={() => remove(index)}
                    style={[
                      styles.mobileRemoveButton,
                      {
                        borderColor: "#FCA5A5",
                      },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />

                    <Text style={styles.mobileRemoveText}>
                      Remove Recruiter
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ))}

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
              borderColor: colors.primary,
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
                color: colors.primary,
              },
            ]}
          >
            Add Another Recruiter
          </Text>
        </TouchableOpacity>

        {/* Scheduled information */}
        {scheduledFor && (
          <View style={styles.scheduledBanner}>
            <Ionicons name="time-outline" size={17} color="#D97706" />

            <View style={{ flex: 1 }}>
              <Text style={styles.scheduledTitle}>Email scheduled</Text>

              <Text style={styles.scheduledText}>
                {scheduledFor.date} at {scheduledFor.time}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setScheduledFor(null)}>
              <Ionicons name="close-circle" size={18} color="#D97706" />
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          {/* Schedule */}
          <TouchableOpacity
            disabled={submitting}
            onPress={() => {
              if (scheduledFor) {
                onSchedule();
              } else {
                setScheduleVisible(true);
              }
            }}
            style={[
              styles.scheduleButton,
              {
                borderColor: colors.primary,
              },
              submitting && submitMode === "schedule" && styles.disabledButton,
            ]}
          >
            {submitting && submitMode === "schedule" ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.scheduleButtonText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  {scheduledFor ? "Schedule" : "Schedule"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Send Now */}
          <TouchableOpacity
            disabled={submitting}
            onPress={onSendNow}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.primary,
              },
              submitting && submitMode === "now" && styles.disabledButton,
            ]}
          >
            {submitting && submitMode === "now" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />

                <Text style={styles.sendButtonText}>Send Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Schedule Modal */}
      <ScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
        onConfirm={(date, time, timezone) => {
          setScheduledFor({
            date,
            time,
            timezone,
          });
        }}
        colors={colors}
      />
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  backButton: {
    padding: 6,
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  // Content
  content: {
    padding: 16,
  },

  desktopContent: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },

  // Section
  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  // Errors
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

  // Desktop columns
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

  // Desktop row
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

  // Recruiter
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

  // Mobile fields
  mobileField: {
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
    letterSpacing: 0.2,
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

  // Add
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

  // Schedule
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

  // Actions
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

  // Modal
  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  modalClose: {
    width: 30,
    padding: 4,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  scheduleContent: {
    padding: 24,
    gap: 18,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  timezoneBox: {
    justifyContent: "center",
  },

  confirmButton: {
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 4,
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});