import type { PostEntity } from '@blog/shared/domain';

/**
 * Post Repository Interface (Port)
 *
 * Defines the contract for post persistence operations.
 */
export interface IPostRepository {
  /**
   * Find post by ID
   */
  findById(id: string): Promise<PostEntity | null>;

  /**
   * Find post by slug
   */
  findBySlug(slug: string): Promise<PostEntity | null>;

  /**
   * Find posts by author ID
   */
  findByAuthorId(
    authorId: string,
    options?: PostQueryOptions
  ): Promise<PostEntity[]>;

  /**
   * Find published posts (for public feed)
   */
  findPublished(options?: PostFeedOptions): Promise<PostEntity[]>;

  /**
   * Save post (create or update)
   */
  save(post: PostEntity): Promise<void>;

  /**
   * Delete post (soft delete)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Full-text search posts
   */
  searchFullText(
    query: string,
    options?: PostSearchOptions
  ): Promise<PostEntity[]>;

  /**
   * Semantic search using embeddings
   */
  searchSemantic(
    embedding: number[],
    options?: PostSearchOptions
  ): Promise<PostEntity[]>;

  /**
   * Find posts by category
   */
  findByCategory(
    categoryId: string,
    options?: PostFeedOptions
  ): Promise<PostEntity[]>;

  /**
   * Find posts by tag
   */
  findByTag(tagId: string, options?: PostFeedOptions): Promise<PostEntity[]>;

  /**
   * Find related posts (by category/tag overlap or semantic similarity)
   */
  findRelated(postId: string, limit?: number): Promise<PostEntity[]>;

  /**
   * Count posts by status
   */
  countByStatus(status: string): Promise<number>;

  /**
   * Count posts by author
   */
  countByAuthor(authorId: string): Promise<number>;

  /**
   * Find trending posts (high view/like count)
   */
  findTrending(options?: TrendingOptions): Promise<PostEntity[]>;
}

/**
 * Post Query Options
 */
export interface PostQueryOptions {
  status?: string | string[];
  visibility?: string | string[];
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'publishedAt'
    | 'viewCount'
    | 'likeCount';
  orderDir?: 'asc' | 'desc';
}

/**
 * Post Feed Options (for paginated feeds)
 */
export interface PostFeedOptions {
  cursor?: string; // last post ID for cursor pagination
  limit?: number;
  orderBy?: 'publishedAt' | 'viewCount' | 'likeCount';
  orderDir?: 'asc' | 'desc';
}

/**
 * Post Search Options
 */
export interface PostSearchOptions {
  limit?: number;
  offset?: number;
  status?: string;
  minScore?: number; // minimum relevance score
}

/**
 * Trending Options
 */
export interface TrendingOptions {
  period?: 'day' | 'week' | 'month' | 'all';
  limit?: number;
}
