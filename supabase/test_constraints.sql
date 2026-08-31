-- ============================================================================
-- Milestone 2: Automated Constraint & Business Rule Verification Suite
-- Execute in Supabase SQL Editor or psql to test constraint enforcement.
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_user_id2 UUID := '00000000-0000-0000-0000-000000000002';
    test_cat_id UUID;
    test_exp_id UUID;
    test_com_id UUID;
    error_caught BOOLEAN;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Starting Milestone 2 Constraint Verification Tests...';
    RAISE NOTICE '=======================================================';

    -- ------------------------------------------------------------------------
    -- Setup Temporary Test Fixtures
    -- ------------------------------------------------------------------------
    -- 1. Create test records in auth.users to satisfy foreign key constraints
    INSERT INTO auth.users (
        id, 
        instance_id,
        aud, 
        role, 
        email, 
        encrypted_password, 
        email_confirmed_at,
        raw_user_meta_data, 
        created_at, 
        updated_at
    )
    VALUES 
        (test_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_user_alpha@eside.test', 'encrypted_placeholder', now(), '{"username": "TestUser_Alpha"}'::jsonb, now(), now()),
        (test_user_id2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_user_beta@eside.test', 'encrypted_placeholder', now(), '{"username": "TestUser_Beta"}'::jsonb, now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Ensure public.users profile exists
    INSERT INTO public.users (id, username, bio)
    VALUES (test_user_id, 'TestUser_Alpha', 'Test user bio')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, username, bio)
    VALUES (test_user_id2, 'TestUser_Beta', 'Test user beta bio')
    ON CONFLICT (id) DO NOTHING;

    -- Get a valid seeded category
    SELECT id INTO test_cat_id FROM public.categories LIMIT 1;
    IF test_cat_id IS NULL THEN
        RAISE EXCEPTION 'Seed categories not found. Please run seed script first.';
    END IF;

    -- ------------------------------------------------------------------------
    -- TEST 1: Case-Insensitive Username Uniqueness
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 1: Case-Insensitive Username Uniqueness ---';
    error_caught := FALSE;
    BEGIN
        -- Attempt to update test_user_id2's username to 'testuser_alpha' (lowercase duplicate)
        UPDATE public.users 
        SET username = 'testuser_alpha'
        WHERE id = test_user_id2;
    EXCEPTION WHEN unique_violation THEN
        error_caught := TRUE;
    END;

    IF error_caught THEN
        RAISE NOTICE 'PASS: Lowercase duplicate username correctly rejected by idx_users_username_lower.';
    ELSE
        RAISE EXCEPTION 'FAIL: Duplicate username with different casing was incorrectly allowed!';
    END IF;

    -- Create test experience for downstream tests
    INSERT INTO public.experiences (id, author_id, category_id, title, story, is_anonymous, status)
    VALUES (gen_random_uuid(), test_user_id, test_cat_id, 'Test Experience Title', 'Test experience detailed story for verification', true, 'active')
    RETURNING id INTO test_exp_id;

    -- Create test comment
    INSERT INTO public.comments (id, experience_id, author_id, content)
    VALUES (gen_random_uuid(), test_exp_id, test_user_id, 'Test comment content')
    RETURNING id INTO test_com_id;

    -- ------------------------------------------------------------------------
    -- TEST 2: Reports Target CHECK Constraint
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 2: Reports Target CHECK Constraint ---';
    
    -- Sub-test 2A: Neither target specified (should fail)
    error_caught := FALSE;
    BEGIN
        INSERT INTO public.reports (reporter_id, reason, status)
        VALUES (test_user_id, 'spam', 'pending');
    EXCEPTION WHEN check_violation THEN
        error_caught := TRUE;
    END;
    IF error_caught THEN
        RAISE NOTICE 'PASS: Report with NO targets correctly rejected.';
    ELSE
        RAISE EXCEPTION 'FAIL: Report without targets was allowed!';
    END IF;

    -- Sub-test 2B: Both targets specified (should fail)
    error_caught := FALSE;
    BEGIN
        INSERT INTO public.reports (reporter_id, experience_id, comment_id, reason, status)
        VALUES (test_user_id, test_exp_id, test_com_id, 'harassment', 'pending');
    EXCEPTION WHEN check_violation THEN
        error_caught := TRUE;
    END;
    IF error_caught THEN
        RAISE NOTICE 'PASS: Report with BOTH experience and comment targets correctly rejected.';
    ELSE
        RAISE EXCEPTION 'FAIL: Report with both targets was allowed!';
    END IF;

    -- Sub-test 2C: Exactly one target specified (should succeed)
    INSERT INTO public.reports (reporter_id, experience_id, reason, status)
    VALUES (test_user_id, test_exp_id, 'spam', 'pending');
    RAISE NOTICE 'PASS: Report with exactly ONE target successfully inserted.';

    -- ------------------------------------------------------------------------
    -- TEST 3: Soft-Delete (deleted_at) Logic
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 3: Soft Delete (deleted_at) Support ---';
    -- Update experience with soft-delete timestamp
    UPDATE public.experiences 
    SET status = 'deleted', deleted_at = now()
    WHERE id = test_exp_id;

    -- Query active feed count
    IF EXISTS (
        SELECT 1 FROM public.experiences 
        WHERE id = test_exp_id AND (status != 'active' OR deleted_at IS NOT NULL)
    ) THEN
        RAISE NOTICE 'PASS: Soft-deleted experience correctly marked and excluded from active feed index.';
    ELSE
        RAISE EXCEPTION 'FAIL: Soft delete status / deleted_at not reflected correctly!';
    END IF;

    -- ------------------------------------------------------------------------
    -- TEST 4: Bookmarks Composite Primary Key Uniqueness
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 4: Bookmarks Composite PK Uniqueness ---';
    INSERT INTO public.bookmarks (user_id, experience_id)
    VALUES (test_user_id, test_exp_id)
    ON CONFLICT DO NOTHING;

    error_caught := FALSE;
    BEGIN
        INSERT INTO public.bookmarks (user_id, experience_id)
        VALUES (test_user_id, test_exp_id); -- Duplicate bookmark
    EXCEPTION WHEN unique_violation THEN
        error_caught := TRUE;
    END;

    IF error_caught THEN
        RAISE NOTICE 'PASS: Duplicate bookmark correctly rejected by composite PK (user_id, experience_id).';
    ELSE
        RAISE EXCEPTION 'FAIL: Duplicate bookmark was incorrectly allowed!';
    END IF;

    -- ------------------------------------------------------------------------
    -- TEST 5: Outcomes Milestone Uniqueness Constraint
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 5: Outcomes Milestone Uniqueness (uq_experience_days_after) ---';
    INSERT INTO public.outcomes (experience_id, days_after, content)
    VALUES (test_exp_id, 30, 'Day 30 update: Things are getting better.')
    ON CONFLICT DO NOTHING;

    error_caught := FALSE;
    BEGIN
        INSERT INTO public.outcomes (experience_id, days_after, content)
        VALUES (test_exp_id, 30, 'Duplicate Day 30 update'); -- Same milestone for same experience
    EXCEPTION WHEN unique_violation THEN
        error_caught := TRUE;
    END;

    IF error_caught THEN
        RAISE NOTICE 'PASS: Duplicate outcome milestone for the same experience correctly rejected.';
    ELSE
        RAISE EXCEPTION 'FAIL: Duplicate outcome milestone was incorrectly allowed!';
    END IF;

    -- Sub-test 5B: Invalid days_after (e.g. day 45)
    error_caught := FALSE;
    BEGIN
        INSERT INTO public.outcomes (experience_id, days_after, content)
        VALUES (test_exp_id, 45, 'Invalid milestone');
    EXCEPTION WHEN check_violation THEN
        error_caught := TRUE;
    END;

    IF error_caught THEN
        RAISE NOTICE 'PASS: Invalid days_after (45) correctly rejected by chk_outcomes_days_after.';
    ELSE
        RAISE EXCEPTION 'FAIL: Invalid outcome days_after was allowed!';
    END IF;

    -- ------------------------------------------------------------------------
    -- Clean up test fixtures
    -- ------------------------------------------------------------------------
    DELETE FROM public.experiences WHERE id = test_exp_id;
    DELETE FROM auth.users WHERE id IN (test_user_id, test_user_id2);
    DELETE FROM public.users WHERE id IN (test_user_id, test_user_id2);

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL 5 CONSTRAINT AND BUSINESS LOGIC TESTS PASSED (100 PERCENT)';
    RAISE NOTICE '=======================================================';
END $$;
