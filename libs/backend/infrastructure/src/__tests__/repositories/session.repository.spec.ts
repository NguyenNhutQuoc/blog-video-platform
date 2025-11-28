/**
 * Session Repository Integration Tests
 *
 * Tests PostgresSessionRepository with real database operations.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { Kysely } from 'kysely';
import type { Database } from '../../database/types.js';
import { PostgresSessionRepository } from '../../repositories/session.repository.js';
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';
import {
  createTestUser,
  createTestSession,
  createTestMultiDeviceSessions,
  generateTestRefreshToken,
  resetSessionCounter,
} from '../fixtures/index.js';

describe('PostgresSessionRepository', () => {
  let db: Kysely<Database>;
  let sessionRepository: PostgresSessionRepository;
  let userRepository: PostgresUserRepository;
  let testUserId: string;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;
    sessionRepository = new PostgresSessionRepository(db);
    userRepository = new PostgresUserRepository(db);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    resetSessionCounter();

    // Create test user
    const testUser = createTestUser({
      email: 'sessionuser@example.com',
      username: 'sessionuser',
    });
    await userRepository.save(testUser);
    testUserId = testUser.id;
  });

  describe('save', () => {
    it('should save a new session', async () => {
      // Arrange
      const session = createTestSession({ userId: testUserId });

      // Act
      await sessionRepository.save(session);

      // Assert
      const found = await sessionRepository.findById(session.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(session.id);
      expect(found?.userId).toBe(testUserId);
    });

    it('should update an existing session', async () => {
      // Arrange
      const session = createTestSession({ userId: testUserId });
      await sessionRepository.save(session);

      // Modify session
      const newToken = generateTestRefreshToken();
      session.rotateToken(newToken);

      // Act
      await sessionRepository.save(session);

      // Assert
      const found = await sessionRepository.findById(session.id);
      expect(found?.refreshToken).toBe(newToken);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent session', async () => {
      const result = await sessionRepository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('should find session by id', async () => {
      const session = createTestSession({ userId: testUserId });
      await sessionRepository.save(session);

      const found = await sessionRepository.findById(session.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(session.id);
    });

    it('should not return expired sessions', async () => {
      const session = createTestSession({
        userId: testUserId,
        expiresInDays: -1, // Already expired
      });
      await sessionRepository.save(session);

      const found = await sessionRepository.findById(session.id);
      expect(found).toBeNull();
    });
  });

  describe('findByTokenHash', () => {
    it('should return null for non-existent token', async () => {
      const result = await sessionRepository.findByTokenHash(
        'non-existent-token'
      );
      expect(result).toBeNull();
    });

    it('should find session by refresh token hash', async () => {
      const refreshToken = generateTestRefreshToken();
      const session = createTestSession({
        userId: testUserId,
        refreshToken,
      });
      await sessionRepository.save(session);

      const found = await sessionRepository.findByTokenHash(refreshToken);
      expect(found).not.toBeNull();
      expect(found?.refreshToken).toBe(refreshToken);
    });

    it('should not return expired sessions', async () => {
      const refreshToken = generateTestRefreshToken();
      const session = createTestSession({
        userId: testUserId,
        refreshToken,
        expiresInDays: -1,
      });
      await sessionRepository.save(session);

      const found = await sessionRepository.findByTokenHash(refreshToken);
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return empty array for user with no sessions', async () => {
      const result = await sessionRepository.findByUserId(crypto.randomUUID());
      expect(result).toEqual([]);
    });

    it('should find all active sessions for user', async () => {
      const sessions = createTestMultiDeviceSessions(testUserId);
      for (const session of sessions) {
        await sessionRepository.save(session);
      }

      const found = await sessionRepository.findByUserId(testUserId);
      expect(found).toHaveLength(3); // desktop, mobile, tablet
    });

    it('should not include expired sessions', async () => {
      const activeSession = createTestSession({ userId: testUserId });
      const expiredSession = createTestSession({
        userId: testUserId,
        expiresInDays: -1,
      });

      await sessionRepository.save(activeSession);
      await sessionRepository.save(expiredSession);

      const found = await sessionRepository.findByUserId(testUserId);
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(activeSession.id);
    });

    it('should order by last active descending', async () => {
      const session1 = createTestSession({ userId: testUserId });
      await sessionRepository.save(session1);

      // Wait a bit and create second session
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = createTestSession({ userId: testUserId });
      await sessionRepository.save(session2);

      const found = await sessionRepository.findByUserId(testUserId);
      expect(found).toHaveLength(2);
      expect(found[0].id).toBe(session2.id); // Most recently active first
    });
  });

  describe('delete', () => {
    it('should delete a session', async () => {
      const session = createTestSession({ userId: testUserId });
      await sessionRepository.save(session);

      await sessionRepository.delete(session.id);

      const found = await sessionRepository.findById(session.id);
      expect(found).toBeNull();
    });
  });

  describe('deleteAllForUser', () => {
    it('should delete all sessions for user', async () => {
      const sessions = createTestMultiDeviceSessions(testUserId);
      for (const session of sessions) {
        await sessionRepository.save(session);
      }

      await sessionRepository.deleteAllForUser(testUserId);

      const found = await sessionRepository.findByUserId(testUserId);
      expect(found).toEqual([]);
    });

    it('should not affect other users sessions', async () => {
      // Create another user
      const otherUser = createTestUser({
        email: 'other@example.com',
        username: 'otheruser',
      });
      await userRepository.save(otherUser);

      const session1 = createTestSession({ userId: testUserId });
      const session2 = createTestSession({ userId: otherUser.id });

      await sessionRepository.save(session1);
      await sessionRepository.save(session2);

      await sessionRepository.deleteAllForUser(testUserId);

      const testUserSessions = await sessionRepository.findByUserId(testUserId);
      const otherUserSessions = await sessionRepository.findByUserId(
        otherUser.id
      );

      expect(testUserSessions).toEqual([]);
      expect(otherUserSessions).toHaveLength(1);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired sessions', async () => {
      const activeSession = createTestSession({ userId: testUserId });
      const expiredSession = createTestSession({
        userId: testUserId,
        expiresInDays: -1,
      });

      await sessionRepository.save(activeSession);
      await sessionRepository.save(expiredSession);

      const deletedCount = await sessionRepository.deleteExpired();

      expect(deletedCount).toBe(1);

      // Verify active session still exists (need to query directly as findById filters expired)
      const remaining = await db
        .selectFrom('sessions')
        .selectAll()
        .where('user_id', '=', testUserId)
        .execute();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(activeSession.id);
    });

    it('should return 0 when no expired sessions', async () => {
      const session = createTestSession({ userId: testUserId });
      await sessionRepository.save(session);

      const deletedCount = await sessionRepository.deleteExpired();
      expect(deletedCount).toBe(0);
    });
  });

  describe('countByUserId', () => {
    it('should return 0 for user with no sessions', async () => {
      const count = await sessionRepository.countByUserId(crypto.randomUUID());
      expect(count).toBe(0);
    });

    it('should count active sessions for user', async () => {
      const sessions = createTestMultiDeviceSessions(testUserId);
      for (const session of sessions) {
        await sessionRepository.save(session);
      }

      const count = await sessionRepository.countByUserId(testUserId);
      expect(count).toBe(3);
    });

    it('should not count expired sessions', async () => {
      const activeSession = createTestSession({ userId: testUserId });
      const expiredSession = createTestSession({
        userId: testUserId,
        expiresInDays: -1,
      });

      await sessionRepository.save(activeSession);
      await sessionRepository.save(expiredSession);

      const count = await sessionRepository.countByUserId(testUserId);
      expect(count).toBe(1);
    });
  });

  describe('session lifecycle', () => {
    it('should handle complete session lifecycle', async () => {
      // 1. Create session
      const refreshToken = generateTestRefreshToken();
      const session = createTestSession({
        userId: testUserId,
        refreshToken,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
      await sessionRepository.save(session);

      // 2. Find by token
      const found = await sessionRepository.findByTokenHash(refreshToken);
      expect(found).not.toBeNull();

      // 3. Rotate token
      const newToken = generateTestRefreshToken();
      found!.rotateToken(newToken);
      await sessionRepository.save(found!);

      // 4. Old token should not work
      const oldTokenSession = await sessionRepository.findByTokenHash(
        refreshToken
      );
      expect(oldTokenSession).toBeNull();

      // 5. New token should work
      const newTokenSession = await sessionRepository.findByTokenHash(newToken);
      expect(newTokenSession).not.toBeNull();

      // 6. Delete session (logout)
      await sessionRepository.delete(session.id);

      // 7. Session should not exist
      const deletedSession = await sessionRepository.findById(session.id);
      expect(deletedSession).toBeNull();
    });

    it('should handle multiple devices correctly', async () => {
      // User logs in from 3 devices
      const sessions = createTestMultiDeviceSessions(testUserId);
      for (const session of sessions) {
        await sessionRepository.save(session);
      }

      // Count active sessions
      const count = await sessionRepository.countByUserId(testUserId);
      expect(count).toBe(3);

      // Logout from one device
      await sessionRepository.delete(sessions[0].id);

      // Should have 2 sessions remaining
      const remaining = await sessionRepository.findByUserId(testUserId);
      expect(remaining).toHaveLength(2);

      // Logout from all devices
      await sessionRepository.deleteAllForUser(testUserId);

      // Should have no sessions
      const finalCount = await sessionRepository.countByUserId(testUserId);
      expect(finalCount).toBe(0);
    });
  });
});
