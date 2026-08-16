/**
 * ResumeUploader.tsx
 *
 * Upload trigger. Does NOT touch the form.
 * Emits the extraction result to the parent Profile screen.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { pickAndExtractResume } from '@/services/resume.service';
import type { ExtractionResult } from '@/types/resume';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeUploaderProps {
  onExtractionComplete: (result: ExtractionResult) => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'loading' | 'success' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeUploader({
  onExtractionComplete,
  disabled = false,
}: ResumeUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handlePress() {
    if (disabled || state === 'loading') return;

    setState('loading');
    setErrorMessage('');

    const result = await pickAndExtractResume();

    if (result.cancelled) {
      setState('idle');
      return;
    }

    if (!result.success) {
      setState('error');
      setErrorMessage(result.error ?? 'Resume extraction failed.');
      onExtractionComplete(result);
      return;
    }

    setState('success');
    onExtractionComplete(result);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || state === 'loading') && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || state === 'loading'}
        accessibilityRole="button"
        accessibilityLabel="Upload Resume"
      >
        {state === 'loading' ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[styles.buttonText, styles.loadingText]}>
              Extracting resume...
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {state === 'success' ? '↑ Upload Different Resume' : '↑ Upload Resume'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Supported: PDF, DOCX (max 10 MB)</Text>

      {state === 'success' && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>
            ✓ Resume information extracted successfully.
          </Text>
          <Text style={styles.successBody}>
            Please review the information before saving.
          </Text>
        </View>
      )}

      {state === 'error' && errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
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
  successTitle: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 13,
  },
  successBody: {
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
});