"""
Landslide Risk Prediction ML Service

FastAPI application providing REST endpoints for:
- Single location risk prediction
- Batch predictions
- District-level risk assessment
- Model training and management
"""
import os
import sys
import pandas as pd
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to path for utils
sys.path.insert(0, os.path.dirname(__file__))

from schemas import (
    PredictionRequest, BatchPredictionRequest,
    PredictionResponse, BatchPredictionResponse,
    DistrictRiskResponse, HealthResponse,
)
from utils.model import LandslidePredictor
from utils.terrain_lookup import terrain_lookup
from utils.data_preprocessing import (
    load_nasa_glc, preprocess_for_training, generate_demo_ner_data
)

app = FastAPI(
    title="Landslide Risk Prediction API",
    description="AI-powered landslide susceptibility prediction for North Eastern Region",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = LandslidePredictor()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        model_loaded=predictor.model_loaded,
        model_type="xgboost" if predictor.model_loaded else "rule_based",
        training_samples=0,  # Will be updated after training
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Predict landslide risk for a single location with real terrain data."""
    # User-provided features
    provided = {
        'slope': request.slope,
        'aspect': request.aspect,
        'elevation': request.elevation,
        'rainfall_current': request.rainfall_current,
        'rainfall_24hr': request.rainfall_24hr,
        'rainfall_7days': request.rainfall_7days,
        'ndvi': request.ndvi,
        'soil_moisture': request.soil_moisture,
        'distance_to_road': request.distance_to_road,
    }

    # Enrich with real terrain data from nearest-neighbor lookup
    features = terrain_lookup.enrich_features(
        request.latitude, request.longitude, provided
    )

    result = predictor.predict(features)

    # Attach feature importance if model is loaded
    feature_importance = {}
    if predictor.model_loaded and hasattr(predictor.model, 'feature_importances_'):
        importance_values = predictor.model.feature_importances_
        for i, name in enumerate(predictor.feature_names):
            feature_importance[name] = round(float(importance_values[i]) * 100, 1)
        # Sort by importance descending
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    return PredictionResponse(
        latitude=request.latitude,
        longitude=request.longitude,
        risk_score=result['risk_score'],
        risk_level=result['risk_level'],
        confidence=result['confidence'],
        factors=result['factors'],
        source=result['source'],
        feature_importance=feature_importance if feature_importance else None,
        terrain_data={
            'slope': round(features['slope'], 1),
            'elevation': round(features['elevation'], 0),
            'ndvi': round(features['ndvi'], 3),
            'soil_moisture': round(features['soil_moisture'], 3),
            'distance_to_road': round(features['distance_to_road'], 0),
            'source': features.get('_terrain_source', 'unknown'),
        },
    )


@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Predict risk for multiple locations."""
    predictions = []
    for loc in request.locations:
        features = {
            'latitude': loc.latitude,
            'longitude': loc.longitude,
            'slope': loc.slope,
            'aspect': loc.aspect,
            'elevation': loc.elevation,
            'rainfall_current': loc.rainfall_current,
            'rainfall_24hr': loc.rainfall_24hr,
            'rainfall_7days': loc.rainfall_7days,
            'ndvi': loc.ndvi,
            'soil_moisture': loc.soil_moisture,
            'distance_to_road': loc.distance_to_road,
        }
        result = predictor.predict(features)
        predictions.append(PredictionResponse(
            latitude=loc.latitude,
            longitude=loc.longitude,
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            confidence=result['confidence'],
            factors=result['factors'],
            source=result['source'],
        ))

    return BatchPredictionResponse(predictions=predictions, count=len(predictions))


@app.get("/risk/grid")
async def get_risk_grid(
    lat_min: float = 21.0,
    lat_max: float = 30.0,
    lon_min: float = 88.0,
    lon_max: float = 98.0,
    resolution: int = 20,
):
    """Generate a risk grid across the NER region using real terrain data."""
    lats = pd.Series(pd.linspace(lat_min, lat_max, resolution))
    lons = pd.Series(pd.linspace(lon_min, lon_max, resolution))

    grid_points = []
    for lat in lats:
        for lon in lons:
            # Enrich with real terrain data from nearest-neighbor lookup
            features = terrain_lookup.enrich_features(
                float(lat), float(lon), {}
            )
            result = predictor.predict(features)
            grid_points.append({
                'lat': round(float(lat), 4),
                'lng': round(float(lon), 4),
                'risk_score': result['risk_score'],
                'risk_level': result['risk_level'],
            })

    return {
        "grid": grid_points,
        "bounds": {
            "lat_min": lat_min, "lat_max": lat_max,
            "lon_min": lon_min, "lon_max": lon_max,
        },
        "resolution": resolution,
        "count": len(grid_points),
    }


@app.get("/risk/district/{district}")
async def get_district_risk(district: str):
    """Get aggregated risk assessment for a district using real terrain data."""
    district_centers = {
        'guwahati': (26.14, 91.74), 'dibrugarh': (27.47, 94.91),
        'jorhat': (26.75, 94.22), 'tezpur': (26.65, 92.80),
        'shillong': (25.58, 91.89), 'imphal': (24.81, 93.94),
        'aizawl': (23.73, 92.72), 'kohima': (25.66, 94.11),
        'itanagar': (27.10, 93.62), 'agartala': (23.83, 91.28),
    }

    center = district_centers.get(district.lower())
    if not center:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found in database")

    lat, lng = center
    sample_points = []
    offsets = [-0.15, -0.075, 0, 0.075, 0.15]
    for dlat in offsets:
        for dlng in offsets:
            features = terrain_lookup.enrich_features(
                lat + dlat, lng + dlng,
                {'rainfall_24hr': 40}
            )
            result = predictor.predict(features)
            sample_points.append(result)

    scores = [p['risk_score'] for p in sample_points]
    levels = [p['risk_level'] for p in sample_points]

    avg_score = sum(scores) / len(scores)
    critical_count = levels.count('critical')
    high_count = levels.count('high') + levels.count('very_high')

    return DistrictRiskResponse(
        district=district.title(),
        risk_level=predictor._score_to_level(avg_score),
        risk_score=round(avg_score, 1),
        zone_count=len(sample_points),
        critical_count=critical_count,
        high_count=high_count,
        predictions=[
            PredictionResponse(
                latitude=p['latitude'] if 'latitude' in p else lat,
                longitude=p['longitude'] if 'longitude' in p else lng,
                risk_score=p['risk_score'],
                risk_level=p['risk_level'],
                confidence=p.get('confidence', 0.5),
                factors=p.get('factors', {}),
                source=p.get('source', 'rule_based'),
            )
            for p in sample_points
        ],
    )


@app.post("/train")
async def train_model(csv_path: Optional[str] = None):
    """Train or retrain the landslide prediction model."""
    if csv_path and os.path.exists(csv_path):
        df = load_nasa_glc(csv_path)
        X, y, feature_names = preprocess_for_training(df)
        result = predictor.train(csv_path)
        return {"message": "Model trained successfully", "details": result}
    else:
        # Generate demo data and train
        print("📊 Generating synthetic NER demo data...")
        df = generate_demo_ner_data(n_samples=1000)
        demo_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'demo_ner_data.csv')
        os.makedirs(os.path.dirname(demo_path), exist_ok=True)
        df.to_csv(demo_path, index=False)

        result = predictor.train(demo_path)
        return {
            "message": "Model trained on synthetic NER demo data",
            "details": result,
            "note": "For production, use real NASA GLC data with: POST /train?csv_path=/path/to/glcc.csv",
        }


@app.get("/demo/ner-grid")
async def get_demo_grid():
    """Get a pre-computed risk grid for demo purposes."""
    import numpy as np
    np.random.seed(42)

    districts = {
        'Guwahati': (26.14, 91.74, 'moderate'),
        'Dibrugarh': (27.47, 94.91, 'high'),
        'Jorhat': (26.75, 94.22, 'moderate'),
        'Tezpur': (26.65, 92.80, 'high'),
        'Shillong': (25.58, 91.89, 'critical'),
        'Imphal': (24.81, 93.94, 'very_high'),
        'Aizawl': (23.73, 92.72, 'critical'),
        'Kohima': (25.66, 94.11, 'very_high'),
        'Itanagar': (27.10, 93.62, 'high'),
        'Agartala': (23.83, 91.28, 'moderate'),
    }

    grid = []
    for name, (lat, lng, base_level) in districts.items():
        level_scores = {'low': 15, 'moderate': 35, 'high': 55, 'very_high': 70, 'critical': 85}
        base_score = level_scores[base_level]

        for i in range(25):
            lat_off = np.random.normal(0, 0.1)
            lng_off = np.random.normal(0, 0.1)
            score = min(100, max(0, base_score + np.random.normal(0, 15)))
            level = predictor._score_to_level(score)
            grid.append({
                'lat': round(lat + lat_off, 4),
                'lng': round(lng + lng_off, 4),
                'risk_score': round(score, 1),
                'risk_level': level,
                'district': name,
            })

    return {"grid": grid, "count": len(grid)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
