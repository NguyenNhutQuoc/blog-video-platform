/**
 * Auth Routes
 *
 * Handles authentication endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  LogoutUserUseCase,
  LogoutAllUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { AuthRoutesDependencies } from './types.js';

export function createAuthRoutes(deps: AuthRoutesDependencies): Router {
  const router = Router();

  const registerUseCase = new RegisterUserUseCase({
    userRepository: deps.userRepository,
    sessionRepository: deps.sessionRepository,
    passwordHasher: deps.passwordHasher,
    tokenGenerator: deps.tokenGenerator,
  });

  const loginUseCase = new LoginUserUseCase({
    userRepository: deps.userRepository,
    sessionRepository: deps.sessionRepository,
    passwordHasher: deps.passwordHasher,
    tokenGenerator: deps.tokenGenerator,
  });

  const refreshTokenUseCase = new RefreshTokenUseCase({
    userRepository: deps.userRepository,
    sessionRepository: deps.sessionRepository,
    tokenGenerator: deps.tokenGenerator,
  });

  const logoutUseCase = new LogoutUserUseCase({
    sessionRepository: deps.sessionRepository,
    tokenGenerator: deps.tokenGenerator,
  });

  const logoutAllUseCase = new LogoutAllUseCase({
    sessionRepository: deps.sessionRepository,
    tokenGenerator: deps.tokenGenerator,
  });

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Creates a new user account and returns authentication tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User successfully registered
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserProfile'
   *                     tokens:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/register',
    asyncHandler(async (req: Request, res: Response) => {
      const result = await registerUseCase.execute({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        fullName: req.body.fullName,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      if (!result.success) {
        throw createError(
          result.error.message,
          result.error.code === 'VALIDATION_ERROR' ? 400 : 409,
          result.error.code,
          result.error.details
        );
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Login with email and password
   *     description: Authenticates a user and returns access and refresh tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserProfile'
   *                     tokens:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: User account is inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
      const result = await loginUseCase.execute({
        email: req.body.email,
        password: req.body.password,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      if (!result.success) {
        throw createError(
          result.error.message,
          result.error.code === 'USER_INACTIVE' ? 403 : 401,
          result.error.code
        );
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     description: Exchange a valid refresh token for a new access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenRequest'
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     tokens:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       400:
   *         description: Refresh token is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response) => {
      const refreshToken = req.body.refreshToken;

      if (!refreshToken) {
        throw createError('Refresh token is required', 400, 'VALIDATION_ERROR');
      }

      const result = await refreshTokenUseCase.execute({
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      if (!result.success) {
        throw createError(result.error.message, 401, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     summary: Logout current session
   *     description: Invalidates the provided refresh token
   *     tags: [Authentication]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Optional refresh token to invalidate
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Logged out successfully
   */
  router.post(
    '/logout',
    asyncHandler(async (req: Request, res: Response) => {
      const refreshToken = req.body.refreshToken;

      if (refreshToken) {
        await logoutUseCase.execute({ refreshToken });
      }

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    })
  );

  /**
   * @openapi
   * /api/auth/logout-all:
   *   post:
   *     summary: Logout from all devices
   *     description: Invalidates all sessions for the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All sessions invalidated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: All sessions revoked
   *                     revokedCount:
   *                       type: number
   *                       example: 3
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/logout-all',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await logoutAllUseCase.execute({
        userId: req.user.userId,
      });

      if (!result.success) {
        throw createError(result.error.message, 500, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     summary: Get current user info
   *     description: Returns the profile of the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/UserProfile'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/me',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const user = await deps.userRepository.findById(req.user.userId);

      if (!user) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          user: user.toProfile(),
        },
      });
    })
  );

  return router;
}
