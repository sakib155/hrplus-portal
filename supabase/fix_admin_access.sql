-- RUN THIS IN SUPABASE SQL EDITOR TO GRANT ADMIN ACCESS

DO $$
DECLARE
  target_email TEXT := 'sakib.purno@gmail.com'; -- The email you signed up with
  target_id UUID;
BEGIN
  -- 1. Find the User ID from Supabase Auth System
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NOT NULL THEN
    -- 2. Create or Update the Employee Record with Admin Role
    INSERT INTO public.employees (id, name, role)
    VALUES (target_id, 'Sakib Purno', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'SUCCESS: Admin access granted to %', target_email;
  ELSE
    RAISE NOTICE 'ERROR: User not found! Please Sign Up first.';
  END IF;
END $$;
