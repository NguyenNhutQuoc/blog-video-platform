/**
 * Unbookmark Post Use Case
 *
 * Handles removing a bookmark from a post.
 */

import type { IBookmarkRepository } from '../../ports/repositories/bookmark.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UnbookmarkPostInput {
  /** User who is removing bookmark */
  userId: string;
  /** Post being unbookmarked */
  postId: string;
}

export interface UnbookmarkPostOutput {
  success: boolean;
}

export interface UnbookmarkPostDependencies {
  bookmarkRepository: IBookmarkRepository;
}

export class UnbookmarkPostUseCase {
  constructor(private readonly deps: UnbookmarkPostDependencies) {}

  async execute(
    input: UnbookmarkPostInput
  ): Promise<Result<UnbookmarkPostOutput>> {
    // 1. Check if bookmark exists
    const bookmark = await this.deps.bookmarkRepository.findByUserAndPost(
      input.userId,
      input.postId
    );

    if (!bookmark) {
      return failure(ErrorCodes.NOT_FOUND, 'Bookmark not found');
    }

    // 2. Delete bookmark
    await this.deps.bookmarkRepository.delete(input.userId, input.postId);

    // Note: Database triggers will automatically:
    // - Decrement post.bookmark_count
    // - Decrement folder.bookmark_count

    // 3. Return result
    return success({
      success: true,
    });
  }
}
