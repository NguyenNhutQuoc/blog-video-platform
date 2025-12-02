/**
 * PostgreSQL Post Repository
 *
 * Implementation of IPostRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  IPostRepository,
  PostQueryOptions,
  PostFeedOptions,
  PostSearchOptions,
  TrendingOptions,
} from '@blog/backend/core';
import { PostEntity } from '@blog/shared/domain';
import {
  toDomainPost,
  toNewPostRow,
  toPostUpdateRow,
} from '../mappers/post.mapper.js';

export class PostgresPostRepository implements IPostRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<PostEntity | null> {
    const row = await this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.id', '=', id)
      .where('posts.deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainPost(row) : null;
  }

  async findBySlug(slug: string): Promise<PostEntity | null> {
    const row = await this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.slug', '=', slug)
      .where('posts.deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainPost(row) : null;
  }

  async findByAuthorId(
    authorId: string,
    options?: PostQueryOptions
  ): Promise<PostEntity[]> {
    let query = this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.author_id', '=', authorId);

    if (!options?.includeDeleted) {
      query = query.where('deleted_at', 'is', null);
    }

    if (options?.status) {
      const statuses = Array.isArray(options.status)
        ? options.status
        : [options.status];
      query = query.where('status', 'in', statuses);
    }

    if (options?.visibility) {
      const visibilities = Array.isArray(options.visibility)
        ? options.visibility
        : [options.visibility];
      query = query.where('visibility', 'in', visibilities);
    }

    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'desc';
    const columnMap = {
      createdAt: 'posts.created_at',
      updatedAt: 'posts.updated_at',
      publishedAt: 'posts.published_at',
      viewCount: 'posts.view_count',
      likeCount: 'posts.like_count',
    } as const;
    const column =
      columnMap[orderBy as keyof typeof columnMap] ?? 'posts.created_at';
    query = query.orderBy((eb) => eb.ref(column), orderDir);

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return rows.map(toDomainPost);
  }

  async findPublished(options?: PostFeedOptions): Promise<PostEntity[]> {
    let query = this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.status', '=', 'published')
      .where('posts.visibility', '=', 'public')
      .where('posts.deleted_at', 'is', null);

    const orderBy = options?.orderBy ?? 'publishedAt';
    const orderDir = options?.orderDir ?? 'desc';
    const columnMap = {
      publishedAt: 'posts.published_at',
      viewCount: 'posts.view_count',
      likeCount: 'posts.like_count',
    } as const;
    const column =
      columnMap[orderBy as keyof typeof columnMap] ?? 'posts.published_at';
    query = query.orderBy((eb) => eb.ref(column), orderDir);

    if (options?.cursor) {
      // Cursor-based pagination
      query = query.where('id', '<', options.cursor);
    }

    query = query.limit(options?.limit ?? 20);

    const rows = await query.execute();
    console.log('findPublished retrieved rows:', rows);
    return rows.map(toDomainPost);
  }

  async save(post: PostEntity): Promise<void> {
    const existingPost = await this.db
      .selectFrom('posts')
      .select('id')
      .where('id', '=', post.id)
      .executeTakeFirst();

    if (existingPost) {
      // Update
      await this.db
        .updateTable('posts')
        .set(toPostUpdateRow(post))
        .where('id', '=', post.id)
        .execute();
    } else {
      // Insert
      await this.db.insertInto('posts').values(toNewPostRow(post)).execute();
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .updateTable('posts')
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.db
      .selectFrom('posts')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('slug', '=', slug)
      .where('deleted_at', 'is', null);

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const result = await query.executeTakeFirst();
    return (result?.count ?? 0) > 0;
  }

  async searchFullText(
    query: string,
    options?: PostSearchOptions
  ): Promise<PostEntity[]> {
    // Use PostgreSQL full-text search
    let dbQuery = this.db
      .selectFrom('posts')
      .selectAll()
      .where('status', '=', options?.status ?? 'published')
      .where('deleted_at', 'is', null);

    // Simple ILIKE search for now (can be upgraded to ts_vector)
    dbQuery = dbQuery.where((eb) =>
      eb.or([
        eb('title', 'ilike', `%${query}%`),
        eb('content', 'ilike', `%${query}%`),
      ])
    );

    dbQuery = dbQuery
      .orderBy('published_at', 'desc')
      .limit(options?.limit ?? 20);

    if (options?.offset) {
      dbQuery = dbQuery.offset(options.offset);
    }

    const rows = await dbQuery.execute();
    return rows.map(toDomainPost);
  }

  async searchSemantic(
    _embedding: number[],
    options?: PostSearchOptions
  ): Promise<PostEntity[]> {
    // Vector similarity search using pgvector
    // For now, fall back to regular search since embedding requires raw SQL
    // TODO: Implement proper vector search with Kysely raw SQL
    return this.findPublished({ limit: options?.limit ?? 20 });
  }

  async findByCategory(
    categoryId: string,
    options?: PostFeedOptions
  ): Promise<PostEntity[]> {
    let query = this.db
      .selectFrom('posts')
      .innerJoin('post_categories', 'posts.id', 'post_categories.post_id')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('post_categories.category_id', '=', categoryId)
      .where('posts.status', '=', 'published')
      .where('posts.visibility', '=', 'public')
      .where('posts.deleted_at', 'is', null);

    query = query.orderBy('posts.published_at', options?.orderDir ?? 'desc');
    query = query.limit(options?.limit ?? 20);

    if (options?.cursor) {
      query = query.where('posts.id', '<', options.cursor);
    }

    const rows = await query.execute();
    return rows.map(toDomainPost);
  }

  async findByTag(
    tagId: string,
    options?: PostFeedOptions
  ): Promise<PostEntity[]> {
    let query = this.db
      .selectFrom('posts')
      .innerJoin('post_tags', 'posts.id', 'post_tags.post_id')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('post_tags.tag_id', '=', tagId)
      .where('posts.status', '=', 'published')
      .where('posts.visibility', '=', 'public')
      .where('posts.deleted_at', 'is', null);

    query = query.orderBy('posts.published_at', options?.orderDir ?? 'desc');
    query = query.limit(options?.limit ?? 20);

    if (options?.cursor) {
      query = query.where('posts.id', '<', options.cursor);
    }

    const rows = await query.execute();
    return rows.map(toDomainPost);
  }

  async findRelated(postId: string, limit = 5): Promise<PostEntity[]> {
    // Find posts with overlapping categories/tags
    const post = await this.findById(postId);
    if (!post) return [];

    // Simple related posts: same author, excluding current post
    const rows = await this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.author_id', '=', post.authorId)
      .where('posts.id', '!=', postId)
      .where('posts.status', '=', 'published')
      .where('posts.visibility', '=', 'public')
      .where('posts.deleted_at', 'is', null)
      .orderBy('posts.published_at', 'desc')
      .limit(limit)
      .execute();

    return rows.map(toDomainPost);
  }

  async countByStatus(status: string): Promise<number> {
    const result = await this.db
      .selectFrom('posts')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('status', '=', status)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countByAuthor(authorId: string): Promise<number> {
    const result = await this.db
      .selectFrom('posts')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('author_id', '=', authorId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async findTrending(options?: TrendingOptions): Promise<PostEntity[]> {
    let query = this.db
      .selectFrom('posts')
      .leftJoin('videos', 'posts.video_id', 'videos.id')
      .selectAll('posts')
      .select([
        'videos.id as joined_video_id',
        'videos.status as video_status',
        'videos.hls_master_url as video_hls_url',
        'videos.thumbnail_url as video_thumbnail_url',
        'videos.duration as video_duration',
        'videos.width as video_width',
        'videos.height as video_height',
      ])
      .where('posts.status', '=', 'published')
      .where('posts.visibility', '=', 'public')
      .where('posts.deleted_at', 'is', null);

    // Filter by period
    if (options?.period && options.period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (options.period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.where('published_at', '>=', startDate);
    }

    // Order by engagement (views + likes)
    query = query
      .orderBy('view_count', 'desc')
      .orderBy('like_count', 'desc')
      .limit(options?.limit ?? 10);

    const rows = await query.execute();
    return rows.map(toDomainPost);
  }
}

/**
 * Create a PostgresPostRepository instance
 */
export function createPostRepository(db: Kysely<Database>): IPostRepository {
  return new PostgresPostRepository(db);
}
