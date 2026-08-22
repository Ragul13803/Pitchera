import { useState } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import api from "@/services/api";

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

interface UploadedResume {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isPrimary: boolean;
  createdAt: string;
}

interface ResumeUploadResponse {
  success: boolean;
  message: string;
  resume: UploadedResume;
}

export function useResumeUpload(onSuccess?: (resume: UploadedResume) => void) {
  const [uploading, setUploading] = useState(false);

  const uploadResume = async () => {
    if (uploading) return;

    try {
      // ================================
      // STEP 1: Pick PDF
      // ================================
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) return;

      // ================================
      // STEP 2: Validate
      // ================================
      const fileName = file.name || "resume.pdf";
      const isPdf =
        file.mimeType === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        Toast.show({
          type: "error",
          text1: "Invalid File",
          text2: "Please select a PDF file only.",
        });
        return;
      }

      if (file.size && file.size > MAX_RESUME_SIZE) {
        Toast.show({
          type: "error",
          text1: "File Too Large",
          text2: "Resume must be 5 MB or smaller.",
        });
        return;
      }

      setUploading(true);

      // ================================
      // STEP 3: Create FormData
      // ================================
      const formData = new FormData();

      if (Platform.OS === "web") {
        // Web's FormData requires a real Blob/File part - a React
        // Native-style {uri, type, name} object isn't a valid file part
        // in a browser and silently produces an empty/broken multipart
        // request (multer then sees no file). DocumentPicker's `uri` on
        // web is a blob: URL, so re-fetch it to recover the actual Blob.
        const blob = await fetch(file.uri).then((r) => r.blob());
        formData.append("resume", blob, fileName);
      } else {
        // Native fetch/FormData recognizes this {uri, type, name} shape
        // and streams the file directly from its local URI - this is
        // the required (and only) form on iOS/Android.
        formData.append("resume", {
          uri: file.uri,
          type: file.mimeType || "application/pdf",
          name: fileName,
        } as any);
      }

      // ================================
      // STEP 4: Upload to Backend
      // ================================
      const response = await api.upload<ResumeUploadResponse>(
        "/resume/upload",
        formData
      );

      Toast.show({
        type: "success",
        text1: "Resume Uploaded",
        text2: "Your PDF resume was uploaded successfully.",
      });

      if (onSuccess && response.resume) {
        onSuccess(response.resume);
      }
    } catch (error: any) {
      console.error("❌ Resume upload failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to upload your resume. Please try again.";

      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: message,
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadResume,
    uploading,
  };
}