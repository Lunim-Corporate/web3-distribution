-- LUNIM Migration 003b: Fix RLS Policies — PRD §11.2
-- Replace overly permissive "public read" policies with scoped access

-- ============================================================
-- 1. Drop existing policies to ensure idempotency
-- ============================================================
DROP POLICY IF EXISTS "public read" ON projects;
DROP POLICY IF EXISTS "service write" ON projects;
DROP POLICY IF EXISTS "admin_read_all_projects" ON projects;
DROP POLICY IF EXISTS "holder_read_own_projects" ON projects;
DROP POLICY IF EXISTS "service_all_projects" ON projects;

DROP POLICY IF EXISTS "public read" ON rights_holders;
DROP POLICY IF EXISTS "service write" ON rights_holders;
DROP POLICY IF EXISTS "admin_read_all_holders" ON rights_holders;
DROP POLICY IF EXISTS "holder_read_own_record" ON rights_holders;
DROP POLICY IF EXISTS "service_all_holders" ON rights_holders;

DROP POLICY IF EXISTS "public read" ON transactions;
DROP POLICY IF EXISTS "service write" ON transactions;
DROP POLICY IF EXISTS "admin_read_all_transactions" ON transactions;
DROP POLICY IF EXISTS "service_all_transactions" ON transactions;

DROP POLICY IF EXISTS "public read" ON transaction_splits;
DROP POLICY IF EXISTS "service write" ON transaction_splits;
DROP POLICY IF EXISTS "admin_read_all_splits" ON transaction_splits;
DROP POLICY IF EXISTS "holder_read_own_splits" ON transaction_splits;
DROP POLICY IF EXISTS "service_all_splits" ON transaction_splits;

DROP POLICY IF EXISTS "users_read_own_profile" ON users_profile;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON users_profile;
DROP POLICY IF EXISTS "users_update_own_profile" ON users_profile;
DROP POLICY IF EXISTS "service_all_profiles" ON users_profile;

DROP POLICY IF EXISTS "admin_manage_invites" ON invites;
DROP POLICY IF EXISTS "service_all_invites" ON invites;

DROP POLICY IF EXISTS "authenticated_read_settings" ON settings;
DROP POLICY IF EXISTS "admin_write_settings" ON settings;
DROP POLICY IF EXISTS "service_all_settings" ON settings;


-- ============================================================
-- 2. users_profile policies
-- ============================================================
CREATE POLICY "users_read_own_profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_read_all_profiles" ON users_profile
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = auth.uid() AND up.role = 'ADMIN')
  );

CREATE POLICY "users_update_own_profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "service_all_profiles" ON users_profile
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. projects policies — admins see all, holders see own projects
-- ============================================================
CREATE POLICY "admin_read_all_projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "holder_read_own_projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rights_holders
      WHERE rights_holders.project_id = projects.id
      AND rights_holders.user_id = auth.uid()
    )
  );

CREATE POLICY "service_all_projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 4. rights_holders policies
-- ============================================================
CREATE POLICY "admin_read_all_holders" ON rights_holders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "holder_read_own_record" ON rights_holders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "service_all_holders" ON rights_holders
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. transactions policies
-- ============================================================
CREATE POLICY "admin_read_all_transactions" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "service_all_transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 6. transaction_splits policies
-- ============================================================
CREATE POLICY "admin_read_all_splits" ON transaction_splits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "holder_read_own_splits" ON transaction_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rights_holders
      WHERE rights_holders.id = transaction_splits.rights_holder_id
      AND rights_holders.user_id = auth.uid()
    )
  );

CREATE POLICY "service_all_splits" ON transaction_splits
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. invites policies — admin only
-- ============================================================
CREATE POLICY "admin_manage_invites" ON invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "service_all_invites" ON invites
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 8. settings policies — admin read/write, authenticated read
-- ============================================================
CREATE POLICY "authenticated_read_settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_write_settings" ON settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "service_all_settings" ON settings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 9. Automatic Profile Creation — PRD §11.1
-- ============================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, display_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'RIGHTS_HOLDER')::text
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to link auth.users to public.users_profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users who might be missing a profile
INSERT INTO public.users_profile (id, display_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  COALESCE(raw_user_meta_data->>'role', 'RIGHTS_HOLDER')::text
FROM auth.users
ON CONFLICT (id) DO NOTHING;
