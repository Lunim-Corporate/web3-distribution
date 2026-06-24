-- Migration 007: Add eth_price_at_tx to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS eth_price_at_tx NUMERIC(20,8);
