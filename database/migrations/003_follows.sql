-- =====================================================
-- DATABASE MIGRATION: Follows System
-- Version: 3.0
-- Date: 2025-11-29
-- Description: Add follows table for user follow relationships
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- Table: follows (user follow relationships)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Cannot follow yourself
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    -- Unique follow relationship
    UNIQUE (follower_id, following_id)
);

-- =====================================================
-- PART 2: ADD COUNTER COLUMNS TO USERS
-- =====================================================

-- Add follower and following count columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE users 
ADD CONSTRAINT follower_count_non_negative CHECK (follower_count >= 0),
ADD CONSTRAINT following_count_non_negative CHECK (following_count >= 0);

-- =====================================================
-- PART 3: CREATE INDEXES
-- =====================================================

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- Composite index for checking if user A follows user B
CREATE INDEX idx_follows_relationship ON follows(follower_id, following_id);

-- Users follower count index (for sorting by popularity)
CREATE INDEX idx_users_follower_count ON users(follower_count DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- PART 4: CREATE TRIGGERS
-- =====================================================

-- Trigger function: Increment follower/following counts on follow
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment follower_count for the user being followed
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    -- Increment following_count for the follower
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Decrement follower/following counts on unfollow
CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement follower_count for the user being unfollowed
    UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    -- Decrement following_count for the unfollower
    UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER follow_insert_increment 
AFTER INSERT ON follows
FOR EACH ROW 
EXECUTE FUNCTION increment_follow_counts();

CREATE TRIGGER follow_delete_decrement 
AFTER DELETE ON follows
FOR EACH ROW 
EXECUTE FUNCTION decrement_follow_counts();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables and indexes created
SELECT 'follows table created' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows');

SELECT indexname, tablename
FROM pg_indexes 
WHERE tablename = 'follows'
ORDER BY indexname;
