/**
 * Get User Folders Use Case
 *
 * Retrieves all bookmark folders for a user.
 */

import type { IBookmarkFolderRepository } from '../../ports/repositories/bookmark-folder.repository.interface.js';
import { type Result, success } from '../common/result.js';

export interface GetUserFoldersInput {
  userId: string;
}

export interface FolderDto {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserFoldersOutput {
  folders: FolderDto[];
}

export interface GetUserFoldersDependencies {
  bookmarkFolderRepository: IBookmarkFolderRepository;
}

export class GetUserFoldersUseCase {
  constructor(private readonly deps: GetUserFoldersDependencies) {}

  async execute(
    input: GetUserFoldersInput
  ): Promise<Result<GetUserFoldersOutput>> {
    // Get all folders for user (ordered by sortOrder, then createdAt)
    const folders = await this.deps.bookmarkFolderRepository.findByUserId(
      input.userId
    );

    // Map to DTOs
    const folderDtos: FolderDto[] = folders.map((folder) => {
      const data = folder.toJSON();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
        sortOrder: data.sortOrder,
        isDefault: data.isDefault,
        bookmarkCount: data.bookmarkCount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return success({
      folders: folderDtos,
    });
  }
}
