-- Migration: 00003_create_tags.sql
-- Description: Creates tags table for topic classification

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique lookup index on tags
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_lower ON public.tags (LOWER(name));
