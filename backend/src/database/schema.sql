-- Create ENUM types
CREATE TYPE user_type_enum AS ENUM ('farmer', 'fpo', 'buyer');
CREATE TYPE grade_enum AS ENUM ('A', 'B', 'C');
CREATE TYPE listing_status_enum AS ENUM ('available', 'reserved', 'sold', 'expired');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE industry_type_enum AS ENUM ('factory', 'wholesaler', 'retailer');

-- Users Table (FPO Operators, Buyers only - Farmers created by FPO)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  user_type user_type_enum NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FPO Table
CREATE TABLE IF NOT EXISTS fpos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(255) UNIQUE,
  certification_status VARCHAR(50),
  total_farmers INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmers Table (Created by FPO, no user account needed)
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  farmer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  plot_size DECIMAL(10, 2),
  plot_location VARCHAR(255),
  plot_gps_lat DECIMAL(10, 8),
  plot_gps_lon DECIMAL(11, 8),
  years_of_experience INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops Table
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  crop_type VARCHAR(100) NOT NULL,
  planting_date DATE,
  expected_harvest_date DATE,
  estimated_quantity DECIMAL(10, 2),
  quantity_unit VARCHAR(50) DEFAULT 'kg',
  variety VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image-Based Quality Certificates
CREATE TABLE IF NOT EXISTS image_quality_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id),
  image_path VARCHAR(255) NOT NULL,
  image_hash VARCHAR(255) UNIQUE,
  detection_results JSONB,
  spoilage_percentage DECIMAL(5, 2),
  freshness_score DECIMAL(3, 2),
  color_texture_score DECIMAL(3, 2),
  overall_quality_score DECIMAL(3, 2),
  grade grade_enum NOT NULL,
  model_version VARCHAR(50),
  processing_time_ms INTEGER,
  confidence_scores JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IoT Quality Certificates
CREATE TABLE IF NOT EXISTS iot_quality_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id),
  csv_file_path VARCHAR(255),
  sensor_type VARCHAR(100),
  mq2_value DECIMAL(10, 2),
  mq4_value DECIMAL(10, 2),
  mq6_value DECIMAL(10, 2),
  mq135_value DECIMAL(10, 2),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  ldr_light_level DECIMAL(5, 2),
  environmental_quality_score DECIMAL(3, 2),
  grade grade_enum NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- IoT Devices (Real-time sensor devices)
CREATE TABLE IF NOT EXISTS iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id),
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100) DEFAULT 'environmental_sensor',
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(255),
  last_reading_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time IoT Sensor Readings
CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES iot_devices(id),
  crop_id UUID NOT NULL REFERENCES crops(id),
  mq2_value DECIMAL(10, 2),
  mq4_value DECIMAL(10, 2),
  mq6_value DECIMAL(10, 2),
  mq135_value DECIMAL(10, 2),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  ldr_light_level DECIMAL(5, 2),
  raw_data JSONB,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Final Grading Results
CREATE TABLE IF NOT EXISTS grading_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id),
  image_cert_id UUID REFERENCES image_quality_certificates(id),
  iot_cert_id UUID REFERENCES iot_quality_certificates(id),
  image_grade grade_enum,
  iot_grade grade_enum,
  image_weight DECIMAL(3, 2) DEFAULT 0.7,
  iot_weight DECIMAL(3, 2) DEFAULT 0.3,
  final_grade grade_enum NOT NULL,
  final_score DECIMAL(3, 2),
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Listings
CREATE TABLE IF NOT EXISTS product_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crops(id),
  grading_result_id UUID NOT NULL REFERENCES grading_results(id),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  quantity DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(50) DEFAULT 'kg',
  grade grade_enum NOT NULL,
  status listing_status_enum DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Market Prices
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type VARCHAR(100) NOT NULL,
  grade grade_enum NOT NULL,
  base_price DECIMAL(10, 2),
  grade_a_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  grade_b_multiplier DECIMAL(3, 2) DEFAULT 0.8,
  grade_c_multiplier DECIMAL(3, 2) DEFAULT 0.6,
  mandi_reference_price DECIMAL(10, 2),
  market_api_source VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_listing_id UUID NOT NULL REFERENCES product_listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  quantity_sold DECIMAL(10, 2) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  grade grade_enum NOT NULL,
  transaction_status transaction_status_enum DEFAULT 'completed',
  payment_method VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  delivery_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer Profiles
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  industry_type industry_type_enum,
  registration_number VARCHAR(255) UNIQUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price History for Transparency
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  crop_type VARCHAR(100) NOT NULL,
  grade grade_enum NOT NULL,
  price_received DECIMAL(10, 2) NOT NULL,
  market_price_at_time DECIMAL(10, 2),
  fpo_margin DECIMAL(10, 2),
  transparency_score DECIMAL(3, 2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FPO Farmer Payments (Direct payments from FPO to farmer)
CREATE TABLE IF NOT EXISTS fpo_farmer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID NOT NULL REFERENCES fpos(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reference_number VARCHAR(100),
  paid_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_farmers_fpo_id ON farmers(fpo_id);
CREATE INDEX idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX idx_product_listings_status ON product_listings(status);
CREATE INDEX idx_product_listings_grade ON product_listings(grade);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_status ON transactions(transaction_status);
CREATE INDEX idx_price_history_farmer_id ON price_history(farmer_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_iot_devices_crop_id ON iot_devices(crop_id);
CREATE INDEX idx_iot_sensor_readings_device_id ON iot_sensor_readings(device_id);
CREATE INDEX idx_iot_sensor_readings_crop_id ON iot_sensor_readings(crop_id);
CREATE INDEX idx_iot_sensor_readings_timestamp ON iot_sensor_readings(received_at DESC);
CREATE INDEX idx_fpo_farmer_payments_fpo_id ON fpo_farmer_payments(fpo_id);
CREATE INDEX idx_fpo_farmer_payments_farmer_id ON fpo_farmer_payments(farmer_id);
CREATE INDEX idx_fpo_farmer_payments_status ON fpo_farmer_payments(status);
