-- Add wallet_address column to users_profile for storing connected wallet addresses
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS wallet_type TEXT;