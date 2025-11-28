/**
 * User Repository Integration Tests
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
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../../database/types.js';
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import { UserEntity } from '@blog/shared/domain';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';

describe('PostgresUserRepository', () => {
  let db: Kysely<Database>;
  let repository: PostgresUserRepository;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;
    repository = new PostgresUserRepository(db);
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  describe('save', () => {
    it('should save a new user', async () => {
      // Arrange
      const user = createTestUser();

      // Act
      await repository.save(user);

      // Assert
      const found = await repository.findById(user.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);
      expect(found?.email).toBe(user.email);
      expect(found?.username).toBe(user.username);
    });

    it('should update an existing user', async () => {
      // Arrange
      const user = createTestUser();
      await repository.save(user);

      // Modify user via updateProfile
      user.updateProfile({ fullName: 'Updated Name' });

      // Act
      await repository.save(user);

      // Assert
      const found = await repository.findById(user.id);
      const json = found?.toJSON();
      expect(json?.fullName).toBe('Updated Name');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent user', async () => {
      const result = await repository.findById(uuidv4());
      expect(result).toBeNull();
    });

    it('should find user by id', async () => {
      const user = createTestUser();
      await repository.save(user);

      const found = await repository.findById(user.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);
    });
  });

  describe('findByEmail', () => {
    it('should return null for non-existent email', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should find user by email', async () => {
      const user = createTestUser();
      await repository.save(user);

      const found = await repository.findByEmail(user.email);
      expect(found).not.toBeNull();
      expect(found?.email).toBe(user.email);
    });
  });

  describe('findByUsername', () => {
    it('should return null for non-existent username', async () => {
      const result = await repository.findByUsername('nonexistent');
      expect(result).toBeNull();
    });

    it('should find user by username', async () => {
      const user = createTestUser();
      await repository.save(user);

      const found = await repository.findByUsername(user.username);
      expect(found).not.toBeNull();
      expect(found?.username).toBe(user.username);
    });
  });

  describe('emailExists', () => {
    it('should return false for non-existent email', async () => {
      const result = await repository.emailExists('nonexistent@example.com');
      expect(result).toBe(false);
    });

    it('should return true for existing email', async () => {
      const user = createTestUser();
      await repository.save(user);

      const result = await repository.emailExists(user.email);
      expect(result).toBe(true);
    });
  });

  describe('usernameExists', () => {
    it('should return false for non-existent username', async () => {
      const result = await repository.usernameExists('nonexistent');
      expect(result).toBe(false);
    });

    it('should return true for existing username', async () => {
      const user = createTestUser();
      await repository.save(user);

      const result = await repository.usernameExists(user.username);
      expect(result).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user', async () => {
      const user = createTestUser();
      await repository.save(user);

      await repository.softDelete(user.id);

      // User should not be found anymore (deleted_at is not null)
      const found = await repository.findById(user.id);
      expect(found).toBeNull();
    });
  });
});

// Helper to create test users
function createTestUser(): UserEntity {
  const uniqueSuffix = Date.now();
  // Match the bcrypt hash format (60+ chars)
  const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW';
  return UserEntity.create({
    email: `test${uniqueSuffix}@example.com`,
    username: `testuser${uniqueSuffix}`,
    passwordHash: dummyHash,
    fullName: 'Test User',
    bio: null,
    avatarUrl: null,
    socialLinks: {},
    emailVerified: false,
    isActive: true,
    isAdmin: false,
    spamScore: 0,
    deletedAt: null,
  });
}
