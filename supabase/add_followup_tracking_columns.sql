-- =============================================
-- Admin Follow-Up Control System Schema Updates
-- =============================================

-- 1. Updates to Leads Table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_response_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_stage TEXT DEFAULT 'Pitched Lead' CHECK (follow_up_stage IN ('Pitched Lead', 'Requirement Discussion', 'Contract Pending')),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- For backwards compatibility/migration, set last_response_date to created_at if null
UPDATE public.leads SET last_response_date = created_at::DATE WHERE last_response_date IS NULL;

-- 2. Updates to Projects Table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS last_response_date DATE,
ADD COLUMN IF NOT EXISTS next_followup_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_stage TEXT DEFAULT 'Waiting for JD' CHECK (follow_up_stage IN ('Waiting for JD', 'Waiting for CV', 'Waiting for Feedback', 'Active Sourcing', 'Offer Pending')),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Set initial values for existing projects
UPDATE public.projects SET last_response_date = created_at::DATE WHERE last_response_date IS NULL;
UPDATE public.projects SET next_followup_date = CURRENT_DATE + INTERVAL '3 days' WHERE next_followup_date IS NULL;
