-- FIX RECRUITER VIEW POLICY
-- Run this in Supabase SQL Editor

-- 1. Drop the potential problematic policy
DROP POLICY IF EXISTS "Recruiter view assigned projects" ON public.projects;

-- 2. Re-create it with a simpler, cleaner syntax (Explicit table naming)
CREATE POLICY "Recruiter view assigned projects" ON public.projects
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT project_id 
            FROM public.project_recruiters 
            WHERE recruiter_id = auth.uid()
        )
    );

-- 3. Ensure Project Recruiters policy allows reading for own ID
DROP POLICY IF EXISTS "Recruiter view own assignments" ON public.project_recruiters;
CREATE POLICY "Recruiter view own assignments" ON public.project_recruiters
    FOR SELECT TO authenticated
    USING (recruiter_id = auth.uid());

-- 4. Double check Projects policy for Admins (Just in case)
DROP POLICY IF EXISTS "Admin view all projects" ON public.projects;
CREATE POLICY "Admin view all projects" ON public.projects
    FOR SELECT TO authenticated
    USING (public.is_admin_or_lead());
