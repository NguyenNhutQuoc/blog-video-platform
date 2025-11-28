/**
 * Video Test Fixtures
 *
 * Factory functions for creating test video entities.
 */

import { VideoEntity, VideoStatus, VideoQuality } from '@blog/shared/domain';
import type { Video } from '@blog/shared/domain';

let videoCounter = 0;

/**
 * Options for creating a test video
 */
export interface CreateTestVideoOptions {
  postId?: string | null;
  originalFilename?: string;
  fileSize?: number;
  mimeType?: string;
  status?: 'uploading' | 'processing' | 'ready' | 'failed' | 'cancelled';
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  retryCount?: number;
  errorMessage?: string | null;
}

/**
 * Create a test video entity with optional overrides
 */
export function createTestVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  videoCounter++;
  const uniqueSuffix = `${Date.now()}_${videoCounter}`;
  const now = new Date();

  const video: Video = {
    id: crypto.randomUUID(),
    postId: options.postId ?? null,
    originalFilename:
      options.originalFilename ?? `test-video-${uniqueSuffix}.mp4`,
    fileSize: options.fileSize ?? 10485760, // 10 MB
    mimeType: options.mimeType ?? 'video/mp4',
    status: options.status ?? VideoStatus.UPLOADING,
    duration: options.duration ?? null,
    width: options.width ?? null,
    height: options.height ?? null,
    originalCodec: null,
    originalBitrate: null,
    rawFilePath: null,
    hlsMasterUrl: null,
    thumbnailUrl: null,
    availableQualities: [],
    retryCount: options.retryCount ?? 0,
    errorMessage: options.errorMessage ?? null,
    uploadedAt: null,
    processingCompletedAt: null,
    createdAt: now,
  };

  return new VideoEntity(video);
}

/**
 * Create a video in uploading status
 */
export function createTestUploadingVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  return createTestVideo({
    ...options,
    status: VideoStatus.UPLOADING,
  });
}

/**
 * Create a video in processing status
 */
export function createTestProcessingVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  return createTestVideo({
    ...options,
    status: VideoStatus.PROCESSING,
  });
}

/**
 * Create a ready video with all metadata
 */
export function createTestReadyVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  videoCounter++;
  const uniqueSuffix = `${Date.now()}_${videoCounter}`;
  const now = new Date();

  const video: Video = {
    id: crypto.randomUUID(),
    postId: options.postId ?? null,
    originalFilename:
      options.originalFilename ?? `test-video-${uniqueSuffix}.mp4`,
    fileSize: options.fileSize ?? 10485760,
    mimeType: options.mimeType ?? 'video/mp4',
    status: VideoStatus.READY,
    duration: options.duration ?? 120, // 2 minutes
    width: options.width ?? 1920,
    height: options.height ?? 1080,
    originalCodec: 'h264',
    originalBitrate: 5000000,
    rawFilePath: `/raw/test-video-${uniqueSuffix}.mp4`,
    hlsMasterUrl: `https://cdn.example.com/videos/${uniqueSuffix}/master.m3u8`,
    thumbnailUrl: `https://cdn.example.com/videos/${uniqueSuffix}/thumbnail.jpg`,
    availableQualities: [
      VideoQuality.Q1080P,
      VideoQuality.Q720P,
      VideoQuality.Q480P,
    ],
    retryCount: 0,
    errorMessage: null,
    uploadedAt: now,
    processingCompletedAt: now,
    createdAt: now,
  };

  return new VideoEntity(video);
}

/**
 * Create a failed video
 */
export function createTestFailedVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  return createTestVideo({
    ...options,
    status: VideoStatus.FAILED,
    retryCount: options.retryCount ?? 3,
    errorMessage:
      options.errorMessage ?? 'Processing failed: codec not supported',
  });
}

/**
 * Create a cancelled video
 */
export function createTestCancelledVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  return createTestVideo({
    ...options,
    status: VideoStatus.CANCELLED,
  });
}

/**
 * Create a video that can be retried (failed but under max retries)
 */
export function createTestRetryableVideo(
  options: CreateTestVideoOptions = {}
): VideoEntity {
  return createTestVideo({
    ...options,
    status: VideoStatus.FAILED,
    retryCount: options.retryCount ?? 1,
    errorMessage: options.errorMessage ?? 'Temporary error',
  });
}

/**
 * Create multiple test videos
 */
export function createTestVideos(
  count: number,
  options: CreateTestVideoOptions = {}
): VideoEntity[] {
  return Array.from({ length: count }, () => createTestVideo(options));
}

/**
 * Reset video counter
 */
export function resetVideoCounter(): void {
  videoCounter = 0;
}
