-- ================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR USERS TABLE
-- ================================================================
-- Run this in Supabase SQL Editor to enable proper access control

-- 1. Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public users table is viewable by all" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert user records" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;

-- 3. Create permissive policy: Everyone can view all users (for project contributor lists)
CREATE POLICY "Public users table is viewable by all"
  ON public.users FOR SELECT
  USING (TRUE);  -- Anyone can read any user

-- 4. Create policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)  -- Only update own record
  WITH CHECK (auth.uid() = id);

-- 5. Create permissive policy: Allow new users to be created (authenticated users)
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);  -- Only insert your own user record

-- 6. Create policy: Service role (via API) can insert without restriction
--    This is implicit - service role bypasses RLS
--    But we can make it explicit for clarity:
CREATE POLICY "Allow service role to manage users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role')  -- Service role can do anything
  WITH CHECK (auth.role() = 'service_role');

-- 7. Verify RLS is enabled and policies exist
SELECT 
  tablename, 
  (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE tablename = 'users'
  AND schemaname = 'public';

-- 8. List all policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';
