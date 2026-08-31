-- Migration: 00010_create_analytics_events.sql
-- Description: Creates analytics_events table with nullable session_id for telemetry tracking

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
