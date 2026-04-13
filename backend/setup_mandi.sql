-- Create mandi prices table
CREATE TABLE IF NOT EXISTS mandi_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_name VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  mandi_name VARCHAR(150) NOT NULL,
  state VARCHAR(50) NOT NULL,
  price_per_unit NUMERIC(10, 2) NOT NULL,
  min_price NUMERIC(10, 2),
  max_price NUMERIC(10, 2),
  avg_price NUMERIC(10, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  unit VARCHAR(20) DEFAULT 'kg',
  grade VARCHAR(10) DEFAULT 'A',
  supply_status VARCHAR(50) DEFAULT 'normal', -- normal, surplus, scarcity
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mandi_prices_commodity ON mandi_prices(commodity_name);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_location ON mandi_prices(state, mandi_name);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_timestamp ON mandi_prices(timestamp DESC);

-- Insert sample mandi price data for Indian market
INSERT INTO mandi_prices (commodity_name, variety, mandi_name, state, price_per_unit, min_price, max_price, avg_price, unit, grade, supply_status, timestamp)
VALUES 
-- Grapes - Maharashtra
('Grapes', 'Green', 'Lasalgaon Mandi', 'Maharashtra', 45.50, 40.00, 52.00, 45.50, 'kg', 'A', 'normal', NOW()),
('Grapes', 'Red', 'Lasalgaon Mandi', 'Maharashtra', 55.00, 48.00, 62.00, 55.00, 'kg', 'A', 'normal', NOW()),

-- Tomato - Multiple Mandis
('Tomato', 'Common', 'Vashi Mandi', 'Maharashtra', 18.50, 12.00, 25.00, 18.50, 'kg', 'B', 'normal', NOW()),
('Tomato', 'Common', 'Yerawada Mandi', 'Maharashtra', 19.00, 13.00, 26.00, 19.00, 'kg', 'B', 'normal', NOW()),
('Tomato', 'Common', 'Azadpur Mandi', 'Delhi', 20.50, 14.00, 28.00, 20.50, 'kg', 'B', 'surplus', NOW()),

-- Onion - Multiple Mandis
('Onion', 'White', 'Lasalgaon Mandi', 'Maharashtra', 25.00, 20.00, 32.00, 25.00, 'kg', 'A', 'normal', NOW()),
('Onion', 'White', 'Mandsaur Mandi', 'Madhya Pradesh', 26.50, 21.00, 34.00, 26.50, 'kg', 'A', 'normal', NOW()),
('Onion', 'Red', 'Bangalore Mandi', 'Karnataka', 28.00, 23.00, 35.00, 28.00, 'kg', 'A', 'scarcity', NOW()),

-- Potato - Multiple Mandis
('Potato', 'Red', 'Lasalgaon Mandi', 'Maharashtra', 22.50, 18.00, 28.00, 22.50, 'kg', 'B', 'normal', NOW()),
('Potato', 'Red', 'Agra Mandi', 'Uttar Pradesh', 20.00, 16.00, 26.00, 20.00, 'kg', 'B', 'surplus', NOW()),
('Potato', 'White', 'Renigunta Mandi', 'Andhra Pradesh', 23.00, 19.00, 29.00, 23.00, 'kg', 'B', 'normal', NOW()),

-- Banana
('Banana', 'Cavendish', 'Lasalgaon Mandi', 'Maharashtra', 35.00, 28.00, 42.00, 35.00, 'dozen', 'A', 'normal', NOW()),
('Banana', 'Cavendish', 'Bangalore Mandi', 'Karnataka', 38.00, 31.00, 45.00, 38.00, 'dozen', 'A', 'normal', NOW()),

-- Mango
('Mango', 'Alphonso', 'Ratnagiri Mandi', 'Maharashtra', 120.00, 100.00, 150.00, 120.00, 'kg', 'A', 'scarcity', NOW()),
('Mango', 'Kesar', 'Veraval Mandi', 'Gujarat', 95.00, 80.00, 120.00, 95.00, 'kg', 'A', 'normal', NOW()),

-- Apple
('Apple', 'Red Delicious', 'Srinagar Mandi', 'Jammu & Kashmir', 85.00, 70.00, 100.00, 85.00, 'kg', 'A', 'normal', NOW()),
('Apple', 'Golden', 'Shimla Mandi', 'Himachal Pradesh', 90.00, 75.00, 110.00, 90.00, 'kg', 'A', 'normal', NOW()),

-- Carrot
('Carrot', 'Orange', 'Lasalgaon Mandi', 'Maharashtra', 22.00, 18.00, 28.00, 22.00, 'kg', 'A', 'normal', NOW()),
('Carrot', 'Orange', 'Pune Mandi', 'Maharashtra', 23.50, 19.00, 30.00, 23.50, 'kg', 'A', 'normal', NOW()),

-- Cabbage
('Cabbage', 'Green', 'Vashi Mandi', 'Maharashtra', 15.00, 10.00, 20.00, 15.00, 'kg', 'B', 'surplus', NOW()),
('Cabbage', 'Green', 'Azadpur Mandi', 'Delhi', 16.50, 12.00, 22.00, 16.50, 'kg', 'B', 'normal', NOW()),

-- Cauliflower
('Cauliflower', 'White', 'Lasalgaon Mandi', 'Maharashtra', 28.00, 22.00, 35.00, 28.00, 'kg', 'A', 'normal', NOW()),
('Cauliflower', 'White', 'Pune Mandi', 'Maharashtra', 30.00, 24.00, 38.00, 30.00, 'kg', 'A', 'normal', NOW()),

-- Butter Milk/Milk
('Milk', 'Buffalo', 'Lasalgaon Mandi', 'Maharashtra', 35.00, 32.00, 40.00, 35.00, 'liter', 'A', 'normal', NOW()),
('Milk', 'Cow', 'Bangalore Mandi', 'Karnataka', 32.00, 28.00, 36.00, 32.00, 'liter', 'A', 'normal', NOW()),

-- Garlic
('Garlic', 'Local', 'Lasalgaon Mandi', 'Maharashtra', 150.00, 120.00, 180.00, 150.00, 'kg', 'A', 'normal', NOW()),
('Garlic', 'Local', 'Mahabaleshwar Mandi', 'Maharashtra', 155.00, 125.00, 185.00, 155.00, 'kg', 'A', 'normal', NOW()),

-- Ginger
('Ginger', 'Fresh', 'Lasalgaon Mandi', 'Maharashtra', 140.00, 110.00, 170.00, 140.00, 'kg', 'A', 'normal', NOW()),
('Ginger', 'Fresh', 'Calicut Mandi', 'Kerala', 145.00, 115.00, 175.00, 145.00, 'kg', 'A', 'normal', NOW());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mandi_prices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mandi_prices_timestamp_trigger ON mandi_prices;
CREATE TRIGGER update_mandi_prices_timestamp_trigger
BEFORE UPDATE ON mandi_prices
FOR EACH ROW
EXECUTE FUNCTION update_mandi_prices_timestamp();

-- Verify table creation
SELECT COUNT(*) as total_prices FROM mandi_prices;
