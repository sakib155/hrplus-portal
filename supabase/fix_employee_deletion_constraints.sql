-- =========================================================================
-- Fix Employee Deletion Constraints
-- This script updates foreign keys pointing to public.employees to use 
-- ON DELETE SET NULL, allowing employees to be cleanly deleted without 
-- wiping out historical records like projects, candidates, and logs.
-- =========================================================================

DO $$ 
DECLARE 
    constraint_rec RECORD;
BEGIN
    -- 1. Update projects.created_by
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'projects' AND column_name = 'created_by' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 2. Update candidates.recruiter_id
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'candidates' AND column_name = 'recruiter_id' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.candidates DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.candidates ADD CONSTRAINT candidates_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 3. Update project_logs.recruiter_id
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'project_logs' AND column_name = 'recruiter_id' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.project_logs DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.project_logs ADD CONSTRAINT project_logs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 4. Update leads.lead_responsible_id
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'leads' AND column_name = 'lead_responsible_id' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.leads ADD CONSTRAINT leads_lead_responsible_id_fkey FOREIGN KEY (lead_responsible_id) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 5. Update leads.lead_owner_id
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'leads' AND column_name = 'lead_owner_id' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.leads ADD CONSTRAINT leads_lead_owner_id_fkey FOREIGN KEY (lead_owner_id) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 6. Update lead_notes.employee_id
    FOR constraint_rec IN (
        SELECT constraint_name FROM information_schema.key_column_usage 
        WHERE table_name = 'lead_notes' AND column_name = 'employee_id' AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.lead_notes DROP CONSTRAINT ' || quote_ident(constraint_rec.constraint_name);
    END LOOP;
    ALTER TABLE public.lead_notes ADD CONSTRAINT lead_notes_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

END $$;
