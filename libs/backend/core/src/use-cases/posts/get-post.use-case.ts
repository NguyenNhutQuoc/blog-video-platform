/**
 * Get Post Use Case
 *
 * Retrieves a single post with permission checking and view tracking.
 */

import { PostStatus, PostVisibility } from '@blog/shared/domain';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface GetPostInput {
  /** Post ID or slug */
  postIdOrSlug: string;
  /** Current user ID (for permission checking) */
  userId?: string;
  /** Whether to track view count */
  trackView?: boolean;
}

export interface GetPostOutput {
  post: {
    id: string;
    authorId: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    videoId: string | null;
    status: string;
    visibility: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    bookmarkCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface GetPostDependencies {
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class GetPostUseCase {
  constructor(private readonly deps: GetPostDependencies) {}

  async execute(input: GetPostInput): Promise<Result<GetPostOutput>> {
    // 1. Find post by ID or slug
    const isUuid = this.isValidUuid(input.postIdOrSlug);
    const post = isUuid
      ? await this.deps.postRepository.findById(input.postIdOrSlug)
      : await this.deps.postRepository.findBySlug(input.postIdOrSlug);

    if (!post) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // 2. Check if post is deleted
    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // 3. Check permissions
    const postData = post.toJSON();
    const isOwner = input.userId === postData.authorId;
    const isPublished = postData.status === PostStatus.PUBLISHED;

    // Non-owners can only see published public posts
    if (!isOwner) {
      if (!isPublished) {
        return failure(
          ErrorCodes.FORBIDDEN,
          'You do not have permission to view this post'
        );
      }

      // Unlisted posts can be viewed by anyone with the link
      // Private posts can only be viewed by owner
      if (postData.visibility === PostVisibility.PRIVATE) {
        return failure(ErrorCodes.FORBIDDEN, 'This post is private');
      }
    }

    // 4. Track view (only for non-owners viewing public posts)
    if (input.trackView !== false && !isOwner && isPublished) {
      post.incrementViewCount();
      await this.deps.postRepository.save(post);
    }

    // 5. Get author info
    const author = await this.deps.userRepository.findById(postData.authorId);
    if (!author) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'Author not found');
    }

    const authorData = author.toJSON();

    // 6. Return result
    return success({
      post: {
        id: postData.id,
        authorId: postData.authorId,
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        excerpt: postData.excerpt,
        featuredImageUrl: postData.featuredImageUrl,
        videoId: postData.videoId,
        status: postData.status,
        visibility: postData.visibility,
        viewCount: postData.viewCount,
        likeCount: postData.likeCount,
        commentCount: postData.commentCount,
        bookmarkCount: postData.bookmarkCount,
        publishedAt: postData.publishedAt,
        createdAt: postData.createdAt,
        updatedAt: postData.updatedAt,
      },
      author: {
        id: authorData.id,
        username: authorData.username,
        fullName: authorData.fullName,
        avatarUrl: authorData.avatarUrl,
      },
    });
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
