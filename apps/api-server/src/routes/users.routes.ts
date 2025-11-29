/**
 * Users Routes
 *
 * Handles user profile endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  ListPostsUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { UserRoutesDependencies } from './types.js';

export function createUsersRoutes(deps: UserRoutesDependencies): Router {
  const router = Router();

  const getUserProfileUseCase = new GetUserProfileUseCase({
    userRepository: deps.userRepository,
    postRepository: deps.postRepository,
    followRepository: deps.followRepository,
  });

  const updateUserProfileUseCase = new UpdateUserProfileUseCase({
    userRepository: deps.userRepository,
  });

  const listPostsUseCase = new ListPostsUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  /**
   * @openapi
   * /api/users/me:
   *   put:
   *     summary: Update own profile
   *     description: Updates the authenticated user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *                 maxLength: 100
   *               bio:
   *                 type: string
   *                 maxLength: 500
   *               avatarUrl:
   *                 type: string
   *                 format: uri
   *               socialLinks:
   *                 type: object
   *                 additionalProperties:
   *                   type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   */
  router.put(
    '/me',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await updateUserProfileUseCase.execute({
        userId: req.user.userId,
        updates: {
          fullName: req.body.fullName,
          bio: req.body.bio,
          avatarUrl: req.body.avatarUrl,
          socialLinks: req.body.socialLinks,
        },
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : 500;
        throw createError(
          result.error.message,
          statusCode,
          result.error.code,
          result.error.details
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
   * /api/users/{username}:
   *   get:
   *     summary: Get user profile
   *     description: Retrieves a user's public profile with statistics
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User profile
   *       404:
   *         description: User not found
   */
  router.get(
    '/:username',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getUserProfileUseCase.execute({
        usernameOrId: req.params.username,
        currentUserId: req.user?.userId,
      });

      if (!result.success) {
        throw createError(
          result.error.message,
          result.error.code === 'USER_NOT_FOUND' ? 404 : 500,
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
   * /api/users/{username}/posts:
   *   get:
   *     summary: Get user's posts
   *     description: Retrieves paginated list of user's posts
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List of user's posts
   *       404:
   *         description: User not found
   */
  router.get(
    '/:username/posts',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      // First find the user by username
      const user = await deps.userRepository.findByUsername(
        req.params.username
      );
      if (!user || !user.isActive) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      const result = await listPostsUseCase.execute({
        authorId: user.id,
        userId: req.user?.userId,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
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

  return router;
}
