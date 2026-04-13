-- Add verification status to product_listings
ALTER TABLE product_listings 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Create enum for verification status if not exists
DO $$ BEGIN
  CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected', 'available');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update verification_status column to use enum
ALTER TABLE product_listings 
ALTER COLUMN verification_status TYPE verification_status_enum USING 
  CASE 
    WHEN verification_status = 'pending' THEN 'pending'::verification_status_enum
    WHEN verification_status = 'verified' THEN 'verified'::verification_status_enum
    WHEN verification_status = 'rejected' THEN 'rejected'::verification_status_enum
    ELSE 'available'::verification_status_enum
  END;

-- Add advance payment tracking to purchases
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_to_pay DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_stage VARCHAR(50) DEFAULT 'full_purchase',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_listings_verification_status ON product_listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_stage ON purchases(payment_stage);
