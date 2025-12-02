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
  IVideoQualityRepository,
} from '@blog/backend/core';
import {
  StorageBuckets,
  VideoQualityStatus,
  CreateVideoQualityInput,
} from '@blog/backend/core';
import type { INotificationService } from '@blog/backend/core';
import {
  VIDEO_ENCODING_QUEUE,
  ENCODING_CONFIG,
  QualityRetryQueueService,
  QualityRetryJobData,
} from '@blog/backend/infrastructure';
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
  videoQualityRepository: IVideoQualityRepository;
  notificationService: INotificationService;
  qualityRetryQueue: QualityRetryQueueService;
}

export class VideoEncodingWorker {
  private worker: Worker<EncodingJobData, JobResult>;
  private config: WorkerConfig;
  private deps: WorkerDependencies;

  constructor(config: WorkerConfig, deps: WorkerDependencies) {
    this.config = config;
    this.deps = deps;

    console.log('🔧 Initializing BullMQ Worker...');
    console.log('  Queue:', VIDEO_ENCODING_QUEUE);
    console.log('  Redis config:', {
      host: config.redis.host,
      port: config.redis.port,
    });
    console.log('  Concurrency:', config.concurrency);

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

    console.log('🔧 Worker instance created, setting up event listeners...');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.worker.on('ready', () => {
      console.log('✅ Video encoding worker ready');
    });

    this.worker.on('active', (job) => {
      console.log(`🎬 Starting job ${job.id} for video ${job.data.videoId}`);
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

    this.worker.on('closed', () => {
      console.log('🔌 Worker closed');
    });

    this.worker.on('closing', () => {
      console.log('🔌 Worker closing...');
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

      // Update video status to processing (from uploaded state)
      const videoEntity = await this.deps.videoRepository.findById(videoId);
      if (!videoEntity) {
        throw new Error(`Video ${videoId} not found`);
      }
      videoEntity.startProcessing();
      await this.deps.videoRepository.save(videoEntity);
      console.log(`📝 Updated video ${videoId} status to PROCESSING`);
      await job.updateProgress(5);

      // Check for cancellation flag
      if (await this.isCancelled(job)) {
        throw new Error('Job cancelled by user');
      }

      // Step 1: Download video from MinIO (10%)
      console.log(`📥 Step 1/8: Downloading video...`);
      const localVideoPath = path.join(workDir, 'source.mp4');

      // Parse bucket and key from rawFilePath (format: "bucket/key")
      const [bucket, ...keyParts] = rawFilePath.split('/');
      const key = keyParts.join('/');

      console.log(`  Downloading from bucket: ${bucket}, key: ${key}`);
      await this.downloadFromStorage(bucket, key, localVideoPath);
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

      // Check for cancellation
      if (await this.isCancelled(job)) {
        throw new Error('Job cancelled by user');
      }

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
      console.log(
        `🎞️ Step 4/8: Encoding to HLS (parallel mode: ${ENCODING_CONFIG.ENABLE_PARALLEL})...`
      );

      // Initialize video quality records before encoding
      // Use upsertBatch to handle job retries gracefully (avoid duplicate key errors)
      const qualityNames = ['360p', '480p', '720p', '1080p'];
      const qualityInputs: CreateVideoQualityInput[] = qualityNames
        .filter((name) => {
          // Filter based on source resolution
          const heightMap = {
            '360p': 360,
            '480p': 480,
            '720p': 720,
            '1080p': 1080,
          };
          return heightMap[name as keyof typeof heightMap] <= metadata.height;
        })
        .map((name) => ({
          videoId,
          qualityName: name,
          retryPriority: ENCODING_CONFIG.QUALITY_RETRY_PRIORITY[name] || 4,
          status: VideoQualityStatus.ENCODING,
        }));

      await this.deps.videoQualityRepository.upsertBatch(qualityInputs);
      console.log(`  Initialized ${qualityInputs.length} quality records`);

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

      // Handle parallel encoding results
      const successQualities = hlsResult.variantPlaylists.map((v) => v.quality);
      const failedQualities = hlsResult.failedQualities || [];

      console.log(`  ✅ Successfully encoded: ${successQualities.join(', ')}`);
      if (failedQualities.length > 0) {
        console.log(
          `  ❌ Failed to encode: ${failedQualities
            .map((f) => f.quality)
            .join(', ')}`
        );
      }

      // Update video quality statuses
      for (const variant of hlsResult.variantPlaylists) {
        await this.deps.videoQualityRepository.update(
          videoId,
          variant.quality,
          {
            status: VideoQualityStatus.READY,
            completedAt: new Date(),
          }
        );
      }

      for (const failed of failedQualities) {
        await this.deps.videoQualityRepository.update(videoId, failed.quality, {
          status: VideoQualityStatus.FAILED,
          errorMessage: failed.error.message,
          completedAt: new Date(),
        });

        // Archive failed artifacts for debugging
        const qualityDir = path.join(hlsDir, failed.quality);
        if (fs.existsSync(qualityDir)) {
          await this.archiveFailedArtifacts(
            videoId,
            failed.quality,
            qualityDir,
            failed.error.message
          );
        }
      }

      await job.updateProgress(80);

      // Check for cancellation before continuing
      if (await this.isCancelled(job)) {
        throw new Error('Job cancelled by user');
      }

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

      // Determine video status based on number of successful qualities
      const readyCount = successQualities.length;
      const minQualities = ENCODING_CONFIG.MIN_QUALITIES_FOR_PLAYBACK;

      // Get video details for notifications
      const video = await this.deps.videoRepository.findById(videoId);
      if (!video) {
        throw new Error(`Video ${videoId} not found in database`);
      }

      // Extract user ID from postId (will need to fetch Post to get authorId in notification service)
      const userId = video.toJSON().postId || 'unknown';

      let videoStatus: (typeof VideoStatus)[keyof typeof VideoStatus];
      if (readyCount >= minQualities && failedQualities.length === 0) {
        videoStatus = VideoStatus.READY;
        console.log(`  ✅ All qualities encoded successfully - Status: READY`);

        // Notify user that video is ready
        await this.deps.notificationService.notifyVideoReady({
          videoId,
          userId,
          thumbnailUrl,
          hlsUrl: hlsMasterUrl,
          availableQualities: successQualities,
        });
      } else if (readyCount >= minQualities) {
        videoStatus = VideoStatus.PARTIAL_READY;
        console.log(
          `  ⚠️ ${readyCount}/${
            readyCount + failedQualities.length
          } qualities ready - Status: PARTIAL_READY`
        );

        // Notify user that video is playable but some qualities failed
        await this.deps.notificationService.notifyVideoPartialReady({
          videoId,
          userId,
          thumbnailUrl,
          hlsUrl: hlsMasterUrl,
          availableQualities: successQualities,
          failedQualities: failedQualities.map((f) => f.quality),
        });

        // Queue retry jobs for failed qualities
        console.log(
          `  🔄 Queueing retry jobs for ${failedQualities.length} failed qualities...`
        );
        for (const failed of failedQualities) {
          const retryJobData: QualityRetryJobData = {
            videoId,
            qualityName: failed.quality,
            rawFilePath, // Keep original raw file path for retry
            retryCount: 0,
            priority:
              ENCODING_CONFIG.QUALITY_RETRY_PRIORITY[failed.quality] || 4,
          };

          await this.deps.qualityRetryQueue.addRetryJob(retryJobData);
          console.log(
            `    📤 Queued retry for ${failed.quality} (priority: ${retryJobData.priority})`
          );
        }
      } else {
        videoStatus = VideoStatus.FAILED;
        console.log(
          `  ❌ Only ${readyCount} qualities ready (need ${minQualities}) - Status: FAILED`
        );

        // Notify user that video encoding failed
        await this.deps.notificationService.notifyVideoFailed({
          videoId,
          userId,
          errorMessage: `Only ${readyCount} out of ${
            readyCount + failedQualities.length
          } qualities encoded successfully. Minimum ${minQualities} required.`,
          failedQualities: failedQualities.map((f) => f.quality),
        });
      }

      await this.deps.videoRepository.update(videoId, {
        status: videoStatus,
        hlsUrl: videoStatus !== VideoStatus.FAILED ? hlsMasterUrl : undefined,
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

      // Check if this was a cancellation
      if (errorMessage.includes('cancelled')) {
        console.log(`🛑 Job cancelled for video ${videoId}`);
        // Kill any active FFmpeg processes
        if (
          this.deps.ffmpegService &&
          'killAllProcesses' in this.deps.ffmpegService
        ) {
          (this.deps.ffmpegService as any).killAllProcesses();
        }
      }

      // Cleanup on error
      await this.cleanup(workDir);

      throw error;
    }
  }

  private async downloadFromStorage(
    bucket: string,
    key: string,
    localPath: string
  ): Promise<void> {
    const stream = await this.deps.storageService.getObjectStream({
      bucket,
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
   * Check if job has been cancelled
   */
  private async isCancelled(job: Job<EncodingJobData>): Promise<boolean> {
    const video = await this.deps.videoRepository.findById(job.data.videoId);
    return video?.status === VideoStatus.CANCELLED;
  }

  /**
   * Archive failed encoding artifacts to MinIO for debugging
   */
  private async archiveFailedArtifacts(
    videoId: string,
    qualityName: string,
    artifactPath: string,
    _errorMessage: string
  ): Promise<void> {
    try {
      if (!fs.existsSync(artifactPath)) {
        return;
      }

      const timestamp = Date.now();
      const debugPath = `${videoId}/${qualityName}/${timestamp}/`;

      // Upload partial files to videos-failed-debug bucket
      const files = fs.readdirSync(artifactPath);
      for (const file of files) {
        const filePath = path.join(artifactPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          const fileBuffer = fs.readFileSync(filePath);
          await this.deps.storageService.uploadFile({
            bucket: 'videos-failed-debug',
            key: `${debugPath}${file}`,
            data: fileBuffer,
            contentType: 'application/octet-stream',
          });
        }
      }

      console.log(
        `🗃️ Archived failed artifacts for ${videoId}/${qualityName} to ${debugPath}`
      );

      // TODO: Insert record into failed_encoding_artifacts table
      // This would require adding a repository for that table
    } catch (error) {
      console.warn(`Failed to archive artifacts:`, error);
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
