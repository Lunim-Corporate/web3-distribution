-- ============================================================================
-- CREATIVE RIGHTS TRACKER - COMPLETE SUPABASE DATABASE SETUP
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Click "SQL Editor" on the left sidebar
-- 3. Click "+ New Query"
-- 4. Copy and paste ALL the SQL code below
-- 5. Click "RUN" button
-- 6. Done! Your database is ready with schema + demo data
--
-- SAFE TO RUN MULTIPLE TIMES:
-- - Uses "CREATE TABLE IF NOT EXISTS" (won't error if tables exist)
-- - Uses "ADD COLUMN IF NOT EXISTS" (won't error if columns exist)
-- - Uses "ON CONFLICT DO NOTHING" (won't duplicate data)
-- - Can be run again without losing data
--
-- NO NEED TO DROP TABLES:
-- - This script preserves existing data
-- - Only adds missing tables/columns
-- - Updates existing records if needed
--
-- ============================================================================

-- ============================================================================
-- PART 1: ENSURE BASE TABLES EXIST (Core schema)
-- ============================================================================

-- 1.1 Users Table (if your Supabase auth doesn't auto-create it)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('admin', 'creator', 'contributor')),
  wallet_address VARCHAR(255),
  wallet_connected BOOLEAN DEFAULT FALSE,
  wallet_connected_at TIMESTAMP,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  active_projects INTEGER DEFAULT 0,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT FALSE,
  preferred_payment_method VARCHAR(50) DEFAULT 'traditional',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'In Progress', 'Paused')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  pending_payments DECIMAL(15,2) DEFAULT 0,
  progress INTEGER DEFAULT 0,
  contract_address VARCHAR(255),
  cover_image VARCHAR(500),
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Project Contributors Table
CREATE TABLE IF NOT EXISTS project_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  revenue_share DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- 1.4 Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(255),
  contributor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Processing' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
  split_percentage DECIMAL(5,2) DEFAULT 100,
  recipient_id UUID REFERENCES users(id),
  transaction_hash VARCHAR(255),
  email_tracked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Creative Rights Table
CREATE TABLE IF NOT EXISTS creative_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rights_type VARCHAR(255) NOT NULL,
  revenue_share DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'disputed')),
  expiration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.6 Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In Progress', 'Completed', 'Overdue')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.7 Activities Table (Audit Log)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: ADD MISSING COLUMNS (Safe updates to existing tables)
-- ============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS split_percentage DECIMAL(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS wallet_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50) DEFAULT 'traditional';

-- ============================================================================
-- PART 3: CREATE INDEXES (For better query performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_contributors_project_id ON project_contributors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributors_user_id ON project_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_contributor_id ON payments(contributor_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_creative_rights_project_id ON creative_rights(project_id);
CREATE INDEX IF NOT EXISTS idx_creative_rights_owner_id ON creative_rights(owner_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);

-- ============================================================================
-- PART 4: CREATE DEMO DATA (Safe insertion with conflict handling)
-- ============================================================================

-- 4.1 Demo Users
INSERT INTO users (id, email, name, avatar, role, total_earnings, active_projects, join_date)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@creative.com', 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'admin', 125000.00, 3, NOW() - INTERVAL '6 months'),
  ('550e8400-e29b-41d4-a716-446655440002', 'creator@creative.com', 'Sarah Johnson', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', 'creator', 89500.00, 2, NOW() - INTERVAL '5 months'),
  ('550e8400-e29b-41d4-a716-446655440003', 'alex@creative.com', 'Alex Rodriguez', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'creator', 67200.00, 3, NOW() - INTERVAL '4 months'),
  ('550e8400-e29b-41d4-a716-446655440004', 'emma@creative.com', 'Emma Wilson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'contributor', 45800.00, 4, NOW() - INTERVAL '3 months'),
  ('550e8400-e29b-41d4-a716-446655440005', 'david@creative.com', 'David Park', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'contributor', 32100.00, 2, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- 4.2 Demo Projects
INSERT INTO projects (id, name, type, description, status, created_by, total_revenue, progress, cover_image)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Music Album Production', 'Music', 'Professional indie album with 12 tracks featuring diverse artists', 'Active', '550e8400-e29b-41d4-a716-446655440002', 150000.00, 65, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=250&fit=crop'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Documentary Film', 'Film', 'Award-winning short documentary about environmental conservation', 'In Progress', '550e8400-e29b-41d4-a716-446655440003', 95000.00, 45, 'https://images.unsplash.com/photo-1485095046884-e64ffc17175d?w=400&h=250&fit=crop'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Web Design Project', 'Design', 'Complete brand redesign and website development for startup', 'Active', '550e8400-e29b-41d4-a716-446655440002', 75000.00, 80, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Podcast Series', 'Audio', 'Weekly podcast exploring tech innovation and entrepreneurship', 'Completed', '550e8400-e29b-41d4-a716-446655440003', 120000.00, 100, 'https://images.unsplash.com/photo-1505373877903-f055e4174563?w=400&h=250&fit=crop'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Art Exhibition', 'Art', 'Contemporary digital art exhibition across multiple galleries', 'Active', '550e8400-e29b-41d4-a716-446655440002', 60000.00, 55, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- 4.3 Demo Project Contributors
INSERT INTO project_contributors (project_id, user_id, role, revenue_share)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Producer', 40.0),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Engineer', 30.0),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'Mastering', 30.0),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Director', 50.0),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Editor', 25.0),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Cinematographer', 25.0),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Designer', 50.0),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Developer', 50.0),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Host', 60.0),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Producer', 40.0),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Curator', 45.0),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Artist', 55.0)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 4.4 Demo Payments
INSERT INTO payments (id, project_id, amount, date, source, contributor_id, status, transaction_hash)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 50000.00, NOW() - INTERVAL '2 months', 'Spotify Revenue', '550e8400-e29b-41d4-a716-446655440002', 'Completed', '0x1234567890'),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 35000.00, NOW() - INTERVAL '1 month', 'Apple Music', '550e8400-e29b-41d4-a716-446655440003', 'Completed', '0x2234567890'),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 25000.00, NOW() - INTERVAL '15 days', 'YouTube Ads', '550e8400-e29b-41d4-a716-446655440004', 'Completed', '0x3234567890'),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 40000.00, NOW() - INTERVAL '20 days', 'Film Festival', '550e8400-e29b-41d4-a716-446655440003', 'Completed', '0x4234567890'),
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 30000.00, NOW() - INTERVAL '10 days', 'Streaming Platform', '550e8400-e29b-41d4-a716-446655440005', 'Completed', '0x5234567890'),
  ('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003', 35000.00, NOW() - INTERVAL '30 days', 'Client Payment', '550e8400-e29b-41d4-a716-446655440002', 'Completed', '0x6234567890'),
  ('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', 40000.00, NOW() - INTERVAL '5 days', 'Additional Revenue', '550e8400-e29b-41d4-a716-446655440004', 'Completed', '0x7234567890'),
  ('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440004', 60000.00, NOW() - INTERVAL '45 days', 'Podcast Sponsorship', '550e8400-e29b-41d4-a716-446655440003', 'Completed', '0x8234567890'),
  ('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440004', 60000.00, NOW() - INTERVAL '15 days', 'Ad Revenue', '550e8400-e29b-41d4-a716-446655440005', 'Completed', '0x9234567890'),
  ('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440005', 30000.00, NOW() - INTERVAL '3 days', 'Gallery Sales', '550e8400-e29b-41d4-a716-446655440002', 'Completed', '0x0234567890'),
  ('750e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440005', 30000.00, NOW() - INTERVAL '1 day', 'Print Sales', '550e8400-e29b-41d4-a716-446655440004', 'Processing', '0x1134567890')
ON CONFLICT (id) DO NOTHING;

-- 4.5 Demo Creative Rights
INSERT INTO creative_rights (id, project_id, owner_id, rights_type, revenue_share, status, expiration_date)
VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Master Recording', 40.0, 'active', NOW() + INTERVAL '2 years'),
  ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Publishing Rights', 30.0, 'active', NOW() + INTERVAL '3 years'),
  ('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Film Rights', 50.0, 'active', NOW() + INTERVAL '5 years'),
  ('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Editing Rights', 25.0, 'active', NOW() + INTERVAL '2 years'),
  ('850e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Design Copyright', 50.0, 'active', NOW() + INTERVAL '3 years'),
  ('850e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Development Rights', 50.0, 'active', NOW() + INTERVAL '4 years'),
  ('850e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Podcast Rights', 60.0, 'active', NOW() + INTERVAL '3 years'),
  ('850e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Art Copyright', 45.0, 'active', NOW() + INTERVAL '10 years')
ON CONFLICT (id) DO NOTHING;

-- 4.6 Demo Milestones
INSERT INTO milestones (id, project_id, title, description, date, status, priority)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Recording Complete', 'All 12 tracks recorded and initial mixing done', NOW() - INTERVAL '2 months', 'Completed', 'high'),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Mastering Phase', 'Professional mastering of all tracks', NOW() - INTERVAL '10 days', 'Completed', 'high'),
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'Distribution to Platforms', 'Release on all major streaming platforms', NOW() + INTERVAL '5 days', 'Upcoming', 'critical'),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Filming Complete', 'All scenes filmed and ready for editing', NOW() - INTERVAL '3 weeks', 'Completed', 'critical'),
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 'Post Production', 'Color grading, sound design, VFX', NOW(), 'In Progress', 'high'),
  ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', 'Film Festival Submission', 'Submit final cut to major film festivals', NOW() + INTERVAL '30 days', 'Upcoming', 'high'),
  ('950e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', 'Design Approval', 'Final design sign-off from client', NOW() - INTERVAL '15 days', 'Completed', 'high'),
  ('950e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440003', 'Development Phase', 'Frontend and backend development', NOW(), 'In Progress', 'high'),
  ('950e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440003', 'Testing & Deployment', 'QA testing and production deployment', NOW() + INTERVAL '20 days', 'Upcoming', 'high'),
  ('950e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440005', 'Artworks Completed', 'All digital artworks finalized', NOW() - INTERVAL '1 month', 'Completed', 'medium'),
  ('950e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440005', 'Gallery Exhibition', 'Physical and digital exhibition launch', NOW() + INTERVAL '2 weeks', 'Upcoming', 'critical')
ON CONFLICT (id) DO NOTHING;

-- 4.7 Demo Activities (Audit Log)
INSERT INTO activities (id, user_id, project_id, action, description, timestamp)
VALUES
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'project_created', 'Created project "Music Album Production"', NOW() - INTERVAL '6 months'),
  ('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'contributor_added', 'Added Emma Wilson as Engineer', NOW() - INTERVAL '5 months'),
  ('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'payment_recorded', 'Recorded $50,000 payment from Spotify', NOW() - INTERVAL '2 months'),
  ('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'project_created', 'Created project "Documentary Film"', NOW() - INTERVAL '4 months'),
  ('a50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 'project_created', 'Created project "Web Design Project"', NOW() - INTERVAL '3 months'),
  ('a50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', 'milestone_updated', 'Completed "Recording Complete" milestone', NOW() - INTERVAL '2 months'),
  ('a50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'milestone_updated', 'Started "Post Production" milestone', NOW() - INTERVAL '3 days'),
  ('a50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 'payment_recorded', 'Recorded $35,000 payment from Client', NOW() - INTERVAL '30 days'),
  ('a50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', 'milestone_updated', 'Started "Development Phase" milestone', NOW() - INTERVAL '5 days'),
  ('a50e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440004', 'project_status_changed', 'Project marked as Completed', NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 5: CREATE VIEWS (For analytics and reporting)
-- ============================================================================

-- 5.1 Project Revenue Summary View
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.progress,
  COALESCE(SUM(pay.amount), 0)::DECIMAL(15,2) as total_revenue,
  COALESCE(COUNT(DISTINCT pc.user_id), 0)::INTEGER as contributor_count,
  COALESCE(COUNT(DISTINCT cr.id), 0)::INTEGER as total_rights,
  COALESCE(COUNT(DISTINCT CASE WHEN m.status = 'Completed' THEN m.id END), 0)::INTEGER as completed_milestones,
  COALESCE(COUNT(DISTINCT CASE WHEN m.status IN ('Upcoming', 'In Progress') THEN m.id END), 0)::INTEGER as pending_milestones,
  p.created_date,
  p.last_updated
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'Completed'
LEFT JOIN project_contributors pc ON p.id = pc.project_id
LEFT JOIN creative_rights cr ON p.id = cr.project_id
LEFT JOIN milestones m ON p.id = m.project_id
GROUP BY p.id, p.name, p.status, p.progress, p.created_date, p.last_updated;

-- 5.2 Contributor Earnings View
CREATE OR REPLACE VIEW contributor_earnings AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.total_earnings,
  COALESCE(COUNT(DISTINCT pc.project_id), 0)::INTEGER as projects_involved,
  COALESCE(SUM(pay.amount * (pc.revenue_share / 100)), 0)::DECIMAL(15,2) as total_earned_this_period,
  COALESCE(COUNT(DISTINCT CASE WHEN pay.status = 'Completed' THEN pay.id END), 0)::INTEGER as completed_payments,
  u.join_date
FROM users u
LEFT JOIN project_contributors pc ON u.id = pc.user_id
LEFT JOIN payments pay ON pc.project_id = pay.project_id
LEFT JOIN projects p ON pc.project_id = p.id
GROUP BY u.id, u.name, u.email, u.role, u.total_earnings, u.join_date;

-- 5.3 Project Performance View
CREATE OR REPLACE VIEW project_performance AS
SELECT 
  p.id,
  p.name,
  p.type,
  p.status,
  p.progress,
  COALESCE(SUM(pay.amount), 0)::DECIMAL(15,2) as total_revenue,
  COALESCE(AVG(pc.revenue_share), 0)::DECIMAL(5,2) as avg_share,
  COALESCE(COUNT(DISTINCT pc.user_id), 0)::INTEGER as num_contributors,
  CASE 
    WHEN p.progress >= 100 THEN 'Completed'
    WHEN p.progress >= 75 THEN 'Near Complete'
    WHEN p.progress >= 50 THEN 'Halfway'
    WHEN p.progress >= 25 THEN 'Started'
    ELSE 'Planning'
  END as progress_stage,
  EXTRACT(DAY FROM NOW() - p.created_date)::INTEGER as days_active
FROM projects p
LEFT JOIN payments pay ON p.id = pay.project_id
LEFT JOIN project_contributors pc ON p.id = pc.project_id
GROUP BY p.id, p.name, p.type, p.status, p.progress, p.created_date;

-- ============================================================================
-- PART 6: SET UP ROW LEVEL SECURITY (Optional but recommended)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE creative_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for projects
CREATE POLICY IF NOT EXISTS "Users can view all projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins can update any project, creators can update their own"
  ON projects FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR created_by = auth.uid()
  );

-- Create RLS policy for creative_rights
CREATE POLICY IF NOT EXISTS "Users can view rights for their projects"
  ON creative_rights FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    ) OR owner_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS "Project creators can insert rights"
  ON creative_rights FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Create RLS policy for activities
CREATE POLICY IF NOT EXISTS "Users can view activities"
  ON activities FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "System can insert activities"
  ON activities FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 7: FINAL VERIFICATION
-- ============================================================================

-- Check table counts
SELECT 'Tables Created' as status, 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;

-- Check user count
SELECT 'Demo Users' as status, COUNT(*) as count FROM users;

-- Check project count
SELECT 'Demo Projects' as status, COUNT(*) as count FROM projects;

-- Check total revenue
SELECT 'Total Revenue' as status, SUM(amount)::DECIMAL(15,2) as total_revenue FROM payments;

-- Check sample data
SELECT 'Sample Revenue Data' as status, COUNT(*) as payment_records FROM payments;

-- ============================================================================
-- DONE! Your database is now fully set up with schema and demo data
-- ============================================================================

-- You can now use the application with real data!
-- All views are available:
--   SELECT * FROM project_revenue_summary;
--   SELECT * FROM contributor_earnings;
--   SELECT * FROM project_performance;
