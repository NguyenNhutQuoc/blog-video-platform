/**
 * Video Quality Repository Implementation
 *
 * Adapter for managing video quality records in PostgreSQL
 */

import { Pool } from 'pg';
import {
  VideoQuality,
  CreateVideoQualityInput,
  UpdateVideoQualityInput,
  VideoQualityStatus,
} from '@blog/backend/core';
import { IVideoQualityRepository } from '@blog/backend/core';

export class VideoQualityRepository implements IVideoQualityRepository {
  constructor(private pool: Pool) {}

  async create(input: CreateVideoQualityInput): Promise<VideoQuality> {
    const result = await this.pool.query<VideoQuality>(
      `INSERT INTO video_qualities 
       (video_id, quality_name, retry_priority, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        input.videoId,
        input.qualityName,
        input.retryPriority,
        input.status || VideoQualityStatus.PENDING,
      ]
    );
    return this.mapRow(result.rows[0]);
  }

  async createBatch(
    inputs: CreateVideoQualityInput[]
  ): Promise<VideoQuality[]> {
    if (inputs.length === 0) return [];

    const values = inputs
      .map(
        (_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      )
      .join(', ');

    const params = inputs.flatMap((input) => [
      input.videoId,
      input.qualityName,
      input.retryPriority,
      input.status || VideoQualityStatus.PENDING,
    ]);

    const result = await this.pool.query<VideoQuality>(
      `INSERT INTO video_qualities
       (video_id, quality_name, retry_priority, status)
       VALUES ${values}
       RETURNING *`,
      params
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async upsertBatch(
    inputs: CreateVideoQualityInput[]
  ): Promise<VideoQuality[]> {
    if (inputs.length === 0) return [];

    const values = inputs
      .map(
        (_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      )
      .join(', ');

    const params = inputs.flatMap((input) => [
      input.videoId,
      input.qualityName,
      input.retryPriority,
      input.status || VideoQualityStatus.PENDING,
    ]);

    const result = await this.pool.query<VideoQuality>(
      `INSERT INTO video_qualities
       (video_id, quality_name, retry_priority, status)
       VALUES ${values}
       ON CONFLICT (video_id, quality_name)
       DO UPDATE SET
         retry_priority = EXCLUDED.retry_priority,
         status = EXCLUDED.status,
         started_at = NULL,
         completed_at = NULL,
         error_message = NULL,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      params
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findByVideoAndQuality(
    videoId: string,
    qualityName: string
  ): Promise<VideoQuality | null> {
    const result = await this.pool.query<VideoQuality>(
      `SELECT * FROM video_qualities 
       WHERE video_id = $1 AND quality_name = $2`,
      [videoId, qualityName]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByVideoId(videoId: string): Promise<VideoQuality[]> {
    const result = await this.pool.query<VideoQuality>(
      `SELECT * FROM video_qualities 
       WHERE video_id = $1 
       ORDER BY retry_priority ASC`,
      [videoId]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async findByStatus(
    status: VideoQualityStatus,
    limit = 100
  ): Promise<VideoQuality[]> {
    const result = await this.pool.query<VideoQuality>(
      `SELECT * FROM video_qualities 
       WHERE status = $1 
       ORDER BY created_at ASC
       LIMIT $2`,
      [status, limit]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async findReadyForRetry(limit = 50): Promise<VideoQuality[]> {
    const result = await this.pool.query<VideoQuality>(
      `SELECT * FROM video_qualities 
       WHERE status = $1 AND retry_count < 3
       ORDER BY retry_priority ASC, created_at ASC
       LIMIT $2`,
      [VideoQualityStatus.FAILED, limit]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async update(
    videoId: string,
    qualityName: string,
    input: UpdateVideoQualityInput
  ): Promise<VideoQuality> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.hlsPlaylistPath !== undefined) {
      setClauses.push(`hls_playlist_path = $${paramIndex++}`);
      values.push(input.hlsPlaylistPath);
    }
    if (input.segmentsCount !== undefined) {
      setClauses.push(`segments_count = $${paramIndex++}`);
      values.push(input.segmentsCount);
    }
    if (input.retryCount !== undefined) {
      setClauses.push(`retry_count = $${paramIndex++}`);
      values.push(input.retryCount);
    }
    if (input.errorMessage !== undefined) {
      setClauses.push(`error_message = $${paramIndex++}`);
      values.push(input.errorMessage);
    }
    if (input.startedAt !== undefined) {
      setClauses.push(`started_at = $${paramIndex++}`);
      values.push(input.startedAt);
    }
    if (input.completedAt !== undefined) {
      setClauses.push(`completed_at = $${paramIndex++}`);
      values.push(input.completedAt);
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(videoId, qualityName);

    const result = await this.pool.query<VideoQuality>(
      `UPDATE video_qualities 
       SET ${setClauses.join(', ')}
       WHERE video_id = $${paramIndex++} AND quality_name = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Video quality not found: ${videoId}/${qualityName}`);
    }

    return this.mapRow(result.rows[0]);
  }

  async incrementRetryCount(
    videoId: string,
    qualityName: string
  ): Promise<VideoQuality> {
    const result = await this.pool.query<VideoQuality>(
      `UPDATE video_qualities 
       SET retry_count = retry_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE video_id = $1 AND quality_name = $2
       RETURNING *`,
      [videoId, qualityName]
    );

    if (result.rows.length === 0) {
      throw new Error(`Video quality not found: ${videoId}/${qualityName}`);
    }

    return this.mapRow(result.rows[0]);
  }

  async countReadyQualities(videoId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM video_qualities 
       WHERE video_id = $1 AND status = $2`,
      [videoId, VideoQualityStatus.READY]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async hasMinimumQualities(videoId: string, minCount = 2): Promise<boolean> {
    const result = await this.pool.query<{ result: boolean }>(
      `SELECT has_minimum_qualities($1, $2) as result`,
      [videoId, minCount]
    );
    return result.rows[0].result;
  }

  async deleteByVideoId(videoId: string): Promise<void> {
    await this.pool.query(`DELETE FROM video_qualities WHERE video_id = $1`, [
      videoId,
    ]);
  }

  private mapRow(row: any): VideoQuality {
    return {
      id: row.id,
      videoId: row.video_id,
      qualityName: row.quality_name,
      status: row.status as VideoQualityStatus,
      hlsPlaylistPath: row.hls_playlist_path,
      segmentsCount: row.segments_count || 0,
      retryCount: row.retry_count || 0,
      retryPriority: row.retry_priority,
      errorMessage: row.error_message,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

/**
 * Factory function to create VideoQualityRepository
 */
export function createVideoQualityRepository(
  pool: Pool
): IVideoQualityRepository {
  return new VideoQualityRepository(pool);
}
