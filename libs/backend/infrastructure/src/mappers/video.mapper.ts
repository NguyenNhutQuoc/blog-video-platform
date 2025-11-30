/**
 * Video Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { VideoRow, NewVideo, VideoUpdate } from '../database/types.js';
import { VideoEntity, type Video } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainVideo(row: VideoRow): VideoEntity {
  // CamelCasePlugin converts DB columns to camelCase
  const video: Video = {
    id: row.id,
    postId: row.postId ?? null,
    originalFilename: row.originalFilename,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    status: row.status as
      | 'uploading'
      | 'processing'
      | 'ready'
      | 'failed'
      | 'cancelled',
    duration: row.duration ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    originalCodec: row.originalCodec ?? null,
    originalBitrate: row.originalBitrate ?? null,
    rawFilePath: row.rawFilePath ?? null,
    hlsMasterUrl: row.hlsMasterUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    availableQualities: (row.availableQualities ?? []) as unknown as (
      | '1080p'
      | '720p'
      | '480p'
      | '360p'
    )[],
    retryCount: row.retryCount,
    errorMessage: row.errorMessage ?? null,
    uploadedAt: row.uploadedAt ?? null,
    processingCompletedAt: row.processingCompletedAt ?? null,
    createdAt: row.createdAt,
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
