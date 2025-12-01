# Week 5 Summary: Video Infrastructure Implementation

## Overview

Week 5 focused on building a complete video upload → processing → streaming pipeline. This implementation enables users to upload videos, have them processed into HLS format for adaptive streaming, and view them with a custom video player.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │     │   API Server    │     │   Video Worker  │
│   (Next.js)     │────▶│   (Express)     │────▶│   (BullMQ)      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼─────┐          ┌──────▼──────┐
    │ VideoJS │            │  Redis    │          │   FFmpeg    │
    │ Player  │            │  (Queue)  │          │ (Encoding)  │
    └─────────┘            └───────────┘          └─────────────┘
                                                         │
                           ┌─────────────────────────────┤
                           │                             │
                     ┌─────▼─────┐               ┌───────▼───────┐
                     │  MinIO    │               │  PostgreSQL   │
                     │ (Storage) │               │  (Database)   │
                     └───────────┘               └───────────────┘
```

## Components Implemented

### Day 1: MinIO Service Setup ✅

**Files Created:**

- `libs/backend/core/src/ports/services/storage.service.interface.ts` - IStorageService interface
- `libs/backend/infrastructure/src/storage/minio.service.ts` - MinIOService implementation
- `libs/backend/core/src/use-cases/videos/generate-upload-url.use-case.ts`
- `libs/backend/core/src/use-cases/videos/confirm-upload.use-case.ts`
- `libs/backend/core/src/use-cases/videos/get-video-status.use-case.ts`
- `apps/api-server/src/routes/videos.routes.ts` - Video API endpoints

**Key Features:**

- Presigned URL generation for direct upload (bypasses server for large files)
- Bucket management (videos-raw, videos-encoded, thumbnails)
- File existence verification
- Public URL generation for encoded videos

**API Endpoints:**

- `POST /api/videos/upload-url` - Generate presigned upload URL
- `POST /api/videos/:id/confirm` - Confirm upload and queue for processing
- `GET /api/videos/:id/status` - Get video processing status

### Day 2: BullMQ Job Queue ✅

**Files Created:**

- `libs/backend/core/src/ports/services/video-queue.service.interface.ts` - IVideoQueueService interface
- `libs/backend/infrastructure/src/queue/video-queue.service.ts` - BullMQVideoQueueService

**Key Features:**

- Redis-backed job queue for reliable processing
- Default retry configuration (3 attempts, exponential backoff)
- Job progress tracking
- Queue statistics monitoring

**Queue Configuration:**

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000 // 5s → 10s → 20s
  },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 }
}
```

### Day 3: FFmpeg Processing Pipeline ✅

**Files Created:**

- `libs/backend/core/src/ports/services/ffmpeg.service.interface.ts` - IFFmpegService interface
- `libs/backend/infrastructure/src/ffmpeg/ffmpeg.service.ts` - FFmpegService implementation
- `apps/video-worker/src/worker.ts` - Video encoding worker
- `apps/video-worker/src/main.ts` - Worker entry point
- `apps/video-worker/src/config/env.ts` - Worker configuration

**Processing Pipeline:**

1. Download video from MinIO (videos-raw bucket)
2. Extract metadata (duration, resolution, codec)
3. Generate thumbnail (at 10% or 2 seconds)
4. Encode to HLS with 4 quality variants:
   - 1080p @ 2800kbps
   - 720p @ 1400kbps
   - 480p @ 800kbps
   - 360p @ 400kbps
5. Upload thumbnail to MinIO
6. Upload HLS files (master playlist + segments)
7. Update database with URLs and metadata
8. Cleanup temporary files

**HLS Output Structure:**

```
videos-encoded/
  {videoId}/
    master.m3u8           # Master playlist
    1080p/
      playlist.m3u8       # Quality variant playlist
      segment_000.ts      # Video segments
      segment_001.ts
      ...
    720p/
      ...
    480p/
      ...
    360p/
      ...
```

### Day 4: Frontend Upload Components ✅

**Files Created:**

- `libs/shared/ui-kit/src/components/VideoUpload/VideoUpload.tsx`
- `libs/shared/ui-kit/src/components/VideoStatus/VideoStatus.tsx`
- `libs/shared/data-access/src/hooks/useVideos.ts`

**VideoUpload Component Features:**

- Drag and drop support
- File type validation (video/mp4, video/webm, video/quicktime)
- File size validation (max 2GB)
- Upload progress indicator
- Cancel upload functionality
- Error handling and display

**VideoStatus Component Features:**

- Real-time processing status updates (polling)
- Progress visualization
- Status icons (uploading, processing, ready, failed)
- Auto-refresh until completion

**Hooks:**

- `useRequestUploadUrl()` - Request presigned URL
- `useConfirmUpload()` - Confirm upload completion
- `useVideoStatus()` - Poll video processing status

### Day 5: HLS Video Player ✅

**Files Created:**

- `libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.tsx`

**VideoPlayer Features:**

- HLS.js integration via Video.js
- Custom controls overlay
- Quality selector (auto ABR + manual selection)
- Progress bar with seeking
- Volume control with mute toggle
- Fullscreen support
- Loading state indicator
- Center play button when paused
- Keyboard accessibility
- Responsive design

**Integration:**

- Added to post detail page (`apps/web-client/src/app/posts/[id]/page.tsx`)
- Automatically displays when post has a video with HLS URL
- Falls back to featured image when no video

## Database Schema Updates

Added `update` method to `IVideoRepository`:

```typescript
update(id: string, data: Partial<{
  status: string;
  hlsUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  processedAt: Date;
}>): Promise<void>;
```

## Environment Variables

**API Server:**

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=minio_password_change_in_production

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_change_in_production
```

**Video Worker:**

```env
# Worker Configuration
WORKER_CONCURRENCY=2
TEMP_DIR=/tmp/video-processing

# FFmpeg (optional - uses system PATH if not set)
FFMPEG_PATH=
FFPROBE_PATH=

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=blog_video_platform
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# MinIO & Redis (same as API server)
```

## Storage Buckets

| Bucket           | Access Policy | Purpose             |
| ---------------- | ------------- | ------------------- |
| `videos-raw`     | Private       | Raw uploaded videos |
| `videos-encoded` | Public-read   | HLS encoded videos  |
| `thumbnails`     | Public-read   | Video thumbnails    |

## Constraints & Limits

- **Maximum file size:** 2GB
- **Maximum duration:** 30 minutes
- **Supported formats:** MP4, WebM, QuickTime
- **Worker concurrency:** 2-3 simultaneous jobs
- **Retry attempts:** 3 (with exponential backoff)

## Running the System

1. **Start Docker services:**

   ```bash
   docker-compose up -d postgres redis minio
   ```

2. **Start API server:**

   ```bash
   nx serve api-server
   ```

3. **Start Video Worker:**

   ```bash
   nx serve video-worker
   ```

4. **Start Web Client:**
   ```bash
   nx serve web-client
   ```

## Testing

Run tests:

```bash
nx test backend-core
nx test backend-infrastructure
nx test shared-ui-kit
```

## Dependencies Added

**Backend:**

- `minio` - MinIO SDK
- `bullmq` - Job queue
- `fluent-ffmpeg` - FFmpeg wrapper
- `@types/fluent-ffmpeg` - TypeScript types

**Frontend:**

- `video.js` - Video player
- `@types/video.js` - TypeScript types

## Future Improvements

1. **Adaptive Bitrate:** Use ABR algorithms to dynamically adjust quality based on network conditions
2. **Thumbnail Grid:** Generate multiple thumbnails for video preview scrubbing
3. **Subtitles/Captions:** Support WebVTT subtitle files
4. **Video Analytics:** Track play counts, watch time, engagement
5. **CDN Integration:** Add CloudFront/Cloudflare for video delivery
6. **Live Streaming:** Extend to support HLS live streaming
7. **Video Trimming:** Allow users to trim videos before publishing

## Conclusion

Week 5 successfully implemented a complete video infrastructure with:

- ✅ Direct upload to MinIO with presigned URLs
- ✅ Background video processing with BullMQ
- ✅ HLS encoding with FFmpeg (4 quality levels)
- ✅ Video player with quality selection
- ✅ Real-time processing status updates
- ✅ Error handling and retry logic
