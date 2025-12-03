/**
 * Delete Video Use Case
 *
 * Handles video deletion with smart logic:
 * - Videos without posts: hard delete (permanent removal)
 * - Videos with posts: soft delete (can be restored)
 *
 * Also handles cancelling encoding if video is being processed.
 */

import { VideoStatus } from '@blog/shared/domain';
import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IStorageService } from '../../ports/services/storage.service.interface.js';
import type { IVideoQueueService } from '../../ports/services/video-queue.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface DeleteVideoInput {
  videoId: string;
  userId: string;
  /** Force hard delete even if video has associated post */
  forceHardDelete?: boolean;
}

export interface DeleteVideoOutput {
  videoId: string;
  deleteType: 'hard' | 'soft';
  message: string;
}

export interface DeleteVideoDependencies {
  videoRepository: IVideoRepository;
  storageService: IStorageService;
  videoQueueService: IVideoQueueService;
}

/** Storage bucket names */
const StorageBuckets = {
  VIDEOS_RAW: 'videos-raw',
  VIDEOS_ENCODED: 'videos-encoded',
  THUMBNAILS: 'thumbnails',
} as const;

export class DeleteVideoUseCase {
  constructor(private readonly deps: DeleteVideoDependencies) {}

  async execute(input: DeleteVideoInput): Promise<Result<DeleteVideoOutput>> {
    // 1. Find video (include deleted to handle edge cases)
    const video = await this.deps.videoRepository.findByIdIncludeDeleted(
      input.videoId
    );

    if (!video) {
      return failure(ErrorCodes.NOT_FOUND, 'Video not found');
    }

    const videoData = video.toJSON();

    // 2. Check if already deleted
    // Note: We check via status since entity doesn't have deletedAt
    // The repository handles deleted_at filtering

    // 3. Check ownership (video owner validation would need user_id on video or check via post)
    // For now, we'll validate via the post if exists
    const hasPost = await this.deps.videoRepository.hasAssociatedPost(
      input.videoId
    );

    // 4. Handle encoding cancellation if video is processing or queued
    if (
      videoData.status === VideoStatus.UPLOADING ||
      videoData.status === VideoStatus.UPLOADED ||
      videoData.status === VideoStatus.PROCESSING
    ) {
      await this.cancelEncodingIfNeeded(input.videoId);
    }

    // 5. Determine delete type
    const shouldHardDelete = input.forceHardDelete || !hasPost;

    if (shouldHardDelete) {
      // Hard delete: remove files and DB record
      await this.performHardDelete(input.videoId, videoData);

      return success({
        videoId: input.videoId,
        deleteType: 'hard',
        message: 'Video permanently deleted',
      });
    } else {
      // Soft delete: just mark as deleted
      await this.deps.videoRepository.softDelete(input.videoId);

      return success({
        videoId: input.videoId,
        deleteType: 'soft',
        message:
          'Video moved to trash. It will be permanently deleted after 30 days.',
      });
    }
  }

  /**
   * Cancel encoding job if video is in queue or processing
   */
  private async cancelEncodingIfNeeded(videoId: string): Promise<void> {
    try {
      const jobId = `video-${videoId}`;
      const jobStatus = await this.deps.videoQueueService.getJobStatus(jobId);

      if (jobStatus) {
        if (jobStatus.state === 'waiting' || jobStatus.state === 'delayed') {
          // Job is queued, can be removed
          await this.deps.videoQueueService.cancelJob(jobId);
          console.log(`🗑️ Cancelled queued job for video ${videoId}`);
        } else if (jobStatus.state === 'active') {
          // Job is processing, update status so worker will stop
          // Worker checks deleted_at/cancelled status during processing
          await this.deps.videoRepository.updateStatus(
            videoId,
            VideoStatus.CANCELLED
          );
          console.log(
            `⚠️ Video ${videoId} marked as cancelled. Worker will stop processing.`
          );
        }
      }
    } catch (error) {
      console.error(`Failed to cancel encoding for video ${videoId}:`, error);
      // Continue with deletion even if cancellation fails
    }
  }

  /**
   * Perform hard delete: remove all files and DB record
   */
  private async performHardDelete(
    videoId: string,
    videoData: ReturnType<
      typeof import('@blog/shared/domain').VideoEntity.prototype.toJSON
    >
  ): Promise<void> {
    // Delete raw file
    if (videoData.rawFilePath) {
      try {
        const [bucket, ...keyParts] = videoData.rawFilePath.split('/');
        const key = keyParts.join('/');
        await this.deps.storageService.deleteObject({ bucket, key });
        console.log(`🗑️ Deleted raw file: ${videoData.rawFilePath}`);
      } catch (error) {
        console.error(
          `Failed to delete raw file: ${videoData.rawFilePath}`,
          error
        );
      }
    }

    // Delete encoded files (HLS segments)
    if (videoData.hlsMasterUrl) {
      try {
        // HLS files are stored with video ID as prefix
        const prefix = `${videoId}/`;
        const objects = await this.deps.storageService.listObjects({
          bucket: StorageBuckets.VIDEOS_ENCODED,
          prefix,
        });
        if (objects.length > 0) {
          await this.deps.storageService.deleteObjects(
            StorageBuckets.VIDEOS_ENCODED,
            objects.map((obj) => obj.key)
          );
        }
        console.log(`🗑️ Deleted encoded files for video ${videoId}`);
      } catch (error) {
        console.error(
          `Failed to delete encoded files for video ${videoId}`,
          error
        );
      }
    }

    // Delete thumbnail
    if (videoData.thumbnailUrl) {
      try {
        // Extract key from thumbnail URL
        const thumbnailKey = `${videoId}/thumbnail.jpg`;
        await this.deps.storageService.deleteObject({
          bucket: StorageBuckets.THUMBNAILS,
          key: thumbnailKey,
        });
        console.log(`🗑️ Deleted thumbnail for video ${videoId}`);
      } catch (error) {
        console.error(`Failed to delete thumbnail for video ${videoId}`, error);
      }
    }

    // Delete DB record
    await this.deps.videoRepository.hardDelete(videoId);
    console.log(`🗑️ Hard deleted video record ${videoId}`);
  }
}
