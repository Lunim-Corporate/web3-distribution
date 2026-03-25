-- Creative Rights Tracker - Complete Supabase Database Schema
-- This is the FINAL, CLEAN migration for Supabase PostgreSQL
-- Copy and paste each section into Supabase SQL Editor

-- ============================================================
-- STEP 1: CREATE USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'contributor', -- 'admin', 'creator', 'contributor'
  avatar_url TEXT,
  wallet_address VARCHAR(255),
  wallet_connected BOOLEAN DEFAULT FALSE,
  wallet_connected_at TIMESTAMP,
  preferred_payment_method VARCHAR(50) DEFAULT 'traditional',
  total_earnings BIGINT DEFAULT 0, -- in cents
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- ============================================================
-- STEP 2: CREATE PROJECTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100), -- e.g., 'music', 'video', 'art', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
  total_revenue BIGINT DEFAULT 0, -- in cents
  progress INTEGER DEFAULT 0, -- percentage 0-100
  cover_image_url TEXT,
  contract_address VARCHAR(255), -- smart contract address if applicable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB -- for storing additional project data
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- ============================================================
-- STEP 3: CREATE PROJECT_CONTRIBUTORS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS project_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100), -- e.g., 'artist', 'producer', 'composer'
  revenue_share NUMERIC(5,2) NOT NULL DEFAULT 0, -- percentage 0-100
  total_earned BIGINT DEFAULT 0, -- in cents
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_contributors_project_id ON project_contributors(project_id);
CREATE INDEX idx_project_contributors_user_id ON project_contributors(user_id);

-- ============================================================
-- STEP 4: CREATE PAYMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL, -- payment amount in cents
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50), -- 'bank_transfer', 'crypto', 'paypal', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  source VARCHAR(255), -- where the payment came from
  tx_hash VARCHAR(255), -- blockchain transaction hash if crypto
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- STEP 5: CREATE CREATIVE_RIGHTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS creative_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rights_type VARCHAR(255) NOT NULL, -- 'master', 'composition', 'publishing', etc.
  revenue_share NUMERIC(5,2) NOT NULL DEFAULT 0, -- percentage share
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'transferred'
  expiration_date TIMESTAMP,
  renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB -- for storing additional rights data
);

CREATE INDEX idx_creative_rights_project_id ON creative_rights(project_id);
CREATE INDEX idx_creative_rights_owner_id ON creative_rights(owner_id);
CREATE INDEX idx_creative_rights_status ON creative_rights(status);
CREATE INDEX idx_creative_rights_expiration_date ON creative_rights(expiration_date);

-- ============================================================
-- STEP 6: CREATE MILESTONES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL, -- milestone date
  target_amount BIGINT, -- optional target revenue in cents
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'upcoming', 'in_progress', 'completed', 'overdue'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_date ON milestones(date);
CREATE INDEX idx_milestones_status ON milestones(status);

-- ============================================================
-- STEP 7: CREATE ACTIVITIES TABLE FOR AUDIT TRAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL, -- 'payment_recorded', 'right_added', 'milestone_created', etc.
  description TEXT NOT NULL,
  metadata JSONB, -- additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);

-- ============================================================
-- STEP 8: CREATE DISTRIBUTION_HISTORY TABLE (for tracking payments to contributors)
-- ============================================================

CREATE TABLE IF NOT EXISTS distribution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_contributor_id UUID REFERENCES project_contributors(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL, -- amount distributed to this contributor
  share_percentage NUMERIC(5,2) NOT NULL, -- revenue share percentage
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distribution_history_payment_id ON distribution_history(payment_id);
CREATE INDEX idx_distribution_history_contributor_id ON distribution_history(contributor_id);
CREATE INDEX idx_distribution_history_status ON distribution_history(status);

-- ============================================================
-- STEP 9: CREATE ANALYTICS VIEWS
-- ============================================================

-- View 1: Project Revenue Summary
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT 
  p.id,
  p.name,
  p.owner_id,
  u.name AS owner_name,
  p.status,
  COALESCE(SUM(pay.amount_cents), 0)::BIGINT as total_revenue,
  COUNT(DISTINCT pc.id)::INTEGER as contributor_count,
  COUNT(DISTINCT cr.id)::INTEGER as total_rights,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'completed'
LEFT JOIN project_contributors pc ON p.id = pc.project_id
LEFT JOIN creative_rights cr ON p.id = cr.project_id
GROUP BY p.id, p.name, p.owner_id, u.name, p.status, p.created_at, p.updated_at;

-- View 2: Contributor Earnings Summary
CREATE OR REPLACE VIEW contributor_earnings AS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT pc.project_id)::INTEGER as projects_involved,
  COUNT(DISTINCT cr.id)::INTEGER as rights_owned,
  COALESCE(SUM(dh.amount_cents), 0)::BIGINT as total_earned,
  COALESCE(SUM(CASE WHEN dh.status = 'pending' THEN dh.amount_cents ELSE 0 END), 0)::BIGINT as pending_earnings,
  u.created_at
FROM users u
LEFT JOIN project_contributors pc ON u.id = pc.user_id
LEFT JOIN creative_rights cr ON u.id = cr.owner_id
LEFT JOIN distribution_history dh ON u.id = dh.contributor_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.created_at;

-- View 3: Monthly Revenue Trend
CREATE OR REPLACE VIEW monthly_revenue_trend AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  DATE_TRUNC('month', pay.payment_date)::DATE as month,
  COALESCE(SUM(pay.amount_cents), 0)::BIGINT as monthly_revenue,
  COUNT(DISTINCT pay.id)::INTEGER as transaction_count
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'completed'
GROUP BY p.id, p.name, DATE_TRUNC('month', pay.payment_date)
ORDER BY p.id, month DESC;

-- ============================================================
-- STEP 10: ENABLE ROW LEVEL SECURITY (RLS) - OPTIONAL
-- ============================================================

-- Uncomment the following lines if you want to enable RLS for security

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_contributors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE creative_rights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE distribution_history ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for projects (only owners can view their projects):
-- CREATE POLICY "Users can view their own projects" ON projects
-- FOR SELECT USING (owner_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- ============================================================
-- STEP 11: SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================

-- You can insert sample data here for testing purposes
-- Uncomment to use:

/*
-- Insert sample admin user
INSERT INTO users (email, name, role) 
VALUES ('admin@example.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample creator
INSERT INTO users (email, name, role) 
VALUES ('creator@example.com', 'Creator User', 'creator')
ON CONFLICT (email) DO NOTHING;

-- Insert sample contributor
INSERT INTO users (email, name, role) 
VALUES ('contributor@example.com', 'Contributor User', 'contributor')
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================
-- NOTES FOR USER
-- ============================================================
/*
1. All monetary amounts (total_revenue, total_earned, etc.) are stored in CENTS to avoid floating-point issues
   - Convert: cents / 100 = display amount in currency
   
2. UUID PRIMARY KEYs are auto-generated using gen_random_uuid()
   
3. Indexes are created on frequently queried columns for performance
   
4. The views provide aggregated data for analytics and reporting
   
5. Timestamps default to CURRENT_TIMESTAMP for audit trails
   
6. JSONB column (metadata) allows flexible storage of additional properties per project
   
7. All foreign key constraints use ON DELETE CASCADE to maintain referential integrity
   
8. Status fields are VARCHAR to allow future custom status values
   
9. Tables are created with IF NOT EXISTS to be idempotent (safe to run multiple times)
*/
