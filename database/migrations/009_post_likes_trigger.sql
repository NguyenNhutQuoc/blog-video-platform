-- Migration: Post Likes Trigger
-- Description: Add triggers to automatically update like_count in posts table
-- Date: 2024-12-03

-- =====================================================
-- TRIGGER FUNCTIONS FOR POST LIKE COUNT
-- =====================================================

-- Function to increment like_count when a like is added
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement like_count when a like is removed
CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_post_like_count ON likes;
DROP TRIGGER IF EXISTS trigger_decrement_post_like_count ON likes;

-- Trigger after insert
CREATE TRIGGER trigger_increment_post_like_count
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_post_like_count();

-- Trigger after delete
CREATE TRIGGER trigger_decrement_post_like_count
    AFTER DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_post_like_count();

-- =====================================================
-- FIX EXISTING DATA
-- =====================================================

-- Update like_count for all posts based on current likes
UPDATE posts p
SET like_count = (
    SELECT COUNT(*) 
    FROM likes l 
    WHERE l.post_id = p.id
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION increment_post_like_count() IS 'Automatically increments post like_count when a like is added';
COMMENT ON FUNCTION decrement_post_like_count() IS 'Automatically decrements post like_count when a like is removed';
