/**
 * Create Bookmark Folder Use Case
 *
 * Creates a new folder for organizing bookmarks.
 */

import { BookmarkFolderEntity } from '@blog/shared/domain';
import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface CreateBookmarkFolderInput {
  userId: string;
  name: string;
  description?: string;
  color?: string; // Format: #RRGGBB
}

export interface CreateBookmarkFolderOutput {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: Date;
}

export interface CreateBookmarkFolderDependencies {
  bookmarkFolderRepository: IBookmarkFolderRepository;
}

export class CreateBookmarkFolderUseCase {
  constructor(private readonly deps: CreateBookmarkFolderDependencies) {}

  async execute(
    input: CreateBookmarkFolderInput
  ): Promise<Result<CreateBookmarkFolderOutput>> {
    // 1. Validate name
    const name = input.name.trim();
    if (name.length < 1 || name.length > 50) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Folder name must be between 1 and 50 characters'
      );
    }

    // 2. Check if folder name already exists for user (case-insensitive)
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

    // 3. Validate description if provided
    if (input.description && input.description.length > 200) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Description must be at most 200 characters'
      );
    }

    // 4. Validate color format if provided
    if (input.color) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(input.color)) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Color must be in format #RRGGBB'
        );
      }
    }

    // 5. Get current folder count to set sortOrder
    const folderCount = await this.deps.bookmarkFolderRepository.countByUserId(
      input.userId
    );

    // 6. Create folder
    const folder = BookmarkFolderEntity.create({
      userId: input.userId,
      name,
      description: input.description || null,
      color: input.color || null,
      sortOrder: folderCount, // Append to end
    });

    await this.deps.bookmarkFolderRepository.save(folder);

    // 7. Return result
    const data = folder.toJSON();
    return success({
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      sortOrder: data.sortOrder,
      isDefault: data.isDefault,
      bookmarkCount: data.bookmarkCount,
      createdAt: data.createdAt,
    });
  }
}
