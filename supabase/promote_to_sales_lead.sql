-- DATA FIX: Promote a specific user to 'sales_lead'
-- Replace 'deepa@example.com' with the actual email of the user if known, 
-- or use the ID if we knew it.
-- Since I don't know the exact email, I'll provide a template.

UPDATE public.employees
SET role = 'sales_lead'
WHERE email = 'deepa@hrplus.com'; -- REPLACE THIS with her actual email

-- Verify the change
SELECT * FROM public.employees WHERE role = 'sales_lead';
