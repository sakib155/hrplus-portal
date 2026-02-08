-- Drop the existing constraint
ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;

-- Add the new constraint including 'Cancelled'
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('Active', 'On Hold', 'Closed', 'Cancelled'));
