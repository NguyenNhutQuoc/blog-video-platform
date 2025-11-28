import { describe, it, expect } from '@jest/globals';
import { Email } from '../value-objects/email.vo.js';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('Test@Example.COM');

      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('USER@DOMAIN.COM');

      expect(email.getValue()).toBe('user@domain.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  user@example.com  ');

      expect(email.getValue()).toBe('user@example.com');
    });

    it('should throw error for invalid email', () => {
      expect(() => Email.create('invalid-email')).toThrow();
      expect(() => Email.create('missing@')).toThrow();
      expect(() => Email.create('@nodomain.com')).toThrow();
    });

    it('should throw error for email too long', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(() => Email.create(longEmail)).toThrow();
    });
  });

  describe('fromPersistence', () => {
    it('should create email without validation', () => {
      const email = Email.fromPersistence('stored@email.com');

      expect(email.getValue()).toBe('stored@email.com');
    });
  });

  describe('getDomain', () => {
    it('should return domain part', () => {
      const email = Email.create('user@example.com');

      expect(email.getDomain()).toBe('example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should return local part', () => {
      const email = Email.create('user@example.com');

      expect(email.getLocalPart()).toBe('user');
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const email = Email.create('test@example.com');

      expect(email.toString()).toBe('test@example.com');
    });

    it('should convert to JSON', () => {
      const email = Email.create('test@example.com');

      expect(email.toJSON()).toBe('test@example.com');
    });
  });
});
