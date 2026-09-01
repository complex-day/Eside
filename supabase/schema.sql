-- ============================================================================
-- Eside - Complete Consolidated Database Schema & Seed Data (M2)
-- PostgreSQL / Supabase Migration
-- ============================================================================

BEGIN;

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) NOT NULL,
    avatar_url TEXT NULL,
    bio TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, avatar_url, bio, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'bio',
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Table: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- 4. Table: tags
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_lower ON public.tags (LOWER(name));

-- 5. Table: experiences
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    story TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_experiences_status CHECK (status IN ('active', 'hidden', 'reported', 'deleted')),
    CONSTRAINT chk_experiences_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 150),
    CONSTRAINT chk_experiences_story_length CHECK (char_length(story) >= 10)
);

DROP TRIGGER IF EXISTS tr_experiences_updated_at ON public.experiences;
CREATE TRIGGER tr_experiences_updated_at
    BEFORE UPDATE ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Table: experience_tags
CREATE TABLE IF NOT EXISTS public.experience_tags (
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (experience_id, tag_id)
);

-- 7. Table: comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 3000)
);

DROP TRIGGER IF EXISTS tr_comments_updated_at ON public.comments;
CREATE TRIGGER tr_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Table: outcomes
CREATE TABLE IF NOT EXISTS public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    days_after INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_outcomes_days_after CHECK (days_after >= 0 AND days_after <= 3650),
    CONSTRAINT chk_outcomes_content_length CHECK (char_length(content) >= 5 AND char_length(content) <= 5000)
);

-- 9. Table: bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, experience_id)
);

-- 10. Table: reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_reports_reason CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'threats', 'privacy_violation', 'other')),
    CONSTRAINT chk_reports_status CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    CONSTRAINT chk_reports_single_target CHECK (
        (experience_id IS NOT NULL AND comment_id IS NULL) OR
        (experience_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- 11. Table: analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT NULL,
    event_name VARCHAR(100) NOT NULL,
    entity_id UUID NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_analytics_event_name CHECK (char_length(event_name) > 0)
);

-- 12. Indexes
CREATE INDEX IF NOT EXISTS idx_experiences_feed ON public.experiences (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_experiences_category ON public.experiences (category_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_experiences_author ON public.experiences (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_tags_tag_id ON public.experience_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_comments_experience_timeline ON public.comments (experience_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_timeline ON public.outcomes (experience_id, days_after ASC);
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_recency ON public.outcomes (experience_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_feed ON public.bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_moderation_queue ON public.reports (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reports_experience_id ON public.reports (experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_comment_id ON public.reports (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events (session_id) WHERE session_id IS NOT NULL;

-- 13. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies
-- users
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.users;
CREATE POLICY "Public profiles are readable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update only their own profile" ON public.users;
CREATE POLICY "Users can update only their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
CREATE POLICY "Users can delete their own profile" ON public.users FOR DELETE USING (auth.uid() = id);

-- categories
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone" ON public.categories FOR SELECT USING (true);

-- tags
DROP POLICY IF EXISTS "Tags are readable by everyone" ON public.tags;
CREATE POLICY "Tags are readable by everyone" ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
CREATE POLICY "Authenticated users can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

-- experiences
DROP POLICY IF EXISTS "Active experiences are readable by everyone" ON public.experiences;
CREATE POLICY "Active experiences are readable by everyone" ON public.experiences FOR SELECT USING ((status = 'active' AND deleted_at IS NULL) OR (auth.uid() = author_id));

DROP POLICY IF EXISTS "Authenticated users can create experiences" ON public.experiences;
CREATE POLICY "Authenticated users can create experiences" ON public.experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own experiences" ON public.experiences;
CREATE POLICY "Authors can update their own experiences" ON public.experiences FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own experiences" ON public.experiences;
CREATE POLICY "Authors can delete their own experiences" ON public.experiences FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- experience_tags
DROP POLICY IF EXISTS "Experience tags are readable by everyone" ON public.experience_tags;
CREATE POLICY "Experience tags are readable by everyone" ON public.experience_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Experience authors can add tags" ON public.experience_tags;
CREATE POLICY "Experience authors can add tags" ON public.experience_tags FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = experience_tags.experience_id AND experiences.author_id = auth.uid())
);

DROP POLICY IF EXISTS "Experience authors can remove tags" ON public.experience_tags;
CREATE POLICY "Experience authors can remove tags" ON public.experience_tags FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = experience_tags.experience_id AND experiences.author_id = auth.uid())
);

-- comments
DROP POLICY IF EXISTS "Comments are readable by everyone" ON public.comments;
CREATE POLICY "Comments are readable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.comments;
CREATE POLICY "Authors can delete their own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- outcomes
DROP POLICY IF EXISTS "Outcomes are readable by everyone" ON public.outcomes;
CREATE POLICY "Outcomes are readable by everyone" ON public.outcomes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Experience authors can add outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can add outcomes" ON public.outcomes FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = outcomes.experience_id AND experiences.author_id = auth.uid())
);

DROP POLICY IF EXISTS "Experience authors can update outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can update outcomes" ON public.outcomes FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = outcomes.experience_id AND experiences.author_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = outcomes.experience_id AND experiences.author_id = auth.uid())
);

DROP POLICY IF EXISTS "Experience authors can delete outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can delete outcomes" ON public.outcomes FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = outcomes.experience_id AND experiences.author_id = auth.uid())
);

-- bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reports
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- analytics_events
DROP POLICY IF EXISTS "Users and guests can insert telemetry events" ON public.analytics_events;
CREATE POLICY "Users and guests can insert telemetry events" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 15. Seed Initial Data
INSERT INTO public.categories (name, description)
VALUES 
    ('Education', 'Academic struggles, semester failures, exams, college transitions, and learning journeys.'),
    ('Career', 'Job searches, career switches, workplace challenges, promotions, layoffs, and professional growth.'),
    ('Relationships', 'Dating, breakups, friendships, communication challenges, and long-term commitments.'),
    ('Family', 'Family dynamics, parental expectations, sibling relationships, and domestic hurdles.'),
    ('Finance', 'Debt recovery, budgeting, money mistakes, investing lessons, and financial stability.'),
    ('Health', 'Physical health recovery, chronic illness navigation, medical diagnoses, and lifestyle habits.'),
    ('Mental Wellbeing', 'Anxiety, depression, burnout recovery, therapy experiences, and mindfulness practices.'),
    ('Social Life', 'Overcoming loneliness, relocating to new cities, making adult friendships, and community building.')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

INSERT INTO public.tags (name)
VALUES 
    ('failure'),
    ('anxiety'),
    ('breakup'),
    ('career-change'),
    ('bullying'),
    ('loneliness'),
    ('recovery'),
    ('college'),
    ('budgeting'),
    ('first-job'),
    ('burnout'),
    ('relocation')
ON CONFLICT (name) DO NOTHING;

COMMIT;
