-- Add demo_contract_address to projects table
-- contract_address = LIVE mode contract
-- demo_contract_address = DEMO mode contract
ALTER TABLE projects ADD COLUMN IF NOT EXISTS demo_contract_address TEXT;
