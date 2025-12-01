/**
 * Videos Routes
 *
 * Handles video upload and status endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  GenerateUploadUrlUseCase,
  ConfirmUploadUseCase,
  GetVideoStatusUseCase,
} from '@blog/backend/core';
import { asyncHandler, createError } from '../middleware/error.middleware.js';
import type { VideoRoutesDependencies } from './types.js';

export function createVideosRoutes(deps: VideoRoutesDependencies): Router {
  const router = Router();

  const generateUploadUrlUseCase = new GenerateUploadUrlUseCase({
    videoRepository: deps.videoRepository,
    userRepository: deps.userRepository,
    storageService: deps.storageService,
  });

  const confirmUploadUseCase = new ConfirmUploadUseCase({
    videoRepository: deps.videoRepository,
    storageService: deps.storageService,
    queueVideoForProcessing: deps.queueVideoForProcessing,
  });

  const getVideoStatusUseCase = new GetVideoStatusUseCase({
    videoRepository: deps.videoRepository,
    videoQueueService: deps.videoQueueService,
  });

  /**
   * @openapi
   * /api/videos/upload-url:
   *   post:
   *     summary: Generate presigned upload URL
   *     description: Generates a presigned URL for direct video upload to storage
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - filename
   *               - fileSize
   *               - mimeType
   *             properties:
   *               filename:
   *                 type: string
   *                 description: Original filename
   *                 example: my-video.mp4
   *               fileSize:
   *                 type: integer
   *                 description: File size in bytes (max 2GB)
   *                 example: 10485760
   *               mimeType:
   *                 type: string
   *                 description: Video MIME type
   *                 enum: [video/mp4, video/quicktime, video/x-msvideo, video/x-matroska]
   *                 example: video/mp4
   *     responses:
   *       200:
   *         description: Presigned URL generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     videoId:
   *                       type: string
   *                       format: uuid
   *                     uploadUrl:
   *                       type: string
   *                       format: uri
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   *       403:
   *         description: Email not verified
   */
  router.post(
    '/upload-url',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await generateUploadUrlUseCase.execute({
        userId: req.user.userId,
        filename: req.body.filename,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'USER_NOT_FOUND'
            ? 404
            : result.error.code === 'EMAIL_NOT_VERIFIED'
            ? 403
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

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  /**
   * @openapi
   * /api/videos/{videoId}/confirm:
   *   post:
   *     summary: Confirm video upload
   *     description: Confirms upload is complete and queues video for processing
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Video ID returned from upload-url endpoint
   *     responses:
   *       200:
   *         description: Video queued for processing
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     videoId:
   *                       type: string
   *                       format: uuid
   *                     status:
   *                       type: string
   *                       enum: [processing]
   *                     message:
   *                       type: string
   *       400:
   *         description: Upload not complete or already processed
   *       401:
   *         description: Authentication required
   *       404:
   *         description: Video not found
   */
  router.post(
    '/:videoId/confirm',
    deps.authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw createError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const result = await confirmUploadUseCase.execute({
        videoId: req.params.videoId,
        userId: req.user.userId,
      });

      if (!result.success) {
        const statusCode =
          result.error.code === 'NOT_FOUND'
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
   * /api/videos/{videoId}/status:
   *   get:
   *     summary: Get video processing status
   *     description: Returns current video status for polling during processing
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Video status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           format: uuid
   *                         status:
   *                           type: string
   *                           enum: [uploading, processing, ready, failed, cancelled]
   *                         progress:
   *                           type: integer
   *                           minimum: 0
   *                           maximum: 100
   *                         duration:
   *                           type: integer
   *                           nullable: true
   *                         thumbnailUrl:
   *                           type: string
   *                           nullable: true
   *                         hlsMasterUrl:
   *                           type: string
   *                           nullable: true
   *                         availableQualities:
   *                           type: array
   *                           items:
   *                             type: string
   *                             enum: ['1080p', '720p', '480p', '360p']
   *                         errorMessage:
   *                           type: string
   *                           nullable: true
   *       404:
   *         description: Video not found
   */
  router.get(
    '/:videoId/status',
    asyncHandler(async (req: Request, res: Response) => {
      const result = await getVideoStatusUseCase.execute({
        videoId: req.params.videoId,
      });

      if (!result.success) {
        const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
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
