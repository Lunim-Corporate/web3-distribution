-- =============================================================
-- SUPABASE AUTH TRIGGER - Auto-create public.users on signup
-- =============================================================
-- Run this in Supabase SQL Editor to enable automatic user creation

-- Create a PL/pgSQL function to handle auth.users -> public.users sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'name')::text, NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'contributor')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to execute the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger is active
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Optional: Test the function (uncomment to run after deployment)
-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES (gen_random_uuid(), 'test@example.com', '{"name":"Test User","role":"creator"}');
