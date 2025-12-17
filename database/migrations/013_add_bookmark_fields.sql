-- Migration: Add bookmark and folder fields
-- Description: Add note field to bookmarks, add description, color, sort_order to bookmark_folders
-- Date: 2024-12-16

-- =====================================================
-- ADD FIELDS TO BOOKMARKS TABLE
-- =====================================================

-- Add note field for personal notes on bookmarks
ALTER TABLE bookmarks
ADD COLUMN IF NOT EXISTS note VARCHAR(500);

-- =====================================================
-- ADD FIELDS TO BOOKMARK_FOLDERS TABLE
-- =====================================================

-- Add description field
ALTER TABLE bookmark_folders
ADD COLUMN IF NOT EXISTS description VARCHAR(200);

-- Add color field for folder customization
ALTER TABLE bookmark_folders
ADD COLUMN IF NOT EXISTS color VARCHAR(7); -- Format: #RRGGBB

-- Add sort_order field for custom folder ordering
ALTER TABLE bookmark_folders
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add updated_at timestamp
ALTER TABLE bookmark_folders
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add constraint for color format (hex color)
ALTER TABLE bookmark_folders
ADD CONSTRAINT check_color_format
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- Add check constraint for sort_order (non-negative)
ALTER TABLE bookmark_folders
ADD CONSTRAINT check_sort_order_non_negative
CHECK (sort_order >= 0);

-- =====================================================
-- UPDATE TRIGGER FOR bookmark_folders.updated_at
-- =====================================================

-- Create trigger for bookmark_folders updated_at
CREATE TRIGGER update_bookmark_folders_updated_at
BEFORE UPDATE ON bookmark_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RENAME post_count TO bookmark_count FOR CONSISTENCY
-- =====================================================

-- Rename post_count to bookmark_count in bookmark_folders
-- (This matches the domain entity naming)
-- Note: Skip if already named bookmark_count
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookmark_folders' 
        AND column_name = 'post_count'
    ) THEN
        ALTER TABLE bookmark_folders 
        RENAME COLUMN post_count TO bookmark_count;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check columns:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name IN ('bookmarks', 'bookmark_folders')
-- ORDER BY table_name, ordinal_position;
