/**
 * ResumeUploadButton.tsx
 *
 * A self-contained upload button component.
 * Does NOT handle form state — that stays in the parent Profile screen.
 * Emits extracted data to the parent via onExtractionComplete callback.
 *
 * Shows:
 * - Upload button (idle state)
 * - Loading state while extracting
 * - Success message after extraction
 * - Error message on failure
 * - Warnings from the backend
 */

import { pickAndExtractResume, type ExtractedResumeData } from '@/services/resume.service';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeUploadButtonProps {
  onExtractionComplete: (
    data: ExtractedResumeData,
    warnings: string[]
  ) => void;
  disabled?: boolean;
  /** Style overrides for the container */
  style?: object;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeUploadButton({
  onExtractionComplete,
  disabled = false,
  style,
}: ResumeUploadButtonProps) {
  const [state, setState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleUpload() {
    if (disabled || state === 'loading') return;

    setState('loading');
    setErrorMessage('');
    setWarnings([]);

    const result = await pickAndExtractResume();

    if (result.cancelled) {
      // User cancelled — silently return to idle
      setState('idle');
      return;
    }

    if (!result.success || !result.data) {
      setState('error');
      setErrorMessage(
        result.error || 'Resume extraction failed. Please try again.'
      );
      return;
    }

    const extractionWarnings = result.metadata?.warnings || [];
    setWarnings(extractionWarnings);
    setState('success');

    // Emit to parent — parent decides what to do with the data
    onExtractionComplete(result.data, extractionWarnings);
  }

  return (
    <View style={[styles.container, style]}>
      {/* ── Upload Button ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || state === 'loading') && styles.buttonDisabled,
        ]}
        onPress={handleUpload}
        disabled={disabled || state === 'loading'}
        accessibilityLabel="Upload Resume"
        accessibilityRole="button"
      >
        {state === 'loading' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>
              Extracting resume...
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {state === 'success' ? '↑ Upload Different Resume' : '↑ Upload Resume'}
          </Text>
        )}
      </TouchableOpacity>

      {/* ── Supported formats note ───────────────────────────────────────── */}
      <Text style={styles.hint}>Supported: PDF, DOCX (max 10 MB)</Text>

      {/* ── Success Message ──────────────────────────────────────────────── */}
      {state === 'success' && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✓ Resume information extracted successfully.
          </Text>
          <Text style={styles.successSubText}>
            Please review the information before saving.
          </Text>
        </View>
      )}

      {/* ── Error Message ────────────────────────────────────────────────── */}
      {state === 'error' && errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* ── Warnings ─────────────────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <View style={styles.warningBox}>
          {warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>
              ⚠ {w}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  successBox: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  successText: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 13,
  },
  successSubText: {
    color: '#15803D',
    fontSize: 12,
    marginTop: 2,
  },
  errorBox: {
    marginTop: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  warningBox: {
    marginTop: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    marginBottom: 2,
  },
});
