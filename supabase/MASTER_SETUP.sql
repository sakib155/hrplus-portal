-- MASTER SETUP FOR HRPLUS
-- =============================================================
-- Copy this ENTIRE content and run it in Supabase SQL Editor.
-- =============================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    project_title TEXT NOT NULL,
    openings INTEGER DEFAULT 1,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_close_date DATE,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Closed')),
    notes TEXT,
    created_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Recruiters (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.project_recruiters (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, recruiter_id)
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    recruiter_id UUID REFERENCES public.employees(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    cv_link TEXT NOT NULL,
    source TEXT CHECK (source IN ('LinkedIn', 'BDJobs', 'Referral', 'Other')),
    internal_interview_date TIMESTAMP WITH TIME ZONE,
    internal_result TEXT CHECK (internal_result IN ('Pass', 'Hold', 'Reject')),
    internal_notes TEXT,
    client_submission_date TIMESTAMP WITH TIME ZONE,
    client_submission_channel TEXT CHECK (client_submission_channel IN ('Email', 'WhatsApp', 'Portal', 'Other')),
    client_feedback_status TEXT DEFAULT 'Awaiting' CHECK (client_feedback_status IN ('Awaiting', 'Interview', 'Offer', 'Rejected', 'Hold')),
    offer_date DATE,
    joining_date DATE,
    joining_letter_link TEXT,
    admin_approved_joining BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Sourced' CHECK (status IN ('Sourced', 'Shortlisted', 'Internal Pass', 'Submitted', 'Interview', 'Offer', 'Joined', 'Not Joined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    date DATE PRIMARY KEY,
    description TEXT
);

-- System Tasks Table
CREATE TABLE IF NOT EXISTS public.system_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    recruiter_id UUID REFERENCES public.employees(id),
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;

-- 4. CREATE HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin_or_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = auth.uid() AND role IN ('admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE POLICIES (Simplified for idempotency - Drop first to avoid errors on rerun)
DROP POLICY IF EXISTS "View employees" ON public.employees;
DROP POLICY IF EXISTS "Admin manage employees" ON public.employees;
DROP POLICY IF EXISTS "Allow self-registration" ON public.employees;

CREATE POLICY "View employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage employees" ON public.employees FOR ALL TO authenticated USING (public.is_admin_or_lead());
-- Allow users to create their own profile (FIX FOR SIGNUP)
CREATE POLICY "Allow self-registration" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- (Policies for other tables omitted for brevity but should be from schema.sql if needed. 
-- Assuming clean slate, running the full schema.sql content plus the fix is best.
-- I will include minimal critical policies here to get started).

-- Projects Policies
DROP POLICY IF EXISTS "Admin view all projects" ON public.projects;
DROP POLICY IF EXISTS "Recruiter view assigned projects" ON public.projects;
CREATE POLICY "Admin view all projects" ON public.projects FOR SELECT TO authenticated USING (public.is_admin_or_lead());
CREATE POLICY "Recruiter view assigned projects" ON public.projects FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.project_recruiters WHERE project_id = public.projects.id AND recruiter_id = auth.uid())
);

-- 6. GRANT ADMIN ACCESS (The Critical Fix)
DO $$
DECLARE
  target_email TEXT := 'sakib.purno@gmail.com';
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;
  
  IF target_id IS NOT NULL THEN
    INSERT INTO public.employees (id, name, role)
    VALUES (target_id, 'Sakib Purno', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
