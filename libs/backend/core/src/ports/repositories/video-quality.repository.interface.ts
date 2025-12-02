/**
 * Video Quality Repository Interface
 *
 * Port for managing individual video quality variants in the database
 */

import type {
  VideoQuality,
  CreateVideoQualityInput,
  UpdateVideoQualityInput,
  VideoQualityStatus,
} from '../../domain/entities/video-quality.entity.js';

export interface IVideoQualityRepository {
  /**
   * Create a new video quality record
   */
  create(input: CreateVideoQualityInput): Promise<VideoQuality>;

  /**
   * Create multiple video quality records in batch
   */
  createBatch(inputs: CreateVideoQualityInput[]): Promise<VideoQuality[]>;

  /**
   * Upsert multiple video quality records in batch (insert or update if exists)
   * Uses ON CONFLICT DO UPDATE to handle duplicate keys gracefully
   */
  upsertBatch(inputs: CreateVideoQualityInput[]): Promise<VideoQuality[]>;

  /**
   * Find a specific quality for a video
   */
  findByVideoAndQuality(
    videoId: string,
    qualityName: string
  ): Promise<VideoQuality | null>;

  /**
   * Find all qualities for a video
   */
  findByVideoId(videoId: string): Promise<VideoQuality[]>;

  /**
   * Find qualities by status (for retry queue)
   */
  findByStatus(
    status: VideoQualityStatus,
    limit?: number
  ): Promise<VideoQuality[]>;

  /**
   * Find failed qualities ready for retry (retry_count < 3)
   * Ordered by retry_priority (low to high) for priority-based retry
   */
  findReadyForRetry(limit?: number): Promise<VideoQuality[]>;

  /**
   * Update a video quality record
   */
  update(
    videoId: string,
    qualityName: string,
    input: UpdateVideoQualityInput
  ): Promise<VideoQuality>;

  /**
   * Increment retry count
   */
  incrementRetryCount(
    videoId: string,
    qualityName: string
  ): Promise<VideoQuality>;

  /**
   * Count ready qualities for a video
   */
  countReadyQualities(videoId: string): Promise<number>;

  /**
   * Check if video has minimum qualities for playback
   */
  hasMinimumQualities(videoId: string, minCount?: number): Promise<boolean>;

  /**
   * Delete all qualities for a video
   */
  deleteByVideoId(videoId: string): Promise<void>;
}
