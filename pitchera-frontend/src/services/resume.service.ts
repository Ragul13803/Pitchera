/**
 * services/resume.service.ts
 *
 * Resume extraction API client.
 * All parsing happens on the backend — this only uploads and receives JSON.
 *
 * Adjust API_BASE_URL and getAuthToken() to match your existing api service.
 */

import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import api from '@/services/api';
import type {
  ExtractionResult,
  ResumeExtractionResponse,
} from '@/types/resume';

// Re-export types so components can import from either location
export type {
  ExtractedResumeData,
  ExtractionResult,
  ResumeExtractionMetadata,
  ResumeExtractionResponse,
} from '@/types/resume';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — UX guard, backend enforces

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

// ─── Picker ───────────────────────────────────────────────────────────────────

export async function pickResumeFile(): Promise<DocumentPicker.DocumentPickerResult | null> {
  try {
    return await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MIME_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch (err) {
    console.error('[resumeService] Picker error:', err);
    return null;
  }
}

// ─── Upload + Extract ─────────────────────────────────────────────────────────

export async function extractResumeFromFile(
  asset: DocumentPicker.DocumentPickerAsset
): Promise<ResumeExtractionResponse> {
  const formData = new FormData();

  if (Platform.OS === 'web' && asset.file) {
    formData.append('resume', asset.file, asset.name);
  } else {
    formData.append('resume', {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);
  }

  return api.upload<ResumeExtractionResponse>('/resume/extract', formData);
}

// ─── Combined Flow ────────────────────────────────────────────────────────────

export async function pickAndExtractResume(): Promise<ExtractionResult> {
  const picked = await pickResumeFile();

  if (!picked || picked.canceled) {
    return { success: false, cancelled: true };
  }

  const asset = picked.assets?.[0];
  if (!asset?.uri || !asset.name) {
    return { success: false, error: 'No file was selected.' };
  }

  if (asset.size && asset.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: 'Resume file is too large. Maximum allowed size is 10 MB.',
    };
  }

  try {
    const response = await extractResumeFromFile(asset);

    if (!response.success) {
      return { success: false, error: response.message ?? 'Extraction failed.' };
    }

    return {
      success: true,
      data: response.data,
      metadata: response.metadata,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Resume extraction failed.',
    };
  }
}
