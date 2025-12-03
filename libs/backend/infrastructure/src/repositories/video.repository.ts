/**
 * PostgreSQL Video Repository
 *
 * Implementation of IVideoRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  IVideoRepository,
  VideoQueryOptions,
  VideoUpdateData,
} from '@blog/backend/core';
import { VideoEntity } from '@blog/shared/domain';
import {
  toDomainVideo,
  toNewVideoRow,
  toVideoUpdateRow,
} from '../mappers/video.mapper.js';

export class PostgresVideoRepository implements IVideoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<VideoEntity | null> {
    const row = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainVideo(row) : null;
  }

  async findByIdIncludeDeleted(id: string): Promise<VideoEntity | null> {
    const row = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainVideo(row) : null;
  }

  async findByFilename(filename: string): Promise<VideoEntity | null> {
    const row = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('original_filename', '=', filename)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainVideo(row) : null;
  }

  async findByUploaderId(
    uploaderId: string,
    options?: VideoQueryOptions
  ): Promise<VideoEntity[]> {
    // Note: Videos don't have direct uploader_id, they're linked via posts
    // For now, find videos linked to posts by the author
    let query = this.db
      .selectFrom('videos')
      .innerJoin('posts', 'videos.post_id', 'posts.id')
      .selectAll('videos')
      .where('posts.author_id', '=', uploaderId)
      .where('videos.deleted_at', 'is', null);

    if (options?.status) {
      const statuses = Array.isArray(options.status)
        ? options.status
        : [options.status];
      query = query.where('videos.status', 'in', statuses);
    }

    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'desc';
    const columnMap: Record<string, string> = {
      createdAt: 'videos.created_at',
      duration: 'videos.duration',
    };
    query = query.orderBy(
      (columnMap[orderBy] ?? 'videos.created_at') as 'videos.created_at',
      orderDir
    );

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return rows.map(toDomainVideo);
  }

  async findByStatus(
    status: string,
    options?: VideoQueryOptions
  ): Promise<VideoEntity[]> {
    let query = this.db
      .selectFrom('videos')
      .selectAll()
      .where('status', '=', status)
      .where('deleted_at', 'is', null);

    const orderDir = options?.orderDir ?? 'desc';
    query = query.orderBy('created_at', orderDir);

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return rows.map(toDomainVideo);
  }

  async findPendingProcessing(limit = 10): Promise<VideoEntity[]> {
    const rows = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('status', 'in', ['uploading', 'processing'])
      .where('retry_count', '<', 3)
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'asc')
      .limit(limit)
      .execute();

    return rows.map(toDomainVideo);
  }

  async findFailedForRetry(maxRetries = 3): Promise<VideoEntity[]> {
    const rows = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('status', '=', 'failed')
      .where('retry_count', '<', maxRetries)
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map(toDomainVideo);
  }

  async save(video: VideoEntity): Promise<void> {
    const existingVideo = await this.db
      .selectFrom('videos')
      .select('id')
      .where('id', '=', video.id)
      .executeTakeFirst();

    if (existingVideo) {
      // Update
      await this.db
        .updateTable('videos')
        .set(toVideoUpdateRow(video))
        .where('id', '=', video.id)
        .execute();
    } else {
      // Insert
      await this.db.insertInto('videos').values(toNewVideoRow(video)).execute();
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('videos').where('id', '=', id).execute();
  }

  async update(id: string, updates: Partial<VideoUpdateData>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.hlsUrl !== undefined) {
      updateData.hls_master_url = updates.hlsUrl;
    }
    if (updates.thumbnailUrl !== undefined) {
      updateData.thumbnail_url = updates.thumbnailUrl;
    }
    if (updates.duration !== undefined) {
      updateData.duration = updates.duration;
    }
    if (updates.width !== undefined) {
      updateData.width = updates.width;
    }
    if (updates.height !== undefined) {
      updateData.height = updates.height;
    }
    if (updates.processedAt !== undefined) {
      updateData.processing_completed_at = updates.processedAt;
    }
    if (updates.error !== undefined) {
      updateData.error_message = updates.error;
    }

    await this.db
      .updateTable('videos')
      .set(updateData)
      .where('id', '=', id)
      .execute();
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db
      .updateTable('videos')
      .set({ status })
      .where('id', '=', id)
      .execute();
  }

  async countByStatus(status: string): Promise<number> {
    const result = await this.db
      .selectFrom('videos')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('status', '=', status)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countByUploader(uploaderId: string): Promise<number> {
    const result = await this.db
      .selectFrom('videos')
      .innerJoin('posts', 'videos.post_id', 'posts.id')
      .select(this.db.fn.count<number>('videos.id').as('count'))
      .where('posts.author_id', '=', uploaderId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async findForCleanup(olderThan: Date): Promise<VideoEntity[]> {
    const rows = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('status', '=', 'ready')
      .where('raw_file_path', 'is not', null)
      .where('processing_completed_at', '<', olderThan)
      .execute();

    return rows.map(toDomainVideo);
  }

  async getTotalStorageByUser(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('videos')
      .innerJoin('posts', 'videos.post_id', 'posts.id')
      .select(this.db.fn.sum<number>('videos.file_size').as('total'))
      .where('posts.author_id', '=', userId)
      .where('videos.deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.total ?? 0;
  }

  // =====================================================
  // SOFT DELETE METHODS
  // =====================================================

  async softDelete(id: string): Promise<void> {
    await this.db
      .updateTable('videos')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async restore(id: string): Promise<void> {
    await this.db
      .updateTable('videos')
      .set({ deleted_at: null })
      .where('id', '=', id)
      .execute();
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.deleteFrom('videos').where('id', '=', id).execute();
  }

  async hasAssociatedPost(id: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('posts')
      .select('id')
      .where('video_id', '=', id)
      .executeTakeFirst();

    return !!result;
  }

  async findOrphanVideos(olderThanHours: number): Promise<VideoEntity[]> {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const rows = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('deleted_at', 'is', null)
      .where('created_at', '<', cutoffDate)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('posts')
              .select('posts.id')
              .whereRef('posts.video_id', '=', 'videos.id')
          )
        )
      )
      .execute();

    return rows.map(toDomainVideo);
  }

  async findDeletedByUserId(userId: string): Promise<VideoEntity[]> {
    // Find deleted videos that belong to user's posts
    const rows = await this.db
      .selectFrom('videos')
      .innerJoin('posts', 'videos.post_id', 'posts.id')
      .selectAll('videos')
      .where('posts.author_id', '=', userId)
      .where('videos.deleted_at', 'is not', null)
      .orderBy('videos.deleted_at', 'desc')
      .execute();

    return rows.map(toDomainVideo);
  }

  async findDeletedOlderThan(days: number): Promise<VideoEntity[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.db
      .selectFrom('videos')
      .selectAll()
      .where('deleted_at', 'is not', null)
      .where('deleted_at', '<', cutoffDate)
      .execute();

    return rows.map(toDomainVideo);
  }
}

/**
 * Create a PostgresVideoRepository instance
 */
export function createVideoRepository(db: Kysely<Database>): IVideoRepository {
  return new PostgresVideoRepository(db);
}
