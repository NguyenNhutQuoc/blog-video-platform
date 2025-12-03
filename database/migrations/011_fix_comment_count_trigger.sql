-- =====================================================
-- MIGRATION 011: Fix Post Comment Count Trigger for Soft-Delete
-- Date: 2025-12-03
-- Description: Update trigger to handle soft-delete (UPDATE on deleted_at)
-- =====================================================

-- Function to update comment_count on posts (handles soft-delete)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only increase if new comment is not soft-deleted
        IF NEW.deleted_at IS NULL THEN
            UPDATE posts 
            SET comment_count = comment_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle soft-delete: deleted_at from NULL -> has value
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE posts 
            SET comment_count = GREATEST(0, comment_count - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.post_id;
        -- Handle restore: deleted_at from has value -> NULL
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE posts 
            SET comment_count = comment_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Only decrease if comment was not already soft-deleted
        IF OLD.deleted_at IS NULL THEN
            UPDATE posts 
            SET comment_count = GREATEST(0, comment_count - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to include UPDATE operation
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Recalculate existing comment counts (exclude soft-deleted comments)
UPDATE posts p
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments c 
    WHERE c.post_id = p.id 
    AND c.deleted_at IS NULL
);
