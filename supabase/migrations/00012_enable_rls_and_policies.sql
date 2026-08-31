-- Migration: 00012_enable_rls_and_policies.sql
-- Description: Enables Row Level Security (RLS) and creates authorization policies on all 10 tables

-- 1. Enable RLS on all tables
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

-- ============================================================================
-- 2. Policies for: users
-- ============================================================================
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.users;
CREATE POLICY "Public profiles are readable by everyone"
    ON public.users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update only their own profile" ON public.users;
CREATE POLICY "Users can update only their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
CREATE POLICY "Users can delete their own profile"
    ON public.users FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- 3. Policies for: categories
-- ============================================================================
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone"
    ON public.categories FOR SELECT
    USING (true);

-- ============================================================================
-- 4. Policies for: tags
-- ============================================================================
DROP POLICY IF EXISTS "Tags are readable by everyone" ON public.tags;
CREATE POLICY "Tags are readable by everyone"
    ON public.tags FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
CREATE POLICY "Authenticated users can create tags"
    ON public.tags FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- 5. Policies for: experiences
-- ============================================================================
DROP POLICY IF EXISTS "Active experiences are readable by everyone" ON public.experiences;
CREATE POLICY "Active experiences are readable by everyone"
    ON public.experiences FOR SELECT
    USING ((status = 'active' AND deleted_at IS NULL) OR (auth.uid() = author_id));

DROP POLICY IF EXISTS "Authenticated users can create experiences" ON public.experiences;
CREATE POLICY "Authenticated users can create experiences"
    ON public.experiences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own experiences" ON public.experiences;
CREATE POLICY "Authors can update their own experiences"
    ON public.experiences FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own experiences" ON public.experiences;
CREATE POLICY "Authors can delete their own experiences"
    ON public.experiences FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- ============================================================================
-- 6. Policies for: experience_tags
-- ============================================================================
DROP POLICY IF EXISTS "Experience tags are readable by everyone" ON public.experience_tags;
CREATE POLICY "Experience tags are readable by everyone"
    ON public.experience_tags FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Experience authors can add tags" ON public.experience_tags;
CREATE POLICY "Experience authors can add tags"
    ON public.experience_tags FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = experience_tags.experience_id
            AND experiences.author_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Experience authors can remove tags" ON public.experience_tags;
CREATE POLICY "Experience authors can remove tags"
    ON public.experience_tags FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = experience_tags.experience_id
            AND experiences.author_id = auth.uid()
        )
    );

-- ============================================================================
-- 7. Policies for: comments
-- ============================================================================
DROP POLICY IF EXISTS "Comments are readable by everyone" ON public.comments;
CREATE POLICY "Comments are readable by everyone"
    ON public.comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments"
    ON public.comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON public.comments;
CREATE POLICY "Authors can delete their own comments"
    ON public.comments FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- ============================================================================
-- 8. Policies for: outcomes
-- ============================================================================
DROP POLICY IF EXISTS "Outcomes are readable by everyone" ON public.outcomes;
CREATE POLICY "Outcomes are readable by everyone"
    ON public.outcomes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Experience authors can add outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can add outcomes"
    ON public.outcomes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = outcomes.experience_id
            AND experiences.author_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Experience authors can update outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can update outcomes"
    ON public.outcomes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = outcomes.experience_id
            AND experiences.author_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = outcomes.experience_id
            AND experiences.author_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Experience authors can delete outcomes" ON public.outcomes;
CREATE POLICY "Experience authors can delete outcomes"
    ON public.outcomes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiences
            WHERE experiences.id = outcomes.experience_id
            AND experiences.author_id = auth.uid()
        )
    );

-- ============================================================================
-- 9. Policies for: bookmarks
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks"
    ON public.bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- 10. Policies for: reports
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

-- Note: SELECT / UPDATE / DELETE on reports are intentionally restricted from client access
-- and accessible only via service_role / moderation administrative functions.

-- ============================================================================
-- 11. Policies for: analytics_events
-- ============================================================================
DROP POLICY IF EXISTS "Users and guests can insert telemetry events" ON public.analytics_events;
CREATE POLICY "Users and guests can insert telemetry events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Note: SELECT / UPDATE / DELETE on analytics_events are restricted to service_role.
