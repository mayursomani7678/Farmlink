-- Fix Marketplace Schema Issues
-- This migration adds missing tables and columns for marketplace/purchase functionality

-- 1. Add missing columns to product_listings table
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'available';

-- 2. Create buyer_wallets table
CREATE TABLE IF NOT EXISTS buyer_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL UNIQUE REFERENCES buyers(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 100000,
  total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create escrow_accounts table
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'held', -- held, released, refunded
  released_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create purchases table (alternative to transactions for buyer flow)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  listing_id UUID NOT NULL REFERENCES product_listings(id),
  farm_id UUID NOT NULL REFERENCES farmers(id),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  quantity DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, cancelled
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create farmer_payments table (if not exists - used for FPO payments to farmers)
CREATE TABLE IF NOT EXISTS farmer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  purchase_id UUID REFERENCES purchases(id),
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled
  paid_at TIMESTAMP,
  given_at TIMESTAMP,
  given_by_fpo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_buyer_wallets_buyer_id ON buyer_wallets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_listing_id ON purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_fpo_id ON purchases(fpo_id);
CREATE INDEX IF NOT EXISTS idx_purchases_farm_id ON purchases(farm_id);
CREATE INDEX IF NOT EXISTS idx_farmer_payments_farmer_id ON farmer_payments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_payments_status ON farmer_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_transaction_id ON escrow_accounts(transaction_id);

-- 7. Create indexes on product_listings for marketplace queries
CREATE INDEX IF NOT EXISTS idx_product_listings_verification_status ON product_listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_product_listings_price_per_kg ON product_listings(price_per_kg);
CREATE INDEX IF NOT EXISTS idx_product_listings_fpo_id ON product_listings(fpo_id);
