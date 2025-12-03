/**
 * Restore Video Use Case
 *
 * Restores a soft-deleted video.
 * Optionally re-queues for encoding if it was in processing state.
 */

import { VideoStatus } from '@blog/shared/domain';
import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IVideoQueueService } from '../../ports/services/video-queue.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface RestoreVideoInput {
  videoId: string;
  userId: string;
}

export interface RestoreVideoOutput {
  videoId: string;
  status: string;
  message: string;
  requeued: boolean;
}

export interface RestoreVideoDependencies {
  videoRepository: IVideoRepository;
  videoQueueService: IVideoQueueService;
}

export class RestoreVideoUseCase {
  constructor(private readonly deps: RestoreVideoDependencies) {}

  async execute(input: RestoreVideoInput): Promise<Result<RestoreVideoOutput>> {
    // 1. Find video (include deleted)
    const video = await this.deps.videoRepository.findByIdIncludeDeleted(
      input.videoId
    );

    if (!video) {
      return failure(ErrorCodes.NOT_FOUND, 'Video not found');
    }

    const videoData = video.toJSON();

    // 2. Check if video is actually deleted (we can't check deletedAt directly from entity)
    // We'll try to find it in non-deleted state first
    const activeVideo = await this.deps.videoRepository.findById(input.videoId);
    if (activeVideo) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Video is not deleted and cannot be restored'
      );
    }

    // 3. Restore the video
    await this.deps.videoRepository.restore(input.videoId);

    // 4. Check if we need to re-queue for processing
    let requeued = false;
    const statusesThatNeedRequeue = [
      VideoStatus.UPLOADED,
      VideoStatus.CANCELLED,
    ];

    if (
      statusesThatNeedRequeue.includes(
        videoData.status as
          | typeof VideoStatus.UPLOADED
          | typeof VideoStatus.CANCELLED
      )
    ) {
      // Check if raw file path exists for re-processing
      if (videoData.rawFilePath) {
        try {
          await this.deps.videoQueueService.addEncodingJob({
            videoId: input.videoId,
            rawFilePath: videoData.rawFilePath,
          });
          requeued = true;

          // Update status back to uploaded (queued for processing)
          await this.deps.videoRepository.updateStatus(
            input.videoId,
            VideoStatus.UPLOADED
          );
        } catch (error) {
          console.error(
            `Failed to re-queue video ${input.videoId} for processing:`,
            error
          );
          // Continue with restore even if re-queue fails
        }
      }
    }

    return success({
      videoId: input.videoId,
      status: requeued ? VideoStatus.UPLOADED : videoData.status,
      message: requeued
        ? 'Video restored and re-queued for processing'
        : 'Video restored successfully',
      requeued,
    });
  }
}
