-- FIX MISSING PERMISSIONS
-- Run this in Supabase SQL Editor

-- 1. Policies for Projects (Admins can do everything)
DROP POLICY IF EXISTS "Admin manage projects" ON public.projects;
CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- 2. Policies for Project Recruiters
DROP POLICY IF EXISTS "Admin manage assignments" ON public.project_recruiters;
CREATE POLICY "Admin manage assignments" ON public.project_recruiters
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- 3. Policies for Candidates
DROP POLICY IF EXISTS "Admin manage candidates" ON public.candidates;
CREATE POLICY "Admin manage candidates" ON public.candidates
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- 4. Policies for Holidays
DROP POLICY IF EXISTS "Admin manage holidays" ON public.holidays;
CREATE POLICY "Admin manage holidays" ON public.holidays
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- 5. Policies for System Tasks
DROP POLICY IF EXISTS "Admin manage tasks" ON public.system_tasks;
-- Usually audit logs are append-only, but let's allow Admins to view/insert.
-- (Insert is allowed by "Insert system tasks" policy already if it exists, let's ensure it does)
DROP POLICY IF EXISTS "Insert system tasks" ON public.system_tasks;
CREATE POLICY "Insert system tasks" ON public.system_tasks FOR INSERT TO authenticated WITH CHECK (true);
