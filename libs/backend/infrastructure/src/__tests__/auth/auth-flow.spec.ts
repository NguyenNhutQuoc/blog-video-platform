/**
 * Auth Flow Integration Tests
 *
 * Tests the complete authentication flow including
 * registration, login, token refresh, and logout.
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
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import { PostgresSessionRepository } from '../../repositories/session.repository.js';
import { BcryptPasswordHasher } from '../../auth/password-hasher.js';
import { JwtTokenGenerator } from '../../auth/token-generator.js';
import { RegisterUserUseCase } from '@blog/backend/core';
import { LoginUserUseCase } from '@blog/backend/core';
import { RefreshTokenUseCase } from '@blog/backend/core';
import { LogoutUserUseCase } from '@blog/backend/core';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';

// Test JWT configuration
const jwtConfig = {
  accessTokenSecret: 'test-access-secret-key-must-be-long-enough',
  refreshTokenSecret: 'test-refresh-secret-key-must-be-long-enough',
  accessTokenExpiresInSeconds: 900, // 15 minutes
  refreshTokenExpiresInSeconds: 604800, // 7 days
  issuer: 'test-issuer',
  audience: 'test-audience',
};

describe('Auth Flow Integration', () => {
  let db: Kysely<Database>;
  let userRepository: PostgresUserRepository;
  let sessionRepository: PostgresSessionRepository;
  let passwordHasher: BcryptPasswordHasher;
  let tokenGenerator: JwtTokenGenerator;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;
  let refreshTokenUseCase: RefreshTokenUseCase;
  let logoutUseCase: LogoutUserUseCase;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;

    // Create repositories
    userRepository = new PostgresUserRepository(db);
    sessionRepository = new PostgresSessionRepository(db);

    // Create services
    passwordHasher = new BcryptPasswordHasher();
    tokenGenerator = new JwtTokenGenerator(jwtConfig);

    // Create use cases with dependency injection
    registerUseCase = new RegisterUserUseCase({
      userRepository,
      sessionRepository,
      passwordHasher,
      tokenGenerator,
    });
    loginUseCase = new LoginUserUseCase({
      userRepository,
      sessionRepository,
      passwordHasher,
      tokenGenerator,
    });
    refreshTokenUseCase = new RefreshTokenUseCase({
      userRepository,
      sessionRepository,
      tokenGenerator,
    });
    logoutUseCase = new LogoutUserUseCase({
      sessionRepository,
      tokenGenerator,
    });
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const result = await registerUseCase.execute({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'Password123!',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('newuser@example.com');
        expect(result.data.user.username).toBe('newuser');
        expect(result.data.tokens.accessToken).toBeDefined();
        expect(result.data.tokens.refreshToken).toBeDefined();
      }
    });

    it('should reject duplicate email', async () => {
      // Register first user
      await registerUseCase.execute({
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'Password123!',
      });

      // Try to register with same email
      const result = await registerUseCase.execute({
        email: 'existing@example.com',
        username: 'differentuser',
        password: 'Password123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('email');
      }
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await registerUseCase.execute({
        email: 'first@example.com',
        username: 'sameusername',
        password: 'Password123!',
      });

      // Try to register with same username
      const result = await registerUseCase.execute({
        email: 'second@example.com',
        username: 'sameusername',
        password: 'Password123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('username');
      }
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await registerUseCase.execute({
        email: 'logintest@example.com',
        username: 'loginuser',
        password: 'Password123!',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const result = await loginUseCase.execute({
        email: 'logintest@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tokens.accessToken).toBeDefined();
        expect(result.data.tokens.refreshToken).toBeDefined();
        expect(result.data.user.email).toBe('logintest@example.com');
      }
    });

    it('should reject invalid email', async () => {
      const result = await loginUseCase.execute({
        email: 'nonexistent@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid');
      }
    });

    it('should reject invalid password', async () => {
      const result = await loginUseCase.execute({
        email: 'logintest@example.com',
        password: 'WrongPassword123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid');
      }
    });
  });

  describe('Token Refresh Flow', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Create user and login to get tokens
      await registerUseCase.execute({
        email: 'refreshtest@example.com',
        username: 'refreshuser',
        password: 'Password123!',
      });

      const loginResult = await loginUseCase.execute({
        email: 'refreshtest@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      if (loginResult.success) {
        validRefreshToken = loginResult.data.tokens.refreshToken;
      }
    });

    it('should refresh tokens with valid refresh token', async () => {
      const result = await refreshTokenUseCase.execute({
        refreshToken: validRefreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tokens.accessToken).toBeDefined();
        expect(result.data.tokens.refreshToken).toBeDefined();
        // New tokens should be different
        expect(result.data.tokens.refreshToken).not.toBe(validRefreshToken);
      }
    });

    it('should reject invalid refresh token', async () => {
      const result = await refreshTokenUseCase.execute({
        refreshToken: 'invalid-token',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(false);
    });

    it('should invalidate old refresh token after refresh', async () => {
      // First refresh
      await refreshTokenUseCase.execute({
        refreshToken: validRefreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      // Try to use old token again
      const result = await refreshTokenUseCase.execute({
        refreshToken: validRefreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and login
      await registerUseCase.execute({
        email: 'logouttest@example.com',
        username: 'logoutuser',
        password: 'Password123!',
      });

      const loginResult = await loginUseCase.execute({
        email: 'logouttest@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      if (loginResult.success) {
        refreshToken = loginResult.data.tokens.refreshToken;
      }
    });

    it('should logout successfully', async () => {
      const result = await logoutUseCase.execute({ refreshToken });
      expect(result.success).toBe(true);
    });

    it('should invalidate refresh token after logout', async () => {
      // Logout
      await logoutUseCase.execute({ refreshToken });

      // Try to refresh with logged out token
      const result = await refreshTokenUseCase.execute({
        refreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete auth lifecycle', async () => {
      // 1. Register
      const registerResult = await registerUseCase.execute({
        email: 'journey@example.com',
        username: 'journeyuser',
        password: 'Password123!',
      });
      expect(registerResult.success).toBe(true);

      // 2. Login
      const loginResult = await loginUseCase.execute({
        email: 'journey@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });
      expect(loginResult.success).toBe(true);

      if (!loginResult.success) return;

      // 3. Refresh Token
      const refreshResult = await refreshTokenUseCase.execute({
        refreshToken: loginResult.data.tokens.refreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });
      expect(refreshResult.success).toBe(true);

      if (!refreshResult.success) return;

      // 4. Logout
      const logoutResult = await logoutUseCase.execute({
        refreshToken: refreshResult.data.tokens.refreshToken,
      });
      expect(logoutResult.success).toBe(true);

      // 5. Verify can't refresh after logout
      const failedRefresh = await refreshTokenUseCase.execute({
        refreshToken: refreshResult.data.tokens.refreshToken,
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });
      expect(failedRefresh.success).toBe(false);

      // 6. Can still login again
      const reloginResult = await loginUseCase.execute({
        email: 'journey@example.com',
        password: 'Password123!',
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
      });
      expect(reloginResult.success).toBe(true);
    });
  });
});
