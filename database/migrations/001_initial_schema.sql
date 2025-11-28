-- =====================================================
-- DATABASE MIGRATION: Blog & Video Platform
-- Version: 1.0
-- Date: 2025-11-27
-- Description: Initial schema creation with all tables
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- Table 1: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    spam_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_-]+$'),
    CONSTRAINT email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT spam_score_range CHECK (spam_score >= 0 AND spam_score <= 100)
);

-- Table 2: categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976D2',
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT category_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Table 3: tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tag_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50)
);

-- Table 4: videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploading',
    duration INTEGER,
    width INTEGER,
    height INTEGER,
    original_codec VARCHAR(50),
    original_bitrate INTEGER,
    raw_file_path VARCHAR(500),
    hls_master_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    available_qualities JSONB DEFAULT '[]',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    uploaded_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT video_status_valid CHECK (status IN ('uploading', 'processing', 'ready', 'failed', 'cancelled')),
    CONSTRAINT video_file_size_max CHECK (file_size <= 2147483648),
    CONSTRAINT video_duration_max CHECK (duration IS NULL OR duration <= 1800),
    CONSTRAINT video_retry_limit CHECK (retry_count <= 3)
);

-- Table 5: posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    embedding vector(1536),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT post_title_length CHECK (char_length(title) >= 10 AND char_length(title) <= 200),
    CONSTRAINT post_content_length CHECK (char_length(content) >= 50),
    CONSTRAINT post_status_valid CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT post_visibility_valid CHECK (visibility IN ('public', 'private', 'unlisted')),
    CONSTRAINT unique_author_slug UNIQUE (author_id, slug)
);

-- Add foreign key for videos.post_id (circular dependency)
ALTER TABLE videos ADD CONSTRAINT fk_videos_post_id 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Table 6: post_categories
CREATE TABLE post_categories (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- Table 7: post_tags
CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Table 8: comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    CONSTRAINT comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
    CONSTRAINT comment_status_valid CHECK (status IN ('approved', 'pending_review', 'hidden'))
);

-- Table 9: likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (user_id, post_id)
);

-- Table 10: bookmark_folders
CREATE TABLE bookmark_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (user_id, name)
);

-- Add unique constraint for default folder
CREATE UNIQUE INDEX idx_bookmark_folders_default ON bookmark_folders(user_id, is_default) 
WHERE is_default = TRUE;

-- Table 11: bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES bookmark_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (user_id, post_id)
);

-- Table 12: sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (expires_at > created_at)
);

-- Table 13: post_views
CREATE TABLE post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referrer VARCHAR(500),
    user_agent TEXT,
    is_bot BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_date DATE GENERATED ALWAYS AS (viewed_at::DATE) STORED,
    
    UNIQUE (post_id, session_id, view_date)
);

-- Table 14: video_views
CREATE TABLE video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration_watched INTEGER NOT NULL,
    total_duration INTEGER NOT NULL,
    completion_rate FLOAT GENERATED ALWAYS AS (
        CASE WHEN total_duration > 0 
        THEN (duration_watched::FLOAT / total_duration::FLOAT) * 100 
        ELSE 0 END
    ) STORED,
    quality_watched VARCHAR(10),
    referrer VARCHAR(500),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (duration_watched >= 0 AND duration_watched <= total_duration),
    CHECK (quality_watched IN ('1080p', '720p', '480p', '360p') OR quality_watched IS NULL)
);

-- Table 15: activity_logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (action ~ '^[A-Z_]+$')
);

-- Table 16: search_queries
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    search_type VARCHAR(20) NOT NULL,
    results_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (search_type IN ('fulltext', 'semantic', 'rag')),
    CHECK (results_count >= 0)
);

-- =====================================================
-- PART 2: CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Posts indexes
CREATE INDEX idx_posts_author_id ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_posts_view_count ON posts(view_count DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_posts_fulltext ON posts USING GIN (to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_posts_embedding ON posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Videos indexes
CREATE INDEX idx_videos_post_id ON videos(post_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_post_count ON categories(post_count DESC);

-- Tags indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);

-- Junction tables indexes
CREATE INDEX idx_post_categories_post_id ON post_categories(post_id);
CREATE INDEX idx_post_categories_category_id ON post_categories(category_id);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_flagged ON comments(is_flagged) WHERE is_flagged = TRUE AND deleted_at IS NULL;

-- Likes indexes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

-- Bookmarks indexes
CREATE INDEX idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX idx_bookmarks_folder_id ON bookmarks(folder_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_expired ON sessions(expires_at) WHERE expires_at < CURRENT_TIMESTAMP;

-- Analytics indexes
CREATE INDEX idx_post_views_post_id ON post_views(post_id);
CREATE INDEX idx_post_views_session_id ON post_views(session_id);
CREATE INDEX idx_post_views_user_id ON post_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_post_views_viewed_at ON post_views(viewed_at DESC);
CREATE INDEX idx_post_views_date ON post_views(DATE(viewed_at));

CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_session_id ON video_views(session_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_video_views_viewed_at ON video_views(viewed_at DESC);
CREATE INDEX idx_video_views_completion_rate ON video_views(completion_rate DESC);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN(metadata);

-- Search queries indexes
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_search_queries_type ON search_queries(search_type);
CREATE INDEX idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query_trgm ON search_queries USING GIN(query gin_trgm_ops);

-- =====================================================
-- PART 3: CREATE TRIGGERS
-- =====================================================

-- Trigger function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger functions: Counter management
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_insert_increment AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION increment_post_like_count();

CREATE TRIGGER like_delete_decrement AFTER DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION decrement_post_like_count();

-- Comment count triggers
CREATE OR REPLACE FUNCTION increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_insert_increment AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION increment_post_comment_count();

CREATE TRIGGER comment_delete_decrement AFTER DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION decrement_post_comment_count();

-- Tag usage count triggers
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_tag_insert_increment AFTER INSERT ON post_tags
    FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

CREATE TRIGGER post_tag_delete_decrement AFTER DELETE ON post_tags
    FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

-- Category post count triggers
CREATE OR REPLACE FUNCTION increment_category_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_category_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_category_insert_increment AFTER INSERT ON post_categories
    FOR EACH ROW EXECUTE FUNCTION increment_category_count();

CREATE TRIGGER post_category_delete_decrement AFTER DELETE ON post_categories
    FOR EACH ROW EXECUTE FUNCTION decrement_category_count();

-- Generate post slug trigger
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    WHILE EXISTS (
        SELECT 1 FROM posts 
        WHERE author_id = NEW.author_id 
          AND slug = final_slug 
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
          AND deleted_at IS NULL
    ) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
        
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique slug after 100 attempts';
        END IF;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_post_slug_trigger 
BEFORE INSERT OR UPDATE OF title ON posts
FOR EACH ROW 
WHEN (NEW.slug IS NULL OR OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION generate_post_slug();

-- Generate post excerpt trigger
CREATE OR REPLACE FUNCTION generate_post_excerpt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
        NEW.excerpt := left(
            regexp_replace(NEW.content, '<[^>]+>', '', 'g'),
            200
        ) || '...';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_post_excerpt_trigger 
BEFORE INSERT OR UPDATE OF content ON posts
FOR EACH ROW 
EXECUTE FUNCTION generate_post_excerpt();

-- Validate comment depth trigger (1-level only)
CREATE OR REPLACE FUNCTION validate_comment_depth()
RETURNS TRIGGER AS $$
DECLARE
    parent_parent_id UUID;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT parent_id INTO parent_parent_id
        FROM comments
        WHERE id = NEW.parent_id;
        
        IF parent_parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot reply to a reply. Only 1-level comments allowed.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_comment_depth_trigger 
BEFORE INSERT OR UPDATE OF parent_id ON comments
FOR EACH ROW 
EXECUTE FUNCTION validate_comment_depth();

-- =====================================================
-- PART 4: SEED DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Articles about programming, AI, and tech trends', '#2196F3'),
('Travel', 'travel', 'Travel guides, tips, and destination reviews', '#4CAF50'),
('Food', 'food', 'Recipes, restaurant reviews, and cooking tips', '#FF9800'),
('Lifestyle', 'lifestyle', 'Health, fitness, and personal development', '#9C27B0'),
('Business', 'business', 'Entrepreneurship, startups, and business strategies', '#F44336');

-- Insert common tags
INSERT INTO tags (name, slug) VALUES
('react', 'react'),
('nodejs', 'nodejs'),
('typescript', 'typescript'),
('python', 'python'),
('machine-learning', 'machine-learning'),
('web-development', 'web-development'),
('tutorial', 'tutorial'),
('beginner-friendly', 'beginner-friendly');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
SELECT 
    schemaname, 
    tablename, 
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify indexes created
SELECT 
    indexname, 
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
