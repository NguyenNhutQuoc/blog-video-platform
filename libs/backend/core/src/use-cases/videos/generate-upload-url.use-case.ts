/**
 * Generate Upload URL Use Case
 *
 * Generates a presigned URL for direct video upload to MinIO.
 * Creates a pending video record in the database.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VideoEntity,
  VideoStatus,
  RequestUploadUrlDtoSchema,
} from '@blog/shared/domain';
import type { IVideoRepository } from '../../ports/repositories/video.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IStorageService } from '../../ports/services/storage.service.interface.js';
import { StorageBuckets } from '../../ports/services/storage.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

/** Maximum file size: 2GB (BR-02) */
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

/** Presigned URL expiration: 1 hour */
const PRESIGNED_URL_EXPIRY = 3600;

/** Maximum videos per user (to prevent abuse) */
const MAX_VIDEOS_PER_USER = 50;

export interface GenerateUploadUrlInput {
  userId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

export interface GenerateUploadUrlOutput {
  videoId: string;
  uploadUrl: string;
  expiresAt: Date;
}

export interface GenerateUploadUrlDependencies {
  videoRepository: IVideoRepository;
  userRepository: IUserRepository;
  storageService: IStorageService;
}

export class GenerateUploadUrlUseCase {
  constructor(private readonly deps: GenerateUploadUrlDependencies) {}

  async execute(
    input: GenerateUploadUrlInput
  ): Promise<Result<GenerateUploadUrlOutput>> {
    // 1. Validate input with Zod schema
    const validation = RequestUploadUrlDtoSchema.safeParse({
      filename: input.filename,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    });

    if (!validation.success) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Invalid input', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 2. Check file size limit
    if (input.fileSize > MAX_FILE_SIZE) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'File size exceeds maximum limit of 2GB'
      );
    }

    // 3. Check user exists and is verified
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    if (!user.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'User account is inactive');
    }

    if (!user.emailVerified) {
      return failure(
        ErrorCodes.EMAIL_NOT_VERIFIED,
        'Email must be verified to upload videos'
      );
    }

    // 4. Check user hasn't exceeded video limit
    const videoCount = await this.deps.videoRepository.countByUploader(
      input.userId
    );
    if (videoCount >= MAX_VIDEOS_PER_USER) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        `Maximum video limit (${MAX_VIDEOS_PER_USER}) reached`
      );
    }

    // 5. Generate video ID and storage key
    const videoId = uuidv4();
    const fileExtension = this.getFileExtension(input.filename);
    const storageKey = `${videoId}${fileExtension}`;

    // 6. Generate presigned upload URL
    const { url, expiresAt } =
      await this.deps.storageService.generatePresignedUploadUrl({
        bucket: StorageBuckets.VIDEOS_RAW,
        key: storageKey,
        expiresIn: PRESIGNED_URL_EXPIRY,
        contentType: input.mimeType,
      });

    // 7. Create pending video record
    const video = new VideoEntity({
      id: videoId,
      postId: null,
      originalFilename: input.filename,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      status: VideoStatus.UPLOADING,
      duration: null,
      width: null,
      height: null,
      originalCodec: null,
      originalBitrate: null,
      rawFilePath: `${StorageBuckets.VIDEOS_RAW}/${storageKey}`,
      hlsMasterUrl: null,
      thumbnailUrl: null,
      availableQualities: [],
      retryCount: 0,
      errorMessage: null,
      uploadedAt: null,
      processingCompletedAt: null,
      createdAt: new Date(),
    });

    await this.deps.videoRepository.save(video);

    // 8. Return result
    return success({
      videoId,
      uploadUrl: url,
      expiresAt,
    });
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '.mp4';
  }
}
