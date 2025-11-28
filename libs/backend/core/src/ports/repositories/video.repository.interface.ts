import type { VideoEntity } from '@blog/shared/domain';

/**
 * Video Repository Interface (Port)
 *
 * Defines the contract for video persistence operations.
 */
export interface IVideoRepository {
  /**
   * Find video by ID
   */
  findById(id: string): Promise<VideoEntity | null>;

  /**
   * Find video by filename
   */
  findByFilename(filename: string): Promise<VideoEntity | null>;

  /**
   * Find videos by uploader ID
   */
  findByUploaderId(
    uploaderId: string,
    options?: VideoQueryOptions
  ): Promise<VideoEntity[]>;

  /**
   * Find videos by status
   */
  findByStatus(
    status: string,
    options?: VideoQueryOptions
  ): Promise<VideoEntity[]>;

  /**
   * Find videos pending processing
   */
  findPendingProcessing(limit?: number): Promise<VideoEntity[]>;

  /**
   * Find failed videos for retry
   */
  findFailedForRetry(maxRetries?: number): Promise<VideoEntity[]>;

  /**
   * Save video (create or update)
   */
  save(video: VideoEntity): Promise<void>;

  /**
   * Delete video (and all associated files)
   */
  delete(id: string): Promise<void>;

  /**
   * Update video status
   */
  updateStatus(id: string, status: string): Promise<void>;

  /**
   * Count videos by status
   */
  countByStatus(status: string): Promise<number>;

  /**
   * Count videos by uploader
   */
  countByUploader(uploaderId: string): Promise<number>;

  /**
   * Find videos to cleanup (old raw files)
   */
  findForCleanup(olderThan: Date): Promise<VideoEntity[]>;

  /**
   * Get total storage used by user
   */
  getTotalStorageByUser(userId: string): Promise<number>;
}

/**
 * Video Query Options
 */
export interface VideoQueryOptions {
  status?: string | string[];
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'duration' | 'viewCount';
  orderDir?: 'asc' | 'desc';
}
