const axios = require('axios');

const WEATHER_API_BASE = 'https://api.imd.gov.in/api/v1';

// NER district codes for IMD API
const NER_DISTRICT_CODES = {
  'Guwahati': '18501',
  'Dibrugarh': '18202',
  'Jorhat': '18302',
  'Tezpur': '18103',
  'Shillong': '14601',
  'Tura': '14701',
  'Imphal': '15501',
  'Aizawl': '15601',
  'Kohima': '15701',
  'Itanagar': '15201',
  'Agartala': '15101',
  'Gangtok': '14101',
};

class WeatherService {
  /**
   * Fetch district-wise rainfall from IMD
   */
  async getDistrictRainfall(district) {
    const code = NER_DISTRICT_CODES[district];
    if (!code) {
      return this.getDefaultWeather(district);
    }

    try {
      const response = await axios.get(`${WEATHER_API_BASE}/cityforecast`, {
        params: { id: code },
        timeout: 10000,
      });
      return this.parseIMDResponse(district, response.data);
    } catch (error) {
      console.error(`IMD API error for ${district}:`, error.message);
      return this.getDefaultWeather(district);
    }
  }

  /**
   * Fetch current weather/nowcast for a location
   */
  async getCurrentWeather(lat, lng) {
    try {
      const response = await axios.get(`${WEATHER_API_BASE}/currentweather`, {
        params: { lat, lon: lng },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('IMD current weather error:', error.message);
      return null;
    }
  }

  /**
   * Fetch district warnings
   */
  async getDistrictWarning(district) {
    const code = NER_DISTRICT_CODES[district];
    if (!code) return null;

    try {
      const response = await axios.get(`${WEATHER_API_BASE}/district_warning`, {
        params: { id: code },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error(`IMD warning error for ${district}:`, error.message);
      return null;
    }
  }

  /**
   * Get all NER districts weather
   */
  async getAllNERWeather() {
    const results = {};
    for (const [district, code] of Object.entries(NER_DISTRICT_CODES)) {
      results[district] = await this.getDistrictRainfall(district);
    }
    return results;
  }

  parseIMDResponse(district, data) {
    return {
      district,
      source: 'imd_api',
      fetchedAt: new Date(),
      rainfall: {
        last24hr: data.Past_24_hrs_Rainfall || 0,
        forecast: data.Todays_Forecast || '',
      },
      temperature: {
        current: data.Today_Max_temp || data.Today_Min_temp,
        max: data.Today_Max_temp,
        min: data.Today_Min_temp,
      },
      humidity: data.Relative_Humidity_at_0830,
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
      message: 'IMD data unavailable, using defaults',
    };
  }
}

module.exports = new WeatherService();
