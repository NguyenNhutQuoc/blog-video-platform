/**
 * Video Repository Integration Tests
 *
 * Tests PostgresVideoRepository with real database operations.
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
import { PostgresVideoRepository } from '../../repositories/video.repository.js';
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import { PostgresPostRepository } from '../../repositories/post.repository.js';
import { VideoStatus } from '@blog/shared/domain';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';
import {
  createTestUser,
  createTestPost,
  createTestVideo,
  createTestReadyVideo,
  createTestProcessingVideo,
  createTestFailedVideo,
  createTestRetryableVideo,
  resetVideoCounter,
} from '../fixtures/index.js';

describe('PostgresVideoRepository', () => {
  let db: Kysely<Database>;
  let videoRepository: PostgresVideoRepository;
  let userRepository: PostgresUserRepository;
  let postRepository: PostgresPostRepository;
  let testUserId: string;
  let testPostId: string;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;
    videoRepository = new PostgresVideoRepository(db);
    userRepository = new PostgresUserRepository(db);
    postRepository = new PostgresPostRepository(db);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    resetVideoCounter();

    // Create test user and post
    const testUser = createTestUser({
      email: 'videoauthor@example.com',
      username: 'videoauthor',
    });
    await userRepository.save(testUser);
    testUserId = testUser.id;

    const testPost = createTestPost({ authorId: testUserId });
    await postRepository.save(testPost);
    testPostId = testPost.id;
  });

  describe('save', () => {
    it('should save a new video', async () => {
      // Arrange
      const video = createTestVideo({ postId: testPostId });

      // Act
      await videoRepository.save(video);

      // Assert
      const found = await videoRepository.findById(video.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(video.id);
      expect(found?.toJSON().originalFilename).toBe(
        video.toJSON().originalFilename
      );
    });

    it('should save video without post id', async () => {
      const video = createTestVideo({ postId: null });
      await videoRepository.save(video);

      const found = await videoRepository.findById(video.id);
      expect(found).not.toBeNull();
      expect(found?.toJSON().postId).toBeNull();
    });

    it('should update an existing video', async () => {
      // Arrange
      const video = createTestVideo({ postId: testPostId });
      await videoRepository.save(video);

      // Modify video status
      video.startProcessing();

      // Act
      await videoRepository.save(video);

      // Assert
      const found = await videoRepository.findById(video.id);
      expect(found?.status).toBe(VideoStatus.PROCESSING);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent video', async () => {
      const result = await videoRepository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('should find video by id', async () => {
      const video = createTestVideo({ postId: testPostId });
      await videoRepository.save(video);

      const found = await videoRepository.findById(video.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(video.id);
    });
  });

  describe('findByFilename', () => {
    it('should return null for non-existent filename', async () => {
      const result = await videoRepository.findByFilename('non-existent.mp4');
      expect(result).toBeNull();
    });

    it('should find video by filename', async () => {
      const video = createTestVideo({
        postId: testPostId,
        originalFilename: 'unique-test-video.mp4',
      });
      await videoRepository.save(video);

      const found = await videoRepository.findByFilename(
        'unique-test-video.mp4'
      );
      expect(found).not.toBeNull();
      expect(found?.toJSON().originalFilename).toBe('unique-test-video.mp4');
    });
  });

  describe('findByStatus', () => {
    it('should return empty array for no videos with status', async () => {
      const result = await videoRepository.findByStatus('ready');
      expect(result).toEqual([]);
    });

    it('should find all videos by status', async () => {
      const video1 = createTestProcessingVideo({ postId: testPostId });
      const video2 = createTestProcessingVideo({ postId: testPostId });
      const video3 = createTestReadyVideo({ postId: testPostId });

      await videoRepository.save(video1);
      await videoRepository.save(video2);
      await videoRepository.save(video3);

      const processingVideos = await videoRepository.findByStatus('processing');
      expect(processingVideos).toHaveLength(2);
      processingVideos.forEach((v) => {
        expect(v.status).toBe(VideoStatus.PROCESSING);
      });
    });

    it('should respect pagination options', async () => {
      for (let i = 0; i < 5; i++) {
        await videoRepository.save(
          createTestProcessingVideo({ postId: testPostId })
        );
      }

      const page1 = await videoRepository.findByStatus('processing', {
        limit: 2,
        offset: 0,
      });
      const page2 = await videoRepository.findByStatus('processing', {
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('findPendingProcessing', () => {
    it('should find videos pending processing', async () => {
      const uploading = createTestVideo({
        postId: testPostId,
        status: 'uploading',
      });
      const processing = createTestProcessingVideo({ postId: testPostId });
      const ready = createTestReadyVideo({ postId: testPostId });

      await videoRepository.save(uploading);
      await videoRepository.save(processing);
      await videoRepository.save(ready);

      const pending = await videoRepository.findPendingProcessing();

      expect(pending).toHaveLength(2);
      pending.forEach((v) => {
        expect(['uploading', 'processing']).toContain(v.status);
      });
    });

    it('should not include videos with max retries', async () => {
      const normalVideo = createTestProcessingVideo({ postId: testPostId });
      const maxRetriesVideo = createTestVideo({
        postId: testPostId,
        status: 'processing',
        retryCount: 3,
      });

      await videoRepository.save(normalVideo);
      await videoRepository.save(maxRetriesVideo);

      const pending = await videoRepository.findPendingProcessing();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(normalVideo.id);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await videoRepository.save(
          createTestProcessingVideo({ postId: testPostId })
        );
      }

      const pending = await videoRepository.findPendingProcessing(2);
      expect(pending).toHaveLength(2);
    });
  });

  describe('findFailedForRetry', () => {
    it('should find failed videos that can be retried', async () => {
      const retryable1 = createTestRetryableVideo({
        postId: testPostId,
        retryCount: 1,
      });
      const retryable2 = createTestRetryableVideo({
        postId: testPostId,
        retryCount: 2,
      });
      const maxRetries = createTestFailedVideo({
        postId: testPostId,
        retryCount: 3,
      });

      await videoRepository.save(retryable1);
      await videoRepository.save(retryable2);
      await videoRepository.save(maxRetries);

      const retryable = await videoRepository.findFailedForRetry(3);

      expect(retryable).toHaveLength(2);
      retryable.forEach((v) => {
        expect(v.retryCount).toBeLessThan(3);
      });
    });

    it('should return empty array when no retryable videos', async () => {
      const maxRetries = createTestFailedVideo({
        postId: testPostId,
        retryCount: 3,
      });
      await videoRepository.save(maxRetries);

      const retryable = await videoRepository.findFailedForRetry(3);
      expect(retryable).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update video status', async () => {
      const video = createTestVideo({ postId: testPostId });
      await videoRepository.save(video);

      await videoRepository.updateStatus(video.id, 'processing');

      const updated = await videoRepository.findById(video.id);
      expect(updated?.status).toBe('processing');
    });
  });

  describe('delete', () => {
    it('should permanently delete a video', async () => {
      const video = createTestVideo({ postId: testPostId });
      await videoRepository.save(video);

      await videoRepository.delete(video.id);

      const found = await videoRepository.findById(video.id);
      expect(found).toBeNull();
    });
  });

  describe('countByStatus', () => {
    it('should return 0 for no videos', async () => {
      const count = await videoRepository.countByStatus('ready');
      expect(count).toBe(0);
    });

    it('should count videos by status', async () => {
      await videoRepository.save(
        createTestProcessingVideo({ postId: testPostId })
      );
      await videoRepository.save(
        createTestProcessingVideo({ postId: testPostId })
      );
      await videoRepository.save(createTestReadyVideo({ postId: testPostId }));

      const processingCount = await videoRepository.countByStatus('processing');
      const readyCount = await videoRepository.countByStatus('ready');

      expect(processingCount).toBe(2);
      expect(readyCount).toBe(1);
    });
  });

  describe('findForCleanup', () => {
    it('should find ready videos with raw files older than threshold', async () => {
      const video = createTestReadyVideo({ postId: testPostId });
      await videoRepository.save(video);

      // Set processing_completed_at to old date
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      await db
        .updateTable('videos')
        .set({ processing_completed_at: oldDate })
        .where('id', '=', video.id)
        .execute();

      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 7);

      const toCleanup = await videoRepository.findForCleanup(threshold);

      expect(toCleanup).toHaveLength(1);
      expect(toCleanup[0].id).toBe(video.id);
    });

    it('should not include recent videos', async () => {
      const video = createTestReadyVideo({ postId: testPostId });
      await videoRepository.save(video);

      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 7);

      const toCleanup = await videoRepository.findForCleanup(threshold);

      expect(toCleanup).toHaveLength(0);
    });
  });

  describe('getTotalStorageByUser', () => {
    it('should return 0 for user with no videos', async () => {
      const storage = await videoRepository.getTotalStorageByUser(testUserId);
      expect(storage).toBe(0);
    });

    it('should sum file sizes for user videos', async () => {
      const video1 = createTestVideo({
        postId: testPostId,
        fileSize: 1000000, // 1 MB
      });
      const video2 = createTestVideo({
        postId: testPostId,
        fileSize: 2000000, // 2 MB
      });

      await videoRepository.save(video1);
      await videoRepository.save(video2);

      const storage = await videoRepository.getTotalStorageByUser(testUserId);
      expect(storage).toBe(3000000); // 3 MB
    });
  });
});
