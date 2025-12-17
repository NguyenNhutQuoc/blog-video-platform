/**
 * Update Bookmark Folder Use Case
 *
 * Updates a bookmark folder's properties.
 */

import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UpdateBookmarkFolderInput {
  userId: string;
  folderId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
}

export interface UpdateBookmarkFolderOutput {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  bookmarkCount: number;
  updatedAt: Date;
}

export interface UpdateBookmarkFolderDependencies {
  bookmarkFolderRepository: IBookmarkFolderRepository;
}

export class UpdateBookmarkFolderUseCase {
  constructor(private readonly deps: UpdateBookmarkFolderDependencies) {}

  async execute(
    input: UpdateBookmarkFolderInput
  ): Promise<Result<UpdateBookmarkFolderOutput>> {
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

    // 3. Validate and update name if provided
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 1 || name.length > 50) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Folder name must be between 1 and 50 characters'
        );
      }

      // Check if new name conflicts with existing folder (case-insensitive)
      const currentName = folder.toJSON().name;
      if (name.toLowerCase() !== currentName.toLowerCase()) {
        const exists =
          await this.deps.bookmarkFolderRepository.existsByUserIdAndName(
            input.userId,
            name
          );
        if (exists) {
          return failure(
            ErrorCodes.VALIDATION_ERROR,
            'A folder with this name already exists'
          );
        }
      }
    }

    // 4. Validate description if provided
    if (
      input.description !== undefined &&
      input.description !== null &&
      input.description.length > 200
    ) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Description must be at most 200 characters'
      );
    }

    // 5. Validate color format if provided
    if (input.color !== undefined && input.color !== null) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(input.color)) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Color must be in format #RRGGBB'
        );
      }
    }

    // 6. Validate sortOrder if provided
    if (input.sortOrder !== undefined && input.sortOrder < 0) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Sort order must be non-negative'
      );
    }

    // 7. Update folder
    folder.update({
      name: input.name,
      description: input.description,
      color: input.color,
      sortOrder: input.sortOrder,
    });

    await this.deps.bookmarkFolderRepository.update(folder);

    // 8. Return result
    const data = folder.toJSON();
    return success({
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      sortOrder: data.sortOrder,
      isDefault: data.isDefault,
      bookmarkCount: data.bookmarkCount,
      updatedAt: data.updatedAt,
    });
  }
}
