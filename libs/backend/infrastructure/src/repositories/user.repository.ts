/**
 * PostgreSQL User Repository
 *
 * Implementation of IUserRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type { IUserRepository } from '@blog/backend/core';
import { UserEntity } from '@blog/shared/domain';
import {
  toDomainUser,
  toNewUserRow,
  toUserUpdateRow,
} from '../mappers/user.mapper.js';

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainUser(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainUser(row) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username.toLowerCase())
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? toDomainUser(row) : null;
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('users')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('email', '=', email.toLowerCase())
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('users')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('username', '=', username.toLowerCase())
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async save(user: UserEntity): Promise<void> {
    const existingUser = await this.db
      .selectFrom('users')
      .select('id')
      .where('id', '=', user.id)
      .executeTakeFirst();

    if (existingUser) {
      // Update
      await this.db
        .updateTable('users')
        .set(toUserUpdateRow(user))
        .where('id', '=', user.id)
        .execute();
    } else {
      // Insert
      await this.db.insertInto('users').values(toNewUserRow(user)).execute();
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .updateTable('users')
      .set({
        deleted_at: new Date(),
        is_active: false,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];

    const rows = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', 'in', ids)
      .where('deleted_at', 'is', null)
      .execute();

    return rows.map(toDomainUser);
  }

  async findSpammers(threshold = 5): Promise<UserEntity[]> {
    const rows = await this.db
      .selectFrom('users')
      .selectAll()
      .where('spam_score', '>=', threshold)
      .where('deleted_at', 'is', null)
      .orderBy('spam_score', 'desc')
      .execute();

    return rows.map(toDomainUser);
  }

  async countActive(): Promise<number> {
    const result = await this.db
      .selectFrom('users')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.count ?? 0;
  }
}

/**
 * Create a PostgresUserRepository instance
 */
export function createUserRepository(db: Kysely<Database>): IUserRepository {
  return new PostgresUserRepository(db);
}
