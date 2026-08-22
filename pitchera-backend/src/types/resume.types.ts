export interface ResumeUploadResponse {
  success: boolean;
  message: string;
  resume: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    isPrimary: boolean;
    createdAt: Date;
  };
}

export interface UploadThingFile {
  key: string;
  url: string;
  name: string;
  size: number;
}