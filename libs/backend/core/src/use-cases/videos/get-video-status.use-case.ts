/**
 * Get Video Status Use Case
 *
 * Returns current video processing status for polling.
 */

import type { VideoStatusResponseDto } from '@blog/shared/domain';
import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IVideoQueueService } from '../../ports/services/video-queue.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';
import { VideoStatus } from '@blog/shared/domain';

export interface GetVideoStatusInput {
  videoId: string;
}

export interface GetVideoStatusOutput {
  status: VideoStatusResponseDto;
}

export interface GetVideoStatusDependencies {
  videoRepository: IVideoRepository;
  videoQueueService?: IVideoQueueService; // Optional - for real-time progress
}

export class GetVideoStatusUseCase {
  constructor(private readonly deps: GetVideoStatusDependencies) {}

  async execute(
    input: GetVideoStatusInput
  ): Promise<Result<GetVideoStatusOutput>> {
    // 1. Find video
    const video = await this.deps.videoRepository.findById(input.videoId);

    if (!video) {
      return failure(ErrorCodes.NOT_FOUND, 'Video not found');
    }

    // 2. Get base status from video entity
    const statusDto = video.toStatusDto();

    // 3. If video is processing, get real-time progress from queue
    if (
      video.status === VideoStatus.PROCESSING &&
      this.deps.videoQueueService
    ) {
      try {
        const jobStatus = await this.deps.videoQueueService.getJobByVideoId(
          input.videoId
        );
        if (jobStatus && jobStatus.state === 'active') {
          // Override with real-time progress from job
          statusDto.progress = jobStatus.progress;
        }
      } catch (error) {
        // Log but don't fail - fall back to default progress
        console.warn(
          `Failed to get job progress for video ${input.videoId}:`,
          error
        );
      }
    }

    // 4. Return status DTO
    return success({
      status: statusDto,
    });
  }
}
