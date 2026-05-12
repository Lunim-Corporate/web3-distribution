-- LUNIM Migration 003: Align schema to PRD §11.1
-- Adds missing tables and columns required by the PRD specification

-- ============================================================
-- 1. users_profile (extends Supabase auth.users) — PRD §11.1
-- ============================================================
CREATE TABLE IF NOT EXISTS users_profile (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT CHECK (role IN ('ADMIN', 'RIGHTS_HOLDER')) DEFAULT 'RIGHTS_HOLDER',
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Add missing columns to rights_holders — PRD §11.1
-- ============================================================
ALTER TABLE rights_holders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE rights_holders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- ============================================================
-- 3. Add missing columns to transactions — PRD §11.1
-- ============================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'eth';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- ============================================================
-- 4. invites table — PRD §11.1
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'RIGHTS_HOLDER',
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  status      TEXT CHECK (status IN ('pending','accepted','expired')) DEFAULT 'pending',
  sent_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ DEFAULT now() + INTERVAL '48 hours'
);

-- ============================================================
-- 5. settings table — PRD §11.1
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed initial settings
INSERT INTO settings (key, value) VALUES ('demo_mode', 'false') ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. Enable RLS on new tables
-- ============================================================
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. Auto-update triggers for new tables
-- ============================================================
CREATE TRIGGER trg_users_profile_updated
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. Enable Realtime on required tables — PRD §11.3
-- ============================================================
-- Note: Run these via Supabase Dashboard if ALTER PUBLICATION is restricted
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE transaction_splits;
-- ALTER PUBLICATION supabase_realtime ADD TABLE rights_holders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE settings;
