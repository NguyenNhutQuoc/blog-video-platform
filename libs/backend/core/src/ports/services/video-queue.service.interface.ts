/**
 * Video Queue Service Interface
 *
 * Port interface for video processing job queue operations.
 */

export interface EncodingJobData {
  /** Video ID */
  videoId: string;
  /** Raw file path in storage (bucket/key) */
  rawFilePath: string;
}

export interface JobStatus {
  /** Job ID */
  id: string;
  /** Job state */
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if failed */
  failedReason?: string;
  /** Number of attempts */
  attemptsMade: number;
  /** Timestamp when job was created */
  timestamp: number;
  /** Timestamp when job was processed */
  processedOn?: number;
  /** Timestamp when job finished */
  finishedOn?: number;
}

export interface JobResult {
  /** Video ID */
  videoId: string;
  /** HLS master playlist URL */
  hlsMasterUrl: string;
  /** Thumbnail URL */
  thumbnailUrl: string;
  /** Available quality variants */
  qualities: string[];
  /** Video duration in seconds */
  duration: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Video Queue Service Port
 *
 * Defines the contract for video encoding job queue operations.
 */
export interface IVideoQueueService {
  /**
   * Add a video encoding job to the queue
   * @returns Job ID
   */
  addEncodingJob(data: EncodingJobData): Promise<string>;

  /**
   * Get the status of a job
   */
  getJobStatus(jobId: string): Promise<JobStatus | null>;

  /**
   * Get job by video ID
   */
  getJobByVideoId(videoId: string): Promise<JobStatus | null>;

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): Promise<boolean>;

  /**
   * Retry a failed job
   */
  retryJob(jobId: string): Promise<string>;

  /**
   * Get queue statistics
   */
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;

  /**
   * Clean old completed jobs
   */
  cleanCompletedJobs(olderThanMs: number): Promise<number>;

  /**
   * Close the queue connection
   */
  close(): Promise<void>;
}
