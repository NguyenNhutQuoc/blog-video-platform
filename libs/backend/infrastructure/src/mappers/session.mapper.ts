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

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseSessionRow {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: Record<string, unknown> | null;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainSession(row: SessionRow): SessionEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseSessionRow;

  const session: Session = {
    id: camelRow.id,
    userId: camelRow.userId,
    refreshToken: camelRow.token,
    userAgent: camelRow.userAgent ?? null,
    ipAddress: camelRow.ipAddress ?? null,
    deviceName:
      ((camelRow.deviceInfo as Record<string, unknown> | null)?.deviceName as
        | string
        | null) ?? null,
    lastActiveAt: camelRow.lastActiveAt,
    expiresAt: camelRow.expiresAt,
    createdAt: camelRow.createdAt,
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
