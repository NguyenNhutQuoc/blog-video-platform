/**
 * Update Bookmark Use Case
 *
 * Updates a bookmark's folder or note.
 */

import type { IBookmarkRepository } from '../../ports/repositories/bookmark.repository.interface.js';
import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UpdateBookmarkInput {
  userId: string;
  bookmarkId: string;
  folderId?: string | null;
  note?: string | null;
}

export interface UpdateBookmarkOutput {
  id: string;
  folderId: string | null;
  note: string | null;
  updatedAt: Date;
}

export interface UpdateBookmarkDependencies {
  bookmarkRepository: IBookmarkRepository;
  bookmarkFolderRepository: IBookmarkFolderRepository;
}

export class UpdateBookmarkUseCase {
  constructor(private readonly deps: UpdateBookmarkDependencies) {}

  async execute(
    input: UpdateBookmarkInput
  ): Promise<Result<UpdateBookmarkOutput>> {
    // 1. Find bookmark
    const bookmark = await this.deps.bookmarkRepository.findById(
      input.bookmarkId
    );
    if (!bookmark) {
      return failure(ErrorCodes.NOT_FOUND, 'Bookmark not found');
    }

    // 2. Verify ownership
    if (bookmark.toJSON().userId !== input.userId) {
      return failure(ErrorCodes.FORBIDDEN, 'You do not own this bookmark');
    }

    // 3. Validate and set folder if provided
    if (input.folderId !== undefined) {
      if (input.folderId) {
        const folder = await this.deps.bookmarkFolderRepository.findById(
          input.folderId
        );
        if (!folder || folder.toJSON().userId !== input.userId) {
          return failure(ErrorCodes.NOT_FOUND, 'Folder not found');
        }
      }
    }

    // 4. Validate note if provided
    if (
      input.note !== undefined &&
      input.note !== null &&
      input.note.length > 500
    ) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Note must be at most 500 characters'
      );
    }

    // 5. Update bookmark
    bookmark.update({
      folderId: input.folderId,
      note: input.note,
    });

    await this.deps.bookmarkRepository.update(bookmark);

    // Note: Database trigger will update folder bookmark_counts if folder changed

    // 6. Return result
    const data = bookmark.toJSON();
    return success({
      id: data.id,
      folderId: data.folderId,
      note: data.note,
      updatedAt: data.updatedAt,
    });
  }
}
