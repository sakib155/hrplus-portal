-- Add lead_owner_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_owner_id') THEN
        ALTER TABLE public.leads ADD COLUMN lead_owner_id UUID REFERENCES public.employees(id);
    END IF;
END $$;

-- Update RLS policies to allow Lead Owner to view their leads
-- (In case the owner is not marketing/sales/admin, e.g., a recruiter who referred a client)

DROP POLICY IF EXISTS "View leads" ON public.leads;

CREATE POLICY "View leads" ON public.leads
    FOR SELECT TO authenticated USING (
        -- Admin/Marketing/Sales Lead/Recruitment Lead can view ALL
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales_lead', 'lead')
        )
        OR
        -- Sales Reps view ASSIGNED leads
        (
            EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'sales')
            AND lead_responsible_id = auth.uid()
        )
        OR
        -- Lead Owner can view their OWN leads
        lead_owner_id = auth.uid()
    );
