/**
 * Session Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type {
  SessionRow,
  NewSession,
  SessionUpdate,
} from '../database/types.js';
import { SessionEntity, type Session } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainSession(row: SessionRow): SessionEntity {
  const session: Session = {
    id: row.id,
    userId: row.user_id,
    refreshToken: row.token,
    userAgent: row.user_agent ?? null,
    ipAddress: row.ip_address ?? null,
    deviceName:
      ((row.device_info as Record<string, unknown> | null)?.deviceName as
        | string
        | null) ?? null,
    lastActiveAt: row.last_active_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };

  return SessionEntity.fromPersistence(session);
}

/**
 * Map domain entity to database insert row
 */
export function toNewSessionRow(entity: SessionEntity): NewSession {
  const data = entity.toJSON();
  return {
    id: data.id,
    user_id: data.userId,
    token: data.refreshToken,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    device_info: data.deviceName ? { deviceName: data.deviceName } : null,
    expires_at: data.expiresAt,
    last_active_at: data.lastActiveAt,
    created_at: data.createdAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toSessionUpdateRow(entity: SessionEntity): SessionUpdate {
  const data = entity.toJSON();
  return {
    token: data.refreshToken,
    last_active_at: data.lastActiveAt,
    expires_at: data.expiresAt,
  };
}
