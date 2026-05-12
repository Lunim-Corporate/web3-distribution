ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_id_fkey;
ALTER TABLE users_profile ALTER COLUMN id TYPE TEXT;
