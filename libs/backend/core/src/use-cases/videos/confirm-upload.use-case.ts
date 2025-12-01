/**
 * Confirm Upload Use Case
 *
 * Confirms that video upload is complete and queues it for processing.
 * Verifies the file exists in storage before queueing.
 */

import { VideoStatus } from '@blog/shared/domain';
import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IStorageService } from '../../ports/services/storage.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface ConfirmUploadInput {
  videoId: string;
  userId: string;
}

export interface ConfirmUploadOutput {
  videoId: string;
  status: string;
  message: string;
}

export interface ConfirmUploadDependencies {
  videoRepository: IVideoRepository;
  storageService: IStorageService;
  /**
   * Function to queue video for encoding
   * This will be provided by the infrastructure layer (BullMQ)
   */
  queueVideoForProcessing: (
    videoId: string,
    rawFilePath: string
  ) => Promise<string>;
}

export class ConfirmUploadUseCase {
  constructor(private readonly deps: ConfirmUploadDependencies) {}

  async execute(
    input: ConfirmUploadInput
  ): Promise<Result<ConfirmUploadOutput>> {
    // 1. Find video record
    const video = await this.deps.videoRepository.findById(input.videoId);

    if (!video) {
      return failure(ErrorCodes.NOT_FOUND, 'Video not found');
    }

    // 2. Check video is in uploading status
    if (video.status !== VideoStatus.UPLOADING) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        `Cannot confirm upload. Video is already in '${video.status}' status`
      );
    }

    // 3. Verify file exists in storage
    const rawFilePath = video.toJSON().rawFilePath;
    if (!rawFilePath) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Video raw file path not found'
      );
    }

    // Parse bucket and key from rawFilePath (format: "bucket/key")
    const [bucket, ...keyParts] = rawFilePath.split('/');
    const key = keyParts.join('/');

    const fileExists = await this.deps.storageService.objectExists({
      bucket,
      key,
    });

    if (!fileExists) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Video file not found in storage. Please upload the file first.'
      );
    }

    // 4. Update video status to processing
    video.startProcessing();
    const videoData = video.toJSON();

    // Update uploadedAt timestamp
    const updatedVideo = {
      ...videoData,
      uploadedAt: new Date(),
    };

    // Create a new entity with updated data for saving
    const { VideoEntity } = await import('@blog/shared/domain');
    const videoToSave = new VideoEntity(updatedVideo);
    await this.deps.videoRepository.save(videoToSave);

    // 5. Queue video for processing
    const jobId = await this.deps.queueVideoForProcessing(
      input.videoId,
      rawFilePath
    );

    // 6. Return result
    return success({
      videoId: input.videoId,
      status: VideoStatus.PROCESSING,
      message: `Video queued for processing. Job ID: ${jobId}`,
    });
  }
}
