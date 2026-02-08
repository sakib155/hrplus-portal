-- 1. Update Employee Role Constraint
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('admin', 'lead', 'recruiter', 'marketing', 'sales', 'sales_lead'));

-- 2. Update Leads RLS Policies

-- Drop existing generic "View leads" policy
DROP POLICY IF EXISTS "View leads" ON public.leads;

-- New Policy: Sales Lead & Admins & Marketing see ALL leads
CREATE POLICY "View all leads for Leads/Admins/Marketing" ON public.leads
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales_lead', 'lead')
        )
    );

-- New Policy: Sales Reps see ONLY assigned leads
CREATE POLICY "View assigned leads for Sales" ON public.leads
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role = 'sales'
        )
        AND lead_responsible_id = auth.uid()
    );

-- 3. Update Manage Leads Policy (Editing)
DROP POLICY IF EXISTS "Manage leads" ON public.leads;

-- Sales Lead/Admin/Marketing can manage all
CREATE POLICY "Manage all leads" ON public.leads
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales_lead', 'lead')
        )
    );

-- Sales Reps can update their OWN leads
CREATE POLICY "Update assigned leads" ON public.leads
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role = 'sales'
        )
        AND lead_responsible_id = auth.uid()
    );
