-- Fix RLS: Grant 'sales_lead' permission to Manage Leads
DROP POLICY IF EXISTS "Manage leads" ON public.leads;
DROP POLICY IF EXISTS "Manage all leads" ON public.leads;

CREATE POLICY "Manage all leads" ON public.leads
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales_lead', 'lead') -- Added sales_lead
        )
    );

-- Fix RLS: Grant 'sales_lead' permission to View/Insert Notes
DROP POLICY IF EXISTS "View notes" ON public.lead_notes;

CREATE POLICY "View notes" ON public.lead_notes
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales', 'sales_lead', 'lead') -- Added sales_lead
        )
    );

-- Update "Insert notes" is already generic (auth.uid = employee_id), but ensuring they can access the table is good.
-- (No change needed for Insert Notes as long as they passed the SELECT check if it was used for validation, but Insert usually only checks WITH CHECK)
