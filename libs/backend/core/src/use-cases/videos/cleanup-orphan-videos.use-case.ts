/**
 * Cleanup Orphan Videos Use Case
 *
 * Cleans up videos that were uploaded but never attached to a post.
 * These videos are considered orphans after a configurable time period (default: 24 hours).
 *
 * Use case: Scheduled job runs periodically to remove orphan videos and free up storage.
 */

import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IStorageService } from '../../ports/services/storage.service.interface.js';
import type { IVideoQueueService } from '../../ports/services/video-queue.service.interface.js';
import { type Result } from '../common/result.js';

export interface CleanupOrphanVideosInput {
  /** Hours after which an orphan video is eligible for cleanup (default: 24) */
  orphanAgeHours?: number;
  /** Maximum number of videos to cleanup in one run (default: 100) */
  batchSize?: number;
  /** If true, only report what would be deleted without actually deleting */
  dryRun?: boolean;
}

export interface CleanupOrphanVideosOutput {
  /** Total orphan videos found */
  totalOrphans: number;
  /** Number of videos cleaned up */
  cleanedUp: number;
  /** IDs of cleaned up videos */
  cleanedVideoIds: string[];
  /** IDs of videos that failed to cleanup */
  failedVideoIds: string[];
  /** Was this a dry run? */
  dryRun: boolean;
}

export interface CleanupOrphanVideosUseCaseDeps {
  videoRepository: IVideoRepository;
  storageService: IStorageService;
  videoQueueService: IVideoQueueService;
}

export class CleanupOrphanVideosUseCase {
  private readonly videoRepository: IVideoRepository;
  private readonly storageService: IStorageService;
  private readonly videoQueueService: IVideoQueueService;

  constructor(deps: CleanupOrphanVideosUseCaseDeps) {
    this.videoRepository = deps.videoRepository;
    this.storageService = deps.storageService;
    this.videoQueueService = deps.videoQueueService;
  }

  async execute(
    input: CleanupOrphanVideosInput = {}
  ): Promise<Result<CleanupOrphanVideosOutput>> {
    const { orphanAgeHours = 24, batchSize = 100, dryRun = false } = input;

    console.log(
      `🧹 Starting orphan video cleanup (age: ${orphanAgeHours}h, batch: ${batchSize}, dryRun: ${dryRun})`
    );

    try {
      // Find orphan videos older than the specified age
      const orphanVideos = await this.videoRepository.findOrphanVideos(
        orphanAgeHours
      );

      // Apply batch size limit
      const videosToProcess = orphanVideos.slice(0, batchSize);

      console.log(
        `📊 Found ${orphanVideos.length} orphan videos, processing ${videosToProcess.length}`
      );

      if (dryRun) {
        return {
          success: true,
          data: {
            totalOrphans: videosToProcess.length,
            cleanedUp: 0,
            cleanedVideoIds: [],
            failedVideoIds: [],
            dryRun: true,
          },
        };
      }

      const cleanedVideoIds: string[] = [];
      const failedVideoIds: string[] = [];

      for (const video of videosToProcess) {
        const videoData = video.toJSON();
        const videoId = videoData.id;

        try {
          console.log(`🗑️ Cleaning up orphan video ${videoId}`);

          // 1. Cancel any pending encoding jobs
          const jobId = `video-${videoId}`;
          const jobStatus = await this.videoQueueService.getJobStatus(jobId);
          if (
            jobStatus &&
            (jobStatus.state === 'waiting' || jobStatus.state === 'delayed')
          ) {
            await this.videoQueueService.cancelJob(jobId);
          }

          // 2. Delete files from all storage buckets
          await this.deleteVideoFiles(
            videoId,
            videoData.rawFilePath ?? undefined
          );

          // 3. Hard delete from database
          await this.videoRepository.hardDelete(videoId);

          cleanedVideoIds.push(videoId);
          console.log(`✅ Cleaned up orphan video ${videoId}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `❌ Failed to cleanup orphan video ${videoId}: ${errorMessage}`
          );
          failedVideoIds.push(videoId);
        }
      }

      console.log(
        `🧹 Orphan cleanup complete: ${cleanedVideoIds.length} cleaned, ${failedVideoIds.length} failed`
      );

      return {
        success: true,
        data: {
          totalOrphans: videosToProcess.length,
          cleanedUp: cleanedVideoIds.length,
          cleanedVideoIds,
          failedVideoIds,
          dryRun: false,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Orphan cleanup failed: ${errorMessage}`);

      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: `Failed to cleanup orphan videos: ${errorMessage}`,
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
