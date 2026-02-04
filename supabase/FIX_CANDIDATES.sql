-- FIX CANDIDATE RLS POLICIES
-- Run this in Supabase SQL Editor

-- 1. Enable RLS (Just in case)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing potentially broken policies
DROP POLICY IF EXISTS "Recruiter insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Recruiter view own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Admin manage candidates" ON public.candidates;

-- 3. Re-create Admin Policy (Admins can do everything)
CREATE POLICY "Admin manage candidates" ON public.candidates
    FOR ALL TO authenticated
    USING (public.is_admin_or_lead());

-- 4. Re-create Recruiter Insert Policy
-- Allows inserting ONLY if they mark themselves as the recruiter
CREATE POLICY "Recruiter insert candidates" ON public.candidates
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = recruiter_id);

-- 5. Re-create Recruiter View Policy
-- Allows viewing ONLY their own candidates
CREATE POLICY "Recruiter view own candidates" ON public.candidates
    FOR SELECT TO authenticated
    USING (auth.uid() = recruiter_id);

-- 6. Recruiter Update Policy (Optional but good to have)
DROP POLICY IF EXISTS "Recruiter update own candidates" ON public.candidates;
CREATE POLICY "Recruiter update own candidates" ON public.candidates
    FOR UPDATE TO authenticated
    USING (auth.uid() = recruiter_id);
