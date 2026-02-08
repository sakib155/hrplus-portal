-- Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Company Info
    company_name TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    
    -- Lead Status & Owner
    status TEXT NOT NULL CHECK (status IN ('Not Contacted', 'Contacted', 'Requirement Received', 'Converted', 'Lost')),
    lead_responsible_id UUID REFERENCES public.employees(id), -- Sales/Marketing person responsible
    
    -- Contact Person Info
    contact_person TEXT,
    designation TEXT,
    phone TEXT,
    email TEXT,
    
    -- Scoring & Metrics (1-5)
    hiring_growth_score INTEGER CHECK (hiring_growth_score BETWEEN 1 AND 5),
    online_footprint_score INTEGER CHECK (online_footprint_score BETWEEN 1 AND 5),
    marketing_status_score INTEGER CHECK (marketing_status_score BETWEEN 1 AND 5),
    potentiality_score INTEGER, -- Calculated Sum or Manual
    
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
    
    -- Source & Type
    lead_source TEXT,
    service_type TEXT,
    hiring_requirement TEXT,
    
    -- Dates
    last_contact_date DATE,
    next_followup_date DATE,
    
    remarks TEXT
);

-- Create Lead Notes Table (History)
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id), -- Who made the note
    note TEXT NOT NULL,
    contact_type TEXT CHECK (contact_type IN ('Call', 'Email', 'Meeting', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Policies for LEADS
-- Marketing/Sales/Admins can view all leads
CREATE POLICY "View leads" ON public.leads
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales', 'lead')
        )
    );

-- Marketing/Sales/Admins can insert/update leads
CREATE POLICY "Manage leads" ON public.leads
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales', 'lead')
        )
    );

-- Policies for NOTES
CREATE POLICY "View notes" ON public.lead_notes
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'marketing', 'sales', 'lead')
        )
    );

CREATE POLICY "Insert notes" ON public.lead_notes
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = employee_id
    );
