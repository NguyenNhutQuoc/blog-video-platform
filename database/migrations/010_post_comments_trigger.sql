-- =====================================================
-- MIGRATION 010: Post Comment Count Trigger
-- Date: 2025-12-03
-- Description: Add trigger to auto-update comment_count on posts table
-- =====================================================

-- Function to update comment_count on posts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count root comments (parentId is null) or all comments?
        -- For simplicity, count all comments including replies
        UPDATE posts 
        SET comment_count = comment_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET comment_count = GREATEST(0, comment_count - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on comments table
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Fix existing comment counts (recalculate based on actual comments)
UPDATE posts p
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments c 
    WHERE c.post_id = p.id 
    AND c.deleted_at IS NULL
);
