"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List


class PredictionRequest(BaseModel):
    """Single location prediction request."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    rainfall_current: Optional[float] = Field(None, ge=0, description="Current rainfall mm/hr")
    rainfall_1hr: Optional[float] = Field(None, ge=0)
    rainfall_6hr: Optional[float] = Field(None, ge=0)
    rainfall_24hr: Optional[float] = Field(None, ge=0)
    rainfall_7days: Optional[float] = Field(None, ge=0)
    slope: Optional[float] = Field(None, ge=0, le=90, description="Slope angle in degrees")
    aspect: Optional[float] = Field(None, ge=0, le=360)
    elevation: Optional[float] = None
    ndvi: Optional[float] = Field(None, ge=-1, le=1)
    soil_moisture: Optional[float] = Field(None, ge=0, le=1)
    distance_to_road: Optional[float] = Field(None, ge=0, description="Meters to nearest road")
    land_cover: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    """Batch prediction for multiple locations."""
    locations: List[PredictionRequest]


class PredictionResponse(BaseModel):
    """Single location prediction response."""
    latitude: float
    longitude: float
    risk_score: float = Field(..., ge=0, le=100)
    risk_level: str
    confidence: float = Field(..., ge=0, le=1)
    factors: dict
    source: str  # "ml_model" or "rule_based"
    feature_importance: Optional[dict] = None  # XGBoost feature importance breakdown
    terrain_data: Optional[dict] = None  # Real terrain values used in prediction


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[PredictionResponse]
    count: int


class DistrictRiskResponse(BaseModel):
    """District-level risk summary."""
    district: str
    risk_level: str
    risk_score: float
    zone_count: int
    critical_count: int
    high_count: int
    predictions: List[PredictionResponse]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_type: str
    training_samples: int
