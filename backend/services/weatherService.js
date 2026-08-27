const axios = require('axios');

// Open-Meteo: Free weather API, no API key required
// https://open-meteo.com/
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

// NER district coordinates for Open-Meteo queries
const NER_DISTRICTS = {
  'Guwahati':       { lat: 26.14, lng: 91.74 },
  'Dibrugarh':      { lat: 27.47, lng: 94.91 },
  'Jorhat':         { lat: 26.75, lng: 94.22 },
  'Tezpur':         { lat: 26.65, lng: 92.80 },
  'Shillong':       { lat: 25.58, lng: 91.89 },
  'Tura':           { lat: 25.52, lng: 90.22 },
  'Imphal':         { lat: 24.81, lng: 93.94 },
  'Aizawl':         { lat: 23.73, lng: 92.72 },
  'Kohima':         { lat: 25.66, lng: 94.11 },
  'Itanagar':       { lat: 27.10, lng: 93.62 },
  'Agartala':       { lat: 23.83, lng: 91.28 },
  'Gangtok':        { lat: 27.33, lng: 88.61 },
  'Dima Hasao':     { lat: 25.50, lng: 93.10 },
  'Karbi Anglong':  { lat: 26.00, lng: 93.80 },
  'Cachar':         { lat: 24.80, lng: 92.80 },
  'Tinsukia':       { lat: 27.50, lng: 95.36 },
  'Sonitpur':       { lat: 26.65, lng: 92.80 },
  'East Khasi Hills': { lat: 25.58, lng: 91.89 },
  'West Garo Hills': { lat: 25.52, lng: 90.22 },
  'Imphal West':    { lat: 24.81, lng: 93.94 },
  'Champhai':       { lat: 23.48, lng: 93.33 },
  'Mon':            { lat: 26.75, lng: 95.10 },
  'Tuensang':       { lat: 26.25, lng: 94.82 },
  'Papum Pare':     { lat: 27.10, lng: 93.70 },
  'West Siang':     { lat: 27.60, lng: 94.80 },
  'Lower Dibang Valley': { lat: 27.90, lng: 95.60 },
  'West Tripura':   { lat: 23.83, lng: 91.28 },
  'North Tripura':  { lat: 24.20, lng: 92.00 },
  'South Sikkim':   { lat: 27.10, lng: 88.50 },
  'West Sikkim':    { lat: 27.30, lng: 88.20 },
};

class WeatherService {
  /**
   * Fetch current weather from Open-Meteo (free, no API key)
   * Includes: temperature, humidity, rainfall, wind, soil moisture
   */
  async getDistrictWeather(district) {
    const coords = NER_DISTRICTS[district];
    if (!coords) {
      return this.getDefaultWeather(district);
    }

    try {
      const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
        params: {
          latitude: coords.lat,
          longitude: coords.lng,
          current: 'temperature_2m,relative_humidity_2m,rain,soil_moisture_0_to_7cm,wind_speed_10m',
          hourly: 'rain,soil_moisture_0_to_7cm',
          daily: 'rain_sum',
          timezone: 'Asia/Kolkata',
          forecast_days: 3,
        },
        timeout: 10000,
      });
      return this.parseOpenMeteoResponse(district, response.data);
    } catch (error) {
      console.error(`Open-Meteo error for ${district}:`, error.message);
      return this.getDefaultWeather(district);
    }
  }

  /**
   * Fetch current weather for any lat/lng
   */
  async getCurrentWeather(lat, lng) {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,rain,soil_moisture_0_to_7cm,wind_speed_10m',
          timezone: 'Asia/Kolkata',
        },
        timeout: 10000,
      });
      return this.parseOpenMeteoResponse('current', response.data);
    } catch (error) {
      console.error('Open-Meteo current weather error:', error.message);
      return null;
    }
  }

  /**
   * Get rainfall forecast for risk assessment
   */
  async getRainfallForecast(lat, lng, days = 3) {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'rain_sum,precipitation_probability_max',
          hourly: 'rain',
          timezone: 'Asia/Kolkata',
          forecast_days: days,
        },
        timeout: 10000,
      });
      const data = response.data;
      const hourlyRain = data.hourly?.rain || [];
      const now = new Date();
      const last24h = hourlyRain.slice(0, 24);
      const last7d = hourlyRain.slice(0, 168);

      return {
        current: data.current?.rain || 0,
        last24hr: last24h.reduce((a, b) => a + b, 0),
        last7days: last7d.reduce((a, b) => a + b, 0),
        forecast: data.daily?.rain_sum || [],
        forecast_probability: data.daily?.precipitation_probability_max || [],
      };
    } catch (error) {
      console.error('Open-Meteo rainfall forecast error:', error.message);
      return null;
    }
  }

  parseOpenMeteoResponse(district, data) {
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    // Calculate rainfall sums
    const hourlyRain = hourly.rain || [];
    const last24hRain = hourlyRain.slice(0, 24).reduce((a, b) => a + b, 0);
    const last7dRain = hourlyRain.slice(0, 168).reduce((a, b) => a + b, 0);
    const dailyRain = daily.rain_sum || [];

    return {
      district,
      source: 'open-meteo',
      fetchedAt: new Date(),
      rainfall: {
        current: current.rain || 0,
        last24hr: Math.round(last24hRain * 10) / 10,
        last7days: Math.round(last7dRain * 10) / 10,
        forecast: dailyRain,
      },
      temperature: {
        current: current.temperature_2m,
        max: daily.temperature_2m_max ? daily.temperature_2m_max[0] : null,
        min: daily.temperature_2m_min ? daily.temperature_2m_min[0] : null,
      },
      humidity: current.relative_humidity_2m,
      soilMoisture: current.soil_moisture_0_to_7cm,
      windSpeed: current.wind_speed_10m,
      imdWarning: { level: 'none', message: 'Data sourced from Open-Meteo (ECMWF)' },
    };
  }

  getDefaultWeather(district) {
    return {
      district,
      source: 'default',
      fetchedAt: new Date(),
      rainfall: { current: 0, last1hr: 0, last6hr: 0, last24hr: 0, last7days: 0 },
      temperature: { current: null, max: null, min: null },
      humidity: null,
      soilMoisture: null,
      message: 'Weather data unavailable',
    };
  }
}

module.exports = new WeatherService();
