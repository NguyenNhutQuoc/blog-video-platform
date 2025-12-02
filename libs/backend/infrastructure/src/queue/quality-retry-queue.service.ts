/**
 * Quality Retry Queue Service
 *
 * Separate BullMQ queue for retrying individual video quality encoding failures
 * with priority-based processing (360p/480p get higher priority than 720p/1080p)
 */

import { Queue, QueueEvents, Job } from 'bullmq';
import type { RedisOptions } from 'ioredis';

/** Queue name for quality retry jobs */
export const QUALITY_RETRY_QUEUE = 'quality-retry';

export interface QualityRetryJobData {
  videoId: string;
  qualityName: string; // '360p', '480p', '720p', '1080p'
  rawFilePath: string;
  retryCount: number;
  priority: number; // 1 (highest) - 4 (lowest)
}

export interface QualityRetryQueueConfig {
  redis: RedisOptions;
}

export class QualityRetryQueueService {
  private queue: Queue<QualityRetryJobData>;
  private queueEvents: QueueEvents;

  constructor(config: QualityRetryQueueConfig) {
    this.queue = new Queue<QualityRetryJobData>(QUALITY_RETRY_QUEUE, {
      connection: config.redis,
      defaultJobOptions: {
        attempts: 3, // Max 3 retry attempts
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10s
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 500,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    });

    this.queueEvents = new QueueEvents(QUALITY_RETRY_QUEUE, {
      connection: config.redis,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`✅ Quality retry job ${jobId} completed:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Quality retry job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📊 Quality retry job ${jobId} progress:`, data);
    });
  }

  /**
   * Add a quality retry job with priority
   * Lower priority number = processed first
   */
  async addRetryJob(data: QualityRetryJobData): Promise<string> {
    const job = await this.queue.add('retry-quality', data, {
      jobId: `retry-${data.videoId}-${data.qualityName}`,
      // BullMQ priority: lower number = higher priority
      priority: data.priority,
    });

    console.log(
      `📤 Queued retry for ${data.videoId}/${data.qualityName} (priority: ${data.priority}), Job ID: ${job.id}`
    );
    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<Job<QualityRetryJobData> | null> {
    return (await this.queue.getJob(jobId)) ?? null;
  }

  /**
   * Cancel a retry job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) return false;

    const state = await job.getState();
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      console.log(`🗑️ Cancelled retry job ${jobId}`);
      return true;
    }

    return false;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
    console.log('📦 Quality retry queue service closed');
  }

  /**
   * Get the underlying BullMQ queue for advanced operations
   */
  getQueue(): Queue<QualityRetryJobData> {
    return this.queue;
  }
}

/**
 * Factory function to create QualityRetryQueueService
 */
export function createQualityRetryQueueService(
  config: QualityRetryQueueConfig
): QualityRetryQueueService {
  return new QualityRetryQueueService(config);
}
