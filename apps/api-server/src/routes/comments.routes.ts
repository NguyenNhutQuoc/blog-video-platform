/**
 * Comments Routes
 *
 * Handles comment CRUD endpoints including likes.
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  CreateCommentUseCase,
  DeleteCommentUseCase,
  GetPostCommentsUseCase,
  LikeCommentUseCase,
  UnlikeCommentUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import { createCommentRateLimiter } from '../middleware/rate-limit.middleware.js';
import type { CommentRoutesDependencies } from './types.js';

// Type for authenticated request with incrementCommentCount
type AuthenticatedRequest = Request & {
  user?: { userId: string };
  incrementCommentCount?: () => Promise<void>;
};

export function createCommentsRoutes(deps: CommentRoutesDependencies): Router {
  const router = Router();

  const createCommentUseCase = new CreateCommentUseCase({
    commentRepository: deps.commentRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const deleteCommentUseCase = new DeleteCommentUseCase({
    commentRepository: deps.commentRepository,
    userRepository: deps.userRepository,
  });

  const getPostCommentsUseCase = new GetPostCommentsUseCase({
    commentRepository: deps.commentRepository,
    commentLikeRepository: deps.commentLikeRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const likeCommentUseCase = new LikeCommentUseCase({
    commentLikeRepository: deps.commentLikeRepository,
    commentRepository: deps.commentRepository,
    userRepository: deps.userRepository,
  });

  const unlikeCommentUseCase = new UnlikeCommentUseCase({
    commentLikeRepository: deps.commentLikeRepository,
    commentRepository: deps.commentRepository,
    userRepository: deps.userRepository,
  });

  // Create rate limiter middleware if Redis config is provided
  let commentRateLimiter: RequestHandler | null = null;
  if (deps.redisConfig) {
    commentRateLimiter = createCommentRateLimiter({
      redis: deps.redisConfig,
      maxCommentsPerDay: 50,
    });
  }

  /**
   * @openapi
   * /api/posts/{postId}/comments:
   *   get:
   *     summary: Get comments for a post
   *     description: Retrieves paginated comments for a post. Use parentId to get replies.
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Parent comment ID to get replies. Omit for root comments.
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
   *           maximum: 50
   *           default: 20
   *     responses:
   *       200:
   *         description: List of comments
   *       404:
   *         description: Post not found
   */
  router.get(
    '/posts/:postId/comments',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      console.log('GET /comments - req.user:', req.user);
      console.log(
        'GET /comments - Authorization header:',
        req.headers.authorization ? 'Present' : 'Missing'
      );
      const result = await getPostCommentsUseCase.execute({
        postId: req.params.postId,
        parentId: req.query.parentId as string | undefined,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        orderBy: req.query.orderBy as 'createdAt' | 'likeCount' | undefined,
        orderDir: req.query.orderDir as 'asc' | 'desc' | undefined,
        userId: req.user?.userId,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'COMMENT_NOT_FOUND'
            ? 404
            : 500;
        throw createError(result.error.message, statusCode, result.error.code);
      }

      res.json({
        success: true,
        data: result.data.data,
        nextCursor: result.data.nextCursor,
        hasMore: result.data.hasMore,
        total: result.data.total,
      });
    })
  );

  // Build middleware chain for POST - include rate limiter if available
  const createCommentMiddlewares: RequestHandler[] = [deps.authMiddleware];
  if (commentRateLimiter) {
    createCommentMiddlewares.push(commentRateLimiter);
  }

  /**
   * @openapi
   * /api/posts/{postId}/comments:
   *   post:
   *     summary: Create a comment
   *     description: Creates a new comment on a post. Use parentId to reply to a comment. Rate limited to 50 comments per day.
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *               parentId:
   *                 type: string
   *                 format: uuid
   *                 description: Parent comment ID for replies
   *     responses:
   *       201:
   *         description: Comment created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Post or parent comment not found
   *       429:
   *         description: Daily comment limit exceeded (50 per day)
   */
  router.post(
    '/posts/:postId/comments',
    ...createCommentMiddlewares,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await createCommentUseCase.execute({
        userId: req.user.userId,
        postId: req.params.postId,
        content: req.body.content,
        parentId: req.body.parentId,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'USER_INACTIVE'
            ? 403
            : 400;
        throw createError(
          result.error.message,
          statusCode,
          result.error.code,
          result.error.details
        );
      }

      // Increment comment count in Redis after successful creation
      if (req.incrementCommentCount) {
        await req.incrementCommentCount();
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/comments/{id}:
   *   delete:
   *     summary: Delete a comment
   *     description: Soft deletes a comment (owner or admin only)
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized to delete this comment
   *       404:
   *         description: Comment not found
   */
  router.delete(
    '/comments/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await deleteCommentUseCase.execute({
        commentId: req.params.id,
        userId: req.user.userId,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'COMMENT_NOT_FOUND'
            ? 404
            : result.error.code === 'UNAUTHORIZED'
            ? 403
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
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
   * /api/comments/{id}/like:
   *   post:
   *     summary: Like a comment
   *     description: Adds a like to a comment from the authenticated user
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Comment liked successfully
   *       400:
   *         description: Already liked
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Comment not found
   */
  router.post(
    '/comments/:id/like',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await likeCommentUseCase.execute({
        userId: req.user.userId,
        commentId: req.params.id,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'COMMENT_NOT_FOUND'
            ? 404
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'ALREADY_LIKED'
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
   * /api/comments/{id}/like:
   *   delete:
   *     summary: Unlike a comment
   *     description: Removes a like from a comment from the authenticated user
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Comment unliked successfully
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Comment or like not found
   */
  router.delete(
    '/comments/:id/like',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await unlikeCommentUseCase.execute({
        userId: req.user.userId,
        commentId: req.params.id,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'COMMENT_NOT_FOUND'
            ? 404
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'NOT_LIKED'
            ? 404
            : 500;
        throw createError(result.error.message, statusCode, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  return router;
}
