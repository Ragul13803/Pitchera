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
    .email('Invalid email address')
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
        const emails = recruiters.map((r) => r.email.toLowerCase());
        return emails.length === new Set(emails).size;
      },
      { message: 'Duplicate recruiter emails are not allowed' }
    ),
  useDefaultTemplate: z.boolean(),
  customEmailBody: z.string().optional(),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  timezone: z.string().optional(),
});

type AddJobForm = z.infer<typeof addJobSchema>;

// ─── Template Variables ───────────────────────────────────────────────────────

const TEMPLATE_VARS = [
  '{{firstName}}', '{{lastName}}', '{{recruiterName}}', '{{company}}',
  '{{position}}', '{{experience}}', '{{skills}}', '{{phone}}',
  '{{email}}', '{{linkedin}}', '{{github}}', '{{portfolio}}',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ label, required, colors }: { label: string; required?: boolean; colors: any }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.text }]}>
      {label}
      {required && <Text style={{ color: '#EF4444' }}> *</Text>}
    </Text>
  );
}

function FieldError({ message, visible }: { message?: string; visible: boolean }) {
  if (!visible || !message) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
      <Text style={styles.fieldError}>{message}</Text>
    </View>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────

function EmailPreviewModal({
  visible,
  onClose,
  previewData,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  previewData: { to: string; subject: string; body: string } | null;
  colors: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Email Preview</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ padding: 20 }}>
          {previewData ? (
            <>
              <View style={[styles.previewField, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>TO</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>{previewData.to}</Text>
              </View>
              <View style={[styles.previewField, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>SUBJECT</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>{previewData.subject}</Text>
              </View>
              <View style={[styles.previewField, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>BODY</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>{previewData.body}</Text>
              </View>
              <View style={[styles.previewField, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>ATTACHMENTS</Text>
                <Text style={[styles.previewValue, { color: colors.textSecondary }]}>
                  Resume will be attached automatically if uploaded.
                </Text>
              </View>
            </>
          ) : (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleConfirm = () => {
    if (!date || !time) {
      Alert.alert('Required', 'Please enter both date and time.');
      return;
    }
    onConfirm(date, time, tz);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Email</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <View>
            <FieldLabel label="Date (YYYY-MM-DD)" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textSecondary}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View>
            <FieldLabel label="Time (HH:MM)" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="09:00"
              placeholderTextColor={colors.textSecondary}
              value={time}
              onChangeText={setTime}
            />
          </View>
          <View>
            <FieldLabel label="Timezone" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={tz}
              onChangeText={setTz}
            />
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

  const [defaultTemplate, setDefaultTemplate] = useState<string>('');
  const [templateLoading, setTemplateLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [previewData, setPreviewData] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [scheduledFor, setScheduledFor] = useState<{ date: string; time: string; tz: string } | null>(null);

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

  const { fields, append, remove } = useFieldArray({ control, name: 'recruiters' });
  const useDefault = watch('useDefaultTemplate');

  // ── Load Default Template ──────────────────────────────────────────────────

  const loadTemplate = useCallback(async () => {
    try {
      setTemplateLoading(true);
      const res = await api.get('/email-templates/default');
      setDefaultTemplate(res?.data?.body ?? res?.body ?? '');
    } catch {
      setDefaultTemplate('');
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ── Preview ────────────────────────────────────────────────────────────────

  const handlePreview = async () => {
    const values = getValues();
    const firstRecruiter = values.recruiters[0];
    const body = useDefault ? defaultTemplate : (values.customEmailBody ?? '');

    setPreviewData({
      to: firstRecruiter?.email ?? '',
      subject: `Application for ${values.jobTitle} at ${values.companyName}`,
      body,
    });
    setPreviewVisible(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: AddJobForm, sendMode: 'now' | 'schedule') => {
    if (submitting) return;

    if (sendMode === 'schedule' && !scheduledFor) {
      setScheduleVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl,
        jobDescription: data.jobDescription,
        recruiters: data.recruiters,
        emailBody: data.useDefaultTemplate ? defaultTemplate : data.customEmailBody,
        useDefaultTemplate: data.useDefaultTemplate,
      };

      if (sendMode === 'schedule' && scheduledFor) {
        payload.scheduledFor = `${scheduledFor.date}T${scheduledFor.time}:00`;
        payload.timezone = scheduledFor.tz;
      }

      const endpoint = sendMode === 'schedule' ? '/applications/schedule' : '/applications/send';
      await api.post(endpoint, payload);

      Alert.alert(
        sendMode === 'schedule' ? 'Email Scheduled! 📅' : 'Email Sent! 🎉',
        sendMode === 'schedule'
          ? `Your application email has been scheduled.`
          : `Your application email was sent successfully.`,
        [{ text: 'OK', onPress: () => router.push('/(app)/applied-jobs') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSendNow = handleSubmit((data) => onSubmit(data, 'now'));
  const onSchedule = handleSubmit((data) => onSubmit(data, 'schedule'));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Apply for Job</Text>
        <TouchableOpacity onPress={handlePreview} style={styles.previewBtn}>
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={[styles.previewBtnText, { color: colors.primary }]}>Preview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Job Details ────────────────────────────────────────────────── */}
        <SectionHeader title="Job Details" colors={colors} />

        {/* Company */}
        <View style={styles.fieldGroup}>
          <FieldLabel label="Company Name" required colors={colors} />
          <Controller
            control={control}
            name="companyName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, borderColor: errors.companyName ? '#EF4444' : colors.border, color: colors.text },
                ]}
                placeholder="e.g. Google, Apple, Tesla"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                returnKeyType="next"
              />
            )}
          />
          <FieldError message={errors.companyName?.message} visible={isSubmitted} />
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
                  { backgroundColor: colors.card, borderColor: errors.jobTitle ? '#EF4444' : colors.border, color: colors.text },
                ]}
                placeholder="e.g. Senior React Developer"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChange}
                returnKeyType="next"
              />
            )}
          />
          <FieldError message={errors.jobTitle?.message} visible={isSubmitted} />
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
                  { backgroundColor: colors.card, borderColor: errors.jobUrl ? '#EF4444' : colors.border, color: colors.text },
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
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
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

        {/* ── Recruiters ─────────────────────────────────────────────────── */}
        <SectionHeader title="Recruiters" colors={colors} />

        {errors.recruiters?.root?.message ? (
          <View style={[styles.rootError, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
            <Text style={styles.rootErrorText}>{errors.recruiters.root.message}</Text>
          </View>
        ) : null}

        {fields.map((field, index) => (
          <View
            key={field.id}
            style={[styles.recruiterCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.recruiterHeader}>
              <View style={[styles.recruiterIndex, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.recruiterIndexText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.recruiterLabel, { color: colors.text }]}>Recruiter {index + 1}</Text>
              {fields.length > 1 && (
                <TouchableOpacity
                  onPress={() => remove(index)}
                  style={[styles.removeBtn, { backgroundColor: '#FEE2E2' }]}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>

            {/* Recruiter Name */}
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
                        borderColor: errors.recruiters?.[index]?.name ? '#EF4444' : colors.border,
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
              <FieldError message={errors.recruiters?.[index]?.name?.message} visible={isSubmitted} />
            </View>

            {/* Recruiter Email */}
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
                        borderColor: errors.recruiters?.[index]?.email ? '#EF4444' : colors.border,
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
              <FieldError message={errors.recruiters?.[index]?.email?.message} visible={isSubmitted} />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addRecruiterBtn, { borderColor: colors.primary }]}
          onPress={() => append({ name: '', email: '' })}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.addRecruiterBtnText, { color: colors.primary }]}>Add Another Recruiter</Text>
        </TouchableOpacity>

        {/* ── Email Template ─────────────────────────────────────────────── */}
        <SectionHeader title="Email Template" colors={colors} />

        <View style={[styles.templateToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.templateToggleLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.templateToggleTitle, { color: colors.text }]}>Use Default Template</Text>
              <Text style={[styles.templateToggleDesc, { color: colors.textSecondary }]}>
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
        <View style={[styles.templateBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {useDefault ? (
            templateLoading ? (
              <View style={styles.templateLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.templateLoadingText, { color: colors.textSecondary }]}>Loading template…</Text>
              </View>
            ) : (
              <>
                <View style={styles.templateReadonlyBadge}>
                  <Ionicons name="lock-closed-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.templateReadonlyText, { color: colors.textSecondary }]}>Read-only</Text>
                </View>
                <Text style={[styles.templateBodyText, { color: colors.text }]}>
                  {defaultTemplate || 'No default template configured. Please add one in Settings.'}
                </Text>
              </>
            )
          ) : (
            <>
              <View style={styles.varChips}>
                <Text style={[styles.varLabel, { color: colors.textSecondary }]}>Insert variable:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                    {TEMPLATE_VARS.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.varChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                        onPress={() => {
                          const current = getValues('customEmailBody') ?? '';
                          setValue('customEmailBody', current + v);
                        }}
                      >
                        <Text style={[styles.varChipText, { color: colors.primary }]}>{v}</Text>
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
                    placeholder="Write your custom email here… Use {{variables}} for personalization."
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                  />
                )}
              />
            </>
          )}
        </View>

        {/* Scheduled indicator */}
        {scheduledFor && (
          <View style={[styles.scheduledBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={[styles.scheduledBannerText, { color: '#92400E' }]}>
              Scheduled for {scheduledFor.date} at {scheduledFor.time} ({scheduledFor.tz})
            </Text>
            <TouchableOpacity onPress={() => setScheduledFor(null)}>
              <Ionicons name="close-circle" size={16} color="#D97706" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.scheduleBtn, { borderColor: colors.primary }]}
            onPress={() => setScheduleVisible(true)}
            disabled={submitting}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[styles.scheduleBtnText, { color: colors.primary }]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              submitting && { opacity: 0.6 },
            ]}
            onPress={onSendNow}
            disabled={submitting}
          >
            {submitting ? (
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

      {/* Modals */}
      <EmailPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        previewData={previewData}
        colors={colors}
      />
      <ScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
        onConfirm={(date, time, tz) => {
          setScheduledFor({ date, time, tz });
          onSchedule();
        }}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  scrollContent: { padding: 16 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
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

  // Recruiter
  recruiterCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  recruiterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  recruiterIndex: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
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

  // Root Error
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
  },
  templateToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  templateToggleTitle: { fontSize: 14, fontWeight: '600' },
  templateToggleDesc: { fontSize: 12, marginTop: 2 },
  templateBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    minHeight: 150,
  },
  templateReadonlyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  templateReadonlyText: { fontSize: 11 },
  templateBodyText: { fontSize: 13, lineHeight: 22 },
  templateLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 10 },
  templateLoadingText: { fontSize: 13 },
  templateInput: { fontSize: 13, lineHeight: 22, minHeight: 180, textAlignVertical: 'top' },
  varChips: { marginBottom: 10 },
  varLabel: { fontSize: 11, marginBottom: 6 },
  varChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  varChipText: { fontSize: 11, fontWeight: '600' },

  // Scheduled Banner
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
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
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
  previewField: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  previewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  previewValue: { fontSize: 14, lineHeight: 22 },

  // Generic
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