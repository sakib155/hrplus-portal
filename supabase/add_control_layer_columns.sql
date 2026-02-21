-- =============================================
-- Admin Control Layer Schema Updates (Day 1-2)
-- =============================================

-- 1. Updates to Leads Table (Follow-Up Engine)
-- Note: Reusing next_followup_date to avoid duplicate columns, but adding specific missing fields
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_followup_at DATE,
ADD COLUMN IF NOT EXISTS followup_note TEXT;

-- Migration: Set last_followup_at to last_response_date or created_at if null
UPDATE public.leads 
SET last_followup_at = COALESCE(last_response_date, created_at::DATE) 
WHERE last_followup_at IS NULL;

-- 2. Updates to Projects Table (CV Pipeline Tracking)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS last_activity_at DATE,
ADD COLUMN IF NOT EXISTS last_cv_sent_at DATE,
ADD COLUMN IF NOT EXISTS cv_count INTEGER DEFAULT 0;

-- Migration: Set last_activity_at to created_at if null
UPDATE public.projects 
SET last_activity_at = COALESCE(last_response_date, created_at::DATE) 
WHERE last_activity_at IS NULL;
