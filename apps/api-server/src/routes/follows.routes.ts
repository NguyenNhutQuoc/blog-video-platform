/**
 * Follows Routes
 *
 * Handles user follow/unfollow endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  FollowUserUseCase,
  UnfollowUserUseCase,
  GetFollowersUseCase,
  GetFollowingUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { FollowRoutesDependencies } from './types.js';

export function createFollowsRoutes(deps: FollowRoutesDependencies): Router {
  const router = Router();

  const followUserUseCase = new FollowUserUseCase({
    followRepository: deps.followRepository,
    userRepository: deps.userRepository,
  });

  const unfollowUserUseCase = new UnfollowUserUseCase({
    followRepository: deps.followRepository,
    userRepository: deps.userRepository,
  });

  const getFollowersUseCase = new GetFollowersUseCase({
    followRepository: deps.followRepository,
    userRepository: deps.userRepository,
  });

  const getFollowingUseCase = new GetFollowingUseCase({
    followRepository: deps.followRepository,
    userRepository: deps.userRepository,
  });

  /**
   * @openapi
   * /api/users/{username}/follow:
   *   post:
   *     summary: Follow a user
   *     description: Follow another user
   *     tags: [Follows]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *         description: Username of the user to follow
   *     responses:
   *       200:
   *         description: Successfully followed user
   *       400:
   *         description: Cannot follow yourself or already following
   *       401:
   *         description: Authentication required
   *       404:
   *         description: User not found
   */
  router.post(
    '/:username/follow',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await followUserUseCase.execute({
        followerId: req.user.userId,
        followingUsername: req.params.username,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_INACTIVE'
            ? 403
            : 500;
        throw createError(result.error.message, statusCode, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/users/{username}/follow:
   *   delete:
   *     summary: Unfollow a user
   *     description: Unfollow a user you're currently following
   *     tags: [Follows]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *         description: Username of the user to unfollow
   *     responses:
   *       200:
   *         description: Successfully unfollowed user
   *       400:
   *         description: Not following this user
   *       401:
   *         description: Authentication required
   *       404:
   *         description: User not found
   */
  router.delete(
    '/:username/follow',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await unfollowUserUseCase.execute({
        followerId: req.user.userId,
        followingUsername: req.params.username,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
            : 500;
        throw createError(result.error.message, statusCode, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/users/{username}/followers:
   *   get:
   *     summary: Get user's followers
   *     description: Retrieves paginated list of a user's followers
   *     tags: [Follows]
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
   *         description: Pagination cursor
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *     responses:
   *       200:
   *         description: List of followers
   *       404:
   *         description: User not found
   */
  router.get(
    '/:username/followers',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getFollowersUseCase.execute({
        username: req.params.username,
        currentUserId: req.user?.userId,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
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
   * /api/users/{username}/following:
   *   get:
   *     summary: Get users that a user follows
   *     description: Retrieves paginated list of users the specified user follows
   *     tags: [Follows]
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
   *         description: Pagination cursor
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *     responses:
   *       200:
   *         description: List of following
   *       404:
   *         description: User not found
   */
  router.get(
    '/:username/following',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getFollowingUseCase.execute({
        username: req.params.username,
        currentUserId: req.user?.userId,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
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

  return router;
}
