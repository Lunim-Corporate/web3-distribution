-- Activities table for dashboard activity feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  user_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read" ON activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "service write" ON activities FOR ALL
  USING (auth.role() = 'service_role');
