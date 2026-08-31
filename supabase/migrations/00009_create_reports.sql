-- Migration: 00009_create_reports.sql
-- Description: Creates reports table for content moderation with mutually exclusive target constraint

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
