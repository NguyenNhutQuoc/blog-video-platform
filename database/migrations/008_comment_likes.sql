-- Migration: Comment Likes
-- Description: Add comment likes functionality with like_count tracking
-- Date: 2024-12-03

-- =====================================================
-- COMMENT LIKES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, comment_id)
);

-- Index for querying likes by comment
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- Index for querying user's liked comments
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- =====================================================
-- ADD LIKE_COUNT COLUMN TO COMMENTS IF NOT EXISTS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'like_count'
    ) THEN
        ALTER TABLE comments ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- TRIGGER FUNCTIONS FOR LIKE COUNT
-- =====================================================

-- Function to increment like_count when a like is added
CREATE OR REPLACE FUNCTION increment_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement like_count when a like is removed
CREATE OR REPLACE FUNCTION decrement_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_comment_like_count ON comment_likes;
DROP TRIGGER IF EXISTS trigger_decrement_comment_like_count ON comment_likes;

-- Trigger after insert
CREATE TRIGGER trigger_increment_comment_like_count
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_comment_like_count();

-- Trigger after delete
CREATE TRIGGER trigger_decrement_comment_like_count
    AFTER DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_comment_like_count();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE comment_likes IS 'Stores user likes on comments';
COMMENT ON COLUMN comment_likes.user_id IS 'User who liked the comment';
COMMENT ON COLUMN comment_likes.comment_id IS 'Comment that was liked';
COMMENT ON COLUMN comment_likes.created_at IS 'When the like was created';
