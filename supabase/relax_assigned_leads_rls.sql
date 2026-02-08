-- Allow ANY assigned user to VIEW their leads (not just 'sales' role)
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
        -- ANY user can view leads ASSIGNED to them (Manager)
        lead_responsible_id = auth.uid()
        OR
        -- Lead Owner can view their OWN leads
        lead_owner_id = auth.uid()
    );

-- Allow ANY assigned user to UPDATE their leads
DROP POLICY IF EXISTS "Update assigned leads" ON public.leads;

CREATE POLICY "Update assigned leads" ON public.leads
    FOR UPDATE TO authenticated USING (
        -- Admin/Marketing/Sales Lead can manage via other policy ("Manage all leads")
        -- This specific policy is for the ASSIGNEE
        lead_responsible_id = auth.uid()
    );
