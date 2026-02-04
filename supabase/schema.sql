-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

-- Employees Table (Links to Supabase Auth)
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
    project_title TEXT NOT NULL, -- Format: Client – Position
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
    
    -- Candidate Info
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    cv_link TEXT NOT NULL, -- Drive Link
    source TEXT CHECK (source IN ('LinkedIn', 'BDJobs', 'Referral', 'Other')),
    
    -- Internal Process
    internal_interview_date TIMESTAMP WITH TIME ZONE,
    internal_result TEXT CHECK (internal_result IN ('Pass', 'Hold', 'Reject')),
    internal_notes TEXT,
    
    -- Client Process
    client_submission_date TIMESTAMP WITH TIME ZONE,
    client_submission_channel TEXT CHECK (client_submission_channel IN ('Email', 'WhatsApp', 'Portal', 'Other')),
    client_feedback_status TEXT DEFAULT 'Awaiting' CHECK (client_feedback_status IN ('Awaiting', 'Interview', 'Offer', 'Rejected', 'Hold')),
    
    -- Final Outcome
    offer_date DATE,
    joining_date DATE,
    joining_letter_link TEXT, -- Mandatory for joining
    admin_approved_joining BOOLEAN DEFAULT FALSE, -- Locks the record
    
    -- Overall Status
    status TEXT NOT NULL DEFAULT 'Sourced' CHECK (status IN ('Sourced', 'Shortlisted', 'Internal Pass', 'Submitted', 'Interview', 'Offer', 'Joined', 'Not Joined')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holidays Table (For SLA)
CREATE TABLE public.holidays (
    date DATE PRIMARY KEY,
    description TEXT
);

-- System Tasks (Audit Log)
CREATE TABLE public.system_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    recruiter_id UUID REFERENCES public.employees(id),
    action_type TEXT NOT NULL, -- e.g., 'ASSIGNMENT_ACCEPTED', 'CANDIDATE_ADDED'
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. RLS Policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is Admin or Lead
CREATE OR REPLACE FUNCTION public.is_admin_or_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = auth.uid() AND role IN ('admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Employees ---
-- Admin/Lead: View all
-- Recruiter: View self (and maybe others? Admin view is key, let's allow all for now to list recruiters, but restrict edit)
CREATE POLICY "View employees" ON public.employees
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage employees" ON public.employees
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- --- Projects ---
-- Admin/Lead: View all, Manage all
CREATE POLICY "Admin view all projects" ON public.projects
    FOR SELECT TO authenticated USING (public.is_admin_or_lead());

CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- Recruiter: View assigned projects only
CREATE POLICY "Recruiter view assigned projects" ON public.projects
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.project_recruiters 
            WHERE project_id = public.projects.id 
            AND recruiter_id = auth.uid()
        )
    );

-- --- Project Recruiters (Assignment) ---
-- Admin/Lead: Manage all
CREATE POLICY "Admin manage assignments" ON public.project_recruiters
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- Recruiter: View own assignments
CREATE POLICY "Recruiter view own assignments" ON public.project_recruiters
    FOR SELECT TO authenticated USING (recruiter_id = auth.uid());

-- --- Candidates ---
-- Admin/Lead: View all, Manage all (except edit if locked? Admin can edit)
CREATE POLICY "Admin view all candidates" ON public.candidates
    FOR SELECT TO authenticated USING (public.is_admin_or_lead());

CREATE POLICY "Admin manage candidates" ON public.candidates
    FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- Recruiter: View OWN candidates only
CREATE POLICY "Recruiter view own candidates" ON public.candidates
    FOR SELECT TO authenticated USING (recruiter_id = auth.uid());

-- Recruiter: Insert own (must be assigned to project usually, enforced via app or trigger, but simple RLS: recruiter_id must be auth.uid())
CREATE POLICY "Recruiter insert candidates" ON public.candidates
    FOR INSERT TO authenticated WITH CHECK (recruiter_id = auth.uid());

-- Recruiter: Update own candidates (Restrictions: CANNOT edit tasks? Tasks are separate. CANNOT approve joining)
-- Rule: Recruiter cannot edit if admin_approved_joining is TRUE.
CREATE POLICY "Recruiter update own candidates" ON public.candidates
    FOR UPDATE TO authenticated USING (
        recruiter_id = auth.uid() 
        AND admin_approved_joining = FALSE 
    );
-- Note: Recruiter CANNOT update 'admin_approved_joining' check is better done via trigger or column permissions, but RLS prevents row update if approved.

-- --- Holidays ---
CREATE POLICY "Read holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin_or_lead());

-- --- System Tasks ---
-- Read-only audit log
CREATE POLICY "View system tasks" ON public.system_tasks FOR SELECT TO authenticated USING (
    public.is_admin_or_lead() OR recruiter_id = auth.uid()
);
-- No UPDATE/DELETE policies = Immutable by default. Insert allowed via app logic (or server-side).
-- Ideally inserts happen via triggers or specific functions. Let's allow insert for authenticated for now, but restrict via backend logic usually.
CREATE POLICY "Insert system tasks" ON public.system_tasks FOR INSERT TO authenticated WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. Triggers & Functions
-- -----------------------------------------------------------------------------

-- Trigger: Lock Candidate Update if Admin Approved (Extra safety)
CREATE OR REPLACE FUNCTION check_candidate_lock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.admin_approved_joining = TRUE AND public.is_admin_or_lead() = FALSE THEN
        RAISE EXCEPTION 'Cannot edit candidate after Admin approval.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_candidate_lock
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION check_candidate_lock();

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_timestamp
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
