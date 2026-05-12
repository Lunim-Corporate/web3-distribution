-- Drop existing tables cleanly
DROP TABLE IF EXISTS transaction_splits CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS rights_holders CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  genre TEXT,
  description TEXT,
  poster_url TEXT,
  contract_address TEXT,
  network TEXT DEFAULT 'localhost',
  status TEXT CHECK (status IN ('active','completed','upcoming'))
        DEFAULT 'active',
  total_distributed NUMERIC(20,8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rights holders
CREATE TABLE rights_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_initials TEXT,
  wallet_address TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  total_received NUMERIC(20,8) DEFAULT 0,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tx_hash TEXT UNIQUE NOT NULL,
  sender_address TEXT NOT NULL,
  total_amount_eth NUMERIC(20,8) NOT NULL,
  block_number BIGINT,
  status TEXT CHECK (status IN ('pending','confirmed','failed'))
         DEFAULT 'pending',
  network TEXT DEFAULT 'localhost',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Transaction splits
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  rights_holder_id UUID REFERENCES rights_holders(id),
  wallet_address TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  amount_eth NUMERIC(20,8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rights_holders_updated
  BEFORE UPDATE ON rights_holders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON projects FOR SELECT USING (true);
CREATE POLICY "service write" ON projects FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "public read" ON rights_holders FOR SELECT USING (true);
CREATE POLICY "service write" ON rights_holders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "service write" ON transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "public read" ON transaction_splits FOR SELECT USING (true);
CREATE POLICY "service write" ON transaction_splits FOR ALL
  USING (auth.role() = 'service_role');
