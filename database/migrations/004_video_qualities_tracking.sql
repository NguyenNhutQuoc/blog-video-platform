-- Migration 004: Video Qualities Tracking and Failed Encoding Artifacts
-- This migration adds granular tracking for individual video quality encoding
-- and stores failed encoding artifacts for debugging purposes

-- Create video_qualities table for tracking individual quality encoding status
CREATE TABLE IF NOT EXISTS video_qualities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    quality_name VARCHAR(20) NOT NULL, -- '360p', '480p', '720p', '1080p'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'encoding', 'ready', 'failed', 'cancelled'
    hls_playlist_path VARCHAR(500),
    segments_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    retry_priority INTEGER NOT NULL, -- 1=360p (highest priority), 2=480p, 3=720p, 4=1080p (lowest)
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_video_qualities_video FOREIGN KEY (video_id) 
        REFERENCES videos(id) ON DELETE CASCADE,
    CONSTRAINT video_quality_status_valid CHECK (status IN ('pending', 'encoding', 'ready', 'failed', 'cancelled')),
    CONSTRAINT video_quality_name_valid CHECK (quality_name IN ('360p', '480p', '720p', '1080p')),
    CONSTRAINT video_quality_retry_limit CHECK (retry_count <= 3),
    CONSTRAINT video_quality_retry_priority_valid CHECK (retry_priority BETWEEN 1 AND 4),
    CONSTRAINT video_quality_unique UNIQUE (video_id, quality_name)
);

-- Create index for efficient queries
CREATE INDEX idx_video_qualities_video_id ON video_qualities(video_id);
CREATE INDEX idx_video_qualities_status ON video_qualities(status);
CREATE INDEX idx_video_qualities_retry ON video_qualities(status, retry_priority) 
    WHERE status = 'failed' AND retry_count < 3;

-- Create failed_encoding_artifacts table for debugging
CREATE TABLE IF NOT EXISTS failed_encoding_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    quality_name VARCHAR(20) NOT NULL,
    storage_path VARCHAR(500) NOT NULL, -- Path in MinIO videos-failed-debug bucket
    file_size BIGINT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleanup_after TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    CONSTRAINT fk_failed_artifacts_video FOREIGN KEY (video_id) 
        REFERENCES videos(id) ON DELETE CASCADE
);

-- Create index for cleanup job
CREATE INDEX idx_failed_artifacts_cleanup ON failed_encoding_artifacts(cleanup_after) 
    WHERE cleanup_after IS NOT NULL;

-- Add new status 'partial_ready' to videos table
ALTER TABLE videos DROP CONSTRAINT IF EXISTS video_status_valid;
ALTER TABLE videos ADD CONSTRAINT video_status_valid 
    CHECK (status IN ('uploading', 'processing', 'ready', 'partial_ready', 'failed', 'cancelled'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_qualities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_qualities_updated_at
    BEFORE UPDATE ON video_qualities
    FOR EACH ROW
    EXECUTE FUNCTION update_video_qualities_updated_at();

-- Create function to get video encoding status
CREATE OR REPLACE FUNCTION get_video_encoding_status(p_video_id UUID)
RETURNS TABLE (
    quality_name VARCHAR(20),
    status VARCHAR(20),
    retry_count INTEGER,
    error_message TEXT,
    completed_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vq.quality_name,
        vq.status,
        vq.retry_count,
        vq.error_message,
        vq.completed_at
    FROM video_qualities vq
    WHERE vq.video_id = p_video_id
    ORDER BY vq.retry_priority ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if video has minimum qualities for playback
CREATE OR REPLACE FUNCTION has_minimum_qualities(p_video_id UUID, p_min_count INTEGER DEFAULT 2)
RETURNS BOOLEAN AS $$
DECLARE
    ready_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ready_count
    FROM video_qualities
    WHERE video_id = p_video_id AND status = 'ready';
    
    RETURN ready_count >= p_min_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE video_qualities IS 'Tracks individual video quality encoding status for parallel processing';
COMMENT ON TABLE failed_encoding_artifacts IS 'Stores failed encoding artifacts for debugging with 30-day auto-cleanup';
COMMENT ON COLUMN video_qualities.retry_priority IS 'Lower number = higher priority for retry (360p=1, 480p=2, 720p=3, 1080p=4)';
COMMENT ON COLUMN failed_encoding_artifacts.cleanup_after IS 'Timestamp when artifact should be auto-deleted (default 30 days from creation)';
