/**
 * Video Encoding Worker
 *
 * BullMQ worker that processes video encoding jobs.
 * Downloads raw video → Extracts metadata → Generates thumbnail →
 * Encodes to HLS (4 qualities) → Uploads → Updates database → Cleanup
 */

import { Worker, Job } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import type {
  EncodingJobData,
  JobResult,
  IStorageService,
  IFFmpegService,
  IVideoRepository,
} from '@blog/backend/core';
import { StorageBuckets } from '@blog/backend/core';
import { VIDEO_ENCODING_QUEUE } from '@blog/backend/infrastructure';
import { VideoStatus } from '@blog/shared/domain';

export interface WorkerConfig {
  /** Redis connection options */
  redis: RedisOptions;
  /** Number of concurrent jobs (default: 2) */
  concurrency: number;
  /** Temporary directory for processing */
  tempDir: string;
  /** MinIO endpoint for URL generation */
  minioEndpoint: string;
}

export interface WorkerDependencies {
  storageService: IStorageService;
  ffmpegService: IFFmpegService;
  videoRepository: IVideoRepository;
}

export class VideoEncodingWorker {
  private worker: Worker<EncodingJobData, JobResult>;
  private config: WorkerConfig;
  private deps: WorkerDependencies;

  constructor(config: WorkerConfig, deps: WorkerDependencies) {
    this.config = config;
    this.deps = deps;

    // Ensure temp directory exists
    if (!fs.existsSync(config.tempDir)) {
      fs.mkdirSync(config.tempDir, { recursive: true });
    }

    this.worker = new Worker<EncodingJobData, JobResult>(
      VIDEO_ENCODING_QUEUE,
      async (job) => this.processJob(job),
      {
        connection: config.redis,
        concurrency: config.concurrency,
        // Remove job from active list if worker crashes
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      }
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.worker.on('ready', () => {
      console.log('✅ Video encoding worker ready');
    });

    this.worker.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, {
        videoId: result.videoId,
        processingTime: `${result.processingTime}ms`,
        qualities: result.qualities,
      });
    });

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error.message);
      // Update video status to error
      if (job?.data?.videoId) {
        this.updateVideoStatusOnError(job.data.videoId, error.message).catch(
          console.error
        );
      }
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`⚠️ Job ${jobId} stalled`);
    });

    this.worker.on('error', (error) => {
      console.error('❌ Worker error:', error);
    });
  }

  private async updateVideoStatusOnError(
    videoId: string,
    _errorMessage: string
  ): Promise<void> {
    try {
      const video = await this.deps.videoRepository.findById(videoId);
      if (video) {
        await this.deps.videoRepository.update(video.id, {
          status: VideoStatus.FAILED,
        });
        console.log(`📝 Updated video ${videoId} status to ERROR`);
      }
    } catch (error) {
      console.error(`Failed to update video status on error:`, error);
    }
  }

  private async processJob(job: Job<EncodingJobData>): Promise<JobResult> {
    const { videoId, rawFilePath } = job.data;
    const startTime = Date.now();
    const workDir = path.join(this.config.tempDir, videoId);

    console.log(`🎬 Processing video ${videoId} from ${rawFilePath}`);

    try {
      // Create work directory
      if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
      }

      // Update video status to processing
      await this.updateVideoStatus(videoId, VideoStatus.PROCESSING);
      await job.updateProgress(5);

      // Step 1: Download video from MinIO (10%)
      console.log(`📥 Step 1/8: Downloading video...`);
      const localVideoPath = path.join(workDir, 'source.mp4');
      await this.downloadFromStorage(rawFilePath, localVideoPath);
      await job.updateProgress(10);

      // Step 2: Extract metadata (20%)
      console.log(`📊 Step 2/8: Extracting metadata...`);
      const metadata = await this.deps.ffmpegService.extractMetadata(
        localVideoPath
      );
      console.log(
        `  Duration: ${metadata.duration}s, Resolution: ${metadata.width}x${metadata.height}`
      );
      await job.updateProgress(20);

      // Check duration limit (30 minutes max)
      if (metadata.duration > 1800) {
        throw new Error('Video exceeds maximum duration of 30 minutes');
      }

      // Step 3: Generate thumbnail (30%)
      console.log(`🖼️ Step 3/8: Generating thumbnail...`);
      const thumbnailPath = path.join(workDir, 'thumbnail.jpg');
      const thumbnailTimestamp = Math.min(2, metadata.duration * 0.1);
      await this.deps.ffmpegService.generateThumbnail(
        localVideoPath,
        thumbnailPath,
        thumbnailTimestamp
      );
      await job.updateProgress(30);

      // Step 4: Encode to HLS (30% - 80%)
      console.log(`🎞️ Step 4/8: Encoding to HLS...`);
      const hlsDir = path.join(workDir, 'hls');
      const hlsResult = await this.deps.ffmpegService.encodeToHLS(
        localVideoPath,
        hlsDir,
        undefined, // Use default qualities
        (progress) => {
          // Map encoding progress to 30-80 range
          const jobProgress = 30 + Math.floor(progress.percent * 0.5);
          job.updateProgress(Math.min(jobProgress, 80));
          console.log(
            `  Encoding ${progress.quality}: ${progress.percent.toFixed(1)}%`
          );
        }
      );
      console.log(`  Encoding completed in ${hlsResult.encodingTime}ms`);
      await job.updateProgress(80);

      // Step 5: Upload thumbnail (85%)
      console.log(`📤 Step 5/8: Uploading thumbnail...`);
      const thumbnailKey = `${videoId}/thumbnail.jpg`;
      await this.uploadToStorage(
        thumbnailPath,
        StorageBuckets.THUMBNAILS,
        thumbnailKey,
        'image/jpeg'
      );
      await job.updateProgress(85);

      // Step 6: Upload encoded files (90%)
      console.log(`📤 Step 6/8: Uploading encoded files...`);
      await this.uploadHLSFiles(videoId, hlsDir, hlsResult);
      await job.updateProgress(90);

      // Step 7: Update database (95%)
      console.log(`💾 Step 7/8: Updating database...`);
      const hlsMasterUrl = `${this.config.minioEndpoint}/${StorageBuckets.VIDEOS_ENCODED}/${videoId}/master.m3u8`;
      const thumbnailUrl = `${this.config.minioEndpoint}/${StorageBuckets.THUMBNAILS}/${thumbnailKey}`;
      const qualities = hlsResult.variantPlaylists.map((v) => v.quality);

      await this.deps.videoRepository.update(videoId, {
        status: VideoStatus.READY,
        hlsUrl: hlsMasterUrl,
        thumbnailUrl: thumbnailUrl,
        duration: Math.floor(metadata.duration),
        width: metadata.width,
        height: metadata.height,
        processedAt: new Date(),
      });
      await job.updateProgress(95);

      // Step 8: Cleanup (100%)
      console.log(`🧹 Step 8/8: Cleaning up...`);
      await this.cleanup(workDir);

      // Optionally: Delete raw file from storage
      // await this.deps.storageService.deleteFile(StorageBuckets.VIDEOS_RAW, rawFilePath);

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Video ${videoId} processed in ${processingTime}ms`);

      return {
        videoId,
        hlsMasterUrl,
        thumbnailUrl,
        qualities,
        duration: Math.floor(metadata.duration),
        processingTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to process video ${videoId}:`, errorMessage);

      // Cleanup on error
      await this.cleanup(workDir);

      throw error;
    }
  }

  private async updateVideoStatus(
    videoId: string,
    status: (typeof VideoStatus)[keyof typeof VideoStatus]
  ): Promise<void> {
    await this.deps.videoRepository.update(videoId, { status });
    console.log(`📝 Updated video ${videoId} status to ${status}`);
  }

  private async downloadFromStorage(
    key: string,
    localPath: string
  ): Promise<void> {
    const stream = await this.deps.storageService.getObjectStream({
      bucket: StorageBuckets.VIDEOS_RAW,
      key,
    });

    const writeStream = fs.createWriteStream(localPath);

    return new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      stream.on('error', reject);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  private async uploadToStorage(
    localPath: string,
    bucket: string,
    key: string,
    contentType: string
  ): Promise<void> {
    const fileBuffer = fs.readFileSync(localPath);
    await this.deps.storageService.uploadFile({
      bucket,
      key,
      data: fileBuffer,
      contentType,
    });
  }

  private async uploadHLSFiles(
    videoId: string,
    _hlsDir: string,
    hlsResult: {
      masterPlaylistPath: string;
      variantPlaylists: { quality: string; segmentsDir: string }[];
    }
  ): Promise<void> {
    // Upload master playlist
    await this.uploadToStorage(
      hlsResult.masterPlaylistPath,
      StorageBuckets.VIDEOS_ENCODED,
      `${videoId}/master.m3u8`,
      'application/vnd.apple.mpegurl'
    );

    // Upload each quality variant
    for (const variant of hlsResult.variantPlaylists) {
      const qualityDir = variant.segmentsDir;
      const files = fs.readdirSync(qualityDir);

      for (const file of files) {
        const filePath = path.join(qualityDir, file);
        const contentType = file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/mp2t'; // .ts files

        await this.uploadToStorage(
          filePath,
          StorageBuckets.VIDEOS_ENCODED,
          `${videoId}/${variant.quality}/${file}`,
          contentType
        );
      }
    }
  }

  private async cleanup(workDir: string): Promise<void> {
    try {
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up ${workDir}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup ${workDir}:`, error);
    }
  }

  /**
   * Gracefully shutdown the worker
   */
  async close(): Promise<void> {
    console.log('🛑 Shutting down worker...');
    await this.worker.close();
    console.log('👋 Worker closed');
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause();
    console.log('⏸️ Worker paused');
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume();
    console.log('▶️ Worker resumed');
  }

  /**
   * Check if worker is running
   */
  isRunning(): boolean {
    return this.worker.isRunning();
  }
}

/**
 * Create and start the video encoding worker
 */
export function createVideoEncodingWorker(
  config: WorkerConfig,
  deps: WorkerDependencies
): VideoEncodingWorker {
  return new VideoEncodingWorker(config, deps);
}
