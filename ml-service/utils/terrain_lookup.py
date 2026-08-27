"""
Terrain Lookup Service

Provides nearest-neighbor lookup against real terrain datasets to enrich
predictions with location-specific slope, elevation, NDVI, and soil moisture
instead of hardcoded defaults.

Uses:
- NER Training Data (2,000 samples with real terrain features)
- MODIS NDVI Grid (9,000 points across NER)
- NASA GLC catalog (1,693 historical landslide events with coordinates)
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')


class TerrainLookup:
    """Nearest-neighbor terrain data enrichment for NER region."""

    def __init__(self):
        self.ner_terrain = None      # NER training data (slope, elevation, ndvi, etc.)
        self.ndvi_grid = None        # MODIS NDVI grid (9000 points)
        self.nasa_events = None      # NASA GLC historical events
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy-load datasets on first use."""
        if self._loaded:
            return

        # Load NER terrain data
        ner_path = os.path.join(DATA_DIR, 'ner_training_data.csv')
        if os.path.exists(ner_path):
            try:
                self.ner_terrain = pd.read_csv(ner_path)
                print(f"✅ Loaded NER terrain data: {len(self.ner_terrain)} points")
            except Exception as e:
                print(f"⚠️  Failed to load NER terrain: {e}")

        # Load NDVI grid
        ndvi_path = os.path.join(DATA_DIR, 'ndvi_modis_ner.csv')
        if os.path.exists(ndvi_path):
            try:
                self.ndvi_grid = pd.read_csv(ndvi_path)
                print(f"✅ Loaded NDVI grid: {len(self.ndvi_grid)} points")
            except Exception as e:
                print(f"⚠️  Failed to load NDVI grid: {e}")

        # Load NASA GLC events
        nasa_path = os.path.join(DATA_DIR, 'nasa_glc_prepared.csv')
        if os.path.exists(nasa_path):
            try:
                self.nasa_events = pd.read_csv(nasa_path)
                print(f"✅ Loaded NASA GLC events: {len(self.nasa_events)} events")
            except Exception as e:
                print(f"⚠️  Failed to load NASA GLC: {e}")

        self._loaded = True

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km between two lat/lng points using Haversine."""
        R = 6371  # Earth radius in km
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))

    def get_nearest_terrain(self, lat: float, lng: float, k: int = 5) -> Dict:
        """
        Find the k nearest terrain data points and return averaged features.

        Returns dict with: slope, elevation, ndvi, soil_moisture, distance_to_road, aspect
        """
        self._ensure_loaded()

        defaults = {
            'slope': 25.0,
            'elevation': 800.0,
            'ndvi': 0.55,
            'soil_moisture': 0.35,
            'distance_to_road': 1500.0,
            'aspect': 180.0,
            'source': 'defaults',
        }

        if self.ner_terrain is None or len(self.ner_terrain) == 0:
            return defaults

        # Calculate distances to all NER terrain points
        ner = self.ner_terrain
        distances = ner.apply(
            lambda row: self._haversine_km(lat, lng, row['latitude'], row['longitude']),
            axis=1
        )

        # Get k nearest points
        nearest_idx = distances.nsmallest(k).index
        nearest = ner.iloc[nearest_idx]
        nearest_dists = distances.iloc[nearest_idx]

        # Weighted average (inverse distance weighting)
        weights = 1.0 / (nearest_dists.values + 0.01)  # Add small constant to avoid division by zero
        weights = weights / weights.sum()

        result = {}
        feature_cols = {
            'slope': 'slope',
            'elevation': 'elevation',
            'ndvi': 'ndvi',
            'soil_moisture': 'soil_moisture',
            'distance_to_road': 'distance_to_road',
            'aspect': 'aspect',
        }

        for feature, col in feature_cols.items():
            if col in nearest.columns:
                values = nearest[col].fillna(nearest[col].median()).values
                result[feature] = float(np.average(values, weights=weights))
            else:
                result[feature] = defaults[feature]

        result['source'] = 'terrain_lookup'
        result['nearest_distance_km'] = float(nearest_dists.min())
        result['nearest_points'] = k

        # Clamp values to reasonable ranges
        result['slope'] = max(0, min(90, result['slope']))
        result['ndvi'] = max(0, min(1, result['ndvi']))
        result['soil_moisture'] = max(0, min(1, result['soil_moisture']))
        result['elevation'] = max(0, min(8000, result['elevation']))

        return result

    def get_nearest_ndvi(self, lat: float, lng: float) -> Optional[float]:
        """Get NDVI from the MODIS grid specifically (higher resolution)."""
        self._ensure_loaded()

        if self.ndvi_grid is None or len(self.ndvi_grid) == 0:
            return None

        ndvi = self.ndvi_grid
        distances = ndvi.apply(
            lambda row: self._haversine_km(lat, lng, row['latitude'], row['longitude']),
            axis=1
        )

        nearest_idx = distances.idxmin()
        return float(ndvi.iloc[nearest_idx]['ndvi'])

    def get_nearest_rainfall(self, lat: float, lng: float) -> Optional[Dict]:
        """Get rainfall context from nearest NER training points."""
        self._ensure_loaded()

        if self.ner_terrain is None:
            return None

        ner = self.ner_terrain
        distances = ner.apply(
            lambda row: self._haversine_km(lat, lng, row['latitude'], row['longitude']),
            axis=1
        )

        nearest = ner.iloc[distances.idxmin()]
        return {
            'rainfall_daily': float(nearest.get('rainfall_daily', 0)),
            'rainfall_7day': float(nearest.get('rainfall_7day', 0)),
        }

    def enrich_features(self, lat: float, lng: float, provided_features: Dict = None) -> Dict:
        """
        Enrich a prediction request with real terrain data.

        Takes the user-provided features (which may have hardcoded defaults)
        and replaces missing/zero values with nearest-neighbor lookups.

        Returns enriched feature dict ready for the ML model.
        """
        provided = provided_features or {}

        # Get terrain data from nearest neighbors
        terrain = self.get_nearest_terrain(lat, lng)

        # Get high-res NDVI
        ndvi = self.get_nearest_ndvi(lat, lng)

        # Enrich: only override if the provided value looks like a default/missing
        enriched = {
            'latitude': lat,
            'longitude': lng,
            'slope': provided.get('slope') if provided.get('slope') and provided['slope'] != 25 else terrain['slope'],
            'aspect': provided.get('aspect') if provided.get('aspect') and provided['aspect'] != 180 else terrain['aspect'],
            'elevation': provided.get('elevation') if provided.get('elevation') and provided['elevation'] != 500 else terrain['elevation'],
            'rainfall_current': provided.get('rainfall_current', 0),
            'rainfall_24hr': provided.get('rainfall_24hr', 0),
            'rainfall_7days': provided.get('rainfall_7days', provided.get('rainfall_24hr', 0)),
            'ndvi': ndvi if ndvi is not None else (provided.get('ndvi') if provided.get('ndvi') and provided['ndvi'] != 0.5 else terrain['ndvi']),
            'soil_moisture': provided.get('soil_moisture') if provided.get('soil_moisture') and provided['soil_moisture'] != 0.3 else terrain['soil_moisture'],
            'distance_to_road': provided.get('distance_to_road') if provided.get('distance_to_road') and provided['distance_to_road'] != 1000 else terrain['distance_to_road'],
        }

        # Attach metadata about data sources
        enriched['_terrain_source'] = terrain['source']
        enriched['_nearest_distance_km'] = terrain.get('nearest_distance_km', 0)
        enriched['_ndvi_source'] = 'modis_grid' if ndvi is not None else 'terrain_lookup'

        return enriched


# Singleton
terrain_lookup = TerrainLookup()
