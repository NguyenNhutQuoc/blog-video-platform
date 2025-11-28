/**
 * PostgreSQL Session Repository
 *
 * Implementation of ISessionRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type { ISessionRepository } from '@blog/backend/core';
import { SessionEntity } from '@blog/shared/domain';
import {
  toDomainSession,
  toNewSessionRow,
  toSessionUpdateRow,
} from '../mappers/session.mapper.js';

export class PostgresSessionRepository implements ISessionRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<SessionEntity | null> {
    const row = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', id)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    return row ? toDomainSession(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    const row = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('token', '=', tokenHash)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    return row ? toDomainSession(row) : null;
  }

  async findByUserId(userId: string): Promise<SessionEntity[]> {
    const rows = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('expires_at', '>', new Date())
      .orderBy('last_active_at', 'desc')
      .execute();

    return rows.map(toDomainSession);
  }

  async save(session: SessionEntity): Promise<void> {
    const existingSession = await this.db
      .selectFrom('sessions')
      .select('id')
      .where('id', '=', session.id)
      .executeTakeFirst();

    if (existingSession) {
      // Update
      await this.db
        .updateTable('sessions')
        .set(toSessionUpdateRow(session))
        .where('id', '=', session.id)
        .execute();
    } else {
      // Insert
      await this.db
        .insertInto('sessions')
        .values(toNewSessionRow(session))
        .execute();
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id', '=', id).execute();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db
      .deleteFrom('sessions')
      .where('user_id', '=', userId)
      .execute();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .deleteFrom('sessions')
      .where('expires_at', '<', new Date())
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('sessions')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    return result?.count ?? 0;
  }
}

/**
 * Create a PostgresSessionRepository instance
 */
export function createSessionRepository(
  db: Kysely<Database>
): ISessionRepository {
  return new PostgresSessionRepository(db);
}
