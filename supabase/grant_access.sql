-- INSTRUCTIONS TO GRANT ACCESS
-- -------------------------------------------------------------
-- Since I cannot access your Supabase Auth Dashboard directly:

-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add User".
-- 3. Email: sakib.purno@gmail.com
-- 4. Password (Generated): HrPlus-Secure-2026!  (Or choose your own)
-- 5. Click "Create User".
-- 6. Copy the "User UID" from the table row (it looks like a long code).

-- 7. RUN THE SQL BELOW IN THE "SQL EDITOR", REPLACING 'PASTE_UUID_HERE':

INSERT INTO public.employees (id, name, role)
VALUES (
    'PASTE_UUID_HERE',   -- <--- PASTE THE COPIED UID HERE inside quotes
    'Sakib Purno', 
    'admin'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', name = 'Sakib Purno';
