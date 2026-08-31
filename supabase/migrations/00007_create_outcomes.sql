-- Migration: 00007_create_outcomes.sql
-- Description: Creates outcomes table for tracking long-term journey progress (Day 30, 90, 180)

CREATE TABLE IF NOT EXISTS public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    days_after INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_outcomes_days_after CHECK (days_after IN (30, 90, 180)),
    CONSTRAINT chk_outcomes_content_length CHECK (char_length(content) >= 5 AND char_length(content) <= 3000),
    CONSTRAINT uq_experience_days_after UNIQUE (experience_id, days_after)
);
