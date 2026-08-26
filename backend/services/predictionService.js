const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class PredictionService {
  /**
   * Get landslide risk prediction for a specific location
   */
  async getRiskPrediction(lat, lng, additionalData = {}) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
        latitude: lat,
        longitude: lng,
        ...additionalData,
      }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('ML service error:', error.message);
      // Fallback to rule-based prediction
      return this.ruleBasedPrediction(lat, lng, additionalData);
    }
  }

  /**
   * Batch predict risk for multiple locations
   */
  async batchPredict(locations) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict/batch`, {
        locations,
      }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('ML batch prediction error:', error.message);
      return locations.map(loc => ({
        ...loc,
        ...this.ruleBasedPrediction(loc.latitude, loc.longitude, loc),
      }));
    }
  }

  /**
   * Get risk assessment for an entire district
   */
  async getDistrictRisk(district, centerLat, centerLng) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/risk/district/${district}`, {
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      console.error('ML district risk error:', error.message);
      return { district, riskLevel: 'moderate', riskScore: 50, message: 'Fallback assessment' };
    }
  }

  /**
   * Fallback rule-based prediction when ML service is unavailable
   */
  ruleBasedPrediction(lat, lng, data = {}) {
    const rainfall = data.rainfall || data.last24hr || 0;
    const slope = data.slope || 30;
    const ndvi = data.ndvi || 0.5;

    let score = 0;

    // Rainfall contribution (0-35 points)
    if (rainfall > 100) score += 35;
    else if (rainfall > 60) score += 25;
    else if (rainfall > 30) score += 15;
    else if (rainfall > 10) score += 5;

    // Slope contribution (0-25 points)
    if (slope > 45) score += 25;
    else if (slope > 30) score += 18;
    else if (slope > 15) score += 10;
    else score += 3;

    // Vegetation cover (0-20 points, low NDVI = high risk)
    score += Math.round((1 - Math.max(0, ndvi)) * 20);

    // Base terrain risk (0-20 points) — NER is generally high risk
    score += 12;

    score = Math.min(100, Math.max(0, score));

    let riskLevel;
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'very_high';
    else if (score >= 40) riskLevel = 'high';
    else if (score >= 20) riskLevel = 'moderate';
    else riskLevel = 'low';

    return {
      riskScore: score,
      riskLevel,
      confidence: 0.6,
      source: 'rule_based',
      factors: { rainfall, slope, ndvi },
    };
  }
}

module.exports = new PredictionService();
