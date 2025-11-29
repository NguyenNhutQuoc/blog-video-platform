/**
 * PostgreSQL Category Repository
 *
 * Implementation of ICategoryRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  ICategoryRepository,
  CategoryQueryOptions,
} from '@blog/backend/core';
import { CategoryEntity } from '@blog/shared/domain';
import {
  toDomainCategory,
  toNewCategoryRow,
  toCategoryUpdateRow,
} from '../mappers/category.mapper.js';

export class PostgresCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<CategoryEntity | null> {
    const row = await this.db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainCategory(row) : null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const row = await this.db
      .selectFrom('categories')
      .selectAll()
      .where('slug', '=', slug.toLowerCase())
      .executeTakeFirst();

    return row ? toDomainCategory(row) : null;
  }

  async findAll(options?: CategoryQueryOptions): Promise<CategoryEntity[]> {
    let query = this.db.selectFrom('categories').selectAll();

    // Order
    const orderBy = options?.orderBy ?? 'name';
    const orderDir = options?.orderDir ?? 'asc';

    switch (orderBy) {
      case 'postCount':
        query = query.orderBy('post_count', orderDir);
        break;
      case 'sortOrder':
        // Not in current schema - fall back to name
        query = query.orderBy('name', orderDir);
        break;
      case 'createdAt':
        query = query.orderBy('created_at', orderDir);
        break;
      default:
        query = query.orderBy('name', orderDir);
    }

    const rows = await query.execute();
    return rows.map(toDomainCategory);
  }

  async findRoots(): Promise<CategoryEntity[]> {
    // Current schema doesn't support hierarchical categories
    return this.findAll();
  }

  async findChildren(_parentId: string): Promise<CategoryEntity[]> {
    // Current schema doesn't support hierarchical categories
    return [];
  }

  async findTree(): Promise<CategoryEntity[]> {
    // Current schema doesn't support hierarchical categories
    return this.findAll();
  }

  async save(category: CategoryEntity): Promise<void> {
    const existingCategory = await this.db
      .selectFrom('categories')
      .select('id')
      .where('id', '=', category.id)
      .executeTakeFirst();

    if (existingCategory) {
      await this.db
        .updateTable('categories')
        .set(toCategoryUpdateRow(category))
        .where('id', '=', category.id)
        .execute();
    } else {
      await this.db
        .insertInto('categories')
        .values(toNewCategoryRow(category))
        .execute();
    }
  }

  async delete(id: string): Promise<void> {
    // Check if category has posts
    const hasPosts = await this.hasPosts(id);
    if (hasPosts) {
      throw new Error('Cannot delete category with posts');
    }

    await this.db.deleteFrom('categories').where('id', '=', id).execute();
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.db
      .selectFrom('categories')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('slug', '=', slug.toLowerCase());

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const result = await query.executeTakeFirst();
    return (result?.count ?? 0) > 0;
  }

  async hasChildren(_id: string): Promise<boolean> {
    // Current schema doesn't support hierarchical categories
    return false;
  }

  async hasPosts(id: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('post_categories')
      .select(this.db.fn.count<number>('post_id').as('count'))
      .where('category_id', '=', id)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async findByIds(ids: string[]): Promise<CategoryEntity[]> {
    if (ids.length === 0) return [];

    const rows = await this.db
      .selectFrom('categories')
      .selectAll()
      .where('id', 'in', ids)
      .execute();

    return rows.map(toDomainCategory);
  }

  async reorder(_orders: { id: string; sortOrder: number }[]): Promise<void> {
    // Current schema doesn't support sort_order
    // This would be implemented when schema is updated
  }

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('categories')
      .select(this.db.fn.count<number>('id').as('count'))
      .executeTakeFirst();

    return result?.count ?? 0;
  }
}

/**
 * Create a PostgresCategoryRepository instance
 */
export function createCategoryRepository(
  db: Kysely<Database>
): ICategoryRepository {
  return new PostgresCategoryRepository(db);
}
