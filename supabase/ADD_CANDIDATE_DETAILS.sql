-- Add designation (avoiding current_role keyword) and current_company to candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT;

-- Update search logic capability
COMMENT ON COLUMN public.candidates.designation IS 'The candidates current job title (e.g. Head of Sales)';
