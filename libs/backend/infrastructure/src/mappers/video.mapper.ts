/**
 * Video Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { VideoRow, NewVideo, VideoUpdate } from '../database/types.js';
import { VideoEntity, type Video } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseVideoRow {
  id: string;
  postId: string | null;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  status: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  originalCodec: string | null;
  originalBitrate: number | null;
  rawFilePath: string | null;
  hlsMasterUrl: string | null;
  thumbnailUrl: string | null;
  availableQualities: Record<string, unknown>[];
  retryCount: number;
  errorMessage: string | null;
  uploadedAt: Date | null;
  processingCompletedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

/**
 * Map database row to domain entity
 */
export function toDomainVideo(row: VideoRow): VideoEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseVideoRow;

  const video: Video = {
    id: camelRow.id,
    postId: camelRow.postId ?? null,
    originalFilename: camelRow.originalFilename,
    fileSize: camelRow.fileSize,
    mimeType: camelRow.mimeType,
    status: camelRow.status as
      | 'uploading'
      | 'uploaded'
      | 'processing'
      | 'ready'
      | 'partial_ready'
      | 'failed'
      | 'cancelled',
    duration: camelRow.duration ?? null,
    width: camelRow.width ?? null,
    height: camelRow.height ?? null,
    originalCodec: camelRow.originalCodec ?? null,
    originalBitrate: camelRow.originalBitrate ?? null,
    rawFilePath: camelRow.rawFilePath ?? null,
    hlsMasterUrl: camelRow.hlsMasterUrl ?? null,
    thumbnailUrl: camelRow.thumbnailUrl ?? null,
    availableQualities: (camelRow.availableQualities ?? []) as unknown as (
      | '1080p'
      | '720p'
      | '480p'
      | '360p'
    )[],
    retryCount: camelRow.retryCount,
    errorMessage: camelRow.errorMessage ?? null,
    uploadedAt: camelRow.uploadedAt ?? null,
    processingCompletedAt: camelRow.processingCompletedAt ?? null,
    createdAt: camelRow.createdAt,
    deletedAt: camelRow.deletedAt ?? null,
  };

  return new VideoEntity(video);
}

/**
 * Map domain entity to database insert row
 */
export function toNewVideoRow(entity: VideoEntity): NewVideo {
  const data = entity.toJSON();
  return {
    id: data.id,
    post_id: data.postId,
    original_filename: data.originalFilename,
    file_size: data.fileSize,
    mime_type: data.mimeType,
    status: data.status,
    duration: data.duration,
    width: data.width,
    height: data.height,
    original_codec: data.originalCodec,
    original_bitrate: data.originalBitrate,
    raw_file_path: data.rawFilePath,
    hls_master_url: data.hlsMasterUrl,
    thumbnail_url: data.thumbnailUrl,
    available_qualities: data.availableQualities as unknown as Record<
      string,
      unknown
    >[],
    retry_count: data.retryCount,
    error_message: data.errorMessage,
    uploaded_at: data.uploadedAt,
    processing_completed_at: data.processingCompletedAt,
    created_at: data.createdAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toVideoUpdateRow(entity: VideoEntity): VideoUpdate {
  const data = entity.toJSON();
  return {
    post_id: data.postId,
    status: data.status,
    duration: data.duration,
    width: data.width,
    height: data.height,
    original_codec: data.originalCodec,
    original_bitrate: data.originalBitrate,
    raw_file_path: data.rawFilePath,
    hls_master_url: data.hlsMasterUrl,
    thumbnail_url: data.thumbnailUrl,
    available_qualities: data.availableQualities as unknown as Record<
      string,
      unknown
    >[],
    retry_count: data.retryCount,
    error_message: data.errorMessage,
    uploaded_at: data.uploadedAt,
    processing_completed_at: data.processingCompletedAt,
  };
}
