-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.employees(id) ON DELETE SET NULL, -- Nullable for system messages
    type TEXT NOT NULL CHECK (type IN ('Task', 'Alert', 'Info', 'Success')),
    content TEXT NOT NULL,
    link TEXT, -- Optional link to redirect (e.g., /projects/123)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own notifications
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (recipient_id = auth.uid());

-- 2. Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- 3. Admins/System can insert notifications for anyone
-- Also allow specific triggers (which run as system/owner usually) to insert.
-- For manual inserts from authenticated users (e.g. Admin sending task):
CREATE POLICY "Admin insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (
        public.is_admin_or_lead() OR sender_id = auth.uid()
    );
