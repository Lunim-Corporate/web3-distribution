-- Migration 009: Add RPC function to look up user ID by email securely and efficiently

CREATE OR REPLACE FUNCTION get_user_id_by_email(email_address TEXT)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id::UUID FROM auth.users au
  WHERE au.email = email_address
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
