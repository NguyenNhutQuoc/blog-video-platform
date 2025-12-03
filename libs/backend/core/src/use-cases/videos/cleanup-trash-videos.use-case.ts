/**
 * Cleanup Trash Videos Use Case
 *
 * Permanently deletes soft-deleted videos after a configurable retention period (default: 30 days).
 * This is the final cleanup step - after this, videos cannot be restored.
 *
 * Use case: Scheduled job runs daily to permanently remove expired deleted videos.
 */

import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IStorageService } from '../../ports/services/storage.service.interface.js';
import { type Result } from '../common/result.js';

export interface CleanupTrashVideosInput {
  /** Days after which a soft-deleted video is permanently deleted (default: 30) */
  retentionDays?: number;
  /** Maximum number of videos to cleanup in one run (default: 100) */
  batchSize?: number;
  /** If true, only report what would be deleted without actually deleting */
  dryRun?: boolean;
}

export interface CleanupTrashVideosOutput {
  /** Total expired deleted videos found */
  totalExpired: number;
  /** Number of videos permanently deleted */
  permanentlyDeleted: number;
  /** IDs of permanently deleted videos */
  deletedVideoIds: string[];
  /** IDs of videos that failed to delete */
  failedVideoIds: string[];
  /** Was this a dry run? */
  dryRun: boolean;
}

export interface CleanupTrashVideosUseCaseDeps {
  videoRepository: IVideoRepository;
  storageService: IStorageService;
}

export class CleanupTrashVideosUseCase {
  private readonly videoRepository: IVideoRepository;
  private readonly storageService: IStorageService;

  constructor(deps: CleanupTrashVideosUseCaseDeps) {
    this.videoRepository = deps.videoRepository;
    this.storageService = deps.storageService;
  }

  async execute(
    input: CleanupTrashVideosInput = {}
  ): Promise<Result<CleanupTrashVideosOutput>> {
    const { retentionDays = 30, batchSize = 100, dryRun = false } = input;

    console.log(
      `🗑️ Starting trash cleanup (retention: ${retentionDays} days, batch: ${batchSize}, dryRun: ${dryRun})`
    );

    try {
      // Find soft-deleted videos older than retention period
      const expiredVideos = await this.videoRepository.findDeletedOlderThan(
        retentionDays
      );

      // Apply batch size limit
      const videosToProcess = expiredVideos.slice(0, batchSize);

      console.log(
        `📊 Found ${expiredVideos.length} expired deleted videos, processing ${videosToProcess.length}`
      );

      if (dryRun) {
        return {
          success: true,
          data: {
            totalExpired: videosToProcess.length,
            permanentlyDeleted: 0,
            deletedVideoIds: [],
            failedVideoIds: [],
            dryRun: true,
          },
        };
      }

      const deletedVideoIds: string[] = [];
      const failedVideoIds: string[] = [];

      for (const video of videosToProcess) {
        const videoData = video.toJSON();
        const videoId = videoData.id;

        try {
          console.log(`🗑️ Permanently deleting video ${videoId}`);

          // 1. Delete files from all storage buckets
          await this.deleteVideoFiles(
            videoId,
            videoData.rawFilePath ?? undefined
          );

          // 2. Hard delete from database (removes video_qualities too via cascade)
          await this.videoRepository.hardDelete(videoId);

          deletedVideoIds.push(videoId);
          console.log(`✅ Permanently deleted video ${videoId}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `❌ Failed to permanently delete video ${videoId}: ${errorMessage}`
          );
          failedVideoIds.push(videoId);
        }
      }

      console.log(
        `🗑️ Trash cleanup complete: ${deletedVideoIds.length} deleted, ${failedVideoIds.length} failed`
      );

      return {
        success: true,
        data: {
          totalExpired: videosToProcess.length,
          permanentlyDeleted: deletedVideoIds.length,
          deletedVideoIds,
          failedVideoIds,
          dryRun: false,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Trash cleanup failed: ${errorMessage}`);

      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: `Failed to cleanup trash videos: ${errorMessage}`,
        },
      };
    }
  }

  private async deleteVideoFiles(
    videoId: string,
    rawFilePath?: string
  ): Promise<void> {
    // Delete raw file
    if (rawFilePath) {
      try {
        const [bucket, ...keyParts] = rawFilePath.split('/');
        if (bucket && keyParts.length > 0) {
          await this.storageService.deleteObject({
            bucket,
            key: keyParts.join('/'),
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to delete raw file for ${videoId}:`, error);
      }
    }

    // Delete encoded files (HLS)
    try {
      const prefix = `${videoId}/`;
      const objects = await this.storageService.listObjects({
        bucket: 'videos-encoded',
        prefix,
      });
      if (objects.length > 0) {
        await this.storageService.deleteObjects(
          'videos-encoded',
          objects.map((obj) => obj.key)
        );
      }
    } catch (error) {
      console.warn(`⚠️ Failed to delete encoded files for ${videoId}:`, error);
    }

    // Delete thumbnail
    try {
      await this.storageService.deleteObject({
        bucket: 'thumbnails',
        key: `${videoId}/thumbnail.jpg`,
      });
    } catch (error) {
      console.warn(`⚠️ Failed to delete thumbnail for ${videoId}:`, error);
    }
  }
}
