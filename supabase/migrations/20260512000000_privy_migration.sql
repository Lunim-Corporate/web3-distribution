-- Drop RLS policies that depend on the id column before type change
DROP POLICY IF EXISTS user_read_own_profile ON users_profile;
DROP POLICY IF EXISTS user_update_own_profile ON users_profile;
DROP POLICY IF EXISTS admin_all ON users_profile;
DROP POLICY IF EXISTS service_write ON users_profile;

ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_id_fkey;
ALTER TABLE users_profile ALTER COLUMN id TYPE TEXT;

-- Recreate policies
CREATE POLICY user_read_own_profile ON users_profile
  FOR SELECT USING (auth.uid()::text = id OR auth.role() = 'service_role');
CREATE POLICY admin_all ON users_profile
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
