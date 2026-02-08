-- 1. CANDIDATE FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS public.candidate_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.candidate_followups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin view all followups" ON public.candidate_followups;
DROP POLICY IF EXISTS "Admin manage followups" ON public.candidate_followups;
DROP POLICY IF EXISTS "Recruiter view own followups" ON public.candidate_followups;
DROP POLICY IF EXISTS "Recruiter manage own followups" ON public.candidate_followups;

CREATE POLICY "Admin view all followups" ON public.candidate_followups
    FOR SELECT TO authenticated USING (public.is_admin_or_lead());

CREATE POLICY "Admin manage followups" ON public.candidate_followups
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

CREATE POLICY "Recruiter view own followups" ON public.candidate_followups
    FOR SELECT TO authenticated USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiter manage own followups" ON public.candidate_followups
    FOR ALL TO authenticated USING (recruiter_id = auth.uid());


-- 2. PROJECT DAILY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.project_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    blocker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view all project_logs" ON public.project_logs;
DROP POLICY IF EXISTS "Admin manage project_logs" ON public.project_logs;
DROP POLICY IF EXISTS "Recruiter view logs for assigned projects" ON public.project_logs;
DROP POLICY IF EXISTS "Recruiter insert own logs" ON public.project_logs;
DROP POLICY IF EXISTS "Recruiter update own logs" ON public.project_logs;

CREATE POLICY "Admin view all project_logs" ON public.project_logs
    FOR SELECT TO authenticated USING (public.is_admin_or_lead());

-- [FIX] Allow Admins to Manage Logs (Insert/Update/Delete) for any recruiter
CREATE POLICY "Admin manage project_logs" ON public.project_logs
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

CREATE POLICY "Recruiter view logs for assigned projects" ON public.project_logs
    FOR SELECT TO authenticated USING (
        recruiter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_recruiters 
            WHERE project_id = public.project_logs.project_id 
            AND recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Recruiter insert own logs" ON public.project_logs
    FOR INSERT TO authenticated WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiter update own logs" ON public.project_logs
    FOR UPDATE TO authenticated USING (recruiter_id = auth.uid());
