-- Migration: 00011_create_indexes.sql
-- Description: Creates performance indexes for sub-500ms feed and sub-300ms category filtering

-- Experiences indexes
CREATE INDEX IF NOT EXISTS idx_experiences_feed 
    ON public.experiences (status, created_at DESC) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_category 
    ON public.experiences (category_id, status, created_at DESC) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_author 
    ON public.experiences (author_id, created_at DESC);

-- Experience Tags indexes
CREATE INDEX IF NOT EXISTS idx_experience_tags_tag_id 
    ON public.experience_tags (tag_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_experience_timeline 
    ON public.comments (experience_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_author 
    ON public.comments (author_id);

-- Outcomes indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_timeline 
    ON public.outcomes (experience_id, days_after ASC);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_feed 
    ON public.bookmarks (user_id, created_at DESC);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_moderation_queue 
    ON public.reports (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_reports_experience_id 
    ON public.reports (experience_id) 
    WHERE experience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_comment_id 
    ON public.reports (comment_id) 
    WHERE comment_id IS NOT NULL;

-- Analytics Events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created 
    ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
    ON public.analytics_events (user_id) 
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id 
    ON public.analytics_events (session_id) 
    WHERE session_id IS NOT NULL;

-- ============================================================================
-- NOTE FOR MILESTONE 6 (Full-Text Search Indexing):
-- In M6 (Insights Dashboard & Search Discovery), full-text search indexing will be added:
--   ALTER TABLE public.experiences ADD COLUMN search_vector tsvector
--     GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(story, ''))) STORED;
--   CREATE INDEX idx_experiences_search_vector ON public.experiences USING GIN(search_vector);
-- ============================================================================
