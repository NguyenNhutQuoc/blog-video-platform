/**
 * Delete Bookmark Folder Use Case
 *
 * Deletes a bookmark folder. Default folder cannot be deleted.
 * Bookmarks in the folder are moved to the default folder.
 */

import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import type { IBookmarkRepository } from '../../ports/repositories/bookmark.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';
import { BookmarkFolderEntity } from '@blog/shared/domain';

export interface DeleteBookmarkFolderInput {
  userId: string;
  folderId: string;
}

export interface DeleteBookmarkFolderOutput {
  success: boolean;
  movedBookmarksCount: number;
}

export interface DeleteBookmarkFolderDependencies {
  bookmarkFolderRepository: IBookmarkFolderRepository;
  bookmarkRepository: IBookmarkRepository;
}

export class DeleteBookmarkFolderUseCase {
  constructor(private readonly deps: DeleteBookmarkFolderDependencies) {}

  async execute(
    input: DeleteBookmarkFolderInput
  ): Promise<Result<DeleteBookmarkFolderOutput>> {
    // 1. Find folder
    const folder = await this.deps.bookmarkFolderRepository.findById(
      input.folderId
    );
    if (!folder) {
      return failure(ErrorCodes.NOT_FOUND, 'Folder not found');
    }

    // 2. Verify ownership
    if (folder.toJSON().userId !== input.userId) {
      return failure(ErrorCodes.FORBIDDEN, 'You do not own this folder');
    }

    // 3. Cannot delete default folder
    if (!folder.canBeDeleted()) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot delete the default folder'
      );
    }

    // 4. Get or create default folder to move bookmarks
    let defaultFolder =
      await this.deps.bookmarkFolderRepository.findDefaultFolder(input.userId);

    if (!defaultFolder) {
      defaultFolder = BookmarkFolderEntity.createDefault(input.userId);
      await this.deps.bookmarkFolderRepository.save(defaultFolder);
    }

    const defaultFolderId = defaultFolder.toJSON().id;

    // 5. Move all bookmarks to default folder
    const bookmarks = await this.deps.bookmarkRepository.findByFolderId(
      input.folderId,
      { limit: 1000 } // Get all bookmarks (reasonable limit)
    );

    for (const bookmark of bookmarks) {
      bookmark.moveToFolder(defaultFolderId);
      await this.deps.bookmarkRepository.update(bookmark);
    }

    // Note: Database triggers will automatically update folder bookmark_counts

    // 6. Delete folder
    await this.deps.bookmarkFolderRepository.delete(input.folderId);

    // 7. Return result
    return success({
      success: true,
      movedBookmarksCount: bookmarks.length,
    });
  }
}
