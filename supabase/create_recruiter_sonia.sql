-- INSTRUCTIONS TO ADD RECRUITER "SONIA"
-- -------------------------------------------------------------
-- 1. Go to Supabase Dashboard -> Authentication -> Users.
-- 2. Click "Add User".
-- 3. Email: sonia@hrplus.com (or whatever email you want).
-- 4. Password: Choose a password.
-- 5. Click "Create User".

-- 6. RUN THIS SCRIPT IN SQL EDITOR:

DO $$
DECLARE
  new_email TEXT := 'sonia@hrplus.com'; -- CHANGE THIS if you used a different email
  new_name TEXT := 'Sonia';
  target_id UUID;
BEGIN
  -- Find the User ID from Auth
  SELECT id INTO target_id FROM auth.users WHERE email = new_email;

  IF target_id IS NOT NULL THEN
    -- Insert/Update Employee record as Recruiter
    INSERT INTO public.employees (id, name, role)
    VALUES (target_id, new_name, 'recruiter')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'recruiter', name = new_name;
    
    RAISE NOTICE 'SUCCESS: Recruiter % created/updated.', new_name;
  ELSE
    RAISE NOTICE 'ERROR: User % not found in Auth! Please create the user in the Dashboard first.', new_email;
  END IF;
END $$;
