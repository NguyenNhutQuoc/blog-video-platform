import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserEntity, UserCreate } from '../entities/user.entity.js';

describe('UserEntity', () => {
  let validUserData: UserCreate;

  beforeEach(() => {
    validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      passwordHash:
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7BYqt4Yy.e',
      fullName: 'Test User',
      bio: 'Test bio',
      avatarUrl: null,
      deletedAt: null,
      socialLinks: {},
      emailVerified: false,
      isActive: true,
      isAdmin: false,
      spamScore: 0,
    };
  });

  describe('create', () => {
    it('should create a valid user entity', () => {
      const user = UserEntity.create(validUserData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.emailVerified).toBe(false);
      expect(user.spamScore).toBe(0);
    });

    it('should throw error for invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      expect(() => UserEntity.create(invalidData)).toThrow();
    });

    it('should throw error for invalid username (uppercase)', () => {
      const invalidData = { ...validUserData, username: 'TestUser' };

      expect(() => UserEntity.create(invalidData)).toThrow();
    });

    it('should throw error for invalid username (special chars)', () => {
      const invalidData = { ...validUserData, username: 'test@user' };

      expect(() => UserEntity.create(invalidData)).toThrow();
    });

    it('should accept valid username with dash and underscore', () => {
      const validData = { ...validUserData, username: 'test-user_123' };
      const user = UserEntity.create(validData);

      expect(user.username).toBe('test-user_123');
    });

    it('should throw error for spam score out of range', () => {
      const invalidData = { ...validUserData, spamScore: 101 };

      expect(() => UserEntity.create(invalidData)).toThrow();
    });
  });

  describe('business rules', () => {
    describe('canCreatePost', () => {
      it('should return false when email not verified', () => {
        const user = UserEntity.create({
          ...validUserData,
          emailVerified: false,
        });

        expect(user.canCreatePost()).toBe(false);
      });

      it('should return false when user is blocked (spam >= 5)', () => {
        const user = UserEntity.create({
          ...validUserData,
          emailVerified: true,
          spamScore: 5,
        });

        expect(user.canCreatePost()).toBe(false);
      });

      it('should return false when user is inactive', () => {
        const user = UserEntity.create({
          ...validUserData,
          emailVerified: true,
          isActive: false,
        });

        expect(user.canCreatePost()).toBe(false);
      });

      it('should return true when all conditions met', () => {
        const user = UserEntity.create({
          ...validUserData,
          emailVerified: true,
        });

        expect(user.canCreatePost()).toBe(true);
      });
    });

    describe('canEdit', () => {
      it('should allow user to edit own content', () => {
        const user = UserEntity.create(validUserData);

        expect(user.canEdit(user.id)).toBe(true);
      });

      it('should not allow user to edit others content', () => {
        const user = UserEntity.create(validUserData);
        const otherId = crypto.randomUUID();

        expect(user.canEdit(otherId)).toBe(false);
      });

      it('should allow admin to edit any content', () => {
        const admin = UserEntity.create({ ...validUserData, isAdmin: true });
        const otherId = crypto.randomUUID();

        expect(admin.canEdit(otherId)).toBe(true);
      });
    });

    describe('isBlocked', () => {
      it('should return true when spam score >= 5', () => {
        const user = UserEntity.create({ ...validUserData, spamScore: 5 });

        expect(user.isBlocked).toBe(true);
      });

      it('should return false when spam score < 5', () => {
        const user = UserEntity.create({ ...validUserData, spamScore: 4 });

        expect(user.isBlocked).toBe(false);
      });
    });
  });

  describe('methods', () => {
    it('should verify email', () => {
      const user = UserEntity.create({
        ...validUserData,
        emailVerified: false,
      });

      expect(user.emailVerified).toBe(false);

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
    });

    it('should increment spam score', () => {
      const user = UserEntity.create({ ...validUserData, spamScore: 0 });

      user.incrementSpamScore();
      expect(user.spamScore).toBe(1);

      user.incrementSpamScore();
      expect(user.spamScore).toBe(2);
    });

    it('should not exceed spam score max (100)', () => {
      const user = UserEntity.create({ ...validUserData, spamScore: 100 });

      user.incrementSpamScore();

      expect(user.spamScore).toBe(100);
    });

    it('should update profile', () => {
      const user = UserEntity.create(validUserData);

      user.updateProfile({
        fullName: 'Updated Name',
        bio: 'Updated bio',
      });

      const json = user.toJSON();
      expect(json.fullName).toBe('Updated Name');
      expect(json.bio).toBe('Updated bio');
    });

    it('should soft delete user', () => {
      const user = UserEntity.create(validUserData);

      user.softDelete();

      const json = user.toJSON();
      expect(json.deletedAt).toBeInstanceOf(Date);
      expect(json.isActive).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const user = UserEntity.create(validUserData);
      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email');
      expect(json).toHaveProperty('username');
      expect(json).toHaveProperty('createdAt');
    });

    it('should serialize to profile (public fields only)', () => {
      const user = UserEntity.create(validUserData);
      const profile = user.toProfile();

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('username');
      expect(profile).toHaveProperty('fullName');
      expect(profile).toHaveProperty('bio');
      expect(profile).toHaveProperty('avatarUrl');
      expect(profile).not.toHaveProperty('email');
      expect(profile).not.toHaveProperty('passwordHash');
    });
  });
});
