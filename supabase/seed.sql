-- ============================================================
-- Retro Garage – Seed: demo users
-- Run AFTER schema.sql.
-- Create the users first in Supabase Dashboard:
--   Authentication > Users > "Add user"
--   admin@retro.local  / Admin123!
--   chef@retro.local   / Chef123!
-- Then run this script to assign their roles.
-- ============================================================

-- Replace the UUIDs with the actual IDs shown in Auth > Users after creation
update public.profiles
set role = 'admin', name = 'Admin'
where id = (select id from auth.users where email = 'admin@retro.local');

update public.profiles
set role = 'chef', name = 'Chef'
where id = (select id from auth.users where email = 'chef@retro.local');
