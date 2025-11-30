/**
 * Post Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { PostRow, NewPost, PostUpdate } from '../database/types.js';
import { PostEntity, type Post } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainPost(row: PostRow): PostEntity {
  // CamelCasePlugin converts DB columns to camelCase
  const post: Post = {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt ?? null,
    featuredImageUrl: row.featuredImageUrl ?? null,
    videoId: row.videoId ?? null,
    status: row.status as 'draft' | 'published' | 'archived',
    visibility: row.visibility as 'public' | 'private' | 'unlisted',
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    bookmarkCount: row.bookmarkCount,
    embedding: row.embedding ?? null,
    publishedAt: row.publishedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
  };

  return new PostEntity(post);
}

/**
 * Map domain entity to database insert row
 */
export function toNewPostRow(entity: PostEntity): NewPost {
  const data = entity.toJSON();
  return {
    id: data.id,
    author_id: data.authorId,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt,
    featured_image_url: data.featuredImageUrl,
    video_id: data.videoId,
    status: data.status,
    visibility: data.visibility,
    view_count: data.viewCount,
    like_count: data.likeCount,
    comment_count: data.commentCount,
    bookmark_count: data.bookmarkCount,
    embedding: data.embedding,
    published_at: data.publishedAt,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
    deleted_at: data.deletedAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toPostUpdateRow(entity: PostEntity): PostUpdate {
  const data = entity.toJSON();
  return {
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt,
    featured_image_url: data.featuredImageUrl,
    video_id: data.videoId,
    status: data.status,
    visibility: data.visibility,
    view_count: data.viewCount,
    like_count: data.likeCount,
    comment_count: data.commentCount,
    bookmark_count: data.bookmarkCount,
    embedding: data.embedding,
    published_at: data.publishedAt,
    updated_at: new Date(),
    deleted_at: data.deletedAt,
  };
}
