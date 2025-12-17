-- Migration: Bookmark Count Triggers
-- Description: Add triggers to automatically update bookmark_count in posts table
-- Date: 2024-12-16

-- =====================================================
-- TRIGGER FUNCTIONS FOR POST BOOKMARK COUNT
-- =====================================================

-- Function to increment bookmark_count when a bookmark is added
CREATE OR REPLACE FUNCTION increment_post_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET bookmark_count = bookmark_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement bookmark_count when a bookmark is removed
CREATE OR REPLACE FUNCTION decrement_post_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET bookmark_count = GREATEST(0, bookmark_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTIONS FOR FOLDER BOOKMARK COUNT
-- =====================================================

-- Function to increment bookmark_count in folder when a bookmark is added
CREATE OR REPLACE FUNCTION increment_folder_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bookmark_folders 
    SET bookmark_count = bookmark_count + 1 
    WHERE id = NEW.folder_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement bookmark_count in folder when a bookmark is removed
CREATE OR REPLACE FUNCTION decrement_folder_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bookmark_folders 
    SET bookmark_count = GREATEST(0, bookmark_count - 1) 
    WHERE id = OLD.folder_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to update folder counts when a bookmark is moved between folders
CREATE OR REPLACE FUNCTION update_folder_bookmark_count_on_move()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if folder_id actually changed
    IF OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
        -- Decrement old folder
        UPDATE bookmark_folders 
        SET bookmark_count = GREATEST(0, bookmark_count - 1) 
        WHERE id = OLD.folder_id;
        
        -- Increment new folder
        UPDATE bookmark_folders 
        SET bookmark_count = bookmark_count + 1 
        WHERE id = NEW.folder_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_post_bookmark_count ON bookmarks;
DROP TRIGGER IF EXISTS trigger_decrement_post_bookmark_count ON bookmarks;
DROP TRIGGER IF EXISTS trigger_increment_folder_bookmark_count ON bookmarks;
DROP TRIGGER IF EXISTS trigger_decrement_folder_bookmark_count ON bookmarks;
DROP TRIGGER IF EXISTS trigger_update_folder_bookmark_count_on_move ON bookmarks;

-- Trigger for post bookmark_count after insert
CREATE TRIGGER trigger_increment_post_bookmark_count
    AFTER INSERT ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION increment_post_bookmark_count();

-- Trigger for post bookmark_count after delete
CREATE TRIGGER trigger_decrement_post_bookmark_count
    AFTER DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION decrement_post_bookmark_count();

-- Trigger for folder post_count after insert
CREATE TRIGGER trigger_increment_folder_bookmark_count
    AFTER INSERT ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION increment_folder_bookmark_count();

-- Trigger for folder post_count after delete
CREATE TRIGGER trigger_decrement_folder_bookmark_count
    AFTER DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION decrement_folder_bookmark_count();

-- Trigger for folder post_count on bookmark move
CREATE TRIGGER trigger_update_folder_bookmark_count_on_move
    AFTER UPDATE OF folder_id ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_bookmark_count_on_move();

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- Check if triggers exist:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%bookmark%'
-- ORDER BY trigger_name;

-- Verify counts after operations:
-- SELECT p.id, p.title, p.bookmark_count, COUNT(b.id) as actual_bookmarks
-- FROM posts p
-- LEFT JOIN bookmarks b ON b.post_id = p.id
-- GROUP BY p.id, p.title, p.bookmark_count
-- HAVING p.bookmark_count != COUNT(b.id);
