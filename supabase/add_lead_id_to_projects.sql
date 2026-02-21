-- Add lead_id to projects table to support lead-to-project conversion tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Optional: Create an index for faster lookups when tracking lead-to-project conversion
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
