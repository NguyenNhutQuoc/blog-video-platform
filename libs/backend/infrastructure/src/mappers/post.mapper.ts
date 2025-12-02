/**
 * Post Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { PostRow, NewPost, PostUpdate } from '../database/types.js';
import { PostEntity, type Post } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCasePostRow {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  videoId: string | null;
  // Video fields from LEFT JOIN
  joinedVideoId?: string | null;
  videoStatus?: string | null;
  videoHlsUrl?: string | null;
  videoThumbnailUrl?: string | null;
  videoDuration?: number | null;
  videoWidth?: number | null;
  videoHeight?: number | null;
  status: string;
  visibility: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  embedding: number[] | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Map database row to domain entity
 */
export function toDomainPost(row: PostRow): PostEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCasePostRow;

  // Build video object if video data exists
  const video = camelRow.joinedVideoId
    ? {
        id: camelRow.joinedVideoId,
        status: camelRow.videoStatus ?? 'unknown',
        hlsUrl: camelRow.videoHlsUrl ?? null,
        thumbnailUrl: camelRow.videoThumbnailUrl ?? null,
        duration: camelRow.videoDuration ?? null,
        width: camelRow.videoWidth ?? null,
        height: camelRow.videoHeight ?? null,
      }
    : null;

  const post: Post = {
    id: camelRow.id,
    authorId: camelRow.authorId,
    title: camelRow.title,
    slug: camelRow.slug,
    content: camelRow.content,
    excerpt: camelRow.excerpt ?? null,
    featuredImageUrl: camelRow.featuredImageUrl ?? null,
    videoId: camelRow.videoId ?? null,
    video,
    status: camelRow.status as 'draft' | 'published' | 'archived',
    visibility: camelRow.visibility as 'public' | 'private' | 'unlisted',
    viewCount: camelRow.viewCount,
    likeCount: camelRow.likeCount,
    commentCount: camelRow.commentCount,
    bookmarkCount: camelRow.bookmarkCount,
    embedding: camelRow.embedding ?? null,
    publishedAt: camelRow.publishedAt ?? null,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.updatedAt,
    deletedAt: camelRow.deletedAt ?? null,
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
    // Note: video object is not stored in posts table, it's joined from videos table
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
