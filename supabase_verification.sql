-- Supabase Schema Verification Script
-- Run this in the Supabase SQL Editor to ensure the necessary tables, columns, and RLS policies are active for the platform.

-- 1. Ensure `projects` table exists
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure `rights_holders` table exists and links to projects
CREATE TABLE IF NOT EXISTS public.rights_holders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id),
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  role TEXT,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_received NUMERIC(20,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ensure `revenue_transactions` exists for logging distributions
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id),
  tx_hash TEXT,
  total_amount NUMERIC(20,6) NOT NULL,
  source TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ensure `transaction_splits` exists for individual holder allocations
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.revenue_transactions(id) ON DELETE CASCADE,
  rights_holder_id UUID REFERENCES public.rights_holders(id),
  name TEXT NOT NULL,
  role TEXT,
  percentage NUMERIC(5,2) NOT NULL,
  amount_eth NUMERIC(20,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Validate missing columns (if any legacy schemas exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='revenue_transactions' AND column_name='source') THEN
        ALTER TABLE public.revenue_transactions ADD COLUMN source TEXT DEFAULT 'Direct Payment';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='status') THEN
        ALTER TABLE public.projects ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 6. Verify RLS (Optional, can be skipped for internal demo apps, but best practice)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

-- Note: Depending on your authentication, you might need policies. E.g.
-- CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);
