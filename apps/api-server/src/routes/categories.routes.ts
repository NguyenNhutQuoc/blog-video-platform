/**
 * Categories Routes
 *
 * Handles category listing endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import type { CategoryRoutesDependencies } from './types.js';

export function createCategoriesRoutes(
  deps: CategoryRoutesDependencies
): Router {
  const router = Router();

  /**
   * @openapi
   * /api/categories:
   *   get:
   *     summary: List all categories
   *     description: Returns all available categories for posts
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: List of categories
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
   *                   description:
   *                     type: string
   *                   color:
   *                     type: string
   *                   postCount:
   *                     type: integer
   */
  router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
      const categories = await deps.categoryRepository.findAll();

      res.json(
        categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          postCount: cat.postCount,
        }))
      );
    })
  );

  /**
   * @openapi
   * /api/categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     description: Returns a single category by its ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Category details
   *       404:
   *         description: Category not found
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const category = await deps.categoryRepository.findById(req.params.id);

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        });
        return;
      }

      res.json({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        postCount: category.postCount,
      });
    })
  );

  return router;
}
