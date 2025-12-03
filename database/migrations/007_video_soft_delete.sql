-- Migration: Add soft delete support for videos
-- Description: Adds deleted_at column for soft delete functionality
-- Date: 2024-12-03

-- Add deleted_at column to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for querying deleted videos efficiently
CREATE INDEX IF NOT EXISTS idx_videos_deleted_at 
ON videos(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Create index for querying active (non-deleted) videos
CREATE INDEX IF NOT EXISTS idx_videos_active 
ON videos(user_id, created_at) 
WHERE deleted_at IS NULL;

-- Create index for orphan video cleanup (videos without posts)
-- This helps the cleanup job find videos that were uploaded but never attached to a post
CREATE INDEX IF NOT EXISTS idx_videos_orphan_cleanup 
ON videos(created_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN videos.deleted_at IS 'Soft delete timestamp. NULL means active, non-NULL means deleted. Videos without posts are hard deleted, videos with posts are soft deleted.';
