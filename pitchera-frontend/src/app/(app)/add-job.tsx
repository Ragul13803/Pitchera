// src/app/(app)/add-job.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const recruiterSchema = z.object({
  name: z.string().min(1, 'Recruiter name is required').trim(),
  email: z
    .string()
    .min(1, 'Recruiter email is required')
    .email('Please enter a valid email address')
    .trim(),
});

const addJobSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').trim(),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  jobUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  jobDescription: z.string().optional(),
  recruiters: z
    .array(recruiterSchema)
    .min(1, 'At least one recruiter is required')
    .refine(
      (recruiters) => {
        const emails = recruiters.map((r) => r.email.toLowerCase().trim());
        return emails.length === new Set(emails).size;
      },
      { message: 'Duplicate recruiter emails are not allowed' }
    ),
  useDefaultTemplate: z.boolean(),
  customEmailBody: z.string().optional(),
});

type AddJobForm = z.infer<typeof addJobSchema>;

// ─── Template variable chips ──────────────────────────────────────────────────

const TEMPLATE_VARS = [
  '{{firstName}}', '{{lastName}}', '{{recruiterName}}', '{{company}}',
  '{{position}}', '{{experience}}', '{{skills}}', '{{phone}}',
  '{{email}}', '{{linkedin}}', '{{github}}', '{{portfolio}}',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <Text style={[styles.fieldLabel, { color: colors.text }]}>
      {label}
      {required && <Text style={{ color: '#EF4444' }}> *</Text>}
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
  if (!visible || !message) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
      <Text style={styles.fieldError}>{message}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  colors,
}: {
  title: string;
  colors: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────

interface PreviewData {
  recruiterName: string;
  to: string;
  subject: string;
  body: string;
}

function EmailPreviewModal({
  visible,
  onClose,
  previews,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  previews: PreviewData[];
  colors: any;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = previews[activeIndex] ?? null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Email Preview
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Recruiter tabs when multiple */}
        {previews.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.previewTabs, { borderBottomColor: colors.border }]}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {previews.map((p, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveIndex(i)}
                style={[
                  styles.previewTab,
                  {
                    backgroundColor:
                      activeIndex === i ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.previewTabText,
                    { color: activeIndex === i ? '#fff' : colors.text },
                  ]}
                >
                  {p.recruiterName || `Recruiter ${i + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ padding: 20 }}
        >
          {current ? (
            <>
              <View
                style={[
                  styles.previewField,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  TO
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {current.to}
                </Text>
              </View>
              <View
                style={[
                  styles.previewField,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  SUBJECT
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {current.subject}
                </Text>
              </View>
              <View
                style={[
                  styles.previewField,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  BODY
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {current.body}
                </Text>
              </View>
              <View
                style={[
                  styles.previewField,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  ATTACHMENTS
                </Text>
                <Text style={[styles.previewValue, { color: colors.textSecondary }]}>
                  Resume will be attached automatically if uploaded to your profile.
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No preview available. Please fill in recruiter details.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

function ScheduleModal({
  visible,
  onClose,
  onConfirm,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string, tz: string) => void;
  colors: any;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [tz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  const validate = (): boolean => {
    let valid = true;
    setDateError('');
    setTimeError('');

    if (!date.trim()) {
      setDateError('Date is required (YYYY-MM-DD).');
      valid = false;
    } else if (!dateRegex.test(date.trim())) {
      setDateError('Use format YYYY-MM-DD (e.g. 2025-12-31).');
      valid = false;
    }

    if (!time.trim()) {
      setTimeError('Time is required (HH:MM).');
      valid = false;
    } else if (!timeRegex.test(time.trim())) {
      setTimeError('Use format HH:MM (e.g. 09:00).');
      valid = false;
    }

    if (valid) {
      const scheduled = new Date(`${date.trim()}T${time.trim()}:00`);
      if (isNaN(scheduled.getTime())) {
        setDateError('Invalid date or time combination.');
        return false;
      }
      if (scheduled.getTime() <= Date.now() + 60_000) {
        setTimeError('Scheduled time must be at least 1 minute in the future.');
        return false;
      }
    }

    return valid;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(date.trim(), time.trim(), tz);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Schedule Email
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          {/* Info banner */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
            ]}
          >
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoBannerText, { color: colors.primary }]}>
              The email will be sent from your connected Gmail account at the
              scheduled time, even if you close the app.
            </Text>
          </View>

          {/* Date */}
          <View>
            <FieldLabel label="Date (YYYY-MM-DD)" required colors={colors} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: dateError ? '#EF4444' : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textSecondary}
              value={date}
              onChangeText={(v) => {
                setDate(v);
                setDateError('');
              }}
              keyboardType="numbers-and-punctuation"
            />
            {dateError ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                <Text style={styles.fieldError}>{dateError}</Text>
              </View>
            ) : null}
          </View>

          {/* Time */}
          <View>
            <FieldLabel label="Time (HH:MM, 24h)" required colors={colors} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: timeError ? '#EF4444' : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="09:00"
              placeholderTextColor={colors.textSecondary}
              value={time}
              onChangeText={(v) => {
                setTime(v);
                setTimeError('');
              }}
              keyboardType="numbers-and-punctuation"
            />
            {timeError ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                <Text style={styles.fieldError}>{timeError}</Text>
              </View>
            ) : null}
          </View>

          {/* Timezone (read-only) */}
          <View>
            <FieldLabel label="Your Timezone" colors={colors} />
            <View
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {tz}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
          >
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Confirm Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddJobScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // ── State ──────────────────────────────────────────────────────────────────

  const [defaultTemplate, setDefaultTemplate] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'now' | 'schedule' | null>(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previews, setPreviews] = useState<PreviewData[]>([]);

  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<{
    date: string;
    time: string;
    tz: string;
  } | null>(null);

  // ── Form ───────────────────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = useForm<AddJobForm>({
    resolver: zodResolver(addJobSchema),
    defaultValues: {
      companyName: '',
      jobTitle: '',
      jobUrl: '',
      jobDescription: '',
      recruiters: [{ name: '', email: '' }],
      useDefaultTemplate: true,
      customEmailBody: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recruiters',
  });

  const useDefault = watch('useDefaultTemplate');
  const watchedRecruiters = watch('recruiters');
  const watchedJobTitle = watch('jobTitle');
  const watchedCompanyName = watch('companyName');

  // ── Load Default Template ──────────────────────────────────────────────────

  const loadTemplate = useCallback(async () => {
    try {
      setTemplateLoading(true);
      setTemplateError('');
      // Uses the existing api utility — path matches new route
      const res = await api.get('/email-templates/default');
      const data = res?.data ?? res;
      setDefaultTemplate({
        subject: data?.subject ?? '',
        body: data?.body ?? '',
      });
    } catch (err: any) {
      setTemplateError(
        'Could not load default template. You can still write a custom email.'
      );
      setDefaultTemplate(null);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ── Preview ────────────────────────────────────────────────────────────────

  const handlePreview = () => {
    const values = getValues();
    const body = useDefault
      ? (defaultTemplate?.body ?? '')
      : (values.customEmailBody ?? '');

    const subject =
      defaultTemplate?.subject ??
      `Application for ${values.jobTitle} at ${values.companyName}`;

    const generatedPreviews: PreviewData[] = values.recruiters
      .filter((r) => r.email)
      .map((r) => ({
        recruiterName: r.name,
        to: r.email,
        subject: subject
          .replace(/{{position}}/g, values.jobTitle)
          .replace(/{{company}}/g, values.companyName)
          .replace(/{{recruiterName}}/g, r.name)
          .replace(/{{firstName}}/g, '')
          .replace(/{{lastName}}/g, ''),
        body: body.replace(/{{recruiterName}}/g, r.name),
      }));

    if (generatedPreviews.length === 0) {
      Alert.alert(
        'No Recruiters',
        'Please add at least one recruiter email to preview.'
      );
      return;
    }

    setPreviews(generatedPreviews);
    setPreviewVisible(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: AddJobForm, mode: 'now' | 'schedule') => {
    if (submitting) return;

    // Validate email body
    const emailBody = data.useDefaultTemplate
      ? (defaultTemplate?.body ?? '')
      : (data.customEmailBody ?? '');

    if (!emailBody.trim()) {
      Alert.alert(
        'Email Body Required',
        data.useDefaultTemplate
          ? 'Default template could not be loaded. Please disable the toggle and write a custom email.'
          : 'Please write your email body before sending.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMode(mode);

      const payload: Record<string, any> = {
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl || undefined,
        jobDescription: data.jobDescription || undefined,
        recruiters: data.recruiters.map((r) => ({
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
        })),
        emailBody,
        useDefaultTemplate: data.useDefaultTemplate,
      };

      if (mode === 'schedule' && scheduledFor) {
        payload.scheduledFor = `${scheduledFor.date}T${scheduledFor.time}:00`;
        payload.timezone = scheduledFor.tz;
      }

      const endpoint =
        mode === 'schedule' ? '/applications/schedule' : '/applications/send';

      const response = await api.post(endpoint, payload);
      const resData = response?.data ?? response;

      // Build user-facing message from REAL backend response
      let title: string;
      let message: string;

      if (mode === 'schedule') {
        const count = resData?.scheduled ?? data.recruiters.length;
        title = '📅 Email Scheduled!';
        message =
          count === 1
            ? `Your email has been scheduled for ${scheduledFor?.date} at ${scheduledFor?.time}.`
            : `${count} emails have been scheduled for ${scheduledFor?.date} at ${scheduledFor?.time}.`;
      } else {
        const sent = resData?.sent ?? 0;
        const failed = resData?.failed ?? 0;
        const total = resData?.total ?? data.recruiters.length;

        if (failed === 0) {
          title = '🎉 Email Sent!';
          message =
            total === 1
              ? 'Your email was sent successfully.'
              : `All ${sent} emails sent successfully.`;
        } else if (sent === 0) {
          title = '❌ Send Failed';
          message =
            total === 1
              ? 'Your email failed to send. Please check your Gmail connection.'
              : `All ${total} emails failed to send.`;
        } else {
          title = '⚠️ Partially Sent';
          message = `${sent} email${sent > 1 ? 's' : ''} sent, ${failed} failed.`;
        }

        // If some or all failed, don't navigate away — let user retry
        if (sent === 0) {
          Alert.alert(title, message);
          return;
        }
      }

      Alert.alert(title, message, [
        {
          text: 'View Applied Jobs',
          onPress: () => router.push('/(app)/applied-jobs'),
        },
      ]);
    } catch (err: any) {
      const msg = err?.message ?? 'Something went wrong. Please try again.';

      // Provide specific guidance for common errors
      if (
        msg.toLowerCase().includes('gmail') ||
        msg.toLowerCase().includes('not connected')
      ) {
        Alert.alert(
          'Gmail Not Connected',
          'Please connect your Gmail account in Settings before sending emails.',
          [{ text: 'OK' }]
        );
      } else if (msg.toLowerCase().includes('auth')) {
        Alert.alert(
          'Gmail Authorization Expired',
          'Your Gmail authorization has expired. Please reconnect your account in Settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSubmitting(false);
      setSubmitMode(null);
    }
  };

  // Separate handlers to avoid double submit
  const onSendNow = handleSubmit((data) => onSubmit(data, 'now'));

  const onScheduleConfirm = (date: string, time: string, tz: string) => {
    setScheduledFor({ date, time, tz });
    setScheduleVisible(false);
  };

  // When "Send Now (Scheduled)" is triggered after scheduledFor is set
  const onScheduleSubmit = handleSubmit((data) => {
    if (!scheduledFor) {
      setScheduleVisible(true);
      return;
    }
    onSubmit(data, 'schedule');
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Apply for Job
        </Text>
        <TouchableOpacity onPress={handlePreview} style={styles.previewBtn}>
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={[styles.previewBtnText, { color: colors.primary }]}>
            Preview
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Job Details ─────────────────────────────────────────────────── */}
        <SectionHeader title="Job Details" colors={colors} />

        {/* Company Name */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Company Name" required colors={colors} />
          <Controller
            control={control}
            name="companyName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.companyName ? '#EF4444' : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Google, Apple, Tesla"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                returnKeyType="next"
              />
            )}
          />
          <FieldError
            message={errors.companyName?.message}
            visible={isSubmitted}
          />
        </View>

        {/* Job Title */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Job Title" required colors={colors} />
          <Controller
            control={control}
            name="jobTitle"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.jobTitle ? '#EF4444' : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Senior React Developer"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                returnKeyType="next"
              />
            )}
          />
          <FieldError
            message={errors.jobTitle?.message}
            visible={isSubmitted}
          />
        </View>

        {/* Job URL */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Job URL" colors={colors} />
          <Controller
            control={control}
            name="jobUrl"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.jobUrl ? '#EF4444' : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="https://linkedin.com/jobs/..."
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="next"
              />
            )}
          />
          <FieldError message={errors.jobUrl?.message} visible={isSubmitted} />
        </View>

        {/* Job Description */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Job Description" colors={colors} />
          <Controller
            control={control}
            name="jobDescription"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.textarea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Paste the job description here…"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        {/* ── Recruiters ──────────────────────────────────────────────────── */}
        <SectionHeader title="Recruiters" colors={colors} />

        {/* Root-level recruiter array error (e.g. duplicate emails) */}
        {isSubmitted && errors.recruiters?.root?.message ? (
          <View style={[styles.rootError, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
            <Text style={styles.rootErrorText}>
              {errors.recruiters.root.message}
            </Text>
          </View>
        ) : null}

        {fields.map((field, index) => (
          <View
            key={field.id}
            style={[
              styles.recruiterCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.recruiterHeader}>
              <View
                style={[
                  styles.recruiterIndex,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Text
                  style={[styles.recruiterIndexText, { color: colors.primary }]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.recruiterLabel, { color: colors.text }]}>
                Recruiter {index + 1}
              </Text>
              {fields.length > 1 && (
                <TouchableOpacity
                  onPress={() => remove(index)}
                  style={[styles.removeBtn, { backgroundColor: '#FEE2E2' }]}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <FieldLabel label="Name" required colors={colors} />
              <Controller
                control={control}
                name={`recruiters.${index}.name`}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: errors.recruiters?.[index]?.name
                          ? '#EF4444'
                          : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="John Smith"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType="next"
                  />
                )}
              />
              <FieldError
                message={errors.recruiters?.[index]?.name?.message}
                visible={isSubmitted}
              />
            </View>

            {/* Email */}
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <FieldLabel label="Email" required colors={colors} />
              <Controller
                control={control}
                name={`recruiters.${index}.email`}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: errors.recruiters?.[index]?.email
                          ? '#EF4444'
                          : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="john@company.com"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                )}
              />
              <FieldError
                message={errors.recruiters?.[index]?.email?.message}
                visible={isSubmitted}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addRecruiterBtn, { borderColor: colors.primary }]}
          onPress={() => append({ name: '', email: '' })}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.addRecruiterBtnText, { color: colors.primary }]}>
            Add Another Recruiter
          </Text>
        </TouchableOpacity>

        {/* ── Email Template ───────────────────────────────────────────────── */}
        <SectionHeader title="Email Template" colors={colors} />

        {/* Toggle */}
        <View
          style={[
            styles.templateToggle,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.templateToggleLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.templateToggleTitle, { color: colors.text }]}>
                Use Default Template
              </Text>
              <Text
                style={[
                  styles.templateToggleDesc,
                  { color: colors.textSecondary },
                ]}
              >
                Personalized with your profile data
              </Text>
            </View>
          </View>
          <Controller
            control={control}
            name="useDefaultTemplate"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={value ? colors.primary : '#9CA3AF'}
              />
            )}
          />
        </View>

        {/* Template Body */}
        <View
          style={[
            styles.templateBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {useDefault ? (
            /* Default template — READ ONLY */
            templateLoading ? (
              <View style={styles.templateLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text
                  style={[styles.templateLoadingText, { color: colors.textSecondary }]}
                >
                  Loading template…
                </Text>
              </View>
            ) : templateError ? (
              <View style={styles.templateErrorBox}>
                <Ionicons name="warning-outline" size={18} color="#D97706" />
                <Text style={[styles.templateErrorText, { color: '#92400E' }]}>
                  {templateError}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.templateReadonlyBadge}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.templateReadonlyText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Read-only · Variables will be personalized on send
                  </Text>
                </View>
                {defaultTemplate?.subject ? (
                  <View
                    style={[
                      styles.subjectPreview,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.subjectLabel, { color: colors.textSecondary }]}
                    >
                      SUBJECT
                    </Text>
                    <Text style={[styles.subjectText, { color: colors.text }]}>
                      {defaultTemplate.subject}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.templateBodyText, { color: colors.text }]}>
                  {defaultTemplate?.body ||
                    'No default template configured. Please add one in Settings or disable the toggle.'}
                </Text>
              </>
            )
          ) : (
            /* Custom template — EDITABLE */
            <>
              <View style={styles.varChips}>
                <Text style={[styles.varLabel, { color: colors.textSecondary }]}>
                  Tap to insert variable:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                    {TEMPLATE_VARS.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.varChip,
                          {
                            backgroundColor: colors.primary + '15',
                            borderColor: colors.primary + '40',
                          },
                        ]}
                        onPress={() => {
                          const current = getValues('customEmailBody') ?? '';
                          setValue('customEmailBody', current + v);
                        }}
                      >
                        <Text style={[styles.varChipText, { color: colors.primary }]}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Controller
                control={control}
                name="customEmailBody"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.templateInput, { color: colors.text }]}
                    placeholder={`Write your custom email here…\n\nUse {{recruiterName}}, {{position}}, {{company}}, {{firstName}}, {{lastName}}, etc. for personalization.`}
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={12}
                    textAlignVertical="top"
                  />
                )}
              />
            </>
          )}
        </View>

        {/* Scheduled indicator banner */}
        {scheduledFor && (
          <View
            style={[
              styles.scheduledBanner,
              { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
            ]}
          >
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={[styles.scheduledBannerText, { color: '#92400E' }]}>
              Scheduled: {scheduledFor.date} at {scheduledFor.time} (
              {scheduledFor.tz})
            </Text>
            <TouchableOpacity
              onPress={() => setScheduledFor(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#D97706" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {/* Schedule button */}
          <TouchableOpacity
            style={[
              styles.scheduleBtn,
              { borderColor: colors.primary },
              submitting && submitMode === 'schedule' && { opacity: 0.6 },
            ]}
            onPress={() => {
              if (scheduledFor) {
                // Already have a schedule — submit
                onScheduleSubmit();
              } else {
                // Open schedule picker
                setScheduleVisible(true);
              }
            }}
            disabled={submitting}
          >
            {submitting && submitMode === 'schedule' ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.scheduleBtnText, { color: colors.primary }]}>
                  {scheduledFor ? 'Confirm Schedule' : 'Schedule'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Send Now button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              submitting && submitMode === 'now' && { opacity: 0.6 },
            ]}
            onPress={onSendNow}
            disabled={submitting}
          >
            {submitting && submitMode === 'now' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      <EmailPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        previews={previews}
        colors={colors}
      />

      <ScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
        onConfirm={onScheduleConfirm}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewBtnText: { fontSize: 14, fontWeight: '600' },

  // Layout
  scrollContent: { padding: 16 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionLine: { flex: 1, height: 1 },

  // Fields
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldError: { fontSize: 11, color: '#EF4444' },

  // Recruiters
  recruiterCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  recruiterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  recruiterIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recruiterIndexText: { fontSize: 12, fontWeight: '700' },
  recruiterLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  removeBtn: { padding: 6, borderRadius: 8 },
  addRecruiterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 8,
  },
  addRecruiterBtnText: { fontSize: 14, fontWeight: '600' },

  // Root error
  rootError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  rootErrorText: { fontSize: 12, color: '#DC2626', flex: 1 },

  // Template
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  templateToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  templateToggleTitle: { fontSize: 14, fontWeight: '600' },
  templateToggleDesc: { fontSize: 12, marginTop: 2 },
  templateBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    minHeight: 150,
  },
  templateReadonlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  templateReadonlyText: { fontSize: 11 },
  subjectPreview: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  subjectLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  subjectText: { fontSize: 13 },
  templateBodyText: { fontSize: 13, lineHeight: 22 },
  templateLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  templateLoadingText: { fontSize: 13 },
  templateErrorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  templateErrorText: { fontSize: 13, flex: 1, lineHeight: 20 },
  templateInput: { fontSize: 13, lineHeight: 22, minHeight: 200, textAlignVertical: 'top' },
  varChips: { marginBottom: 10 },
  varLabel: { fontSize: 11, marginBottom: 6 },
  varChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  varChipText: { fontSize: 11, fontWeight: '600' },

  // Scheduled banner
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  scheduledBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12 },
  scheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  scheduleBtnText: { fontSize: 15, fontWeight: '700' },
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modals
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { padding: 4 },
  modalBody: { flex: 1 },

  // Preview modal
  previewTabs: { borderBottomWidth: 1, paddingVertical: 10, maxHeight: 56 },
  previewTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  previewTabText: { fontSize: 13, fontWeight: '600' },
  previewField: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 12 },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewValue: { fontSize: 14, lineHeight: 22 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBannerText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Shared
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});