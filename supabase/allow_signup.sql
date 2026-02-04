-- Allow authenticated users to create their OWN employee record
-- This is necessary for the Signup flow to work

CREATE POLICY "Allow self-registration" ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Also, if the user missed the insert during signup (due to previous error),
-- we should allow them to try again or we just manually insert them now.
-- Since I can't trigger them to re-signup easily, I will run a manual insert logic for the active session? 
-- No, the user can just hit the 'Signup' button again with the same email, but Supabase Auth will say "User already exists".

-- BETTER: The user is already logged in (Supabase Auth).
-- They just don't have an employee row.
-- We can add a "Complete Profile" step or just fix it from backend if I could.

-- For now, RUN THIS, then the user might need to "Sign Up" again or we handle the "No Employee Record" state in the UI.
