# ✅ WEEK 5 - VIDEO INFRASTRUCTURE CHECKLIST

**Goal:** Complete video upload → processing → streaming pipeline

---

## 📅 **DAY 1: MinIO & Upload API**

### Morning: MinIO Setup
- [ ] Verify MinIO Docker service running
- [ ] Create 3 buckets (videos-raw, videos-encoded, thumbnails)
- [ ] Install MinIO SDK (`npm install minio`)
- [ ] Create MinIOService class
- [ ] Write unit tests for MinIOService
- [ ] Test presigned URLs generation

### Afternoon: Upload API
- [ ] Update Video entity with all fields
- [ ] Create GenerateUploadUrlUseCase
- [ ] Create ConfirmUploadUseCase
- [ ] Add 3 API endpoints (upload-url, confirm, status)
- [ ] Write integration tests
- [ ] Test with Postman/curl

**Day 1 Done:** ✅ Upload API working, files going to MinIO

---

## 📅 **DAY 2: BullMQ Job Queue**

### Morning: Queue Setup
- [ ] Install BullMQ (`npm install bullmq`)
- [ ] Create VideoQueueService
- [ ] Add addEncodingJob method
- [ ] Add getJobStatus method
- [ ] Create worker skeleton
- [ ] Setup event handlers (completed, failed, error)
- [ ] Test queue connection

### Afternoon: Worker Testing
- [ ] Write queue service tests
- [ ] Start worker in Docker
- [ ] Test job pickup
- [ ] Test end-to-end flow (upload → confirm → job queued)
- [ ] Verify worker logs show "Processing job..."

**Day 2 Done:** ✅ Jobs queued and picked up by worker

---

## 📅 **DAY 3: FFmpeg Processing**

### Morning: FFmpeg Service
- [ ] Install fluent-ffmpeg
- [ ] Create FFmpegService class
- [ ] Implement extractMetadata method
- [ ] Implement generateThumbnail method
- [ ] Implement encodeToHLS method (4 qualities)
- [ ] Create master playlist generator
- [ ] Test encoding locally

### Afternoon: Complete Worker
- [ ] Download video from MinIO
- [ ] Extract metadata
- [ ] Generate thumbnail
- [ ] Encode to HLS (1080p, 720p, 480p, 360p)
- [ ] Upload encoded files
- [ ] Update video status to 'ready'
- [ ] Delete raw file
- [ ] Cleanup temp files
- [ ] Add error handling & retry logic
- [ ] Test full pipeline with small video

**Day 3 Done:** ✅ Worker processes videos end-to-end

---

## 📅 **DAY 4: Upload UI**

### Morning: Upload Component
- [ ] Create VideoUpload component
- [ ] Add file selector with validation
- [ ] Add progress bar
- [ ] Handle upload to presigned URL
- [ ] Add success/error states
- [ ] Create VideoStatus component
- [ ] Add status polling (every 5s)
- [ ] Test upload flow in browser

### Afternoon: Post Editor Integration
- [ ] Integrate VideoUpload into /posts/new
- [ ] Add video section to editor
- [ ] Show VideoStatus during processing
- [ ] Handle upload complete
- [ ] Create Storybook stories
- [ ] Test E2E flow (editor → upload → process)

**Day 4 Done:** ✅ Users can upload videos from editor

---

## 📅 **DAY 5: Video Player**

### Full Day: HLS Player
- [ ] Install Video.js
- [ ] Create VideoPlayer component
- [ ] Configure HLS playback
- [ ] Add adaptive quality selection
- [ ] Create custom MD3 theme
- [ ] Implement quality selector plugin
- [ ] Add thumbnail support
- [ ] Test with sample HLS stream
- [ ] Test with own encoded videos
- [ ] Create Storybook stories
- [ ] Test on mobile

**Day 5 Done:** ✅ Video player works perfectly

---

## 📅 **DAY 6: Integration & Testing**

### Morning: Post Detail Integration
- [ ] Add VideoPlayer to PostDetail page
- [ ] Show VideoStatus for processing videos
- [ ] Update API to include video data
- [ ] Test viewing posts with videos
- [ ] Test quality switching

### Afternoon: E2E Testing
- [ ] Manual E2E test (upload → process → play)
- [ ] Write automated E2E test
- [ ] Test with 10MB video
- [ ] Verify all 4 qualities generated
- [ ] Verify thumbnail created
- [ ] Test concurrent processing (5 videos)
- [ ] Measure processing time
- [ ] Check storage usage

**Day 6 Done:** ✅ All tests passing

---

## 📅 **DAY 7: Polish & Docs**

### Morning: Error Handling
- [ ] Add upload retry logic
- [ ] Add cancel upload
- [ ] Handle presigned URL expiration
- [ ] Improve error messages
- [ ] Add manual retry endpoint
- [ ] Add processing monitoring
- [ ] Test failure scenarios

### Afternoon: Documentation
- [ ] Create WEEK5_SUMMARY.md
- [ ] Update main README
- [ ] Add Swagger docs for video endpoints
- [ ] Create architecture diagrams
- [ ] Document known issues
- [ ] Write deployment notes

**Day 7 Done:** ✅ Week 5 complete & documented

---

## 🎯 **FINAL CHECKLIST**

### Core Features
- [ ] Video upload via presigned URL ✅
- [ ] BullMQ job queue ✅
- [ ] FFmpeg encoding (4 qualities) ✅
- [ ] HLS video player ✅
- [ ] Status polling ✅

### Quality Assurance
- [ ] Unit tests (80%+ coverage)
- [ ] E2E tests passing
- [ ] Performance test (5 concurrent)
- [ ] Error handling tested

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Architecture diagrams
- [ ] Known issues documented

### Deliverables
- [ ] 3 API endpoints
- [ ] 1 worker service
- [ ] 3 UI components (Upload, Status, Player)
- [ ] 5 Storybook stories
- [ ] 10+ tests

---

## 📊 **SUCCESS METRICS**

### Performance Targets
- [ ] Upload 100MB in < 1 minute
- [ ] Process 10MB in < 2 minutes  
- [ ] Player loads in < 2 seconds
- [ ] All 4 qualities generated

### Quality Targets
- [ ] Test coverage > 80%
- [ ] E2E tests 100% pass rate
- [ ] Error rate < 1%
- [ ] Worker handles 5 concurrent videos

### Storage
- [ ] Raw file deleted after encoding
- [ ] Encoded size ~4x original
- [ ] Thumbnails ~50KB

---

## 🚀 **READY FOR WEEK 6?**

After Week 5, you should have:
- ✅ Complete video pipeline
- ✅ 4-quality HLS streaming
- ✅ Professional video player
- ✅ Comprehensive tests
- ✅ Production-ready code

**Week 6:** State Management & Optimization
- TanStack Query advanced patterns
- Optimistic updates
- Form management
- Integration tests

---

## 💡 **QUICK REFERENCE**

### Test Commands
```bash
# Start worker
cd apps/video-worker && npm run dev

# Run tests
npm run test

# E2E test
npm run test:e2e

# Check coverage
npm run test:cov
```

### Debug Commands
```bash
# Check MinIO buckets
docker compose exec minio-client mc ls myminio/

# Check Redis queue
docker compose exec redis redis-cli -a $REDIS_PASSWORD

# Worker logs
docker compose logs -f video-worker

# Check video status
curl http://localhost:3000/api/videos/{id}/status
```

### Useful Links
- MinIO Console: http://localhost:9001
- Storybook: http://localhost:6006
- API Swagger: http://localhost:3000/api-docs
- Redis Commander: http://localhost:8081 (if enabled)

---

**Estimated Time:** 40-50 hours  
**Difficulty:** ⭐⭐⭐⭐ Advanced  
**Prerequisites:** Week 1-4 complete  

Good luck! 🎥🚀
