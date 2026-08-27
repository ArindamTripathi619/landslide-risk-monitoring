# 🏔️ AI-Based Landslide Risk Monitoring System — NER

**SIH 2026 | Problem Statement ID: 26001**
Ministry of Development of North Eastern Region (MDoNER)

## Overview

An AI-powered early warning and monitoring platform for predicting and tracking landslide-prone areas in real time across the North Eastern Region of India.

## Features

- **AI/ML Risk Prediction** — XGBoost model predicts landslide susceptibility (80% accuracy)
- **GIS Dashboard** — Real-time Leaflet.js heatmaps with click-to-predict anywhere on map
- **Mobile Field Reporting** — Geo-tagged photo/video upload of cracks, slope movements, blocked roads
- **Early Warning System** — Multi-channel alerts (in-app, SMS, dashboard) with multilingual support
- **Offline-First Mobile** — Queue and sync for low-network remote areas
- **Real-time Updates** — Socket.IO district-scoped event broadcasting

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js, Express, MongoDB, Socket.IO |
| ML Service | Python, FastAPI, XGBoost, scikit-learn |
| Admin Dashboard | React 19, TypeScript, MUI, Leaflet.js |
| Mobile App | React Native, TypeScript |
| Database | MongoDB + GeoJSON 2dsphere indexes |
| Real-time | Socket.IO |
| GIS | Leaflet.js + OpenStreetMap |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- Python >= 3.10
- Docker (for MongoDB) or local MongoDB

### Option A: Docker (Recommended)
```bash
# Start MongoDB
docker run -d --name landslide-mongo -p 27017:27017 mongo:7

# Start ML Service (port 8001 — port 8000 may be in use)
cd ml-service && source venv/bin/activate
uvicorn api.main:app --reload --port 8001

# Start Backend (port 5000)
cd backend && npm install && node server.js

# Seed database
cd backend && node scripts/seed.js

# Start Dashboard (port 3000)
cd frontend/admin-dashboard && npm install && npm start
```

### Option B: Demo Startup (Recommended for Presentation)
```bash
./demo.sh               # Start all services + show credentials + demo flow
./demo.sh --status      # Check what's running
./demo.sh --stop        # Stop everything
```

### Option C: One-Command Launcher
```bash
./start.sh              # Start all services locally
./start.sh --docker     # Start with Docker Compose
./start.sh --seed       # Seed database only
./start.sh --train      # Retrain ML model
./start.sh --stop       # Stop Docker services
```

### Seed Database
```bash
cd backend
node scripts/seed.js
# Creates: 15 users, 125 risk zones, 37 weather records,
#          47 alerts, 55 landslide events, 29 field reports
```

### Retrain ML Model
```bash
cd ml-service && source venv/bin/activate
python scripts/prepare_datasets.py   # Process raw Kaggle data
python scripts/train_model.py        # Train XGBoost (~80% accuracy)
```

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@landslide.gov.in | admin123 |
| District Admin | rajesh@kamrup.gov.in | admin123 |
| Field Officer | bikram@field.gov.in | officer123 |
| Villager | haren@citizen.gov.in | citizen123 |

## 📊 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login | No |
| GET | /api/risk-zones | All risk zones (GIS) | Yes |
| GET | /api/risk-zones/:district | District risk zones | Yes |
| POST | /api/predict/:lat/:lng | AI risk prediction | Yes |
| GET | /api/weather/:district | Weather data | Yes |
| GET | /api/events | Landslide events | Yes |
| GET | /api/dashboard/stats | Dashboard statistics | Yes |
| POST | /api/alerts | Issue alert | Yes (admin) |
| GET | /api/alerts | List alerts | Yes |
| GET | /api/alerts/active | Active alerts only | Yes |
| POST | /api/field-reports | Submit field report | Yes |
| POST | /api/simulate/landslide | Simulate landslide event | Yes (admin) |
| POST | /api/simulate/batch | Generate batch events | Yes (admin) |
| POST | /api/simulate/field-report | Simulate citizen report | Yes |

## 📁 Project Structure

```
landslide-risk-monitoring/
├── backend/                        # Node.js API server (18 source files)
│   ├── config/database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                 # JWT auth + role-based access
│   │   ├── rateLimiter.js          # Rate limiting (API, Auth, Alerts)
│   │   └── validation.js           # Input validation (express-validator)
│   ├── models/                     # 6 Mongoose models
│   │   ├── User.js                 # Users with NER roles
│   │   ├── RiskZone.js             # GIS risk zones (GeoJSON)
│   │   ├── WeatherData.js          # IMD weather data
│   │   ├── LandslideEvent.js       # Historical/real-time events
│   │   ├── FieldReport.js          # Citizen geo-tagged reports
│   │   └── Alert.js                # Multilingual early warnings
│   ├── routes/                     # auth, riskZones, alerts, simulation
│   ├── scripts/seed.js             # Database seeder (demo data)
│   ├── services/
│   │   ├── predictionService.js    # Calls ML service + rule fallback
│   │   └── weatherService.js       # IMD API integration
│   ├── socket/socketHandler.js     # District-scoped real-time events
│   ├── tests/api.test.js           # 16 API tests (auth, alerts, validation)
│   └── server.js                   # Express + Socket.IO entry point
├── ml-service/                     # Python ML microservice
│   ├── api/main.py                 # FastAPI with /predict, /train
│   ├── api/schemas.py              # Pydantic request/response models
│   ├── utils/model.py              # XGBoost + rule-based fallback
│   ├── utils/data_preprocessing.py # Data loading + feature engineering
│   ├── scripts/
│   │   ├── prepare_datasets.py     # Process Kaggle raw data
│   │   ├── train_model.py          # Train XGBoost model
│   │   └── download_ndvi.py        # NDVI acquisition (MODIS/Sentinel)
│   ├── data/raw/                   # Downloaded Kaggle datasets
│   ├── data/processed/             # Cleaned + merged training data
│   └── models/trained/             # Trained XGBoost model (.pkl)
├── frontend/admin-dashboard/       # React + Leaflet.js GIS dashboard
│   └── src/
│       ├── components/
│       │   ├── Layout.tsx          # Shared responsive sidebar + notification badges
│       │   └── ErrorBoundary.tsx   # Crash recovery UI
│       ├── pages/
│       │   ├── LoginPage.tsx       # Auth
│       │   ├── DashboardPage.tsx   # Stats + alerts + risk summary + DEMO CONTROLS
│       │   ├── MapPage.tsx         # GIS heatmap + click-to-predict + GeoJSON/CSV export
│       │   ├── AlertsPage.tsx      # Issue/resolve + timeline view toggle
│       │   └── ReportsPage.tsx     # View citizen field reports
│       └── services/api.ts         # Backend + ML API client (port 8001)
├── mobile/LandslideAlertApp/       # React Native mobile app (14 files)
│   ├── App.tsx                     # Bottom tab navigation (4 tabs)
│   └── src/
│       ├── screens/
│       │   ├── DashboardScreen.tsx # Alerts + weather + stats
│       │   ├── ReportScreen.tsx    # 3-step wizard + offline queue
│       │   ├── AlertsScreen.tsx    # View + acknowledge alerts
│       │   ├── ProfileScreen.tsx   # Language switcher + settings
│       │   └── LoginScreen.tsx     # Auth
│       ├── services/
│       │   ├── api.ts              # REST client
│       │   ├── socketService.ts    # Real-time Socket.IO
│       │   ├── offlineQueue.ts     # Offline report queue + auto-sync
│       │   └── translations.ts     # i18n (EN, AS, BN, HI, NE)
│       └── types/index.ts          # TypeScript types
├── .github/workflows/ci.yml       # GitHub Actions CI
├── docker-compose.yml              # 4-service Docker orchestration
├── demo.sh                         # Demo startup + credentials + flow guide
└── start.sh                        # One-command launcher
```

## 🧠 ML Model Details

- **Algorithm**: XGBoost Classifier
- **Features**: latitude, longitude, slope, aspect, elevation, 7-day rainfall, NDVI, soil moisture, distance to road
- **Training samples**: 1,600 (NER-specific)
- **Accuracy**: 80.2% test, 81.9% cross-validation (±1.1%)
- **Top features by importance**:
  - Slope: 15%
  - Soil moisture: 14%
  - Elevation: 13%
  - Distance to road: 12%
  - Aspect: 12%
  - NDVI: 12%
  - Longitude: 11%
  - Latitude: 10%

## 📡 Datasets

| Dataset | Source | Rows | Size |
|---------|--------|------|------|
| NASA Global Landslide Catalog | Kaggle | 1,693 | 432KB |
| India Rainfall (1901-2015) | Kaggle | 4,116 | 516KB |
| India Landslide Incidents | Kaggle | ~200 | 34KB |
| Landslide Risk Factors | Kaggle | ~10K | 994KB |
| NER Training Data | Generated | 2,000 | — |
| MODIS NDVI Grid | Generated | 9,000 | — |

## 📡 Additional Data Sources (for enhancement)

| Data | Source | Access |
|------|--------|--------|
| IMD Real-time Rainfall | api.imd.gov.in | Free API key |
| Sentinel-2 Satellite | Copernicus Data Space | Free account |
| SRTM DEM | USGS / Google Earth Engine | Free |
| Indian Landslide Susceptibility Map | ILSM on GEE | Public |
| OpenStreetMap Roads | Overpass API | Free |

## 🎯 Demo Flow for Judges

```bash
./demo.sh                              # Start everything
# → Opens Dashboard at http://localhost:3000
# → Login: admin@landslide.gov.in / admin123
```

1. **Dashboard** — Show stats cards, risk distribution, active alerts
2. **Simulate Landslide** — Click button → event + alert created live
3. **Risk Map** — Show GIS heatmap, click anywhere for AI prediction
4. **Export** — Download GeoJSON/CSV from map
5. **Alerts** — Timeline view, issue/resolve workflow
6. **Reports** — Citizen field reports with status tracking
7. **Mobile** — Field reporting wizard (if phone available)

## Documentation

- [docs/PROJECT.md](docs/PROJECT.md) — Full project aims, requirements, architecture
- [docs/STATUS.md](docs/STATUS.md) — What's done, what's left, demo flow
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — Fork/PR workflow for contributors

## License

MIT
