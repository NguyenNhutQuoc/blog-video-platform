/**
 * PostgreSQL Tag Repository
 *
 * Implementation of ITagRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  ITagRepository,
  TagQueryOptions,
  TrendingTagOptions,
} from '@blog/backend/core';
import { TagEntity } from '@blog/shared/domain';
import {
  toDomainTag,
  toNewTagRow,
  toTagUpdateRow,
} from '../mappers/tag.mapper.js';

export class PostgresTagRepository implements ITagRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<TagEntity | null> {
    const row = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainTag(row) : null;
  }

  async findBySlug(slug: string): Promise<TagEntity | null> {
    const row = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('slug', '=', slug.toLowerCase())
      .executeTakeFirst();

    return row ? toDomainTag(row) : null;
  }

  async findByName(name: string): Promise<TagEntity | null> {
    const row = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('name', '=', name.toLowerCase())
      .executeTakeFirst();

    return row ? toDomainTag(row) : null;
  }

  async findOrCreate(name: string): Promise<TagEntity> {
    // Try to find existing tag
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    // Create new tag
    const tag = TagEntity.create({ name: name.toLowerCase() });
    await this.save(tag);
    return tag;
  }

  async findAll(options?: TagQueryOptions): Promise<TagEntity[]> {
    let query = this.db.selectFrom('tags').selectAll();

    // Filter by minimum usage count
    if (options?.minUsageCount !== undefined) {
      query = query.where('usage_count', '>=', options.minUsageCount);
    }

    // Order
    const orderBy = options?.orderBy ?? 'name';
    const orderDir = options?.orderDir ?? 'asc';

    switch (orderBy) {
      case 'usageCount':
        query = query.orderBy('usage_count', orderDir);
        break;
      case 'createdAt':
        query = query.orderBy('created_at', orderDir);
        break;
      default:
        query = query.orderBy('name', orderDir);
    }

    // Pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.execute();
    return rows.map(toDomainTag);
  }

  async findPopular(limit = 20): Promise<TagEntity[]> {
    const rows = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('usage_count', '>', 0)
      .orderBy('usage_count', 'desc')
      .limit(limit)
      .execute();

    return rows.map(toDomainTag);
  }

  async findTrending(options?: TrendingTagOptions): Promise<TagEntity[]> {
    // For now, just return popular tags
    // A proper implementation would track usage over time
    return this.findPopular(options?.limit ?? 10);
  }

  async search(query: string, limit = 10): Promise<TagEntity[]> {
    const rows = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('name', 'like', `%${query.toLowerCase()}%`)
      .orderBy('usage_count', 'desc')
      .limit(limit)
      .execute();

    return rows.map(toDomainTag);
  }

  async save(tag: TagEntity): Promise<void> {
    const existingTag = await this.db
      .selectFrom('tags')
      .select('id')
      .where('id', '=', tag.id)
      .executeTakeFirst();

    if (existingTag) {
      await this.db
        .updateTable('tags')
        .set(toTagUpdateRow(tag))
        .where('id', '=', tag.id)
        .execute();
    } else {
      await this.db.insertInto('tags').values(toNewTagRow(tag)).execute();
    }
  }

  async delete(id: string): Promise<void> {
    // Check if tag is in use
    const inUse = await this.db
      .selectFrom('post_tags')
      .select(this.db.fn.count<number>('post_id').as('count'))
      .where('tag_id', '=', id)
      .executeTakeFirst();

    if ((inUse?.count ?? 0) > 0) {
      throw new Error('Cannot delete tag that is in use');
    }

    await this.db.deleteFrom('tags').where('id', '=', id).execute();
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.db
      .selectFrom('tags')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('slug', '=', slug.toLowerCase());

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const result = await query.executeTakeFirst();
    return (result?.count ?? 0) > 0;
  }

  async findByIds(ids: string[]): Promise<TagEntity[]> {
    if (ids.length === 0) return [];

    const rows = await this.db
      .selectFrom('tags')
      .selectAll()
      .where('id', 'in', ids)
      .execute();

    return rows.map(toDomainTag);
  }

  async findByPostId(postId: string): Promise<TagEntity[]> {
    const rows = await this.db
      .selectFrom('tags')
      .innerJoin('post_tags', 'tags.id', 'post_tags.tag_id')
      .selectAll('tags')
      .where('post_tags.post_id', '=', postId)
      .execute();

    return rows.map(toDomainTag);
  }

  async merge(sourceId: string, targetId: string): Promise<void> {
    // Update all post_tags to point to target
    await this.db
      .updateTable('post_tags')
      .set({ tag_id: targetId })
      .where('tag_id', '=', sourceId)
      .execute();

    // Update usage count of target
    const sourceTag = await this.findById(sourceId);
    const targetTag = await this.findById(targetId);

    if (sourceTag && targetTag) {
      await this.db
        .updateTable('tags')
        .set({ usage_count: targetTag.usageCount + sourceTag.usageCount })
        .where('id', '=', targetId)
        .execute();
    }

    // Delete source tag
    await this.db.deleteFrom('tags').where('id', '=', sourceId).execute();
  }

  async count(): Promise<number> {
    const result = await this.db
      .selectFrom('tags')
      .select(this.db.fn.count<number>('id').as('count'))
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countUnused(): Promise<number> {
    const result = await this.db
      .selectFrom('tags')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('usage_count', '=', 0)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async deleteUnused(): Promise<number> {
    const result = await this.db
      .deleteFrom('tags')
      .where('usage_count', '=', 0)
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  }
}

/**
 * Create a PostgresTagRepository instance
 */
export function createTagRepository(db: Kysely<Database>): ITagRepository {
  return new PostgresTagRepository(db);
}
