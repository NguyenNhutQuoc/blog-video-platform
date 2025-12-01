# 🎥 TUẦN 5: VIDEO INFRASTRUCTURE - ROADMAP CHI TIẾT

**Duration:** 7 days  
**Goal:** Xây dựng hoàn chỉnh video upload, processing, và streaming infrastructure

---

## 📋 **OVERVIEW**

### **Mục tiêu chính:**
1. ✅ MinIO integration với presigned URLs
2. ✅ BullMQ job queue setup
3. ✅ FFmpeg worker với 4 quality encoding
4. ✅ HLS video player component
5. ✅ Complete upload → process → stream pipeline

### **Tech Stack:**
- **Storage:** MinIO (S3-compatible)
- **Queue:** BullMQ + Redis
- **Processing:** FFmpeg (HLS encoding)
- **Frontend:** React Video Player (HLS.js hoặc Video.js)
- **Backend:** Video API endpoints

---

## 🗓️ **DAY-BY-DAY BREAKDOWN**

---

## **📅 DAY 1: MinIO Setup & Integration**

### **Morning: MinIO Configuration** (3-4 hours)

#### **Tasks:**
1. ✅ Verify MinIO Docker service
   ```bash
   docker compose ps minio
   docker compose logs minio
   ```

2. ✅ Create buckets via MinIO Console
   - Access: http://localhost:9001
   - Buckets: `videos-raw`, `videos-encoded`, `thumbnails`
   - Set policies: raw=private, encoded=public-read, thumbnails=public-read

3. ✅ Install MinIO SDK
   ```bash
   npm install --save minio
   npm install --save-dev @types/minio
   ```

4. ✅ Create MinIO service wrapper
   ```typescript
   // libs/backend/infrastructure/src/services/minio.service.ts
   import { Client } from 'minio';
   
   export class MinIOService {
     private client: Client;
     
     constructor(config: MinIOConfig) {
       this.client = new Client({
         endPoint: config.endpoint,
         port: config.port,
         useSSL: config.useSSL,
         accessKey: config.accessKey,
         secretKey: config.secretKey,
       });
     }
     
     async generatePresignedUploadUrl(
       bucket: string,
       objectKey: string,
       expiresIn: number = 3600
     ): Promise<string> {
       return await this.client.presignedPutObject(
         bucket,
         objectKey,
         expiresIn
       );
     }
     
     async generatePresignedDownloadUrl(
       bucket: string,
       objectKey: string,
       expiresIn: number = 3600
     ): Promise<string> {
       return await this.client.presignedGetObject(
         bucket,
         objectKey,
         expiresIn
       );
     }
     
     async uploadFile(
       bucket: string,
       objectKey: string,
       filePath: string,
       metadata?: Record<string, string>
     ): Promise<void> {
       await this.client.fPutObject(bucket, objectKey, filePath, metadata);
     }
     
     async deleteObject(bucket: string, objectKey: string): Promise<void> {
       await this.client.removeObject(bucket, objectKey);
     }
     
     async listObjects(bucket: string, prefix?: string): Promise<string[]> {
       const stream = this.client.listObjects(bucket, prefix, true);
       const objects: string[] = [];
       
       return new Promise((resolve, reject) => {
         stream.on('data', (obj) => objects.push(obj.name));
         stream.on('end', () => resolve(objects));
         stream.on('error', reject);
       });
     }
   }
   ```

#### **Deliverables:**
- ✅ MinIOService class với 5 methods
- ✅ Unit tests cho MinIOService
- ✅ Environment variables configuration

---

### **Afternoon: Video Upload API** (3-4 hours)

#### **Tasks:**

1. ✅ Update Video entity
   ```typescript
   // libs/shared/domain/src/entities/video.entity.ts
   export interface Video {
     id: string;
     postId: string | null;
     originalFilename: string;
     fileSize: number;
     mimeType: string;
     status: VideoStatus; // 'uploading' | 'processing' | 'ready' | 'failed'
     duration: number | null;
     width: number | null;
     height: number | null;
     originalCodec: string | null;
     originalBitrate: number | null;
     rawFilePath: string | null;
     hlsMasterUrl: string | null;
     thumbnailUrl: string | null;
     availableQualities: VideoQuality[]; // ['1080p', '720p', '480p', '360p']
     retryCount: number;
     errorMessage: string | null;
     uploadedAt: Date | null;
     processingCompletedAt: Date | null;
     createdAt: Date;
   }
   
   export enum VideoStatus {
     UPLOADING = 'uploading',
     PROCESSING = 'processing',
     READY = 'ready',
     FAILED = 'failed',
     CANCELLED = 'cancelled',
   }
   
   export enum VideoQuality {
     Q_1080P = '1080p',
     Q_720P = '720p',
     Q_480P = '480p',
     Q_360P = '360p',
   }
   ```

2. ✅ Create use case: GenerateUploadUrl
   ```typescript
   // libs/backend/application/src/use-cases/videos/generate-upload-url.use-case.ts
   export class GenerateUploadUrlUseCase {
     constructor(
       private videoRepository: VideoRepository,
       private minioService: MinIOService
     ) {}
     
     async execute(input: GenerateUploadUrlInput): Promise<GenerateUploadUrlOutput> {
       // 1. Validate file (type, size)
       this.validateFile(input);
       
       // 2. Create video record with status='uploading'
       const video = new VideoEntity({
         id: crypto.randomUUID(),
         postId: input.postId || null,
         originalFilename: input.filename,
         fileSize: input.fileSize,
         mimeType: input.mimeType,
         status: VideoStatus.UPLOADING,
         // ... other fields null
       });
       
       await this.videoRepository.create(video);
       
       // 3. Generate presigned URL (expire 1h)
       const objectKey = `raw/${video.id}/${input.filename}`;
       const uploadUrl = await this.minioService.generatePresignedUploadUrl(
         'videos-raw',
         objectKey,
         3600
       );
       
       // 4. Update rawFilePath
       video.rawFilePath = objectKey;
       await this.videoRepository.update(video);
       
       return {
         videoId: video.id,
         uploadUrl,
         expiresAt: new Date(Date.now() + 3600 * 1000),
       };
     }
     
     private validateFile(input: GenerateUploadUrlInput): void {
       const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
       const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
       
       if (input.fileSize > MAX_SIZE) {
         throw new ValidationError('File size exceeds 2GB limit');
       }
       
       if (!ALLOWED_TYPES.includes(input.mimeType)) {
         throw new ValidationError('Only MP4, MOV, AVI formats are supported');
       }
     }
   }
   ```

3. ✅ Create use case: ConfirmUpload
   ```typescript
   // libs/backend/application/src/use-cases/videos/confirm-upload.use-case.ts
   export class ConfirmUploadUseCase {
     constructor(
       private videoRepository: VideoRepository,
       private videoQueue: VideoQueue
     ) {}
     
     async execute(input: ConfirmUploadInput): Promise<void> {
       // 1. Get video
       const video = await this.videoRepository.findById(input.videoId);
       if (!video) throw new NotFoundError('Video not found');
       
       // 2. Verify status
       if (video.status !== VideoStatus.UPLOADING) {
         throw new ValidationError('Video is not in uploading state');
       }
       
       // 3. Update status to 'processing'
       video.status = VideoStatus.PROCESSING;
       video.uploadedAt = new Date();
       await this.videoRepository.update(video);
       
       // 4. Queue encoding job
       await this.videoQueue.addEncodingJob({
         videoId: video.id,
         rawFilePath: video.rawFilePath!,
       });
     }
   }
   ```

4. ✅ Create API routes
   ```typescript
   // apps/api-server/src/routes/videos.routes.ts
   router.post('/upload-url', authMiddleware, async (req, res) => {
     const result = await generateUploadUrlUseCase.execute({
       postId: req.body.postId,
       filename: req.body.filename,
       fileSize: req.body.fileSize,
       mimeType: req.body.mimeType,
     });
     
     res.json(result);
   });
   
   router.post('/:videoId/confirm', authMiddleware, async (req, res) => {
     await confirmUploadUseCase.execute({
       videoId: req.params.videoId,
     });
     
     res.json({ message: 'Video queued for processing' });
   });
   
   router.get('/:videoId/status', async (req, res) => {
     const video = await videoRepository.findById(req.params.videoId);
     if (!video) return res.status(404).json({ error: 'Not found' });
     
     res.json({
       status: video.status,
       progress: video.progress,
       hlsMasterUrl: video.hlsMasterUrl,
       thumbnailUrl: video.thumbnailUrl,
       availableQualities: video.availableQualities,
     });
   });
   ```

#### **Deliverables:**
- ✅ Video entity updated
- ✅ 2 use cases: GenerateUploadUrl, ConfirmUpload
- ✅ 3 API endpoints: POST /upload-url, POST /:id/confirm, GET /:id/status
- ✅ Integration tests

---

## **📅 DAY 2: BullMQ Job Queue Setup**

### **Morning: BullMQ Integration** (3-4 hours)

#### **Tasks:**

1. ✅ Install BullMQ
   ```bash
   npm install --save bullmq
   npm install --save-dev @types/bullmq
   ```

2. ✅ Create queue service
   ```typescript
   // libs/backend/infrastructure/src/services/video-queue.service.ts
   import { Queue, QueueEvents } from 'bullmq';
   import { RedisOptions } from 'ioredis';
   
   export interface EncodingJobData {
     videoId: string;
     rawFilePath: string;
   }
   
   export class VideoQueueService {
     private queue: Queue<EncodingJobData>;
     private queueEvents: QueueEvents;
     
     constructor(redisConfig: RedisOptions) {
       this.queue = new Queue('video-encoding', {
         connection: redisConfig,
       });
       
       this.queueEvents = new QueueEvents('video-encoding', {
         connection: redisConfig,
       });
     }
     
     async addEncodingJob(data: EncodingJobData): Promise<string> {
       const job = await this.queue.add('encode-video', data, {
         attempts: 3,
         backoff: {
           type: 'exponential',
           delay: 5000,
         },
         removeOnComplete: 100,
         removeOnFail: false,
       });
       
       return job.id!;
     }
     
     async getJobStatus(jobId: string): Promise<any> {
       const job = await this.queue.getJob(jobId);
       if (!job) return null;
       
       return {
         id: job.id,
         state: await job.getState(),
         progress: job.progress,
         data: job.data,
         returnvalue: job.returnvalue,
         failedReason: job.failedReason,
       };
     }
     
     async close(): Promise<void> {
       await this.queue.close();
       await this.queueEvents.close();
     }
   }
   ```

3. ✅ Create worker skeleton
   ```typescript
   // apps/video-worker/src/worker.ts
   import { Worker, Job } from 'bullmq';
   import { EncodingJobData } from '@blog/backend-infrastructure';
   
   export class VideoEncodingWorker {
     private worker: Worker<EncodingJobData>;
     
     constructor(
       private minioService: MinIOService,
       private videoRepository: VideoRepository,
       private ffmpegService: FFmpegService,
       redisConfig: RedisOptions
     ) {
       this.worker = new Worker(
         'video-encoding',
         this.processJob.bind(this),
         {
           connection: redisConfig,
           concurrency: 2, // Process 2 videos concurrently
         }
       );
       
       this.setupEventHandlers();
     }
     
     private async processJob(job: Job<EncodingJobData>): Promise<void> {
       console.log(`Processing job ${job.id} for video ${job.data.videoId}`);
       
       // Implementation trong Day 3
       await job.updateProgress(0);
       
       // TODO: Download, extract metadata, encode, upload
       
       await job.updateProgress(100);
     }
     
     private setupEventHandlers(): void {
       this.worker.on('completed', (job) => {
         console.log(`Job ${job.id} completed`);
       });
       
       this.worker.on('failed', (job, err) => {
         console.error(`Job ${job?.id} failed:`, err);
       });
       
       this.worker.on('error', (err) => {
         console.error('Worker error:', err);
       });
     }
     
     async close(): Promise<void> {
       await this.worker.close();
     }
   }
   ```

4. ✅ Create worker entry point
   ```typescript
   // apps/video-worker/src/main.ts
   import { initializeWorker } from './worker';
   
   async function bootstrap() {
     console.log('🎬 Video Worker starting...');
     
     const worker = await initializeWorker();
     
     // Graceful shutdown
     process.on('SIGINT', async () => {
       console.log('Shutting down worker...');
       await worker.close();
       process.exit(0);
     });
     
     console.log('✅ Video Worker ready');
   }
   
   bootstrap().catch((error) => {
     console.error('Failed to start worker:', error);
     process.exit(1);
   });
   ```

#### **Deliverables:**
- ✅ VideoQueueService với add/getStatus methods
- ✅ Worker skeleton với event handlers
- ✅ Worker entry point
- ✅ Docker service running

---

### **Afternoon: Testing Queue & Worker** (3-4 hours)

#### **Tasks:**

1. ✅ Create queue tests
   ```typescript
   // libs/backend/infrastructure/src/services/__tests__/video-queue.service.spec.ts
   describe('VideoQueueService', () => {
     it('should add encoding job to queue', async () => {
       const jobId = await queueService.addEncodingJob({
         videoId: 'test-123',
         rawFilePath: 'raw/test.mp4',
       });
       
       expect(jobId).toBeDefined();
       
       const status = await queueService.getJobStatus(jobId);
       expect(status.state).toBe('waiting');
     });
   });
   ```

2. ✅ Test worker connection
   ```bash
   # Start worker
   cd apps/video-worker
   npm run dev
   
   # Should see: "✅ Video Worker ready"
   ```

3. ✅ Test end-to-end flow
   ```bash
   # 1. Generate upload URL
   curl -X POST http://localhost:3000/api/videos/upload-url \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "filename": "test.mp4",
       "fileSize": 10485760,
       "mimeType": "video/mp4"
     }'
   
   # 2. Upload file to presigned URL (use curl or Postman)
   
   # 3. Confirm upload
   curl -X POST http://localhost:3000/api/videos/{videoId}/confirm \
     -H "Authorization: Bearer $TOKEN"
   
   # 4. Check worker logs - should see "Processing job..."
   docker compose logs -f video-worker
   ```

#### **Deliverables:**
- ✅ Queue service tests
- ✅ Worker successfully picking up jobs
- ✅ End-to-end integration test passed

---

## **📅 DAY 3: FFmpeg Processing Pipeline**

### **Morning: FFmpeg Service** (4-5 hours)

#### **Tasks:**

1. ✅ Install FFmpeg dependencies
   ```bash
   npm install --save fluent-ffmpeg
   npm install --save-dev @types/fluent-ffmpeg
   ```

2. ✅ Create FFmpegService
   ```typescript
   // libs/backend/infrastructure/src/services/ffmpeg.service.ts
   import ffmpeg from 'fluent-ffmpeg';
   import { promisify } from 'util';
   import { exec } from 'child_process';
   
   const execAsync = promisify(exec);
   
   export interface VideoMetadata {
     duration: number;
     width: number;
     height: number;
     codec: string;
     bitrate: number;
   }
   
   export interface EncodingOptions {
     inputPath: string;
     outputDir: string;
     qualities: VideoQuality[];
     onProgress?: (progress: number) => void;
   }
   
   export class FFmpegService {
     async extractMetadata(filePath: string): Promise<VideoMetadata> {
       return new Promise((resolve, reject) => {
         ffmpeg.ffprobe(filePath, (err, metadata) => {
           if (err) return reject(err);
           
           const videoStream = metadata.streams.find(s => s.codec_type === 'video');
           if (!videoStream) return reject(new Error('No video stream found'));
           
           resolve({
             duration: metadata.format.duration!,
             width: videoStream.width!,
             height: videoStream.height!,
             codec: videoStream.codec_name!,
             bitrate: metadata.format.bit_rate!,
           });
         });
       });
     }
     
     async generateThumbnail(
       inputPath: string,
       outputPath: string,
       timeInSeconds: number = 2
     ): Promise<void> {
       return new Promise((resolve, reject) => {
         ffmpeg(inputPath)
           .screenshots({
             timestamps: [timeInSeconds],
             filename: 'thumbnail.jpg',
             folder: path.dirname(outputPath),
             size: '1280x720',
           })
           .on('end', () => resolve())
           .on('error', reject);
       });
     }
     
     async encodeToHLS(options: EncodingOptions): Promise<string[]> {
       const { inputPath, outputDir, qualities, onProgress } = options;
       const outputFiles: string[] = [];
       
       // Create master playlist
       const masterPlaylist = path.join(outputDir, 'master.m3u8');
       let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
       
       // Encode each quality
       for (const quality of qualities) {
         const config = this.getQualityConfig(quality);
         const qualityDir = path.join(outputDir, quality);
         await fs.promises.mkdir(qualityDir, { recursive: true });
         
         const playlistPath = path.join(qualityDir, 'playlist.m3u8');
         
         await this.encodeQuality(inputPath, qualityDir, config, onProgress);
         
         outputFiles.push(playlistPath);
         
         // Add to master playlist
         masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${config.bandwidth},RESOLUTION=${config.resolution}\n`;
         masterContent += `${quality}/playlist.m3u8\n\n`;
       }
       
       // Write master playlist
       await fs.promises.writeFile(masterPlaylist, masterContent);
       outputFiles.unshift(masterPlaylist);
       
       return outputFiles;
     }
     
     private async encodeQuality(
       inputPath: string,
       outputDir: string,
       config: QualityConfig,
       onProgress?: (progress: number) => void
     ): Promise<void> {
       return new Promise((resolve, reject) => {
         ffmpeg(inputPath)
           .outputOptions([
             '-codec:v libx264',
             '-codec:a aac',
             `-b:v ${config.bitrate}`,
             '-b:a 128k',
             '-vf', `scale=${config.scale}`,
             '-preset fast',
             '-g 48',
             '-sc_threshold 0',
             '-hls_time 4',
             '-hls_playlist_type vod',
             '-hls_segment_filename', path.join(outputDir, 'segment%03d.ts'),
           ])
           .output(path.join(outputDir, 'playlist.m3u8'))
           .on('progress', (progress) => {
             if (onProgress && progress.percent) {
               onProgress(Math.round(progress.percent));
             }
           })
           .on('end', () => resolve())
           .on('error', reject)
           .run();
       });
     }
     
     private getQualityConfig(quality: VideoQuality): QualityConfig {
       const configs = {
         [VideoQuality.Q_1080P]: {
           bitrate: '5000k',
           scale: '1920:1080',
           resolution: '1920x1080',
           bandwidth: 5000000,
         },
         [VideoQuality.Q_720P]: {
           bitrate: '2800k',
           scale: '1280:720',
           resolution: '1280x720',
           bandwidth: 2800000,
         },
         [VideoQuality.Q_480P]: {
           bitrate: '1400k',
           scale: '854:480',
           resolution: '854x480',
           bandwidth: 1400000,
         },
         [VideoQuality.Q_360P]: {
           bitrate: '800k',
           scale: '640:360',
           resolution: '640x360',
           bandwidth: 800000,
         },
       };
       
       return configs[quality];
     }
   }
   ```

#### **Deliverables:**
- ✅ FFmpegService với 3 methods
- ✅ HLS encoding với 4 qualities
- ✅ Master playlist generation
- ✅ Progress tracking support

---

### **Afternoon: Complete Worker Implementation** (3-4 hours)

#### **Tasks:**

1. ✅ Implement full processing pipeline
   ```typescript
   // apps/video-worker/src/worker.ts
   private async processJob(job: Job<EncodingJobData>): Promise<void> {
     const { videoId, rawFilePath } = job.data;
     
     try {
       // 1. Get video record
       const video = await this.videoRepository.findById(videoId);
       if (!video) throw new Error('Video not found');
       
       // 2. Download raw video từ MinIO
       const tempDir = `/tmp/video-processing/${videoId}`;
       await fs.promises.mkdir(tempDir, { recursive: true });
       
       const localRawPath = path.join(tempDir, 'raw.mp4');
       await this.minioService.downloadFile(
         'videos-raw',
         rawFilePath,
         localRawPath
       );
       
       await job.updateProgress(10);
       
       // 3. Extract metadata
       const metadata = await this.ffmpegService.extractMetadata(localRawPath);
       video.duration = metadata.duration;
       video.width = metadata.width;
       video.height = metadata.height;
       video.originalCodec = metadata.codec;
       video.originalBitrate = metadata.bitrate;
       await this.videoRepository.update(video);
       
       await job.updateProgress(20);
       
       // 4. Generate thumbnail
       const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
       await this.ffmpegService.generateThumbnail(localRawPath, thumbnailPath, 2);
       
       // Upload thumbnail to MinIO
       const thumbnailKey = `thumbnails/${videoId}/thumbnail.jpg`;
       await this.minioService.uploadFile(
         'thumbnails',
         thumbnailKey,
         thumbnailPath,
         { 'Content-Type': 'image/jpeg' }
       );
       
       video.thumbnailUrl = `${MINIO_PUBLIC_URL}/thumbnails/${thumbnailKey}`;
       await this.videoRepository.update(video);
       
       await job.updateProgress(30);
       
       // 5. Encode to HLS (4 qualities)
       const encodedDir = path.join(tempDir, 'encoded');
       const qualities = [
         VideoQuality.Q_1080P,
         VideoQuality.Q_720P,
         VideoQuality.Q_480P,
         VideoQuality.Q_360P,
       ];
       
       await this.ffmpegService.encodeToHLS({
         inputPath: localRawPath,
         outputDir: encodedDir,
         qualities,
         onProgress: async (progress) => {
           // Map 30-90% to encoding progress
           const totalProgress = 30 + Math.round(progress * 0.6);
           await job.updateProgress(totalProgress);
         },
       });
       
       await job.updateProgress(90);
       
       // 6. Upload encoded files to MinIO
       const encodedFiles = await this.getAllFiles(encodedDir);
       for (const file of encodedFiles) {
         const relativePath = path.relative(encodedDir, file);
         const objectKey = `encoded/${videoId}/${relativePath}`;
         
         await this.minioService.uploadFile(
           'videos-encoded',
           objectKey,
           file,
           { 'Content-Type': this.getMimeType(file) }
         );
       }
       
       // 7. Update video record
       video.hlsMasterUrl = `${MINIO_PUBLIC_URL}/videos-encoded/encoded/${videoId}/master.m3u8`;
       video.availableQualities = qualities;
       video.status = VideoStatus.READY;
       video.processingCompletedAt = new Date();
       await this.videoRepository.update(video);
       
       await job.updateProgress(95);
       
       // 8. Delete raw file from MinIO (save storage)
       await this.minioService.deleteObject('videos-raw', rawFilePath);
       
       // 9. Cleanup temp files
       await fs.promises.rm(tempDir, { recursive: true, force: true });
       
       await job.updateProgress(100);
       
       console.log(`✅ Video ${videoId} processed successfully`);
     } catch (error) {
       console.error(`❌ Failed to process video ${videoId}:`, error);
       
       // Update video status to failed
       const video = await this.videoRepository.findById(videoId);
       if (video) {
         video.status = VideoStatus.FAILED;
         video.errorMessage = error.message;
         video.retryCount += 1;
         await this.videoRepository.update(video);
       }
       
       throw error; // BullMQ will retry based on job config
     }
   }
   
   private async getAllFiles(dir: string): Promise<string[]> {
     const files: string[] = [];
     const entries = await fs.promises.readdir(dir, { withFileTypes: true });
     
     for (const entry of entries) {
       const fullPath = path.join(dir, entry.name);
       if (entry.isDirectory()) {
         files.push(...await this.getAllFiles(fullPath));
       } else {
         files.push(fullPath);
       }
     }
     
     return files;
   }
   
   private getMimeType(filePath: string): string {
     const ext = path.extname(filePath);
     const mimeTypes: Record<string, string> = {
       '.m3u8': 'application/vnd.apple.mpegurl',
       '.ts': 'video/mp2t',
       '.jpg': 'image/jpeg',
     };
     return mimeTypes[ext] || 'application/octet-stream';
   }
   ```

#### **Deliverables:**
- ✅ Complete 9-step processing pipeline
- ✅ Error handling với retry logic
- ✅ Progress tracking (0-100%)
- ✅ Cleanup raw files & temp data

---

## **📅 DAY 4: Frontend - Video Upload UI**

### **Morning: Upload Component** (3-4 hours)

#### **Tasks:**

1. ✅ Create VideoUpload component
   ```typescript
   // libs/shared/ui-kit/src/components/VideoUpload/VideoUpload.tsx
   import React, { useState } from 'react';
   import { Box, Button, LinearProgress, Typography, Alert } from '@mui/material';
   import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
   import axios from 'axios';
   
   export interface VideoUploadProps {
     postId?: string;
     onUploadComplete?: (videoId: string) => void;
     onError?: (error: Error) => void;
   }
   
   export const VideoUpload: React.FC<VideoUploadProps> = ({
     postId,
     onUploadComplete,
     onError,
   }) => {
     const [file, setFile] = useState<File | null>(null);
     const [uploading, setUploading] = useState(false);
     const [progress, setProgress] = useState(0);
     const [error, setError] = useState<string | null>(null);
     const [videoId, setVideoId] = useState<string | null>(null);
     const [uploadComplete, setUploadComplete] = useState(false);
     
     const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
       const selectedFile = event.target.files?.[0];
       if (!selectedFile) return;
       
       // Validate file
       const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
       const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
       
       if (selectedFile.size > MAX_SIZE) {
         setError('File size exceeds 2GB limit');
         return;
       }
       
       if (!ALLOWED_TYPES.includes(selectedFile.type)) {
         setError('Only MP4, MOV, AVI formats are supported');
         return;
       }
       
       setFile(selectedFile);
       setError(null);
     };
     
     const handleUpload = async () => {
       if (!file) return;
       
       try {
         setUploading(true);
         setProgress(0);
         setError(null);
         
         // 1. Get presigned upload URL
         const urlResponse = await axios.post('/api/videos/upload-url', {
           postId,
           filename: file.name,
           fileSize: file.size,
           mimeType: file.type,
         });
         
         const { videoId: newVideoId, uploadUrl } = urlResponse.data;
         setVideoId(newVideoId);
         
         // 2. Upload directly to MinIO
         await axios.put(uploadUrl, file, {
           headers: {
             'Content-Type': file.type,
           },
           onUploadProgress: (progressEvent) => {
             const percentCompleted = Math.round(
               (progressEvent.loaded * 100) / (progressEvent.total || file.size)
             );
             setProgress(percentCompleted);
           },
         });
         
         // 3. Confirm upload
         await axios.post(`/api/videos/${newVideoId}/confirm`);
         
         setUploadComplete(true);
         onUploadComplete?.(newVideoId);
       } catch (err: any) {
         const errorMessage = err.response?.data?.message || err.message;
         setError(errorMessage);
         onError?.(err);
       } finally {
         setUploading(false);
       }
     };
     
     return (
       <Box sx={{ width: '100%' }}>
         <input
           type="file"
           accept="video/mp4,video/quicktime,video/x-msvideo"
           onChange={handleFileSelect}
           style={{ display: 'none' }}
           id="video-upload-input"
         />
         
         <label htmlFor="video-upload-input">
           <Button
             variant="outlined"
             component="span"
             startIcon={<CloudUpload />}
             disabled={uploading || uploadComplete}
             fullWidth
           >
             {file ? file.name : 'Select Video'}
           </Button>
         </label>
         
         {file && !uploadComplete && (
           <Button
             variant="contained"
             onClick={handleUpload}
             disabled={uploading}
             fullWidth
             sx={{ mt: 2 }}
           >
             {uploading ? 'Uploading...' : 'Upload Video'}
           </Button>
         )}
         
         {uploading && (
           <Box sx={{ mt: 2 }}>
             <LinearProgress variant="determinate" value={progress} />
             <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
               {progress}% uploaded
             </Typography>
           </Box>
         )}
         
         {uploadComplete && (
           <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
             Video uploaded successfully! Processing will begin shortly.
           </Alert>
         )}
         
         {error && (
           <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
             {error}
           </Alert>
         )}
       </Box>
     );
   };
   ```

2. ✅ Create VideoStatus component
   ```typescript
   // libs/shared/ui-kit/src/components/VideoStatus/VideoStatus.tsx
   import React, { useEffect, useState } from 'react';
   import { Box, LinearProgress, Typography, Alert, Chip } from '@mui/material';
   import axios from 'axios';
   
   export interface VideoStatusProps {
     videoId: string;
     onReady?: (hlsUrl: string) => void;
   }
   
   export const VideoStatus: React.FC<VideoStatusProps> = ({ videoId, onReady }) => {
     const [status, setStatus] = useState<'uploading' | 'processing' | 'ready' | 'failed'>('uploading');
     const [progress, setProgress] = useState(0);
     const [hlsUrl, setHlsUrl] = useState<string | null>(null);
     const [error, setError] = useState<string | null>(null);
     
     useEffect(() => {
       let intervalId: NodeJS.Timeout;
       
       const pollStatus = async () => {
         try {
           const response = await axios.get(`/api/videos/${videoId}/status`);
           const { status: newStatus, progress: newProgress, hlsMasterUrl, errorMessage } = response.data;
           
           setStatus(newStatus);
           setProgress(newProgress || 0);
           
           if (newStatus === 'ready' && hlsMasterUrl) {
             setHlsUrl(hlsMasterUrl);
             onReady?.(hlsMasterUrl);
             clearInterval(intervalId);
           }
           
           if (newStatus === 'failed') {
             setError(errorMessage || 'Video processing failed');
             clearInterval(intervalId);
           }
         } catch (err: any) {
           console.error('Failed to poll status:', err);
         }
       };
       
       // Poll every 5 seconds
       pollStatus();
       intervalId = setInterval(pollStatus, 5000);
       
       return () => clearInterval(intervalId);
     }, [videoId, onReady]);
     
     const getStatusColor = () => {
       switch (status) {
         case 'uploading': return 'info';
         case 'processing': return 'warning';
         case 'ready': return 'success';
         case 'failed': return 'error';
         default: return 'default';
       }
     };
     
     return (
       <Box>
         <Box display="flex" alignItems="center" gap={2} mb={2}>
           <Chip
             label={status.toUpperCase()}
             color={getStatusColor()}
             size="small"
           />
           {status === 'processing' && (
             <Typography variant="body2" color="text.secondary">
               {progress}% complete
             </Typography>
           )}
         </Box>
         
         {status === 'processing' && (
           <LinearProgress variant="determinate" value={progress} />
         )}
         
         {status === 'ready' && hlsUrl && (
           <Alert severity="success">
             Video is ready for playback!
           </Alert>
         )}
         
         {status === 'failed' && (
           <Alert severity="error">
             {error || 'Video processing failed'}
           </Alert>
         )}
       </Box>
     );
   };
   ```

#### **Deliverables:**
- ✅ VideoUpload component với progress tracking
- ✅ VideoStatus component với polling
- ✅ File validation
- ✅ Error handling

---

### **Afternoon: Integrate into Post Editor** (3-4 hours)

#### **Tasks:**

1. ✅ Update PostForm page
   ```typescript
   // apps/web-client/src/app/posts/new/page.tsx
   'use client';
   
   import { useState } from 'react';
   import { Box, Paper, Divider } from '@mui/material';
   import { VideoUpload, VideoStatus, VideoPlayer } from '@blog/shared-ui-kit';
   
   export default function CreatePostPage() {
     const [videoId, setVideoId] = useState<string | null>(null);
     const [hlsUrl, setHlsUrl] = useState<string | null>(null);
     
     return (
       <Container maxWidth="md" sx={{ py: 4 }}>
         <Paper elevation={0} sx={{ p: 4 }}>
           {/* Title, Content, Tags... (existing code) */}
           
           <Divider sx={{ my: 4 }} />
           
           {/* Video Upload Section */}
           <Box mb={4}>
             <Typography variant="h6" mb={2}>
               Add Video (Optional)
             </Typography>
             
             {!videoId ? (
               <VideoUpload
                 onUploadComplete={(id) => setVideoId(id)}
                 onError={(err) => console.error(err)}
               />
             ) : !hlsUrl ? (
               <VideoStatus
                 videoId={videoId}
                 onReady={(url) => setHlsUrl(url)}
               />
             ) : (
               <VideoPlayer
                 src={hlsUrl}
                 thumbnail={`/api/videos/${videoId}/thumbnail`}
               />
             )}
           </Box>
           
           {/* Publish Button */}
         </Paper>
       </Container>
     );
   }
   ```

2. ✅ Create Storybook stories
   ```typescript
   // libs/shared/ui-kit/src/components/VideoUpload/VideoUpload.stories.tsx
   export default {
     title: 'Components/VideoUpload',
     component: VideoUpload,
   };
   
   export const Default = {
     args: {
       onUploadComplete: (id) => console.log('Upload complete:', id),
     },
   };
   
   export const WithPostId = {
     args: {
       postId: 'post-123',
     },
   };
   ```

#### **Deliverables:**
- ✅ VideoUpload integrated into post editor
- ✅ Storybook stories
- ✅ E2E upload flow working

---

## **📅 DAY 5: Video Player Component**

### **Full Day: HLS Video Player** (6-8 hours)

#### **Tasks:**

1. ✅ Install video player library
   ```bash
   npm install --save video.js @videojs/http-streaming
   npm install --save-dev @types/video.js
   ```

2. ✅ Create VideoPlayer component
   ```typescript
   // libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.tsx
   import React, { useEffect, useRef } from 'react';
   import { Box } from '@mui/material';
   import videojs from 'video.js';
   import 'video.js/dist/video-js.css';
   
   export interface VideoPlayerProps {
     src: string;
     thumbnail?: string;
     autoplay?: boolean;
     controls?: boolean;
     width?: string | number;
     height?: string | number;
   }
   
   export const VideoPlayer: React.FC<VideoPlayerProps> = ({
     src,
     thumbnail,
     autoplay = false,
     controls = true,
     width = '100%',
     height = 'auto',
   }) => {
     const videoRef = useRef<HTMLVideoElement>(null);
     const playerRef = useRef<any>(null);
     
     useEffect(() => {
       if (!videoRef.current) return;
       
       // Initialize Video.js
       const player = videojs(videoRef.current, {
         controls,
         autoplay,
         preload: 'auto',
         poster: thumbnail,
         fluid: true,
         responsive: true,
         sources: [{
           src,
           type: 'application/x-mpegURL',
         }],
         html5: {
           vhs: {
             overrideNative: true,
           },
           nativeVideoTracks: false,
           nativeAudioTracks: false,
           nativeTextTracks: false,
         },
       });
       
       playerRef.current = player;
       
       // Setup quality selector
       player.ready(() => {
         const qualities = player.qualityLevels();
         console.log('Available qualities:', qualities.length);
         
         // Auto-select quality based on screen size
         const screenWidth = window.innerWidth;
         let targetHeight = 720;
         
         if (screenWidth >= 1920) targetHeight = 1080;
         else if (screenWidth >= 1280) targetHeight = 720;
         else if (screenWidth >= 854) targetHeight = 480;
         else targetHeight = 360;
         
         for (let i = 0; i < qualities.length; i++) {
           qualities[i].enabled = qualities[i].height === targetHeight;
         }
       });
       
       return () => {
         if (playerRef.current) {
           playerRef.current.dispose();
           playerRef.current = null;
         }
       };
     }, [src, thumbnail, autoplay, controls]);
     
     return (
       <Box sx={{ width, height }}>
         <div data-vjs-player>
           <video
             ref={videoRef}
             className="video-js vjs-big-play-centered"
           />
         </div>
       </Box>
     );
   };
   ```

3. ✅ Add custom Video.js theme
   ```css
   /* libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.css */
   .video-js {
     font-family: 'Roboto', sans-serif;
   }
   
   .video-js .vjs-big-play-button {
     background-color: rgba(103, 80, 164, 0.9);
     border-color: #6750A4;
     border-radius: 50%;
     width: 80px;
     height: 80px;
     line-height: 80px;
     margin-top: -40px;
     margin-left: -40px;
   }
   
   .video-js .vjs-big-play-button:hover {
     background-color: #6750A4;
   }
   
   .video-js .vjs-control-bar {
     background-color: rgba(0, 0, 0, 0.7);
   }
   
   .video-js .vjs-play-progress,
   .video-js .vjs-volume-level {
     background-color: #6750A4;
   }
   ```

4. ✅ Create quality selector plugin
   ```typescript
   // libs/shared/ui-kit/src/components/VideoPlayer/quality-selector.plugin.ts
   import videojs from 'video.js';
   
   const Button = videojs.getComponent('Button');
   
   class QualityButton extends Button {
     constructor(player: any, options: any) {
       super(player, options);
       
       this.controlText('Quality');
       this.addClass('vjs-quality-button');
     }
     
     buildCSSClass() {
       return `vjs-quality-button ${super.buildCSSClass()}`;
     }
     
     handleClick() {
       const qualityLevels = this.player().qualityLevels();
       const currentQuality = this.getCurrentQuality(qualityLevels);
       
       // Show quality menu
       this.showQualityMenu(qualityLevels, currentQuality);
     }
     
     getCurrentQuality(qualityLevels: any): string {
       for (let i = 0; i < qualityLevels.length; i++) {
         if (qualityLevels[i].enabled) {
           return `${qualityLevels[i].height}p`;
         }
       }
       return 'Auto';
     }
     
     showQualityMenu(qualityLevels: any, current: string) {
       // Implementation: Show menu with available qualities
       // Allow user to select quality manually
     }
   }
   
   videojs.registerComponent('QualityButton', QualityButton);
   ```

5. ✅ Create Storybook stories
   ```typescript
   // libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.stories.tsx
   export default {
     title: 'Components/VideoPlayer',
     component: VideoPlayer,
   };
   
   export const Default = {
     args: {
       src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
       thumbnail: 'https://via.placeholder.com/1280x720',
     },
   };
   
   export const Autoplay = {
     args: {
       src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
       autoplay: true,
     },
   };
   
   export const CustomSize = {
     args: {
       src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
       width: 640,
       height: 360,
     },
   };
   ```

#### **Deliverables:**
- ✅ VideoPlayer component với HLS support
- ✅ Adaptive quality selection
- ✅ Custom Material Design theme
- ✅ Quality selector plugin
- ✅ Storybook stories

---

## **📅 DAY 6: Integration & Testing**

### **Morning: Post Detail Page** (3-4 hours)

#### **Tasks:**

1. ✅ Update PostDetail page
   ```typescript
   // apps/web-client/src/app/posts/[id]/page.tsx
   'use client';
   
   import { VideoPlayer } from '@blog/shared-ui-kit';
   
   export default function PostDetailPage() {
     const { data: post } = usePost(postId);
     
     return (
       <Container maxWidth="md">
         {/* Post header, title, author... */}
         
         {/* Video Player */}
         {post?.video && post.video.status === 'ready' && (
           <Box mb={4}>
             <VideoPlayer
               src={post.video.hlsMasterUrl}
               thumbnail={post.video.thumbnailUrl}
             />
           </Box>
         )}
         
         {post?.video && post.video.status === 'processing' && (
           <Box mb={4}>
             <VideoStatus videoId={post.video.id} />
           </Box>
         )}
         
         {/* Post content */}
         <Box dangerouslySetInnerHTML={{ __html: post?.content }} />
         
         {/* Comments... */}
       </Container>
     );
   }
   ```

2. ✅ Add video to API responses
   ```typescript
   // apps/api-server/src/routes/posts.routes.ts
   router.get('/:id', optionalAuthMiddleware, async (req, res) => {
     const post = await getPostByIdUseCase.execute({
       postId: req.params.id,
       userId: req.user?.id,
     });
     
     // Include video if exists
     if (post.videoId) {
       const video = await videoRepository.findById(post.videoId);
       post.video = video;
     }
     
     res.json(post);
   });
   ```

#### **Deliverables:**
- ✅ VideoPlayer integrated in PostDetail
- ✅ Processing status shown
- ✅ API includes video data

---

### **Afternoon: End-to-End Testing** (3-4 hours)

#### **Tasks:**

1. ✅ Manual E2E test
   ```
   Test Flow:
   
   1. Create new post
   2. Upload video (use small test file ~10MB)
   3. Wait for processing (~1-2 min)
   4. Check video status updates
   5. View processed video in player
   6. Test quality switching
   7. Verify all 4 qualities available
   8. Check thumbnail generated
   9. View post in feed
   10. Play video from feed
   ```

2. ✅ Create automated test
   ```typescript
   // apps/video-worker/src/__tests__/e2e/video-pipeline.spec.ts
   describe('Video Pipeline E2E', () => {
     it('should process video end-to-end', async () => {
       // 1. Generate upload URL
       const uploadResponse = await api.post('/videos/upload-url', {
         filename: 'test.mp4',
         fileSize: 10485760,
         mimeType: 'video/mp4',
       });
       
       const { videoId, uploadUrl } = uploadResponse.data;
       
       // 2. Upload file
       await axios.put(uploadUrl, testVideoBuffer, {
         headers: { 'Content-Type': 'video/mp4' },
       });
       
       // 3. Confirm upload
       await api.post(`/videos/${videoId}/confirm`);
       
       // 4. Wait for processing (max 5 min)
       let status = 'processing';
       let attempts = 0;
       
       while (status === 'processing' && attempts < 60) {
         await new Promise(resolve => setTimeout(resolve, 5000));
         
         const statusResponse = await api.get(`/videos/${videoId}/status`);
         status = statusResponse.data.status;
         attempts++;
       }
       
       // 5. Verify ready
       expect(status).toBe('ready');
       
       const video = await videoRepository.findById(videoId);
       expect(video.hlsMasterUrl).toBeDefined();
       expect(video.thumbnailUrl).toBeDefined();
       expect(video.availableQualities).toHaveLength(4);
       expect(video.duration).toBeGreaterThan(0);
     }, 600000); // 10 min timeout
   });
   ```

3. ✅ Performance testing
   ```typescript
   // Test concurrent uploads
   describe('Concurrent Processing', () => {
     it('should handle 5 concurrent videos', async () => {
       const promises = Array(5).fill(null).map(async (_, i) => {
         // Upload video i
         // Wait for processing
         // Verify success
       });
       
       const results = await Promise.all(promises);
       expect(results.every(r => r.status === 'ready')).toBe(true);
     });
   });
   ```

#### **Deliverables:**
- ✅ Manual E2E test passed
- ✅ Automated E2E test
- ✅ Performance test (5 concurrent)
- ✅ All 4 qualities verified

---

## **📅 DAY 7: Polish & Documentation**

### **Morning: Error Handling & Edge Cases** (3-4 hours)

#### **Tasks:**

1. ✅ Handle upload failures
   ```typescript
   // Add retry logic for failed uploads
   // Add cancel upload functionality
   // Handle presigned URL expiration
   // Add upload resume capability
   ```

2. ✅ Handle processing failures
   ```typescript
   // Retry failed jobs (max 3 attempts)
   // Better error messages
   // Admin dashboard to view failed videos
   // Manual retry endpoint
   ```

3. ✅ Add monitoring
   ```typescript
   // Log processing metrics
   // Alert on repeated failures
   // Track average processing time
   // Monitor queue size
   ```

4. ✅ Optimize performance
   ```typescript
   // Adjust FFmpeg preset (fast → medium for better quality)
   // Implement chunked upload for large files
   // Add video duration validation (max 30 min)
   // Optimize thumbnail generation
   ```

#### **Deliverables:**
- ✅ Robust error handling
- ✅ Retry mechanisms
- ✅ Monitoring setup
- ✅ Performance optimizations

---

### **Afternoon: Documentation** (3-4 hours)

#### **Tasks:**

1. ✅ Create WEEK5_SUMMARY.md
   ```markdown
   # Week 5: Video Infrastructure - Summary
   
   ## Architecture
   [Diagram of upload → process → stream flow]
   
   ## Components Built
   - MinIO integration
   - BullMQ job queue
   - FFmpeg worker
   - Video upload UI
   - Video player
   
   ## API Endpoints
   - POST /api/videos/upload-url
   - POST /api/videos/:id/confirm
   - GET /api/videos/:id/status
   
   ## Testing
   - Unit tests: 95% coverage
   - E2E tests: 3 scenarios
   - Performance: 5 concurrent uploads
   
   ## Metrics
   - Processing time: ~2 min for 10MB video
   - Storage used: 4x original size (4 qualities)
   - Worker concurrency: 2 videos
   ```

2. ✅ Update README
   ```markdown
   # Video Features
   
   ## Upload
   - Supported formats: MP4, MOV, AVI
   - Max size: 2GB
   - Max duration: 30 minutes
   - Direct upload to MinIO
   
   ## Processing
   - Automatic HLS encoding
   - 4 qualities: 1080p, 720p, 480p, 360p
   - Thumbnail generation
   - ~2 minutes processing time
   
   ## Playback
   - Adaptive quality switching
   - Custom video player
   - Responsive design
   ```

3. ✅ API documentation
   ```typescript
   // Add Swagger docs for new endpoints
   /**
    * @swagger
    * /api/videos/upload-url:
    *   post:
    *     summary: Generate presigned upload URL
    *     requestBody:
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               filename:
    *                 type: string
    *               fileSize:
    *                 type: number
    *               mimeType:
    *                 type: string
    */
   ```

#### **Deliverables:**
- ✅ WEEK5_SUMMARY.md
- ✅ README updated
- ✅ API docs (Swagger)
- ✅ Architecture diagrams

---

## 📊 **SUCCESS CRITERIA**

### **Must Have (MVP):**
- ✅ Upload video via presigned URL
- ✅ Process video to HLS (4 qualities)
- ✅ Generate thumbnail
- ✅ Play video in web app
- ✅ Status polling during processing

### **Should Have:**
- ✅ Progress tracking (0-100%)
- ✅ Error handling & retry
- ✅ Quality selector in player
- ✅ E2E tests

### **Nice to Have:**
- ⭐ Upload resume capability
- ⭐ Admin dashboard
- ⭐ Video analytics
- ⭐ CDN integration

---

## 🎯 **METRICS TO TRACK**

### **Performance:**
- Upload speed: Target < 1 min for 100MB
- Processing time: Target < 2 min for 10MB
- Player load time: Target < 2 seconds

### **Quality:**
- Unit test coverage: Target 80%+
- E2E test pass rate: Target 100%
- Error rate: Target < 1%

### **Scalability:**
- Concurrent processing: Target 5 videos
- Queue size: Monitor < 100
- Storage efficiency: 4x original size

---

## 🚀 **READY FOR WEEK 6?**

After completing Week 5, you should have:

1. ✅ Complete video pipeline working
2. ✅ 4-quality HLS streaming
3. ✅ Web player functional
4. ✅ E2E tests passing
5. ✅ Documentation complete

**Week 6 Preview:** State Management
- TanStack Query optimizations
- Optimistic updates
- Form management
- Integration tests

---

## 💡 **TIPS & BEST PRACTICES**

### **FFmpeg Tips:**
```bash
# Test encoding locally
ffmpeg -i input.mp4 \
  -c:v libx264 -b:v 2800k \
  -c:a aac -b:a 128k \
  -vf "scale=1280:720" \
  -preset fast \
  -hls_time 4 \
  -hls_playlist_type vod \
  output.m3u8

# Check video metadata
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

### **MinIO Tips:**
```bash
# Test presigned URLs
mc share upload myminio/videos-raw/test.mp4 --expire=1h

# List all objects
mc ls myminio/videos-encoded --recursive

# Check bucket policy
mc admin policy info myminio/ readonly
```

### **BullMQ Tips:**
```typescript
// Monitor queue in real-time
const queue = new Queue('video-encoding');
queue.on('waiting', (job) => console.log('Job waiting:', job.id));
queue.on('active', (job) => console.log('Job active:', job.id));
queue.on('completed', (job) => console.log('Job done:', job.id));

// Clean old jobs
await queue.clean(24 * 3600 * 1000, 'completed');
```

---

## 🎊 **KẾT LUẬN**

Week 5 là tuần quan trọng xây dựng video infrastructure - backbone của platform. Với roadmap chi tiết này, bạn sẽ có:

✅ Complete upload → process → stream pipeline  
✅ Professional video player  
✅ Robust error handling  
✅ Comprehensive testing  
✅ Production-ready code  

**Estimated Effort:** 40-50 hours  
**Difficulty:** ⭐⭐⭐⭐ (Advanced)  
**Dependencies:** Docker, FFmpeg, MinIO all ready from Week 1  

Chúc bạn thành công! 🚀
