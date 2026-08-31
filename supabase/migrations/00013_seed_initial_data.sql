-- Migration: 00013_seed_initial_data.sql
-- Description: Seeds the 8 core platform categories and foundational tags

-- 1. Seed Core Categories
INSERT INTO public.categories (name, description)
VALUES 
    ('Education', 'Academic struggles, semester failures, exams, college transitions, and learning journeys.'),
    ('Career', 'Job searches, career switches, workplace challenges, promotions, layoffs, and professional growth.'),
    ('Relationships', 'Dating, breakups, friendships, communication challenges, and long-term commitments.'),
    ('Family', 'Family dynamics, parental expectations, sibling relationships, and domestic hurdles.'),
    ('Finance', 'Debt recovery, budgeting, money mistakes, investing lessons, and financial stability.'),
    ('Health', 'Physical health recovery, chronic illness navigation, medical diagnoses, and lifestyle habits.'),
    ('Mental Wellbeing', 'Anxiety, depression, burnout recovery, therapy experiences, and mindfulness practices.'),
    ('Social Life', 'Overcoming loneliness, relocating to new cities, making adult friendships, and community building.')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- 2. Seed Foundational Tags
INSERT INTO public.tags (name)
VALUES 
    ('failure'),
    ('anxiety'),
    ('breakup'),
    ('career-change'),
    ('bullying'),
    ('loneliness'),
    ('recovery'),
    ('college'),
    ('budgeting'),
    ('first-job'),
    ('burnout'),
    ('relocation')
ON CONFLICT (name) DO NOTHING;
