-- 1. Check your current role (Run this to see what you are)
SELECT * FROM public.employees WHERE email = 'sakib.purno@gmail.com';

-- 2. Upgrade to VALID Admin (Run this to fix the error)
UPDATE public.employees
SET role = 'admin'
WHERE email = 'sakib.purno@gmail.com';

-- 3. If you signed up with a DIFFERENT email, verify it exists:
-- SELECT * FROM auth.users; 
-- (You can see all users here to get the correct email if you used a different one)
