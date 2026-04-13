# 🔧 Farmlink Installation & Deployment Guide

## Local Development Setup

### Step 1: Clone & Setup Project

```bash
cd /path/to/FARMLINK_PROJECT

# Create necessary directories
mkdir -p uploads certificates models
chmod 755 uploads certificates
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database and user
psql -U postgres << EOF
CREATE DATABASE farmlink;
CREATE USER farmlink_user WITH PASSWORD 'secure_password';
ALTER ROLE farmlink_user SET client_encoding TO 'utf8';
ALTER ROLE farmlink_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE farmlink_user SET default_transaction_deferrable TO on;
ALTER ROLE farmlink_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE farmlink TO farmlink_user;
EOF

# Apply schema
psql -U postgres -d farmlink -f backend/src/database/schema.sql
```

### Step 3: Backend Installation

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit configuration

# Download YOLOv3 model (optional, or use mock)
mkdir -p models
# Download from: https://pjreddie.com/darknet/yolo/

# Start server
npm run dev
```

**Backend should run on:** `http://localhost:5000`

### Step 4: Frontend Installation

```bash
cd frontend

# Install dependencies
npm install

# Create .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

**Frontend should run on:** `http://localhost:3000`

## Testing Workflows

### 1. Register Users

**FPO User:**
```
Email: fpo@farmlink.io
Password: password123
Name: FPO Manager
Type: FPO
```

**Farmer User:**
```
Email: farmer@farmlink.io
Password: password123
Name: Ashok Kumar
Type: Farmer
```

**Buyer User:**
```
Email: buyer@farmlink.io
Password: password123
Name: Grape Factory
Type: Buyer
```

### 2. Create Test Data

**As FPO, create farmer:**
```json
POST /api/fpo/farmers?fpoId=<fpo_id>
{
  "farmerName": "Ram Kumar",
  "plotSize": 2.5,
  "plotLocation": "Nashik, Maharashtra",
  "plotLat": 19.5941,
  "plotLon": 73.7980,
  "yearsOfExperience": 15
}
```

**Create crop:**
```json
POST /api/fpo/crops
{
  "farmerId": "<farmer_id>",
  "cropType": "grapes",
  "plantingDate": "2024-01-15",
  "expectedHarvestDate": "2024-04-15",
  "estimatedQuantity": 5000,
  "variety": "Sonaka"
}
```

### 3. Analyze Grape Image

```bash
# Upload image via FPO Dashboard
# System will use YOLOv3 to generate image certificate
```

### 4. Upload IoT Data

**CSV Format:**
```csv
timestamp,mq2,mq4,mq6,mq135,temperature,humidity,ldr
2024-04-11T10:00:00Z,100.5,45.2,50.1,60.3,8.5,90.2,150
2024-04-11T10:15:00Z,101.2,44.8,51.3,59.8,8.3,91.1,140
```

### 5. Generate Grade

```json
POST /api/fpo/generate-grade
{
  "cropId": "<crop_id>",
  "imageCertificateId": "<image_cert_id>",
  "iotCertificateId": "<iot_cert_id>"
}
```

### 6. Create Listing

```json
POST /api/fpo/listings
{
  "cropId": "<crop_id>",
  "quantity": 500,
  "fpoId": "<fpo_id>"
}
```

### 7. Browse as Buyer

- Login as buyer
- Browse marketplace
- View product details with certificates
- Check farmer reputation and transparency

## Production Deployment

### Server Requirements

- **OS:** Ubuntu 20.04 LTS or similar
- **CPU:** 4 cores minimum
- **RAM:** 8GB minimum
- **Storage:** 100GB SSD
- **Database:** PostgreSQL 12+

### Deploy with Docker

**Dockerfile (Backend):**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY backend/package.json .
RUN npm install --production

COPY backend/src src/
COPY backend/.env .env

EXPOSE 5000
CMD ["node", "src/server.js"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/src src/
COPY frontend/public public/
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: farmlink
      POSTGRES_USER: farmlink_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: farmlink
      DB_USER: farmlink_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./certificates:/app/certificates

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### Deploy to AWS EC2

```bash
# SSH into instance
ssh -i key.pem ubuntu@instance-ip

# Clone repository
git clone https://github.com/your-repo/farmlink.git
cd farmlink

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create .env
nano .env  # Add configuration

# Deploy
sudo docker-compose up -d

# Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

### Environment Variables for Production

```bash
# Database
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=farmlink
DB_USER=farmlink_user
DB_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<your-secret-key>

# Application
NODE_ENV=production
PORT=5000

# API Keys
MANDI_API_KEY=<your-mandi-api-key>
MARKET_PRICE_API=https://api.example.com/prices

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Monitoring & Logging

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Monitor performance
docker stats

# Backup database
pg_dump -U farmlink_user -d farmlink > backup.sql
```

## Performance Optimization

### Database Indexing
All critical indexes are created in schema.sql

### Caching Strategy
- Implement Redis for session storage
- Cache market prices (1-hour TTL)
- Cache marketplace listings (5-minute TTL)

### Image Optimization
- Compress images using Sharp before storage
- Store thumbnails for preview
- Use CDN for image delivery

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL running
psql -U farmlink_user -d farmlink -c "SELECT version();"

# Reset password
psql -U postgres -c "ALTER USER farmlink_user WITH PASSWORD 'new_password';"
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### CORS Errors
- Check CORS_ORIGIN matches frontend URL
- Verify backend is accessible from frontend origin

### Image Analysis Failing
- Verify YOLOv3 model files present
- Check Python and dependencies installed
- Run test: `python3 src/python_scripts/yolov3_detector.py test.jpg`

## CI/CD Pipeline Setup

### GitHub Actions Example

```yaml
name: Deploy Farmlink

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build & Test Backend
        run: |
          cd backend
          npm install
          npm test
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to AWS
        run: |
          # Add deployment script
```

---

**For support, visit:** [Farmlink Documentation](/)
