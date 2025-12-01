/**
 * Tags Routes
 *
 * Handles tag listing and creation endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import type { TagRoutesDependencies } from './types.js';

export function createTagsRoutes(deps: TagRoutesDependencies): Router {
  const router = Router();

  /**
   * @openapi
   * /api/tags:
   *   get:
   *     summary: List all tags or search
   *     description: Returns all tags or searches by name
   *     tags: [Tags]
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Search query for tag name
   *     responses:
   *       200:
   *         description: List of tags
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     format: uuid
   *                   name:
   *                     type: string
   *                   slug:
   *                     type: string
   *                   usageCount:
   *                     type: integer
   */
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const query = req.query.q as string | undefined;

      let tags;
      if (query) {
        tags = await deps.tagRepository.search(query);
      } else {
        tags = await deps.tagRepository.findAll();
      }

      const tagDtos = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: tag.usageCount,
      }));
      res.json({
        data: tagDtos,
      });
    })
  );

  /**
   * @openapi
   * /api/tags/{id}:
   *   get:
   *     summary: Get tag by ID
   *     description: Returns a single tag by its ID
   *     tags: [Tags]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Tag details
   *       404:
   *         description: Tag not found
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const tag = await deps.tagRepository.findById(req.params.id);

      if (!tag) {
        res.status(404).json({
          success: false,
          error: { code: 'TAG_NOT_FOUND', message: 'Tag not found' },
        });
        return;
      }

      res.json({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: tag.usageCount,
      });
    })
  );

  /**
   * @openapi
   * /api/tags:
   *   post:
   *     summary: Create a new tag
   *     description: Creates a new tag or returns existing one
   *     tags: [Tags]
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
   *                 minLength: 2
   *                 maxLength: 50
   *     responses:
   *       201:
   *         description: Tag created
   *       200:
   *         description: Tag already exists (returns existing)
   *       400:
   *         description: Invalid input
   */
  router.post(
    '/',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.length < 2) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Tag name must be at least 2 characters',
          },
        });
        return;
      }

      if (name.length > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Tag name must be at most 50 characters',
          },
        });
        return;
      }

      // Check if tag already exists
      const existingTag = await deps.tagRepository.findByName(name);
      if (existingTag) {
        res.json({
          id: existingTag.id,
          name: existingTag.name,
          slug: existingTag.slug,
          usageCount: existingTag.usageCount,
        });
        return;
      }

      // Create new tag using findOrCreate
      const tag = await deps.tagRepository.findOrCreate(name);

      res.status(201).json({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: tag.usageCount,
      });
    })
  );

  return router;
}
