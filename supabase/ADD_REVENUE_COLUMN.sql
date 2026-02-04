-- Add revenue column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS revenue_amount NUMERIC DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN public.projects.revenue_amount IS 'The expected revenue or commission for filling this position.';
