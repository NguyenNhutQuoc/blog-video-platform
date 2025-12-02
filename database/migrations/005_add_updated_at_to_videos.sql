-- Migration: Add updated_at column to videos table
-- This adds automatic timestamp tracking for video updates

-- Add updated_at column
ALTER TABLE videos 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on videos table
CREATE TRIGGER update_videos_updated_at 
    BEFORE UPDATE ON videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at = created_at
UPDATE videos SET updated_at = created_at WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after backfilling
ALTER TABLE videos ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN videos.updated_at IS 'Timestamp of last update, automatically maintained by trigger';
