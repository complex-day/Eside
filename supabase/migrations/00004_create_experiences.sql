-- Migration: 00004_create_experiences.sql
-- Description: Creates experiences table with soft-delete support (deleted_at) and status constraints

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

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS tr_experiences_updated_at ON public.experiences;
CREATE TRIGGER tr_experiences_updated_at
    BEFORE UPDATE ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- NOTE FOR MILESTONE 6 (Full-Text Search Indexing):
-- In M6 (Insights Dashboard & Search Discovery), full-text search indexing will be added:
--   ALTER TABLE public.experiences ADD COLUMN search_vector tsvector
--     GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(story, ''))) STORED;
--   CREATE INDEX idx_experiences_search_vector ON public.experiences USING GIN(search_vector);
-- This provides sub-300ms lexical search across experience titles and stories.
-- ============================================================================
