/**
 * Posts Routes
 *
 * Handles post CRUD endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  CreatePostUseCase,
  GetPostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  ListPostsUseCase,
  LikePostUseCase,
  UnlikePostUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { PostRoutesDependencies } from './types.js';

export function createPostsRoutes(deps: PostRoutesDependencies): Router {
  const router = Router();

  const createPostUseCase = new CreatePostUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    categoryRepository: deps.categoryRepository,
    tagRepository: deps.tagRepository,
  });

  const getPostUseCase = new GetPostUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    likeRepository: deps.likeRepository,
    bookmarkRepository: deps.bookmarkRepository,
  });

  const updatePostUseCase = new UpdatePostUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    categoryRepository: deps.categoryRepository,
    tagRepository: deps.tagRepository,
  });

  const deletePostUseCase = new DeletePostUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const listPostsUseCase = new ListPostsUseCase({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    bookmarkRepository: deps.bookmarkRepository,
  });

  const likePostUseCase = new LikePostUseCase({
    likeRepository: deps.likeRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const unlikePostUseCase = new UnlikePostUseCase({
    likeRepository: deps.likeRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  /**
   * @openapi
   * /api/posts:
   *   post:
   *     summary: Create a new post
   *     description: Creates a new blog post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *               - categoryIds
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 200
   *               content:
   *                 type: string
   *                 minLength: 50
   *               excerpt:
   *                 type: string
   *                 maxLength: 200
   *               featuredImageUrl:
   *                 type: string
   *                 format: uri
   *               categoryIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 minItems: 1
   *               tagIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 maxItems: 5
   *               status:
   *                 type: string
   *                 enum: [draft, published]
   *               visibility:
   *                 type: string
   *                 enum: [public, private, unlisted]
   *     responses:
   *       201:
   *         description: Post created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   */
  router.post(
    '/',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await createPostUseCase.execute({
        authorId: req.user.userId,
        title: req.body.title,
        content: req.body.content,
        excerpt: req.body.excerpt,
        featuredImageUrl: req.body.featuredImageUrl,
        categoryIds: req.body.categoryIds,
        tagIds: req.body.tagIds,
        videoId: req.body.videoId,
        status: req.body.status,
        visibility: req.body.visibility,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'EMAIL_NOT_VERIFIED'
            ? 403
            : 400;
        throw createError(
          result.error.message,
          statusCode,
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
   * /api/posts:
   *   get:
   *     summary: List posts
   *     description: Get paginated list of posts with optional filters
   *     tags: [Posts]
   *     parameters:
   *       - in: query
   *         name: authorId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by author ID
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by category ID
   *       - in: query
   *         name: tagId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by tag ID
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *         description: Pagination cursor (last post ID)
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of posts per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [publishedAt, viewCount, likeCount]
   *           default: publishedAt
   *       - in: query
   *         name: orderDir
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *     responses:
   *       200:
   *         description: List of posts
   */
  router.get(
    '/',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await listPostsUseCase.execute({
        authorId: req.query.authorId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        tagId: req.query.tagId as string | undefined,
        status: req.query.status as
          | 'draft'
          | 'published'
          | 'archived'
          | undefined,
        userId: req.user?.userId,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        orderBy: req.query.orderBy as
          | 'publishedAt'
          | 'viewCount'
          | 'likeCount'
          | undefined,
        orderDir: req.query.orderDir as 'asc' | 'desc' | undefined,
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
   * /api/posts/{idOrSlug}:
   *   get:
   *     summary: Get a post by ID or slug
   *     description: Retrieves a single post with author info
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: idOrSlug
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID (UUID) or slug
   *     responses:
   *       200:
   *         description: Post details
   *       404:
   *         description: Post not found
   */
  router.get(
    '/:idOrSlug',
    deps.optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getPostUseCase.execute({
        postIdOrSlug: req.params.idOrSlug,
        userId: req.user?.userId,
        trackView: true,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'FORBIDDEN'
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
   * /api/posts/{id}:
   *   put:
   *     summary: Update a post
   *     description: Updates an existing post (owner or admin only)
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               excerpt:
   *                 type: string
   *               categoryIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               tagIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               status:
   *                 type: string
   *                 enum: [draft, published, archived]
   *               visibility:
   *                 type: string
   *                 enum: [public, private, unlisted]
   *     responses:
   *       200:
   *         description: Post updated successfully
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized to edit this post
   *       404:
   *         description: Post not found
   */
  router.put(
    '/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await updatePostUseCase.execute({
        postId: req.params.id,
        userId: req.user.userId,
        updates: {
          title: req.body.title,
          content: req.body.content,
          excerpt: req.body.excerpt,
          featuredImageUrl: req.body.featuredImageUrl,
          categoryIds: req.body.categoryIds,
          tagIds: req.body.tagIds,
          status: req.body.status,
          visibility: req.body.visibility,
        },
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'UNAUTHORIZED_TO_EDIT'
            ? 403
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
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
   * /api/posts/{id}:
   *   delete:
   *     summary: Delete a post
   *     description: Soft deletes a post (owner or admin only)
   *     tags: [Posts]
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
   *         description: Post deleted successfully
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized to delete this post
   *       404:
   *         description: Post not found
   */
  router.delete(
    '/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await deletePostUseCase.execute({
        postId: req.params.id,
        userId: req.user.userId,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'UNAUTHORIZED_TO_EDIT'
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
   * /api/posts/{id}/like:
   *   post:
   *     summary: Like a post
   *     description: Adds a like to a post
   *     tags: [Posts]
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
   *         description: Post liked successfully
   *       400:
   *         description: Already liked
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Post not found
   */
  router.post(
    '/:id/like',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await likePostUseCase.execute({
        userId: req.user.userId,
        postId: req.params.id,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'USER_INACTIVE'
            ? 403
            : 400;
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
   * /api/posts/{id}/like:
   *   delete:
   *     summary: Unlike a post
   *     description: Removes a like from a post
   *     tags: [Posts]
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
   *         description: Post unliked successfully
   *       400:
   *         description: Not liked yet
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Post not found
   */
  router.delete(
    '/:id/like',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await unlikePostUseCase.execute({
        userId: req.user.userId,
        postId: req.params.id,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND'
            ? 404
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : 400;
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
