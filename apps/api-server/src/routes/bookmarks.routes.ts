/**
 * Bookmarks Routes
 *
 * Handles bookmark and bookmark folder endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  BookmarkPostUseCase,
  UnbookmarkPostUseCase,
  UpdateBookmarkUseCase,
  GetUserBookmarksUseCase,
  CreateBookmarkFolderUseCase,
  UpdateBookmarkFolderUseCase,
  DeleteBookmarkFolderUseCase,
  GetUserFoldersUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { BookmarkRoutesDependencies } from './types.js';

// Validation schemas
const bookmarkPostSchema = z.object({
  folderId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

const updateBookmarkSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export function createBookmarksRoutes(
  deps: BookmarkRoutesDependencies
): Router {
  const router = Router();

  // Initialize use cases
  const bookmarkPostUseCase = new BookmarkPostUseCase({
    bookmarkRepository: deps.bookmarkRepository,
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const unbookmarkPostUseCase = new UnbookmarkPostUseCase({
    bookmarkRepository: deps.bookmarkRepository,
  });

  const updateBookmarkUseCase = new UpdateBookmarkUseCase({
    bookmarkRepository: deps.bookmarkRepository,
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
  });

  const getUserBookmarksUseCase = new GetUserBookmarksUseCase({
    bookmarkRepository: deps.bookmarkRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
  });

  const createFolderUseCase = new CreateBookmarkFolderUseCase({
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
  });

  const updateFolderUseCase = new UpdateBookmarkFolderUseCase({
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
  });

  const deleteFolderUseCase = new DeleteBookmarkFolderUseCase({
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
    bookmarkRepository: deps.bookmarkRepository,
  });

  const getUserFoldersUseCase = new GetUserFoldersUseCase({
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
  });

  /**
   * @openapi
   * /api/posts/{id}/bookmark:
   *   post:
   *     summary: Bookmark a post
   *     description: Add a post to bookmarks with optional folder and note
   *     tags: [Bookmarks]
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
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               folderId:
   *                 type: string
   *                 format: uuid
   *               note:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       200:
   *         description: Post bookmarked successfully
   *       400:
   *         description: Already bookmarked or validation error
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Post not found
   */
  router.post(
    '/posts/:id/bookmark',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      // Validate request body
      const validation = bookmarkPostSchema.safeParse(req.body);
      if (!validation.success) {
        throw createError(
          validation.error.issues[0].message,
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await bookmarkPostUseCase.execute({
        userId: req.user.userId,
        postId: req.params.id,
        folderId: validation.data.folderId,
        note: validation.data.note,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'POST_NOT_FOUND' ||
          result.error.code === 'NOT_FOUND'
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
   * /api/posts/{id}/bookmark:
   *   delete:
   *     summary: Remove bookmark
   *     description: Remove a post from bookmarks
   *     tags: [Bookmarks]
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
   *         description: Bookmark removed successfully
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Bookmark not found
   */
  router.delete(
    '/posts/:id/bookmark',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await unbookmarkPostUseCase.execute({
        userId: req.user.userId,
        postId: req.params.id,
      });

      if (!result.success) {
        const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 400;
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
   * /api/bookmarks/{id}:
   *   put:
   *     summary: Update bookmark
   *     description: Update bookmark folder or note
   *     tags: [Bookmarks]
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
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               folderId:
   *                 type: string
   *                 format: uuid
   *                 nullable: true
   *               note:
   *                 type: string
   *                 maxLength: 500
   *                 nullable: true
   *     responses:
   *       200:
   *         description: Bookmark updated successfully
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Bookmark not found
   */
  router.put(
    '/bookmarks/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      // Validate request body
      const validation = updateBookmarkSchema.safeParse(req.body);
      if (!validation.success) {
        throw createError(
          validation.error.issues[0].message,
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await updateBookmarkUseCase.execute({
        userId: req.user.userId,
        bookmarkId: req.params.id,
        folderId: validation.data.folderId,
        note: validation.data.note,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'NOT_FOUND'
            ? 404
            : result.error.code === 'FORBIDDEN'
            ? 403
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
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
   * /api/bookmarks:
   *   get:
   *     summary: Get user bookmarks
   *     description: Get bookmarks for current user with pagination
   *     tags: [Bookmarks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: folderId
   *         schema:
   *           type: string
   *           format: uuid
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
   *         description: Bookmarks retrieved successfully
   *       401:
   *         description: Authentication required
   */
  router.get(
    '/bookmarks',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const folderId = req.query.folderId as string | undefined;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      const result = await getUserBookmarksUseCase.execute({
        userId: req.user.userId,
        folderId,
        cursor,
        limit,
      });

      if (!result.success) {
        throw createError(result.error.message, 400, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/bookmarks/folders:
   *   get:
   *     summary: Get user folders
   *     description: Get all bookmark folders for current user
   *     tags: [Bookmarks]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Folders retrieved successfully
   *       401:
   *         description: Authentication required
   */
  router.get(
    '/bookmarks/folders',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await getUserFoldersUseCase.execute({
        userId: req.user.userId,
      });

      if (!result.success) {
        throw createError(result.error.message, 400, result.error.code);
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/bookmarks/folders:
   *   post:
   *     summary: Create bookmark folder
   *     description: Create a new folder for organizing bookmarks
   *     tags: [Bookmarks]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               description:
   *                 type: string
   *                 maxLength: 200
   *               color:
   *                 type: string
   *                 pattern: ^#[0-9A-Fa-f]{6}$
   *     responses:
   *       200:
   *         description: Folder created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   */
  router.post(
    '/bookmarks/folders',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      // Validate request body
      const validation = createFolderSchema.safeParse(req.body);
      if (!validation.success) {
        throw createError(
          validation.error.issues[0].message,
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await createFolderUseCase.execute({
        userId: req.user.userId,
        name: validation.data.name,
        description: validation.data.description,
        color: validation.data.color,
      });

      if (!result.success) {
        const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 400;
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
   * /api/bookmarks/folders/{id}:
   *   put:
   *     summary: Update bookmark folder
   *     description: Update folder properties
   *     tags: [Bookmarks]
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
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               description:
   *                 type: string
   *                 maxLength: 200
   *                 nullable: true
   *               color:
   *                 type: string
   *                 pattern: ^#[0-9A-Fa-f]{6}$
   *                 nullable: true
   *               sortOrder:
   *                 type: integer
   *                 minimum: 0
   *     responses:
   *       200:
   *         description: Folder updated successfully
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Folder not found
   */
  router.put(
    '/bookmarks/folders/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      // Validate request body
      const validation = updateFolderSchema.safeParse(req.body);
      if (!validation.success) {
        throw createError(
          validation.error.issues[0].message,
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await updateFolderUseCase.execute({
        userId: req.user.userId,
        folderId: req.params.id,
        name: validation.data.name,
        description: validation.data.description,
        color: validation.data.color,
        sortOrder: validation.data.sortOrder,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'NOT_FOUND'
            ? 404
            : result.error.code === 'FORBIDDEN'
            ? 403
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
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
   * /api/bookmarks/folders/{id}:
   *   delete:
   *     summary: Delete bookmark folder
   *     description: Delete a folder (moves bookmarks to default folder)
   *     tags: [Bookmarks]
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
   *         description: Folder deleted successfully
   *       400:
   *         description: Cannot delete default folder
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Folder not found
   */
  router.delete(
    '/bookmarks/folders/:id',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await deleteFolderUseCase.execute({
        userId: req.user.userId,
        folderId: req.params.id,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'NOT_FOUND'
            ? 404
            : result.error.code === 'FORBIDDEN'
            ? 403
            : result.error.code === 'VALIDATION_ERROR'
            ? 400
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
