import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../database/db";
import { UploadThingFile } from "../types/resume.types";

export class ResumeService {
  /**
   * Get user's primary resume
   */
  static async getPrimaryResume(userId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        original_filename AS fileName,
        file_url AS fileUrl,
        file_size AS fileSize,
        mime_type AS mimeType,
        is_primary AS isPrimary,
        created_at AS createdAt
      FROM resumes
      WHERE user_id = ? AND is_primary = 1
      LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  /**
   * Get old resume key for cleanup
   */
  static async getOldResumeKey(userId: number): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT stored_filename FROM resumes WHERE user_id = ? AND is_primary = 1",
      [userId]
    );

    return rows[0]?.stored_filename || null;
  }

  /**
   * Save new resume (atomic operation)
   */
  static async saveResume(userId: number, uploadedFile: UploadThingFile) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Set all existing resumes to non-primary
      await connection.query(
        "UPDATE resumes SET is_primary = 0 WHERE user_id = ?",
        [userId]
      );

      // Insert new resume as primary
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO resumes (
          user_id,
          original_filename,
          stored_filename,
          file_path,
          file_url,
          file_size,
          mime_type,
          is_primary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          uploadedFile.name,
          uploadedFile.key,
          uploadedFile.key,
          uploadedFile.url,
          uploadedFile.size,
          "application/pdf",
          1,
        ]
      );

      await connection.commit();

      return {
        id: result.insertId,
        fileName: uploadedFile.name,
        fileUrl: uploadedFile.url,
        fileSize: uploadedFile.size,
        mimeType: "application/pdf",
        isPrimary: true,
        createdAt: new Date(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete resume
   */
  static async deleteResume(resumeId: number, userId: number) {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    return result.affectedRows > 0;
  }
}