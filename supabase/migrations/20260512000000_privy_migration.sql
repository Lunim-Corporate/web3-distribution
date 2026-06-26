-- Drop RLS policies that depend on the id column before type change
-- Note: policy names must match those created in 003b_rls_fix.sql
DROP POLICY IF EXISTS users_read_own_profile ON users_profile;
DROP POLICY IF EXISTS users_update_own_profile ON users_profile;
DROP POLICY IF EXISTS admin_read_all_profiles ON users_profile;
DROP POLICY IF EXISTS service_all_profiles ON users_profile;

ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_id_fkey;
ALTER TABLE users_profile ALTER COLUMN id TYPE TEXT;

-- Recreate policies
CREATE POLICY user_read_own_profile ON users_profile
  FOR SELECT USING (auth.uid()::text = id OR auth.role() = 'service_role');
CREATE POLICY admin_all ON users_profile
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
