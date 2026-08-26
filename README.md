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

### Option B: One-Command Launcher
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
| POST | /api/field-reports | Submit field report | Yes |

## 📁 Project Structure

```
landslide-risk-monitoring/
├── backend/                        # Node.js API server (14 source files)
│   ├── config/database.js          # MongoDB connection
│   ├── middleware/auth.js          # JWT auth + role-based access
│   ├── models/                     # 6 Mongoose models
│   │   ├── User.js                 # Users with NER roles
│   │   ├── RiskZone.js             # GIS risk zones (GeoJSON)
│   │   ├── WeatherData.js          # IMD weather data
│   │   ├── LandslideEvent.js       # Historical/real-time events
│   │   ├── FieldReport.js          # Citizen geo-tagged reports
│   │   └── Alert.js                # Multilingual early warnings
│   ├── routes/                     # auth, riskZones, alerts
│   ├── scripts/seed.js             # Database seeder (demo data)
│   ├── services/
│   │   ├── predictionService.js    # Calls ML service + rule fallback
│   │   └── weatherService.js       # IMD API integration
│   ├── socket/socketHandler.js     # District-scoped real-time events
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
│       │   ├── Layout.tsx          # Shared responsive sidebar
│       │   └── ErrorBoundary.tsx   # Crash recovery UI
│       ├── pages/
│       │   ├── LoginPage.tsx       # Auth
│       │   ├── DashboardPage.tsx   # Stats cards + alerts + risk summary
│       │   ├── MapPage.tsx         # GIS heatmap + click-to-predict
│       │   ├── AlertsPage.tsx      # Issue/resolve early warnings
│       │   └── ReportsPage.tsx     # View citizen field reports
│       └── services/api.ts         # Backend + ML API client
├── mobile/LandslideAlertApp/       # React Native mobile app
│   ├── App.tsx                     # Bottom tab navigation
│   └── src/screens/
│       ├── DashboardScreen.tsx     # Alerts + weather + stats
│       ├── ReportScreen.tsx        # 3-step field report wizard
│       ├── AlertsScreen.tsx        # View + acknowledge alerts
│       └── LoginScreen.tsx         # Auth
├── .github/workflows/ci.yml       # GitHub Actions CI
├── docker-compose.yml              # 4-service Docker orchestration
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

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the fork/PR workflow using `gh` CLI.

## License

MIT
