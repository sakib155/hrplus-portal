-- Add type and status to project_logs
ALTER TABLE public.project_logs 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Log', -- 'Log' or 'Task'
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending'; -- 'Pending', 'Completed', 'Approved'

-- Index for performance filtering
CREATE INDEX IF NOT EXISTS idx_project_logs_recruiter_status ON public.project_logs(recruiter_id, status);
CREATE INDEX IF NOT EXISTS idx_project_logs_type ON public.project_logs(type);
