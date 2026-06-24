-- Migration 008: Add RPC functions for atomic increments to avoid race conditions

CREATE OR REPLACE FUNCTION increment_project_distributed(project_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET total_distributed = COALESCE(total_distributed, 0) + amount
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_holder_received(holder_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE rights_holders
  SET total_received = COALESCE(total_received, 0) + amount
  WHERE id = holder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
