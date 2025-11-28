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
  const video: Video = {
    id: row.id,
    postId: row.post_id ?? null,
    originalFilename: row.original_filename,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    status: row.status as
      | 'uploading'
      | 'processing'
      | 'ready'
      | 'failed'
      | 'cancelled',
    duration: row.duration ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    originalCodec: row.original_codec ?? null,
    originalBitrate: row.original_bitrate ?? null,
    rawFilePath: row.raw_file_path ?? null,
    hlsMasterUrl: row.hls_master_url ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    availableQualities: (row.available_qualities ?? []) as unknown as (
      | '1080p'
      | '720p'
      | '480p'
      | '360p'
    )[],
    retryCount: row.retry_count,
    errorMessage: row.error_message ?? null,
    uploadedAt: row.uploaded_at ?? null,
    processingCompletedAt: row.processing_completed_at ?? null,
    createdAt: row.created_at,
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
