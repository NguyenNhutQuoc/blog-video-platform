/**
 * BullMQ Video Queue Service Implementation
 *
 * Uses BullMQ for reliable video encoding job queue with Redis backend.
 * Features: Job persistence, retries, progress tracking, and monitoring.
 */

import { Queue, QueueEvents, Job } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import type {
  IVideoQueueService,
  EncodingJobData,
  JobStatus,
} from '@blog/backend/core';

/** Queue name for video encoding jobs */
export const VIDEO_ENCODING_QUEUE = 'video-encoding';

export interface VideoQueueServiceConfig {
  /** Redis connection options */
  redis: RedisOptions;
  /** Default job options */
  defaultJobOptions?: {
    /** Number of retry attempts (default: 3) */
    attempts?: number;
    /** Backoff strategy */
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    /** Remove completed jobs after this many milliseconds */
    removeOnComplete?: number | boolean;
    /** Remove failed jobs after this many milliseconds */
    removeOnFail?: number | boolean;
  };
}

export class VideoQueueService implements IVideoQueueService {
  private queue: Queue<EncodingJobData>;
  private queueEvents: QueueEvents;

  constructor(config: VideoQueueServiceConfig) {
    // Create queue
    this.queue = new Queue<EncodingJobData>(VIDEO_ENCODING_QUEUE, {
      connection: config.redis,
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts ?? 3,
        backoff: config.defaultJobOptions?.backoff ?? {
          type: 'exponential',
          delay: 5000, // Start with 5s, then 10s, 20s, etc.
        },
        removeOnComplete: config.defaultJobOptions?.removeOnComplete ?? {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: config.defaultJobOptions?.removeOnFail ?? {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Create queue events for monitoring
    this.queueEvents = new QueueEvents(VIDEO_ENCODING_QUEUE, {
      connection: config.redis,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`✅ Job ${jobId} completed:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📊 Job ${jobId} progress:`, data);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ Job ${jobId} stalled`);
    });
  }

  async addEncodingJob(data: EncodingJobData): Promise<string> {
    const job = await this.queue.add(
      'encode-video', // Job name
      data,
      {
        // Use videoId as job ID for easy lookup
        jobId: `video-${data.videoId}`,
      }
    );

    console.log(
      `📤 Queued encoding job for video ${data.videoId}, Job ID: ${job.id}`
    );
    return job.id!;
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return this.mapJobToStatus(job);
  }

  async getJobByVideoId(videoId: string): Promise<JobStatus | null> {
    const jobId = `video-${videoId}`;
    return this.getJobStatus(jobId);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) return false;

    const state = await job.getState();

    // Can only cancel waiting or delayed jobs
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      console.log(`🗑️ Cancelled job ${jobId}`);
      return true;
    }

    return false;
  }

  async retryJob(jobId: string): Promise<string> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    if (state !== 'failed') {
      throw new Error(`Can only retry failed jobs. Current state: ${state}`);
    }

    await job.retry();
    console.log(`🔄 Retrying job ${jobId}`);
    return jobId;
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async cleanCompletedJobs(olderThanMs: number): Promise<number> {
    const cleaned = await this.queue.clean(olderThanMs, 1000, 'completed');
    console.log(`🧹 Cleaned ${cleaned.length} completed jobs`);
    return cleaned.length;
  }

  async close(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
    console.log('📦 Video queue service closed');
  }

  private async mapJobToStatus(job: Job<EncodingJobData>): Promise<JobStatus> {
    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    return {
      id: job.id!,
      state: state as JobStatus['state'],
      progress,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get the underlying BullMQ queue for advanced operations
   */
  getQueue(): Queue<EncodingJobData> {
    return this.queue;
  }
}

/**
 * Create and initialize video queue service
 */
export function createVideoQueueService(
  config: VideoQueueServiceConfig
): VideoQueueService {
  return new VideoQueueService(config);
}
