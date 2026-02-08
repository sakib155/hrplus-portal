-- 1. Sync existing users (Fix "User authenticated but no employee record found")
-- Inserts any user from auth.users that is missing in public.employees
INSERT INTO public.employees (id, name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', email, 'Unknown User'), 
  'recruiter'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.employees);

-- 2. Create Trigger Function to automatically create employee record on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.email, 'Unknown User'), 
    'recruiter' -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. (Optional) Enhance RLS to ensure users can read their own data (Already covered by "View employees" policy)
