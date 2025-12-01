# 🚀 WEEK 5 QUICK START GUIDE

**Mục tiêu:** Bắt đầu Week 5 nhanh chóng và hiệu quả

---

## ✅ **PRE-FLIGHT CHECK**

Trước khi bắt đầu, verify rằng bạn đã có:

```bash
# 1. Check Docker services
docker compose ps

# Expected: postgres, redis, minio, api-server, video-worker running
# Status: All services should be "Up" and "healthy"

# 2. Check MinIO access
curl http://localhost:9000/minio/health/live
# Expected: 200 OK

# 3. Check API server
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# 4. Check Redis
docker compose exec redis redis-cli -a $REDIS_PASSWORD PING
# Expected: PONG

# 5. Check FFmpeg in video-worker
docker compose exec video-worker ffmpeg -version
# Expected: ffmpeg version info
```

**✅ All checks passed?** → Proceed to Day 1

**❌ Some checks failed?** → Fix infrastructure first:
```bash
# Restart failed services
docker compose restart <service-name>

# Check logs
docker compose logs <service-name>

# Rebuild if needed
docker compose up -d --build <service-name>
```

---

## 🎯 **DAY 1 - QUICK START**

### **Step 1: Install Dependencies** (5 min)

```bash
# From project root
npm install --save minio
npm install --save-dev @types/minio
```

### **Step 2: Create MinIO Service** (30 min)

```bash
# Create file
mkdir -p libs/backend/infrastructure/src/services
touch libs/backend/infrastructure/src/services/minio.service.ts
```

**Copy template từ WEEK5_VIDEO_INFRASTRUCTURE_ROADMAP.md → Section "DAY 1: MinIO Service"**

### **Step 3: Test MinIO Service** (15 min)

```typescript
// Quick test
const service = new MinIOService(config);
const url = await service.generatePresignedUploadUrl('videos-raw', 'test.mp4');
console.log('Presigned URL:', url);
```

### **Step 4: Create Upload API** (60 min)

```bash
# Create files
mkdir -p libs/backend/application/src/use-cases/videos
touch libs/backend/application/src/use-cases/videos/generate-upload-url.use-case.ts
touch libs/backend/application/src/use-cases/videos/confirm-upload.use-case.ts
```

### **Step 5: Test API** (15 min)

```bash
# Generate upload URL
curl -X POST http://localhost:3000/api/videos/upload-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.mp4",
    "fileSize": 10485760,
    "mimeType": "video/mp4"
  }'

# Expected: { videoId, uploadUrl, expiresAt }
```

**✅ Day 1 Done:** Upload URL generation works

---

## 🎯 **DAY 2 - QUICK START**

### **Step 1: Install BullMQ** (5 min)

```bash
npm install --save bullmq
npm install --save-dev @types/bullmq
```

### **Step 2: Create Queue Service** (30 min)

```bash
touch libs/backend/infrastructure/src/services/video-queue.service.ts
```

**Template code → WEEK5_VIDEO_INFRASTRUCTURE_ROADMAP.md → "DAY 2: Queue Service"**

### **Step 3: Create Worker** (45 min)

```bash
# Create worker files
mkdir -p apps/video-worker/src
touch apps/video-worker/src/worker.ts
touch apps/video-worker/src/main.ts
```

### **Step 4: Test Queue** (15 min)

```bash
# Terminal 1: Start worker
cd apps/video-worker
npm run dev

# Terminal 2: Queue a job
curl -X POST http://localhost:3000/api/videos/VIDEO_ID/confirm \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check worker logs - should see "Processing job..."
```

**✅ Day 2 Done:** Jobs are queued and picked up

---

## 🎯 **DAY 3 - QUICK START**

### **Step 1: Install FFmpeg** (5 min)

```bash
npm install --save fluent-ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

### **Step 2: Test FFmpeg** (10 min)

```bash
# In video-worker container
docker compose exec video-worker ffmpeg -version
docker compose exec video-worker ffprobe -version
```

### **Step 3: Create FFmpeg Service** (90 min)

```bash
touch libs/backend/infrastructure/src/services/ffmpeg.service.ts
```

**Copy full implementation từ roadmap**

### **Step 4: Integrate into Worker** (60 min)

Update `apps/video-worker/src/worker.ts` với full processing pipeline

### **Step 5: Test with Real Video** (30 min)

```bash
# Upload a small test video (10-50MB)
# Monitor worker logs
docker compose logs -f video-worker

# Expected output:
# - "Downloading video..."
# - "Extracting metadata..."
# - "Generating thumbnail..."
# - "Encoding to HLS..."
# - "Uploading encoded files..."
# - "✅ Video processed successfully"
```

**✅ Day 3 Done:** Videos are fully processed

---

## 🎯 **DAY 4 - QUICK START**

### **Step 1: Create Upload Component** (90 min)

```bash
mkdir -p libs/shared/ui-kit/src/components/VideoUpload
touch libs/shared/ui-kit/src/components/VideoUpload/VideoUpload.tsx
```

**Copy component code từ roadmap**

### **Step 2: Create Status Component** (45 min)

```bash
mkdir -p libs/shared/ui-kit/src/components/VideoStatus
touch libs/shared/ui-kit/src/components/VideoStatus/VideoStatus.tsx
```

### **Step 3: Integrate into Post Editor** (45 min)

Update `apps/web-client/src/app/posts/new/page.tsx`

### **Step 4: Test Upload Flow** (15 min)

1. Go to http://localhost:3000/posts/new
2. Click "Select Video"
3. Choose small video file
4. Click "Upload"
5. Watch progress bar
6. See "Processing..." status
7. Wait for "Ready" status

**✅ Day 4 Done:** Users can upload videos

---

## 🎯 **DAY 5 - QUICK START**

### **Step 1: Install Video.js** (5 min)

```bash
npm install --save video.js @videojs/http-streaming
npm install --save-dev @types/video.js
```

### **Step 2: Create Player Component** (120 min)

```bash
mkdir -p libs/shared/ui-kit/src/components/VideoPlayer
touch libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.tsx
touch libs/shared/ui-kit/src/components/VideoPlayer/VideoPlayer.css
```

**Copy implementation từ roadmap**

### **Step 3: Test Player** (30 min)

```bash
# Run Storybook
npm run storybook

# Navigate to VideoPlayer stories
# Test with demo HLS URL
```

### **Step 4: Integrate into PostDetail** (30 min)

Update `apps/web-client/src/app/posts/[id]/page.tsx`

**✅ Day 5 Done:** Videos play beautifully

---

## 🎯 **DAYS 6-7 - QUICK START**

### **Day 6: Testing**

```bash
# Run all tests
npm run test

# Run E2E test
npm run test:e2e

# Check coverage
npm run test:cov
```

### **Day 7: Documentation**

```bash
# Create summary doc
touch docs/WEEK5_SUMMARY.md

# Update README
# Add API docs
# Create diagrams
```

---

## 🔥 **TROUBLESHOOTING**

### **Problem: MinIO connection refused**

```bash
# Check MinIO is running
docker compose ps minio

# Restart MinIO
docker compose restart minio

# Check logs
docker compose logs minio
```

### **Problem: Worker not picking up jobs**

```bash
# Check Redis connection
docker compose exec redis redis-cli -a $REDIS_PASSWORD PING

# Check worker logs
docker compose logs video-worker

# Restart worker
docker compose restart video-worker
```

### **Problem: FFmpeg encoding fails**

```bash
# Check FFmpeg installed
docker compose exec video-worker ffmpeg -version

# Check temp directory writable
docker compose exec video-worker ls -la /tmp

# Check video file downloaded
docker compose exec video-worker ls -la /tmp/video-processing/
```

### **Problem: Upload hangs**

```bash
# Check presigned URL not expired (1h limit)
# Verify file size < 2GB
# Check network connection
# Try uploading smaller file first
```

### **Problem: Video player not loading**

```bash
# Check HLS URL accessible
curl -I <HLS_MASTER_URL>

# Check CORS headers
# Check MinIO public read policy
# Test in browser DevTools Network tab
```

---

## 📚 **HELPFUL RESOURCES**

### **FFmpeg Cheatsheet**

```bash
# Get video info
ffprobe -v quiet -print_format json -show_format input.mp4

# Test encode
ffmpeg -i input.mp4 -c:v libx264 -b:v 2800k output.mp4

# Generate thumbnail
ffmpeg -i input.mp4 -ss 2 -vframes 1 -vf scale=1280:720 thumb.jpg

# Create HLS
ffmpeg -i input.mp4 -c:v libx264 -b:v 2800k \
  -hls_time 4 -hls_playlist_type vod output.m3u8
```

### **MinIO Commands**

```bash
# List buckets
mc ls myminio/

# List objects
mc ls myminio/videos-raw/ --recursive

# Get object
mc cp myminio/videos-raw/test.mp4 ./test.mp4

# Delete object
mc rm myminio/videos-raw/test.mp4

# Set policy
mc policy set public myminio/videos-encoded/
```

### **BullMQ Dashboard**

```bash
# Option 1: Bull Board (recommended)
npm install --save @bull-board/express @bull-board/api

# Add to api-server
# Access at http://localhost:3000/admin/queues

# Option 2: Redis Commander
docker compose --profile tools up -d redis-commander
# Access at http://localhost:8081
```

---

## ✅ **SUCCESS INDICATORS**

You know Week 5 is complete when:

1. ✅ Upload URL generation works
2. ✅ Direct upload to MinIO succeeds
3. ✅ Jobs are queued in BullMQ
4. ✅ Worker picks up jobs
5. ✅ FFmpeg encoding completes
6. ✅ 4 qualities generated (1080p, 720p, 480p, 360p)
7. ✅ Thumbnail created
8. ✅ HLS master playlist exists
9. ✅ Video plays in browser
10. ✅ Quality switching works
11. ✅ All tests pass
12. ✅ Documentation complete

---

## 🎊 **NEXT STEPS**

After Week 5:

**Week 6:** State Management
- TanStack Query advanced patterns
- Optimistic updates
- Complex form management
- Integration tests

**Week 7:** React Native Foundation
- Expo setup
- Mobile components
- Mobile authentication

**Week 8:** Mobile Video Upload
- expo-image-picker
- expo-file-system
- Mobile video player

---

## 💪 **MOTIVATION**

Week 5 is **challenging** but **rewarding**:

- ⭐ You're building real video infrastructure
- ⭐ Learning professional tools (FFmpeg, HLS, BullMQ)
- ⭐ Handling complex async workflows
- ⭐ Creating production-grade features

**Stay focused, take breaks, and debug patiently!** 🚀

You've got this! 💪
