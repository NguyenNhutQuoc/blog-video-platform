/**
 * Get User Bookmarks Use Case
 *
 * Retrieves bookmarks for a user with cursor pagination.
 */

import type { IBookmarkRepository } from '../../ports/repositories/bookmark.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success } from '../common/result.js';

export interface GetUserBookmarksInput {
  userId: string;
  folderId?: string;
  cursor?: string; // ISO timestamp
  limit?: number;
}

export interface BookmarkWithPost {
  bookmarkId: string;
  note: string | null;
  createdAt: Date;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    likeCount: number;
    commentCount: number;
    bookmarkCount: number;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      fullName: string | null;
      avatarUrl: string | null;
    } | null;
  } | null;
}

export interface GetUserBookmarksOutput {
  data: BookmarkWithPost[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface GetUserBookmarksDependencies {
  bookmarkRepository: IBookmarkRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class GetUserBookmarksUseCase {
  constructor(private readonly deps: GetUserBookmarksDependencies) {}

  async execute(
    input: GetUserBookmarksInput
  ): Promise<Result<GetUserBookmarksOutput>> {
    const limit = input.limit || 20;

    // 1. Get bookmarks with pagination (+1 to check hasMore)
    const bookmarks = await this.deps.bookmarkRepository.findByUserId(
      input.userId,
      {
        folderId: input.folderId,
        cursor: input.cursor,
        limit: limit + 1,
      }
    );

    // 2. Check if there are more results
    const hasMore = bookmarks.length > limit;
    if (hasMore) {
      bookmarks.pop(); // Remove extra item
    }

    // 3. Get post details and authors for each bookmark
    const postIds = bookmarks.map((b) => b.toJSON().postId);
    const posts = await Promise.all(
      postIds.map((id) => this.deps.postRepository.findById(id))
    );

    // Get unique author IDs
    const authorIds = [
      ...new Set(posts.filter((p) => p).map((p) => p!.toJSON().authorId)),
    ];
    const authors = await this.deps.userRepository.findByIds(authorIds);
    const authorMap = new Map(
      authors.map((author) => [author.toJSON().id, author])
    );

    // 4. Map to DTOs
    const data: BookmarkWithPost[] = bookmarks.map((bookmark, index) => {
      const bookmarkData = bookmark.toJSON();
      const post = posts[index];
      const postData = post?.toJSON();
      const author = postData ? authorMap.get(postData.authorId) : null;
      const authorData = author?.toJSON();

      return {
        bookmarkId: bookmarkData.id,
        note: bookmarkData.note,
        createdAt: bookmarkData.createdAt,
        post: postData
          ? {
              id: postData.id,
              title: postData.title,
              slug: postData.slug,
              excerpt: postData.excerpt,
              featuredImageUrl: postData.featuredImageUrl,
              likeCount: postData.likeCount,
              commentCount: postData.commentCount,
              bookmarkCount: postData.bookmarkCount,
              createdAt: postData.createdAt,
              author: authorData
                ? {
                    id: authorData.id,
                    username: authorData.username,
                    fullName: authorData.fullName,
                    avatarUrl: authorData.avatarUrl,
                  }
                : null,
            }
          : null,
      };
    });

    // 5. Calculate next cursor
    const nextCursor =
      hasMore && bookmarks.length > 0
        ? bookmarks[bookmarks.length - 1].toJSON().createdAt.toISOString()
        : null;

    return success({
      data,
      hasMore,
      nextCursor,
    });
  }
}
