# Farmlink Project Structure

```
FARMLINK_PROJECT/
│
├── backend/                           # Node.js + Express Backend
│   ├── package.json                  # Dependencies
│   ├── .env.example                  # Environment template
│   ├── src/
│   │   ├── server.js                 # Express application entry
│   │   ├── config/
│   │   │   └── database.js          # PostgreSQL connection
│   │   ├── models/                   # Database models
│   │   │   ├── User.js
│   │   │   ├── Farmer.js
│   │   │   └── Crop.js
│   │   ├── services/                 # Business logic
│   │   │   ├── YOLOv3Service.js      # Image analysis
│   │   │   ├── IoTCertificateService.js # CSV parsing
│   │   │   ├── GradingService.js     # Grade generation
│   │   │   ├── MarketPriceService.js # Pricing
│   │   │   ├── ProductListingService.js
│   │   │   └── TransactionService.js # Purchases
│   │   ├── controllers/              # Request handlers
│   │   │   ├── AuthController.js
│   │   │   ├── FPOController.js
│   │   │   └── BuyerController.js
│   │   ├── routes/                   # API endpoints
│   │   │   ├── authRoutes.js
│   │   │   ├── fpoRoutes.js
│   │   │   ├── buyerRoutes.js
│   │   │   └── transparencyRoutes.js
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── fileUpload.js
│   │   ├── utils/                    # Utilities
│   │   │   └── auth.js
│   │   ├── python_scripts/           # ML integration
│   │   │   └── yolov3_detector.py
│   │   └── database/
│   │       └── schema.sql            # PostgreSQL schema
│   └── uploads/                      # Uploaded files (gitignored)
│
├── frontend/                         # React Frontend (SPA)
│   ├── package.json                 # Dependencies
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── src/
│   │   ├── index.js                 # React entry point
│   │   ├── App.jsx                  # Main app component
│   │   ├── services/
│   │   │   └── api.js               # API client
│   │   ├── context/
│   │   │   └── AuthContext.js       # Authentication state
│   │   ├── pages/
│   │   │   ├── AuthPages.jsx        # Login/Register
│   │   │   ├── FPOPages.jsx         # FPO Dashboard
│   │   │   └── BuyerPages.jsx       # Buyer Marketplace
│   │   ├── components/
│   │   │   ├── QualityAnalysis.jsx  # Image + IoT upload
│   │   │   └── Transparency.jsx     # Transaction history
│   │   └── styles/
│   │       ├── Global.css
│   │       ├── Auth.css
│   │       ├── FPODashboard.css
│   │       ├── BuyerMarketplace.css
│   │       ├── ImageUpload.css
│   │       └── Transparency.css
│   └── build/                       # Production build (gitignored)
│
├── docs/                            # Documentation
│   └── IOT_CSV_GUIDE.md            # IoT sensor data format
│
├── models/                          # ML models (gitignored)
│   ├── yolov3.weights              # YOLOv3 model file
│   ├── yolov3.cfg                  # YOLOv3 config
│   └── coco.names                  # COCO classes
│
├── .gitignore                       # Git ignore file
├── README.md                        # Main documentation
├── DEPLOYMENT.md                    # Deployment guide
└── LICENSE                          # MIT License

```

## Key Directories

### `/backend/src`
- **models/** - Data layer (CRUD operations)
- **services/** - Business logic (analysis, grading, pricing)
- **controllers/** - Request/response handling
- **routes/** - API endpoint definitions
- **middleware/** - Auth, error handling, file uploads
- **config/** - Database & environment setup

### `/frontend/src`
- **pages/** - Full page components (Auth, FPO, Buyer)
- **components/** - Reusable components (QualityAnalysis, Transparency)
- **services/** - API client & HTTP requests
- **context/** - Global state (Authentication)
- **styles/** - CSS stylesheets

### `/docs`
- **IOT_CSV_GUIDE.md** - Format for sensor data CSV files
- API documentation (inline in code)
- Deployment guides

## File Naming Conventions

- **Backend files:** PascalCase (UserModel.js, AuthService.js)
- **Frontend components:** PascalCase.jsx (AuthPages.jsx, Transparency.jsx)
- **Styles:** lowercase.css (auth.css, fpo-dashboard.css)
- **Routes:** pluralRoutes.js (authRoutes.js, fpoRoutes.js)

## Database Relationships

```
users (1) ──── (Many) fpos
             ──── (Many) farmers
             ──── (Many) buyers

farmers (1) ──── (Many) crops

crops (1) ──── (1) image_quality_certificates
             ──── (1) iot_quality_certificates
             ──── (1) grading_results
             ──── (Many) product_listings

product_listings (1) ──── (Many) transactions
                  ──── (1) grading_results

transactions (1) ──── (1) price_history
```

---

For more information, see [README.md](./README.md)
