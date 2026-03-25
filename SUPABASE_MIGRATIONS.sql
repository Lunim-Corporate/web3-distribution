-- Creative Rights Tracker - Supabase Database Migrations
-- Run these SQL commands in the Supabase SQL Editor

-- 0. Create or update milestones table with correct column name
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date);

-- 1. Update projects table with missing columns
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue INTEGER DEFAULT 0;

-- 2. Create or update creative_rights table
CREATE TABLE IF NOT EXISTS creative_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rights_type VARCHAR(255) NOT NULL,
  revenue_share DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  expiration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_creative_rights_project_id ON creative_rights(project_id);
CREATE INDEX IF NOT EXISTS idx_creative_rights_owner_id ON creative_rights(owner_id);

-- 3. Create or update activities table for RecentActivity component
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);

-- 4. Ensure milestones table uses 'date' column (not 'target_date')
-- If your milestones table has target_date, you may need to:
-- ALTER TABLE milestones RENAME COLUMN target_date TO date;
-- Or if you want to keep target_date, update the API to use the correct column

-- 5. Update payments table if needed for PaymentSplitter component
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS split_percentage DECIMAL(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id);

-- Create index for payments
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_recipient_id ON payments(recipient_id);

-- 6. Enable Row Level Security (RLS) for security
ALTER TABLE creative_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for creative_rights
CREATE POLICY IF NOT EXISTS "Users can view rights for their own projects"
  ON creative_rights FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    ) OR owner_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS "Users can insert rights for their projects"
  ON creative_rights FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Create RLS policies for activities
CREATE POLICY IF NOT EXISTS "Users can view activities for projects they own or participate in"
  ON activities FOR SELECT
  USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7. Add wallet-related columns to users table (if not already present)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS wallet_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50) DEFAULT 'traditional';

-- 8. Sample data for testing (optional - comment out if data already exists)
-- INSERT INTO creative_rights (project_id, owner_id, rights_type, revenue_share, status)
-- VALUES (
--   (SELECT id FROM projects LIMIT 1),
--   (SELECT id FROM users LIMIT 1),
--   'Master Recording',
--   50.00,
--   'active'
-- ) ON CONFLICT DO NOTHING;

-- 9. Create a view for revenue analysis
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  COALESCE(SUM(pay.amount), 0)::INTEGER as total_revenue,
  COUNT(DISTINCT cr.id)::INTEGER as total_rights,
  COUNT(DISTINCT cr.owner_id)::INTEGER as contributor_count
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id
LEFT JOIN creative_rights cr ON p.id = cr.project_id
GROUP BY p.id, p.name, p.status;

-- 10. Create a view for contributor earnings
CREATE OR REPLACE VIEW contributor_earnings AS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT cr.project_id)::INTEGER as projects_involved,
  COALESCE(SUM(pay.amount * (cr.revenue_share / 100)), 0)::DECIMAL as total_earnings
FROM users u
LEFT JOIN creative_rights cr ON u.id = cr.owner_id
LEFT JOIN payments pay ON cr.project_id = pay.project_id
GROUP BY u.id, u.name, u.email;

-- Add the following import to your database.ts if needed:
-- These views can be queried like regular tables:
-- SELECT * FROM project_revenue_summary;
-- SELECT * FROM contributor_earnings;
