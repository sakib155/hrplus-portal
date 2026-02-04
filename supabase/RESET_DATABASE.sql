-- DANGER: THIS SCRIPT WILL WIPE ALL DATA
-- =============================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FRESHLY INSTALL DB
-- =============================================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS public.system_tasks CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.project_recruiters CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE TABLES
-- Employees Table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE public.projects (
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
CREATE TABLE public.project_recruiters (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, recruiter_id)
);

-- Candidates Table
CREATE TABLE public.candidates (
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
CREATE TABLE public.holidays (
    date DATE PRIMARY KEY,
    description TEXT
);

-- System Tasks Table
CREATE TABLE public.system_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    recruiter_id UUID REFERENCES public.employees(id),
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin_or_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = auth.uid() AND role IN ('admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE POLICIES (With Fixes Included)

-- Employees
CREATE POLICY "View employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage employees" ON public.employees FOR ALL TO authenticated USING (public.is_admin_or_lead());
-- Allow users to create their own profile (Signup Fix)
CREATE POLICY "Allow self-registration" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY "Admin manage projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin_or_lead());
CREATE POLICY "Recruiter view assigned projects" ON public.projects FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.project_recruiters WHERE project_id = public.projects.id AND recruiter_id = auth.uid())
);

-- Project Recruiters
CREATE POLICY "Admin manage assignments" ON public.project_recruiters FOR ALL TO authenticated USING (public.is_admin_or_lead());
CREATE POLICY "Recruiter view own assignments" ON public.project_recruiters FOR SELECT TO authenticated USING (recruiter_id = auth.uid());

-- Candidates
CREATE POLICY "Admin manage candidates" ON public.candidates FOR ALL TO authenticated USING (public.is_admin_or_lead());
CREATE POLICY "Recruiter view own candidates" ON public.candidates FOR SELECT TO authenticated USING (recruiter_id = auth.uid());
CREATE POLICY "Recruiter insert candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (recruiter_id = auth.uid());
CREATE POLICY "Recruiter update own candidates" ON public.candidates FOR UPDATE TO authenticated USING (
    recruiter_id = auth.uid() AND admin_approved_joining = FALSE
);

-- Holidays
CREATE POLICY "Read holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- System Tasks
CREATE POLICY "Admin manage tasks" ON public.system_tasks FOR ALL TO authenticated USING (public.is_admin_or_lead());
CREATE POLICY "View own system tasks" ON public.system_tasks FOR SELECT TO authenticated USING (recruiter_id = auth.uid());
CREATE POLICY "Insert system tasks" ON public.system_tasks FOR INSERT TO authenticated WITH CHECK (true);

-- 7. RESTORE USERS (Sakib & Sonia)
DO $$
DECLARE
  sakib_email TEXT := 'sakib.purno@gmail.com';
  sonia_email TEXT := 'sonia@hrplus.com';
  target_id UUID;
BEGIN
  -- Grant Admin to Sakib
  SELECT id INTO target_id FROM auth.users WHERE email = sakib_email;
  IF target_id IS NOT NULL THEN
    INSERT INTO public.employees (id, name, role) VALUES (target_id, 'Sakib Purno', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;

  -- Grant Recruiter to Sonia
  SELECT id INTO target_id FROM auth.users WHERE email = sonia_email;
  IF target_id IS NOT NULL THEN
    INSERT INTO public.employees (id, name, role) VALUES (target_id, 'Sonia', 'recruiter')
    ON CONFLICT (id) DO UPDATE SET role = 'recruiter';
  END IF;
END $$;
