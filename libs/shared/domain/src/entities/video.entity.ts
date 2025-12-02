import { z } from 'zod';

/**
 * Video Entity - Video file with encoding status
 */

// =====================================================
// ENUMS
// =====================================================

export const VideoStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  PARTIAL_READY: 'partial_ready',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const VideoQuality = {
  Q1080P: '1080p',
  Q720P: '720p',
  Q480P: '480p',
  Q360P: '360p',
} as const;

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Video Status validation
 */
const VideoStatusSchema = z.enum([
  VideoStatus.UPLOADING,
  VideoStatus.PROCESSING,
  VideoStatus.READY,
  VideoStatus.PARTIAL_READY,
  VideoStatus.FAILED,
  VideoStatus.CANCELLED,
]);

/**
 * Available qualities (JSON array)
 */
const AvailableQualitiesSchema = z
  .array(
    z.enum([
      VideoQuality.Q1080P,
      VideoQuality.Q720P,
      VideoQuality.Q480P,
      VideoQuality.Q360P,
    ])
  )
  .default([]);

/**
 * File size validation: Max 2GB (BR-02)
 */
const FileSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(2147483648, 'File size must not exceed 2GB');

/**
 * Duration validation: Max 30 minutes (BR-02)
 */
const DurationSchema = z
  .number()
  .int()
  .min(1)
  .max(1800, 'Video duration must not exceed 30 minutes')
  .nullable()
  .default(null);

/**
 * Retry count: Max 3 attempts (BR-04)
 */
const RetryCountSchema = z.number().int().min(0).max(3).default(0);

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const VideoSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid().nullable().default(null),
  originalFilename: z.string().max(255),
  fileSize: FileSizeSchema,
  mimeType: z.string().max(50),
  status: VideoStatusSchema.default(VideoStatus.UPLOADING),
  duration: DurationSchema,
  width: z.number().int().min(1).nullable().default(null),
  height: z.number().int().min(1).nullable().default(null),
  originalCodec: z.string().max(50).nullable().default(null),
  originalBitrate: z.number().int().nullable().default(null),
  rawFilePath: z.string().max(500).nullable().default(null),
  hlsMasterUrl: z.string().max(500).nullable().default(null),
  thumbnailUrl: z.string().max(500).nullable().default(null),
  availableQualities: AvailableQualitiesSchema,
  retryCount: RetryCountSchema,
  errorMessage: z.string().nullable().default(null),
  uploadedAt: z.date().nullable().default(null),
  processingCompletedAt: z.date().nullable().default(null),
  createdAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

/**
 * Request Upload URL DTO
 */
export const RequestUploadUrlDtoSchema = z.object({
  filename: z.string().max(255),
  fileSize: FileSizeSchema,
  mimeType: z
    .string()
    .refine(
      (type) =>
        [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
        ].includes(type),
      'Invalid video format. Allowed: MP4, MOV, AVI, MKV'
    ),
});

/**
 * Upload URL Response DTO
 */
export const UploadUrlResponseDtoSchema = z.object({
  videoId: z.string().uuid(),
  uploadUrl: z.string().url(),
  expiresAt: z.date(),
});

/**
 * Confirm Upload DTO
 */
export const ConfirmUploadDtoSchema = z.object({
  videoId: z.string().uuid(),
});

/**
 * Video Status Response DTO
 */
export const VideoStatusResponseDtoSchema = z.object({
  id: z.string().uuid(),
  status: VideoStatusSchema,
  progress: z.number().min(0).max(100).nullable(), // Encoding progress %
  duration: DurationSchema,
  thumbnailUrl: z.string().url().nullable(),
  hlsMasterUrl: z.string().url().nullable(),
  availableQualities: AvailableQualitiesSchema,
  errorMessage: z.string().nullable(),
});

/**
 * Video Response DTO (full details)
 */
export const VideoResponseDtoSchema = VideoSchema.omit({
  rawFilePath: true,
  errorMessage: true,
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Video = z.infer<typeof VideoSchema>;
export type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlDtoSchema>;
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseDtoSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadDtoSchema>;
export type VideoStatusResponseDto = z.infer<
  typeof VideoStatusResponseDtoSchema
>;
export type VideoResponseDto = z.infer<typeof VideoResponseDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class VideoEntity {
  constructor(private readonly props: Video) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get status(): string {
    return this.props.status;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get isReady(): boolean {
    return this.props.status === VideoStatus.READY;
  }

  get isFailed(): boolean {
    return this.props.status === VideoStatus.FAILED;
  }

  // Business Rules

  /**
   * BR-04: Video only shows when status = 'ready'
   */
  canBeDisplayed(): boolean {
    return this.props.status === VideoStatus.READY;
  }

  /**
   * BR-04: Check if can retry encoding
   */
  canRetry(): boolean {
    return this.props.retryCount < 3;
  }

  /**
   * Mark as processing
   */
  startProcessing(): void {
    this.props.status = VideoStatus.PROCESSING;
  }

  /**
   * Mark as ready (after successful encoding)
   */
  markAsReady(
    hlsMasterUrl: string,
    thumbnailUrl: string,
    qualities: string[]
  ): void {
    this.props.status = VideoStatus.READY;
    this.props.hlsMasterUrl = hlsMasterUrl;
    this.props.thumbnailUrl = thumbnailUrl;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.props.availableQualities = qualities as any;
    this.props.processingCompletedAt = new Date();
  }

  /**
   * Mark as failed
   * BR-04: If retry_count >= 3, status = 'failed' permanently
   */
  markAsFailed(errorMessage: string): void {
    this.props.retryCount += 1;

    if (this.props.retryCount >= 3) {
      this.props.status = VideoStatus.FAILED;
      this.props.errorMessage = errorMessage;
    } else {
      // Can retry
      this.props.errorMessage = errorMessage;
    }
  }

  /**
   * Cancel upload/processing
   */
  cancel(): void {
    this.props.status = VideoStatus.CANCELLED;
  }

  /**
   * BR-04: Check if raw file should be deleted (after successful encoding)
   */
  shouldDeleteRawFile(): boolean {
    return (
      this.props.status === VideoStatus.READY && this.props.rawFilePath !== null
    );
  }

  /**
   * Delete raw file path (after cleanup)
   */
  clearRawFilePath(): void {
    this.props.rawFilePath = null;
  }

  /**
   * Get encoding progress (estimated based on status)
   */
  getProgress(): number {
    switch (this.props.status) {
      case VideoStatus.UPLOADING:
        return 0;
      case VideoStatus.PROCESSING:
        return 50; // Could be more sophisticated with actual FFmpeg progress
      case VideoStatus.READY:
        return 100;
      case VideoStatus.FAILED:
      case VideoStatus.CANCELLED:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Convert to status DTO (for polling)
   */
  toStatusDto(): VideoStatusResponseDto {
    return {
      id: this.props.id,
      status: this.props.status,
      progress: this.getProgress(),
      duration: this.props.duration,
      thumbnailUrl: this.props.thumbnailUrl,
      hlsMasterUrl: this.props.hlsMasterUrl,
      availableQualities: this.props.availableQualities,
      errorMessage: this.props.errorMessage,
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Video {
    return { ...this.props };
  }
}
