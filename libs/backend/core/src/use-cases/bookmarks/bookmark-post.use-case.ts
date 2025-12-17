/**
 * Bookmark Post Use Case
 *
 * Handles bookmarking a post with automatic default folder creation.
 */

import { BookmarkEntity, BookmarkFolderEntity } from '@blog/shared/domain';
import type { IBookmarkRepository } from '../../ports/repositories/bookmark.repository.interface.js';
import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface BookmarkPostInput {
  /** User who is bookmarking */
  userId: string;
  /** Post being bookmarked */
  postId: string;
  /** Optional folder ID (if not provided, uses/creates default "Đọc sau" folder) */
  folderId?: string;
  /** Optional note */
  note?: string;
}

export interface BookmarkPostOutput {
  success: boolean;
  bookmarkId: string;
  folderId: string;
  folderName: string;
}

export interface BookmarkPostDependencies {
  bookmarkRepository: IBookmarkRepository;
  bookmarkFolderRepository: IBookmarkFolderRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class BookmarkPostUseCase {
  constructor(private readonly deps: BookmarkPostDependencies) {}

  async execute(input: BookmarkPostInput): Promise<Result<BookmarkPostOutput>> {
    // Helper to check if string is valid UUID
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    // 1. Validate user exists and is active
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Your account is inactive');
    }

    // 2. Validate post exists and is not deleted
    let post = null;
    if (isUUID(input.postId)) {
      post = await this.deps.postRepository.findById(input.postId);
    }
    if (!post) {
      post = await this.deps.postRepository.findBySlug(input.postId);
    }
    if (!post) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    const postId = post.id;

    // 3. Check if already bookmarked
    const existingBookmark =
      await this.deps.bookmarkRepository.findByUserAndPost(
        input.userId,
        postId
      );
    if (existingBookmark) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You have already bookmarked this post'
      );
    }

    // 4. Get or create folder
    let folderId = input.folderId;
    let folder = null;

    if (folderId) {
      // Validate folder exists and belongs to user
      folder = await this.deps.bookmarkFolderRepository.findById(folderId);
      if (!folder || folder.toJSON().userId !== input.userId) {
        return failure(ErrorCodes.NOT_FOUND, 'Folder not found');
      }
    } else {
      // Lazy-create default folder if needed
      folder = await this.deps.bookmarkFolderRepository.findDefaultFolder(
        input.userId
      );

      if (!folder) {
        folder = BookmarkFolderEntity.createDefault(input.userId);
        await this.deps.bookmarkFolderRepository.save(folder);
      }

      folderId = folder.toJSON().id;
    }

    // 5. Validate note length if provided
    if (input.note && input.note.length > 500) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Note must be at most 500 characters'
      );
    }

    // 6. Create bookmark
    const bookmark = BookmarkEntity.create({
      userId: input.userId,
      postId,
      folderId,
      note: input.note || null,
    });

    await this.deps.bookmarkRepository.save(bookmark);

    // Note: Database triggers will automatically:
    // - Increment post.bookmark_count
    // - Increment folder.bookmark_count

    // 7. Return result
    return success({
      success: true,
      bookmarkId: bookmark.toJSON().id,
      folderId,
      folderName: folder.toJSON().name,
    });
  }
}
