/**
 * List Posts Use Case
 *
 * Retrieves paginated list of posts with filtering options.
 */

import { PostStatus, PostVisibility } from '@blog/shared/domain';
import type {
  IPostRepository,
  PostFeedOptions,
} from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success } from '../common/result.js';

export interface ListPostsInput {
  /** Filter by author ID */
  authorId?: string;
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by tag ID */
  tagId?: string;
  /** Filter by status (only for owner/admin) */
  status?: 'draft' | 'published' | 'archived';
  /** Current user ID (for permission checking) */
  userId?: string;
  /** Pagination cursor (last post ID) */
  cursor?: string;
  /** Number of posts per page */
  limit?: number;
  /** Sort order */
  orderBy?: 'publishedAt' | 'viewCount' | 'likeCount';
  orderDir?: 'asc' | 'desc';
}

export interface PostSummary {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  status: string;
  visibility: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface ListPostsOutput {
  posts: PostSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ListPostsDependencies {
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ListPostsUseCase {
  constructor(private readonly deps: ListPostsDependencies) {}

  async execute(input: ListPostsInput): Promise<Result<ListPostsOutput>> {
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    // Build query options
    const feedOptions: PostFeedOptions = {
      cursor: input.cursor,
      limit: limit + 1, // Fetch one extra to check hasMore
      orderBy: input.orderBy ?? 'publishedAt',
      orderDir: input.orderDir ?? 'desc',
    };

    let posts;

    // Determine which query to use based on filters
    if (input.authorId) {
      // Check if requesting user can see non-published posts
      const canSeeAllStatuses =
        input.userId === input.authorId || (await this.isAdmin(input.userId));

      posts = await this.deps.postRepository.findByAuthorId(input.authorId, {
        status: canSeeAllStatuses ? input.status : PostStatus.PUBLISHED,
        visibility: canSeeAllStatuses ? undefined : PostVisibility.PUBLIC,
        limit: feedOptions.limit,
        offset: input.cursor ? undefined : 0,
        orderBy: feedOptions.orderBy as
          | 'publishedAt'
          | 'viewCount'
          | 'likeCount',
        orderDir: feedOptions.orderDir,
      });
    } else if (input.categoryId) {
      posts = await this.deps.postRepository.findByCategory(
        input.categoryId,
        feedOptions
      );
    } else if (input.tagId) {
      posts = await this.deps.postRepository.findByTag(
        input.tagId,
        feedOptions
      );
    } else {
      // Default: public published posts
      posts = await this.deps.postRepository.findPublished(feedOptions);
    }

    // Check if there are more results
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts = posts.slice(0, limit);
    }

    // Get unique author IDs
    const authorIds = [...new Set(posts.map((p) => p.toJSON().authorId))];
    console.log('ListPostsUseCase fetching authors for IDs:', posts);
    const authors = await this.deps.userRepository.findByIds(authorIds);
    const authorMap = new Map(authors.map((a) => [a.toJSON().id, a]));

    // Build response
    const postSummaries: PostSummary[] = posts.map((post) => {
      const postData = post.toJSON();
      const author = authorMap.get(postData.authorId);
      const authorData = author?.toJSON();

      return {
        id: postData.id,
        authorId: postData.authorId,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        featuredImageUrl: postData.featuredImageUrl,
        status: postData.status,
        visibility: postData.visibility,
        viewCount: postData.viewCount,
        likeCount: postData.likeCount,
        commentCount: postData.commentCount,
        publishedAt: postData.publishedAt,
        createdAt: postData.createdAt,
        author: {
          id: authorData?.id ?? postData.authorId,
          username: authorData?.username ?? 'unknown',
          fullName: authorData?.fullName ?? null,
          avatarUrl: authorData?.avatarUrl ?? null,
        },
      };
    });

    console.log('ListPostsUseCase fetched posts:', postSummaries);

    // Calculate next cursor
    const nextCursor =
      hasMore && postSummaries.length > 0
        ? postSummaries[postSummaries.length - 1].id
        : null;

    return success({
      posts: postSummaries,
      nextCursor,
      hasMore,
    });
  }

  private async isAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.deps.userRepository.findById(userId);
    return user?.toJSON().isAdmin ?? false;
  }
}
