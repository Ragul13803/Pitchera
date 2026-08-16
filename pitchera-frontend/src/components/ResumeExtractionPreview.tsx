/**
 * ResumeExtractionPreview.tsx
 *
 * Preview modal shown before applying extracted data to the profile form.
 *
 * Rules:
 * - Existing profile data is NEVER automatically overwritten
 * - User must explicitly press "Apply Extracted Information"
 * - Empty extracted values NEVER erase existing values
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import type {
  ExtractedResumeData,
  ResumeExtractionMetadata,
} from '@/types/resume';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeExtractionPreviewProps {
  visible: boolean;
  extractedData: ExtractedResumeData | null;
  metadata: ResumeExtractionMetadata | null;
  onApply: () => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeExtractionPreview({
  visible,
  extractedData,
  metadata,
  onApply,
  onCancel,
}: ResumeExtractionPreviewProps) {
  if (!extractedData) return null;

  const {
    personal,
    profile,
    social_links,
    skills,
    educations,
    experiences,
    projects,
    certifications,
  } = extractedData;

  const warnings = metadata?.warnings ?? [];
  const fullName = [personal.first_name, personal.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Extracted Resume Information</Text>
          <Text style={styles.headerSubtitle}>
            Review the extracted information, then press{' '}
            <Text style={styles.bold}>Apply</Text> to populate your profile form.
            Existing values will not be overwritten.
          </Text>
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningBanner}>
            {warnings.map((w, i) => (
              <Text key={i} style={styles.warningBannerText}>
                ⚠ {w}
              </Text>
            ))}
          </View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {anyValue(personal) && (
            <PreviewSection title="Personal Information">
              <PreviewField label="Name" value={fullName} />
              <PreviewField label="Email" value={personal.email} />
              <PreviewField label="Phone" value={personal.phone} />
              <PreviewField label="Location" value={personal.location} />
            </PreviewSection>
          )}

          {anyValue(profile) && (
            <PreviewSection title="Profile">
              <PreviewField label="Job Title" value={profile.current_job_title} />
              <PreviewField label="Company" value={profile.current_company} />
              <PreviewField
                label="Total Experience"
                value={profile.total_experience}
              />
              <PreviewField label="Notice Period" value={profile.notice_period} />
              <PreviewField label="Summary" value={profile.summary} multiline />
            </PreviewSection>
          )}

          {anyValue(social_links) && (
            <PreviewSection title="Social Links">
              <PreviewField label="LinkedIn" value={social_links.linkedin} />
              <PreviewField label="GitHub" value={social_links.github} />
              <PreviewField label="Portfolio" value={social_links.portfolio} />
            </PreviewSection>
          )}

          {(skills.technical.length > 0 ||
            skills.soft.length > 0 ||
            skills.language.length > 0) && (
            <PreviewSection title="Skills">
              {skills.technical.length > 0 && (
                <PreviewField
                  label="Technical"
                  value={skills.technical.join(', ')}
                  multiline
                />
              )}
              {skills.soft.length > 0 && (
                <PreviewField
                  label="Soft Skills"
                  value={skills.soft.join(', ')}
                  multiline
                />
              )}
              {skills.language.length > 0 && (
                <PreviewField
                  label="Languages"
                  value={skills.language.join(', ')}
                />
              )}
            </PreviewSection>
          )}

          {educations.length > 0 && (
            <PreviewSection title={`Education (${educations.length})`}>
              {educations.map((edu, i) => (
                <View
                  key={i}
                  style={[
                    styles.subBlock,
                    i === educations.length - 1 && styles.subBlockLast,
                  ]}
                >
                  <PreviewField label="Level" value={edu.level} />
                  <PreviewField label="Institution" value={edu.institution} />
                  <PreviewField label="Degree" value={edu.degree} />
                  <PreviewField label="Field" value={edu.field_of_study} />
                  <PreviewField
                    label="Period"
                    value={formatDateRange(edu.start_date, edu.end_date)}
                  />
                  <PreviewField label="Grade" value={edu.grade} />
                </View>
              ))}
            </PreviewSection>
          )}

          {experiences.length > 0 && (
            <PreviewSection title={`Experience (${experiences.length})`}>
              {experiences.map((exp, i) => (
                <View
                  key={i}
                  style={[
                    styles.subBlock,
                    i === experiences.length - 1 && styles.subBlockLast,
                  ]}
                >
                  <PreviewField label="Company" value={exp.company} />
                  <PreviewField label="Title" value={exp.designation} />
                  <PreviewField
                    label="Period"
                    value={
                      exp.currently_working
                        ? `${exp.start_date ?? ''} – Present`
                        : formatDateRange(exp.start_date, exp.end_date)
                    }
                  />
                  <PreviewField
                    label="Description"
                    value={exp.description}
                    multiline
                  />
                  <PreviewField label="Technologies" value={exp.technologies} />
                </View>
              ))}
            </PreviewSection>
          )}

          {projects.length > 0 && (
            <PreviewSection title={`Projects (${projects.length})`}>
              {projects.map((proj, i) => (
                <View
                  key={i}
                  style={[
                    styles.subBlock,
                    i === projects.length - 1 && styles.subBlockLast,
                  ]}
                >
                  <PreviewField label="Name" value={proj.name} />
                  <PreviewField
                    label="Description"
                    value={proj.description}
                    multiline
                  />
                  <PreviewField label="Technologies" value={proj.technologies} />
                  <PreviewField label="URL" value={proj.project_url} />
                  <PreviewField label="GitHub" value={proj.github_url} />
                </View>
              ))}
            </PreviewSection>
          )}

          {certifications.length > 0 && (
            <PreviewSection title={`Certifications (${certifications.length})`}>
              {certifications.map((cert, i) => (
                <View
                  key={i}
                  style={[
                    styles.subBlock,
                    i === certifications.length - 1 && styles.subBlockLast,
                  ]}
                >
                  <PreviewField label="Name" value={cert.name} />
                  <PreviewField label="Organization" value={cert.organization} />
                  <PreviewField label="Date" value={cert.issue_date} />
                  <PreviewField
                    label="Credential URL"
                    value={cert.credential_url}
                  />
                </View>
              ))}
            </PreviewSection>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            accessibilityLabel="Cancel and discard extracted information"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={onApply}
            accessibilityLabel="Apply extracted information to profile form"
          >
            <Text style={styles.applyBtnText}>Apply Extracted Information</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PreviewField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  if (!value || value.trim() === '') return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when at least one property of the object has a meaningful value.
 *
 * Accepts `object` (not Record<string, unknown>) because TypeScript interfaces
 * do not have implicit index signatures — passing ExtractedPersonal etc.
 * to a Record<string, unknown> parameter fails with TS2345.
 */
function anyValue(obj: object): boolean {
  return Object.values(obj).some((v) => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== '';
  });
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return '';
  if (!end) return String(start ?? '');
  return `${start ?? ''} – ${end ?? ''}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  bold: { fontWeight: '700', color: '#374151' },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  warningBannerText: { color: '#92400E', fontSize: 12, marginBottom: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subBlock: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subBlockLast: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  field: { marginBottom: 6 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldValue: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
    lineHeight: 20,
  },
  fieldValueMultiline: { lineHeight: 20 },
  bottomPad: { height: 20 },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  applyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});