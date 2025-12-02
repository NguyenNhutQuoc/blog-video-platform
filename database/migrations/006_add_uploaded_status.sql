-- =====================================================
-- DATABASE MIGRATION: Add 'uploaded' and 'partial_ready' video statuses
-- Version: 1.6
-- Date: 2025-12-02
-- Description: Add new video statuses to support better UX
--   - 'uploaded': Video uploaded and queued, user can create post immediately
--   - 'partial_ready': Some qualities encoded successfully, others failed but will retry
-- =====================================================

-- Drop old constraint
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS video_status_valid;

-- Add new constraint with additional statuses
ALTER TABLE videos
ADD CONSTRAINT video_status_valid
CHECK (status IN ('uploading', 'uploaded', 'processing', 'ready', 'partial_ready', 'failed', 'cancelled'));

-- Update comment
COMMENT ON COLUMN videos.status IS 'Video processing status:
  - uploading: Initial state, upload in progress
  - uploaded: Upload complete, queued for processing (user can create post)
  - processing: Encoding in progress
  - ready: All qualities encoded successfully
  - partial_ready: Some qualities ready, others failed (will retry)
  - failed: Encoding failed permanently after max retries
  - cancelled: Encoding cancelled by user';
