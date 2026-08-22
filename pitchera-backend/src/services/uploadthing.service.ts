import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

export class UploadThingService {
  /**
   * Upload file to UploadThing
   */
  static async uploadFile(file: Express.Multer.File) {
    try {
      // Convert buffer to File object
      const blob = new Blob([file.buffer], { type: file.mimetype });
      const uploadFile = new File([blob], file.originalname, {
        type: file.mimetype,
      });

      // Upload to UploadThing
      const response = await utapi.uploadFiles(uploadFile);

      if (!response.data) {
        throw new Error("Upload failed - no data returned");
      }

      return {
        key: response.data.key,
        url: response.data.url,
        name: response.data.name,
        size: response.data.size,
      };
    } catch (error) {
      console.error("❌ UploadThing upload failed:", error);
      throw new Error("Failed to upload file to storage");
    }
  }

  /**
   * Delete file from UploadThing
   */
  static async deleteFile(fileKey: string) {
    try {
      await utapi.deleteFiles(fileKey);
      console.log(`🗑️ Deleted file: ${fileKey}`);
    } catch (error) {
      console.error("⚠️ Failed to delete file:", error);
      // Don't throw - deletion failure shouldn't block new upload
    }
  }
}