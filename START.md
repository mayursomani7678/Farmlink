# 🚀 FARMLINK Project - Complete Starting Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Database Setup](#database-setup)
4. [Backend Setup & Run](#backend-setup--run)
5. [Frontend Setup & Run](#frontend-setup--run)
6. [Accessing the Application](#accessing-the-application)
7. [Test Credentials](#test-credentials)
8. [Checking Services](#checking-services)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Complete Startup Script](#complete-startup-script)

---

## 📦 Prerequisites

Before starting the project, ensure you have:

### System Requirements
- **macOS** (or Linux/Windows with adjustments)
- **Node.js** v14+ (Recommended: v16+)
- **npm** v6+ or **yarn**
- **PostgreSQL** 12+ (running locally or remote)
- **Python** 3.8+ (for image processing)
- **Git**

### Installation Check
```bash
# Check Node.js
node --version
# Should output: v16.0.0 or higher

# Check npm
npm --version
# Should output: 8.0.0 or higher

# Check PostgreSQL
psql --version
# Should output: psql (PostgreSQL) 12.0 or higher

# Check Python
python3 --version
# Should output: Python 3.8.0 or higher
```

---

## 📁 Project Structure

```
FARMLINK_PROJECT/
├── backend/                    # Node.js Express backend
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, rate limiting, etc.
│   │   ├── utils/             # Utilities (password validation, etc.)
│   │   ├── config/            # Configuration files
│   │   └── server.js          # Main server file
│   ├── .env                   # Environment variables (create this)
│   ├── package.json
│   └── README.md
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API calls
│   │   ├── context/          # React context (Auth, etc.)
│   │   ├── styles/           # CSS files
│   │   └── App.js            # Main app component
│   ├── .env                  # Environment variables (create this)
│   ├── package.json
│   └── README.md
│
├── START.md                    # ← This file (Project startup guide)
├── README.md
└── SECURITY_IMPLEMENTATION.md  # Security features documentation
```

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# In psql prompt:
CREATE DATABASE farmlink;
CREATE USER tapdiyaom WITH PASSWORD 'your_password';
ALTER ROLE tapdiyaom SET client_encoding TO 'utf8';
ALTER ROLE tapdiyaom SET default_transaction_isolation TO 'read committed';
ALTER ROLE tapdiyaom SET default_transaction_deferrable TO on;
ALTER ROLE tapdiyaom SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE farmlink TO tapdiyaom;
\q
```

### Step 2: Create Tables

```bash
# Navigate to backend
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend

# Run schema
psql -d farmlink -U tapdiyaom -f src/database/schema.sql

# Verify tables created
psql -d farmlink -U tapdiyaom -c "\dt"
```

### Step 3: Insert Initial Data (Optional)

```bash
# Insert Mandi prices
psql -d farmlink -U tapdiyaom << 'EOF'
INSERT INTO mandi_prices (crop_name, grade, price_per_kg, mandi_name, state) 
VALUES 
  ('Grapes', 'A', 55.00, 'Lasalgaon Mandi', 'Maharashtra'),
  ('Grapes', 'B', 30.00, 'Lasalgaon Mandi', 'Maharashtra'),
  ('Grapes', 'C', 15.00, 'Lasalgaon Mandi', 'Maharashtra')
ON CONFLICT DO NOTHING;

SELECT * FROM mandi_prices WHERE crop_name = 'Grapes';
EOF
```

---

## 🔧 Backend Setup & Run

### Step 1: Navigate to Backend Directory

```bash
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend
```

### Step 2: Create Environment File

```bash
# Create .env file in backend directory
cat > .env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=farmlink
DB_USER=tapdiyaom
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRATION=86400

# Application
APP_NAME=Farmlink
APP_VERSION=1.0.0

# File Upload
UPLOAD_DIR=./uploads
ALLOWED_FILE_SIZES=10485760

# Log Level
LOG_LEVEL=debug

# Security Headers
HELMET_ENABLED=true

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
```

### Step 3: Install Dependencies

```bash
# Install packages
npm install

# Verify installation
npm list
```

### Step 4: Start Backend Server

```bash
# Option 1: Development mode (with nodemon auto-restart)
npm run dev

# Option 2: Production mode
npm start

# Expected output:
# 🚀 Farmlink Backend is running on port 5000
# 🔗 Database connected successfully
# ✅ Server started
```

### Step 5: Verify Backend

```bash
# In a new terminal, check health endpoint
curl -s http://localhost:5000/health | jq .

# Expected response:
# {
#   "status": "Farmlink Backend is running",
#   "timestamp": "2026-04-12T10:30:00.000Z"
# }
```

---

## ⚛️ Frontend Setup & Run

### Step 1: Navigate to Frontend Directory

```bash
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/frontend
```

### Step 2: Create Environment File

```bash
# Create .env file in frontend directory
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_ENV=development
EOF
```

### Step 3: Install Dependencies

```bash
# Install packages
npm install

# Clear cache if needed
npm cache clean --force
npm install
```

### Step 4: Start Frontend Server

```bash
# Start development server
npm start

# Expected output:
# Compiled successfully!
# 
# You can now view farmlink-frontend in the browser.
#   Local:            http://localhost:3000
#   On Your Network:  http://192.168.1.15:3000
```

### Step 5: Verify Frontend

```bash
# In a new terminal, check if frontend is accessible
curl -s http://localhost:3000 | head -5

# Application opens automatically at: http://localhost:3000
```

---

## 🌐 Accessing the Application

### URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000/api | REST API endpoints |
| **Health Check** | http://localhost:5000/health | Backend health |
| **Database** | localhost:5432 | PostgreSQL server |

### First Time Access

1. **Open Browser**: http://localhost:3000
2. **You'll see**: Login/Register page
3. **Click**: "Register here" link (bottom of login form)
4. **Create Account**: Fill in registration form
   - Email: `myemail@example.com`
   - Password: `MyPassword123!@#` (min 8 chars, uppercase, lowercase, number, special)
   - Confirm Password: `MyPassword123!@#` (must match)
   - Full Name: `My Name`
   - Account Type: Choose `FPO` or `Buyer`
5. **Register**: Click "✅ Register" button
6. **Success**: Redirected to dashboard

---

## 🔑 Test Credentials

### Pre-created Test Users

#### FPO Account
```
Email: omtapdiya75@gmail.com
Password: om123@&123
Role: FPO Operator
Features: Create farmers, manage crops, grade products
```

#### Buyer Account
```
Email: ramtapdiya76@gmail.com
Password: ram123@&123
Role: Buyer
Features: Browse marketplace, purchase crops
```

### Create New Test Users

**Register with Frontend UI:**
- Go to http://localhost:3000/register
- Fill all fields
- Passwords must match and be strong (min 8 chars, uppercase, lowercase, number, special)
- Submit

**Or via cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!@#",
    "confirmPassword": "TestPass123!@#",
    "fullName": "Test User",
    "userType": "fpo",
    "phone": "9876543210",
    "location": "Test Location"
  }' | jq .
```

---

## ✅ Checking Services

### Check if Backend is Running

```bash
# Method 1: Health endpoint
curl -s http://localhost:5000/health | jq .

# Method 2: Check port
lsof -i :5000

# Method 3: Check process
ps aux | grep "node\|npm"
```

### Check if Frontend is Running

```bash
# Method 1: Test connection
curl -s http://localhost:3000 | head -10

# Method 2: Check port
lsof -i :3000

# Method 3: Check process
ps aux | grep "node\|npm"
```

### Check Database Connection

```bash
# Connect to database
psql -d farmlink -U tapdiyaom

# List tables
\dt

# Query users
SELECT * FROM users;

# Exit
\q
```

---

## 🔄 Stop/Restart Services

### Stop Backend

```bash
# Method 1: Force kill
lsof -ti :5000 | xargs kill -9

# Method 2: If running in terminal
# Press Ctrl+C
```

### Stop Frontend

```bash
# Method 1: Force kill
lsof -ti :3000 | xargs kill -9

# Method 2: If running in terminal
# Press Ctrl+C
```

### Restart Both Services

```bash
# Kill both
lsof -ti :5000 | xargs kill -9 2>/dev/null
lsof -ti :3000 | xargs kill -9 2>/dev/null

# Wait
sleep 2

# Start backend
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend && npm start &

# Wait
sleep 3

# Start frontend
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/frontend && npm start &
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill process using port 5000
lsof -ti :5000 | xargs kill -9

# Or change port in .env and restart
PORT=5001 npm start
```

---

### Issue 2: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# If not running, start it
# On macOS with Homebrew:
brew services start postgresql

# Verify connection
psql -U tapdiyaom -d farmlink
```

---

### Issue 3: Dependencies Installation Failed

**Error**: `npm ERR! Could not resolve dependency`

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

---

### Issue 4: Frontend Not Connecting to Backend

**Error**: `ECONNREFUSED` or `Network Error`

**Solution**:
```bash
# Check backend is running
curl http://localhost:5000/health

# Check frontend .env REACT_APP_API_URL points to backend
cat .env | grep REACT_APP_API_URL

# Rebuild frontend
rm -rf node_modules/.cache
npm start
```

---

### Issue 5: Password Confirmation Not Working

**Error**: "Passwords do not match" when they should match

**Solution**:
- Check for leading/trailing spaces
- Ensure both fields have exact same characters
- Check Caps Lock is off
- Try clearing and re-entering password

---

### Issue 6: Email Already Registered but User Doesn't Exist

**Error**: "Email already registered" when trying new email

**Solution**:
```bash
# Check database for email
psql -d farmlink -U tapdiyaom -c "SELECT email FROM users WHERE email = 'your@email.com';"

# If found, delete it
psql -d farmlink -U tapdiyaom -c "DELETE FROM users WHERE email = 'your@email.com';"

# Try registering again
```

---

### Issue 7: "npm start" Stuck or Not Responding

**Error**: Frontend/Backend won't start or hangs

**Solution**:
```bash
# Kill the process
lsof -ti :3000 | xargs kill -9
lsof -ti :5000 | xargs kill -9

# Wait 2 seconds
sleep 2

# Start fresh
cd backend && npm start

# In another terminal
cd frontend && npm start
```

---

## 📜 Complete Startup Script

Save this as `startup.sh` in project root for one-command startup:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 FARMLINK Project Startup${NC}"
echo "================================"

# Kill existing processes
echo -e "${YELLOW}🛑 Killing existing processes...${NC}"
lsof -ti :5000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Check database
echo -e "${YELLOW}🔍 Checking database...${NC}"
if ! psql -d farmlink -U tapdiyaom -c "SELECT 1" 2>/dev/null; then
  echo -e "${RED}❌ Database not accessible${NC}"
  echo "Please ensure PostgreSQL is running and database 'farmlink' exists"
  exit 1
fi
echo -e "${GREEN}✅ Database OK${NC}"

# Start backend
echo -e "${YELLOW}🔧 Starting backend...${NC}"
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend
npm start 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 5

# Check backend health
if curl -s http://localhost:5000/health > /dev/null; then
  echo -e "${GREEN}✅ Backend is responding${NC}"
else
  echo -e "${RED}⚠️  Backend not responding yet, continuing anyway...${NC}"
fi

# Start frontend
echo -e "${YELLOW}⚛️  Starting frontend...${NC}"
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/frontend
npm start 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to compile
sleep 10

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FARMLINK is running!${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo -e "📱 Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "🔌 Backend:  ${YELLOW}http://localhost:5000${NC}"
echo -e "💾 Database: ${YELLOW}localhost:5432${NC}"
echo ""
echo -e "🔑 Test FPO Account:"
echo -e "   Email: ${YELLOW}omtapdiya75@gmail.com${NC}"
echo -e "   Pass:  ${YELLOW}om123@&123${NC}"
echo ""
echo -e "🔑 Test Buyer Account:"
echo -e "   Email: ${YELLOW}ramtapdiya76@gmail.com${NC}"
echo -e "   Pass:  ${YELLOW}ram123@&123${NC}"
echo ""
echo -e "Press Ctrl+C to stop both services"
echo ""

# Wait for background processes
wait
```

### How to Use Startup Script

```bash
# Make it executable
chmod +x startup.sh

# Run it
./startup.sh

# To stop services
# Press Ctrl+C

# Or in another terminal
lsof -ti :5000 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

---

## 📊 Project Status Checklist

After starting, verify everything is working:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Database connected
- [ ] Can access http://localhost:3000
- [ ] Can register new account
- [ ] Can login with test credentials
- [ ] Password confirmation working
- [ ] Email uniqueness enforced
- [ ] Can navigate between pages
- [ ] All features accessible

---

## 📞 Quick Commands Reference

```bash
# Navigate to backend
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend

# Navigate to frontend
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/frontend

# Start backend (development)
npm run dev

# Start backend (production)
npm start

# Start frontend
npm start

# Install dependencies
npm install

# Check running ports
lsof -i :5000
lsof -i :3000

# Kill process on port 5000
lsof -ti :5000 | xargs kill -9

# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Check PostgreSQL running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Connect to database
psql -d farmlink -U tapdiyaom

# View all users
psql -d farmlink -U tapdiyaom -c "SELECT * FROM users;"

# Clear npm cache
npm cache clean --force

# Test backend health
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000
```

---

## 🎯 First Steps After Starting

1. **Open Browser**: http://localhost:3000
2. **Register Account**: Click "Register here"
3. **Fill Form**:
   - Email: `yourname@example.com`
   - Password: `MyPassword123!@#`
   - Confirm: `MyPassword123!@#`
   - Full Name: `Your Name`
   - Account Type: Select `FPO` or `Buyer`
4. **Submit**: Click "✅ Register"
5. **Explore**: Navigate through the dashboard

---

## 📚 Documentation Files

- **START.md** ← You are here (Project startup guide)
- **[README.md](README.md)** - Project overview
- **[SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)** - Security features
- **[SECURITY_TEST_GUIDE.md](SECURITY_TEST_GUIDE.md)** - Testing security features

---

## 🔒 Security Notes

✅ **Passwords**:
- Minimum 8 characters
- Must contain uppercase, lowercase, number, special character
- Confirmed during registration
- Hashed with bcrypt before storage

✅ **Email**:
- Unique per user
- Cannot be registered twice
- Validated for format

✅ **Rate Limiting**:
- 3 registration attempts per hour
- Prevents brute force attacks

✅ **HTTPS Ready**:
- Production uses HTTPS only
- Security headers configured

---

## ✨ Features Available

### For FPO:
- ✅ Create and manage farmers
- ✅ View farm plots and crops
- ✅ Upload and grade crop images
- ✅ Monitor crop quality (IoT sensors)
- ✅ Manage marketplace listings
- ✅ View payment transactions
- ✅ Mark payments as distributed

### For Buyers:
- ✅ Browse marketplace listings
- ✅ Purchase crops from FPO
- ✅ View transaction history
- ✅ Track spending and wallet balance
- ✅ View product grades and quality certifications

---

## 🆘 Need Help?

1. **Check logs**: Look at terminal output for error messages
2. **Run health check**: `curl http://localhost:5000/health`
3. **Verify database**: `psql -d farmlink -U tapdiyaom -c "SELECT 1;"`
4. **Check ports**: `lsof -i :5000` and `lsof -i :3000`
5. **Review error messages**: Most errors include helpful hints

---

## 📝 Notes

- Always start **backend first**, then **frontend**
- Backend should respond before starting frontend
- Keep both terminals open to see logs
- Don't close terminals otherwise services will stop
- Use `Ctrl+C` to gracefully stop services

---

## 🚀 You're Ready!

Everything is set up. Now:

1. Open http://localhost:3000
2. Create an account or login with test credentials
3. Explore the application
4. Try all features
5. Report any issues

**Happy farming! 🌾**

---

**Last Updated**: April 12, 2026
**Version**: 1.0.0
**Status**: 🟢 Production Ready
