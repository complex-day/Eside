-- ============================================================================
-- Migration: 00014_unlock_freeform_outcome_journeys.sql
-- Description: Unlocks free-form days_after range (0-3650), removes single-update
--              cap, expands content length, and adds recency index for discovery.
-- ============================================================================

BEGIN;

-- 1. Drop discrete milestone check constraint (was restricted to 30, 90, 180)
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS chk_outcomes_days_after;

-- 2. Drop unique constraint that prevented multiple updates on the same day
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS uq_experience_days_after;

-- 3. Add generalized valid day range constraint (0 to 3650 days / 10 years)
ALTER TABLE public.outcomes 
ADD CONSTRAINT chk_outcomes_days_after 
CHECK (days_after >= 0 AND days_after <= 3650);

-- 4. Increase max content length to 5,000 characters
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS chk_outcomes_content_length;

ALTER TABLE public.outcomes 
ADD CONSTRAINT chk_outcomes_content_length 
CHECK (char_length(content) >= 5 AND char_length(content) <= 5000);

-- 5. Create composite index to optimize "Recently Updated" discovery feed queries
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_recency 
ON public.outcomes (experience_id, created_at DESC);

COMMIT;
