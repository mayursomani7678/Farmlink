# Farmlink Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database credentials
npm run dev
# Backend runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

### 3. Database

```bash
# Create database
createdb farmlink

# Apply schema
psql -d farmlink -f backend/src/database/schema.sql
```

## 📝 Test Credentials

**FPO:**
- Email: `fpo@test.io`
- Password: `password123`
- Type: FPO

**Farmer:**
- Email: `farmer@test.io`
- Password: `password123`
- Type: Farmer

**Buyer:**
- Email: `buyer@test.io`
- Password: `password123`
- Type: Buyer

## 🔄 Workflow Steps

1. **Login as FPO** → Create farmer profile → Register crop
2. **Upload image** → System analyzes with YOLOv3 → Get image certificate
3. **Upload IoT CSV** → System parses sensor data → Get IoT certificate
4. **Generate grade** → Combine certificates → Final Grade
5. **Create listing** → Product appears in marketplace
6. **Login as Buyer** → Browse marketplace → Buy product
7. **Login as Farmer** → View transaction history → Check prices → See transparency

## 📁 Project Structure

```
backend/          Node.js API server
frontend/         React web app
docs/             Documentation (IoT CSV format)
README.md         Full project documentation
DEPLOYMENT.md     Production deployment guide
```

## 🔗 Important Files

- **Backend Routes:** `backend/src/routes/`
- **Frontend Pages:** `frontend/src/pages/`
- **Database Schema:** `backend/src/database/schema.sql`
- **API Services:** `frontend/src/services/api.js`

## 💾 IoT CSV Format

```csv
timestamp,mq2,mq4,mq6,mq135,temperature,humidity,ldr
2024-04-11T10:00:00Z,100.5,45.2,50.1,60.3,8.5,90.2,150
```

See [IOT_CSV_GUIDE.md](docs/IOT_CSV_GUIDE.md) for details.

## 🐛 Troubleshooting

**Port already in use:**
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection failed:**
```bash
psql -U postgres  # Test PostgreSQL
# Update DB credentials in .env
```

**CORS errors:**
- Check CORS_ORIGIN in backend
- Verify frontend URL matches

## 📊 System Components

- **YOLOv3 Analysis:** Image quality detection
- **IoT Parsing:** CSV sensor data processing
- **Grading Engine:** Combines AI + IoT scores
- **Marketplace:** Product listings + buying
- **Transparency:** Transaction history + pricing proof

## ✨ Key Features

✓ AI-powered image analysis  
✓ IoT sensor data integration  
✓ Automated grading system  
✓ Transparent pricing  
✓ End-to-end traceability  
✓ Role-based access (farmer/fpo/buyer)  

## 📞 Support

- See [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for codebase overview

---

**Happy farming! 🌾**
