import { describe, it, expect } from '@jest/globals';
import { Username } from '../value-objects/username.vo.js';

describe('Username Value Object', () => {
  describe('create', () => {
    it('should create a valid username', () => {
      const username = Username.create('testuser');

      expect(username.getValue()).toBe('testuser');
    });

    it('should convert to lowercase', () => {
      const username = Username.create('TestUser');

      expect(username.getValue()).toBe('testuser');
    });

    it('should allow username with dash and underscore', () => {
      const username = Username.create('test-user_123');

      expect(username.getValue()).toBe('test-user_123');
    });

    it('should throw error for username too short', () => {
      expect(() => Username.create('ab')).toThrow();
    });

    it('should throw error for username too long', () => {
      const longUsername = 'a'.repeat(51);
      expect(() => Username.create(longUsername)).toThrow();
    });

    it('should throw error for username with special characters', () => {
      expect(() => Username.create('test@user')).toThrow();
      expect(() => Username.create('test user')).toThrow();
      expect(() => Username.create('test.user')).toThrow();
    });

    it('should throw error for username starting with special char', () => {
      expect(() => Username.create('-testuser')).toThrow();
      expect(() => Username.create('_testuser')).toThrow();
    });

    it('should throw error for username ending with special char', () => {
      expect(() => Username.create('testuser-')).toThrow();
      expect(() => Username.create('testuser_')).toThrow();
    });

    it('should allow single character username if 3+ chars', () => {
      const username = Username.create('abc');
      expect(username.getValue()).toBe('abc');
    });
  });

  describe('isReserved', () => {
    it('should return true for reserved usernames', () => {
      expect(Username.isReserved('admin')).toBe(true);
      expect(Username.isReserved('ADMIN')).toBe(true);
      expect(Username.isReserved('root')).toBe(true);
      expect(Username.isReserved('support')).toBe(true);
    });

    it('should return false for non-reserved usernames', () => {
      expect(Username.isReserved('myuser')).toBe(false);
      expect(Username.isReserved('john123')).toBe(false);
    });
  });

  describe('fromPersistence', () => {
    it('should create username without validation', () => {
      const username = Username.fromPersistence('stored-user');

      expect(username.getValue()).toBe('stored-user');
    });
  });

  describe('equals', () => {
    it('should return true for same username', () => {
      const username1 = Username.create('testuser');
      const username2 = Username.create('testuser');

      expect(username1.equals(username2)).toBe(true);
    });

    it('should return false for different username', () => {
      const username1 = Username.create('testuser1');
      const username2 = Username.create('testuser2');

      expect(username1.equals(username2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const username = Username.create('testuser');

      expect(username.toString()).toBe('testuser');
    });

    it('should convert to JSON', () => {
      const username = Username.create('testuser');

      expect(username.toJSON()).toBe('testuser');
    });
  });
});
