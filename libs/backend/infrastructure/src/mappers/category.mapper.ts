/**
 * Category Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type {
  CategoryRow,
  NewCategory,
  CategoryUpdate,
} from '../database/types.js';
import { CategoryEntity, type Category } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  postCount: number;
  createdAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainCategory(row: CategoryRow): CategoryEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseCategoryRow;

  const category: Category = {
    id: camelRow.id,
    name: camelRow.name,
    slug: camelRow.slug,
    description: camelRow.description ?? null,
    parentId: null, // Categories table doesn't have parent_id in current schema
    sortOrder: 0,
    isActive: true,
    postCount: camelRow.postCount,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.createdAt, // Schema doesn't have updated_at
  };

  return CategoryEntity.fromPersistence(category);
}

/**
 * Map domain entity to database insert row
 */
export function toNewCategoryRow(entity: CategoryEntity): NewCategory {
  const data = entity.toJSON();
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    color: '#6b7280', // Default gray color
    post_count: data.postCount,
    created_at: data.createdAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toCategoryUpdateRow(entity: CategoryEntity): CategoryUpdate {
  const data = entity.toJSON();
  return {
    name: data.name,
    slug: data.slug,
    description: data.description,
    post_count: data.postCount,
  };
}
