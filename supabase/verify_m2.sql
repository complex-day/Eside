-- ============================================================================
-- Milestone 2: Schema & Structure Verification Suite
-- Run this script against your Supabase database to verify all M2 requirements.
-- ============================================================================

-- 1. Verify All 10 Tables Exist
SELECT 
    table_name,
    CASE WHEN table_name IN (
        'users', 'categories', 'tags', 'experiences', 
        'experience_tags', 'comments', 'outcomes', 
        'bookmarks', 'reports', 'analytics_events'
    ) THEN 'PASS' ELSE 'EXTRA' END AS status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify Foreign Keys Count and References
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    rc.delete_rule AS on_delete_action
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY source_table, source_column;

-- 3. Verify Indexes on All Tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Verify Row Level Security (RLS) is Enabled on All Tables
SELECT 
    relname AS table_name,
    CASE WHEN relrowsecurity THEN 'ENABLED (PASS)' ELSE 'DISABLED (FAIL)' END AS rls_status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
ORDER BY table_name;

-- 5. Verify All RLS Policies
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Verify Seed Data
SELECT 'categories' AS seed_table, count(*) AS record_count, 8 AS expected_count,
       CASE WHEN count(*) = 8 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.categories
UNION ALL
SELECT 'tags' AS seed_table, count(*) AS record_count, 12 AS expected_count,
       CASE WHEN count(*) = 12 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.tags;
