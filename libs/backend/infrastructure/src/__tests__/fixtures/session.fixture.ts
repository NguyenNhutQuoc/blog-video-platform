/**
 * Session Test Fixtures
 *
 * Factory functions for creating test session entities.
 */

import { SessionEntity } from '@blog/shared/domain';
import type { Session } from '@blog/shared/domain';
import crypto from 'crypto';

let sessionCounter = 0;

/**
 * Options for creating a test session
 */
export interface CreateTestSessionOptions {
  userId: string;
  refreshToken?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresInDays?: number;
  lastActiveAt?: Date;
  createdAt?: Date;
}

/**
 * Generate a random refresh token for testing
 */
export function generateTestRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a test session entity with optional overrides
 */
export function createTestSession(
  options: CreateTestSessionOptions
): SessionEntity {
  sessionCounter++;

  return SessionEntity.create({
    userId: options.userId,
    refreshToken: options.refreshToken ?? generateTestRefreshToken(),
    userAgent: options.userAgent ?? 'Mozilla/5.0 (Test Browser)',
    ipAddress: options.ipAddress ?? '127.0.0.1',
    expiresInDays: options.expiresInDays ?? 30,
  });
}

/**
 * Create an expired session
 */
export function createTestExpiredSession(
  options: CreateTestSessionOptions
): SessionEntity {
  // Create session that expired yesterday
  return createTestSession({
    ...options,
    expiresInDays: -1, // Expired 1 day ago
  });
}

/**
 * Create a session expiring soon (1 hour)
 */
export function createTestExpiringSoonSession(
  options: CreateTestSessionOptions
): SessionEntity {
  const session = createTestSession(options);

  // Manually set expires to 1 hour from now
  const sessionData = session.toJSON();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const modifiedSession: Session = {
    ...sessionData,
    expiresAt,
  };

  return SessionEntity.fromPersistence(modifiedSession);
}

/**
 * Create a session from a specific device
 */
export function createTestSessionFromDevice(
  userId: string,
  deviceType: 'mobile' | 'desktop' | 'tablet'
): SessionEntity {
  const userAgents: Record<string, string> = {
    mobile:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    desktop:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0',
    tablet:
      'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  };

  return createTestSession({
    userId,
    userAgent: userAgents[deviceType],
  });
}

/**
 * Create multiple sessions for the same user (multi-device)
 */
export function createTestMultiDeviceSessions(userId: string): SessionEntity[] {
  return [
    createTestSessionFromDevice(userId, 'desktop'),
    createTestSessionFromDevice(userId, 'mobile'),
    createTestSessionFromDevice(userId, 'tablet'),
  ];
}

/**
 * Create multiple test sessions
 */
export function createTestSessions(
  count: number,
  options: CreateTestSessionOptions
): SessionEntity[] {
  return Array.from({ length: count }, () => createTestSession(options));
}

/**
 * Reset session counter
 */
export function resetSessionCounter(): void {
  sessionCounter = 0;
}
