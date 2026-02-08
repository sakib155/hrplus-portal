-- Update "Manage leads" policy to include 'sales_lead'
-- This gives Sales Leads full access to Insert/Update/Delete leads, just like Admin/Marketing

DROP POLICY IF EXISTS "Manage leads" ON public.leads;

CREATE POLICY "Manage leads" ON public.leads
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales_lead', 'lead', 'sales') 
            -- Note: 'sales' is here too, but we might want to restrict 'sales' to only their own?
            -- deeper discussion: originally 'sales' was in the list in leads_schema.sql
            -- If we want to restrict regular sales users, we should remove 'sales' from here and rely on "Update assigned leads".
            -- However, to be safe and fix the immediate "sales lead can't edit" issue, we MUST add 'sales_lead'.
        )
    );

-- Actually, looking at the original schema, 'sales' was given full access in `leads_schema.sql`. 
-- If that was intended, then `sales_lead` definitely needs it.
-- If 'sales' should be restricted, that's a separate cleanup, but adding 'sales_lead' is the priority.

-- Let's make sure `sales_lead` is in the list.
