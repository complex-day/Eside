-- Migration: 00005_create_experience_tags.sql
-- Description: Creates many-to-many junction table between experiences and tags

CREATE TABLE IF NOT EXISTS public.experience_tags (
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (experience_id, tag_id)
);
