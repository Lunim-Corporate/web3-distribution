-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contract_address TEXT,
  network TEXT DEFAULT 'localhost',
  total_distributed NUMERIC(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rights holders table
CREATE TABLE rights_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  total_received NUMERIC(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table (every on-chain distribution event saved here)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tx_hash TEXT UNIQUE NOT NULL,
  sender_address TEXT NOT NULL,
  total_amount NUMERIC(20, 8) NOT NULL,
  block_number BIGINT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')) 
         DEFAULT 'pending',
  network TEXT DEFAULT 'localhost',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Transaction splits (individual distribution lines per transaction)
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  rights_holder_id UUID REFERENCES rights_holders(id),
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  amount_eth NUMERIC(20, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security but allow service role full access
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

-- Policies: allow all for service_role (backend), 
--           allow read-only for anon (frontend public reads)
CREATE POLICY "Service role full access" ON projects
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON rights_holders
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read rights_holders" ON rights_holders
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON transactions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON transaction_splits
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read transaction_splits" ON transaction_splits
  FOR SELECT USING (true);

-- Trigger to auto-update updated_at on rights_holders
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rights_holders_updated
  BEFORE UPDATE ON rights_holders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
