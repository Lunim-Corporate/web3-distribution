-- ============================================================
-- 006: Database Indexes & ETL Tables
-- Adds performance indexes and ETL infrastructure tables
-- ============================================================

-- ─── Performance Indexes ─────────────────────────────────────

-- Speed up transaction lookups by tx_hash (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash 
  ON transactions(tx_hash);

-- Speed up rights holder lookups by project
CREATE INDEX IF NOT EXISTS idx_rights_holders_project_id 
  ON rights_holders(project_id);

-- Speed up transaction lookups by project
CREATE INDEX IF NOT EXISTS idx_transactions_project_id 
  ON transactions(project_id);

-- Speed up transaction splits lookups by transaction
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id 
  ON transaction_splits(transaction_id);

-- Speed up activity feed queries
CREATE INDEX IF NOT EXISTS idx_activities_timestamp 
  ON activities(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activities_project_id 
  ON activities(project_id);

-- ─── ETL: Royalty Inflows (multi-source ingestion) ──────────

CREATE TABLE IF NOT EXISTS royalty_inflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'manual', 'on-chain', 'csv')),
  external_ref_id TEXT,
  amount_eth NUMERIC(20,8) DEFAULT 0,
  amount_usd NUMERIC(20,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_tx_id UUID REFERENCES transactions(id),
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate ingestion from same source
  UNIQUE(source, external_ref_id)
);

-- ─── ETL: Reconciliation Log ────────────────────────────────

CREATE TABLE IF NOT EXISTS etl_reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  total_inflows INTEGER DEFAULT 0,
  matched INTEGER DEFAULT 0,
  unmatched INTEGER DEFAULT 0,
  discrepancy_amount_eth NUMERIC(20,8) DEFAULT 0,
  details JSONB DEFAULT '[]',
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed'))
);

-- ─── ETL: Financial Aggregates (materialized rollups) ───────

CREATE TABLE IF NOT EXISTS financial_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_eth NUMERIC(20,8) DEFAULT 0,
  total_usd NUMERIC(20,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  holder_count INTEGER DEFAULT 0,
  source_breakdown JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One aggregate per project per period
  UNIQUE(project_id, period_type, period_start)
);

-- ─── RLS Policies ───────────────────────────────────────────

ALTER TABLE royalty_inflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_aggregates ENABLE ROW LEVEL SECURITY;

-- Service role only — these tables are server-side only
CREATE POLICY "service_all_royalty_inflows" ON royalty_inflows
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "service_all_etl_reconciliation_log" ON etl_reconciliation_log
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "service_all_financial_aggregates" ON financial_aggregates
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Indexes for ETL tables ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_royalty_inflows_project 
  ON royalty_inflows(project_id);

CREATE INDEX IF NOT EXISTS idx_royalty_inflows_source 
  ON royalty_inflows(source);

CREATE INDEX IF NOT EXISTS idx_royalty_inflows_reconciled 
  ON royalty_inflows(reconciled) WHERE reconciled = FALSE;

CREATE INDEX IF NOT EXISTS idx_financial_aggregates_project_period 
  ON financial_aggregates(project_id, period_type, period_start);
