-- =============================================
-- HRPLUS RESCUE SCRIPT: DROP ONNO TABLES
-- Run this in your Supabase SQL Editor to wipe out the accidental Onno schema
-- =============================================

-- 1. Drop the trigger and function on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Drop all Onno specific tables correctly resolving dependencies via CASCADE
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.seo_settings CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- Extremely important: DO NOT drop `public.profiles` if HRPlus originally used it,
-- but based on the HRPlus schema.sql I saw earlier, HRPlus uses `public.employees`.
-- Therefore, it is safe to drop `profiles` as it was created by the Onno script.
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Note: Your genuine HRPlus tables are intact:
-- employees, projects, project_recruiters, candidates, holidays, system_tasks, leads, lead_notes
