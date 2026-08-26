import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ML_BASE = process.env.REACT_APP_ML_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });
const mlApi = axios.create({ baseURL: ML_BASE });

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lrn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('lrn_token', data.token);
  return data;
};

export const register = async (userData: any) => {
  const { data } = await api.post('/auth/register', userData);
  localStorage.setItem('lrn_token', data.token);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

// Risk Zones
export const getRiskZones = async (filters?: { district?: string; riskLevel?: string }) => {
  const { data } = await api.get('/risk-zones', { params: filters });
  return data;
};

export const createRiskZone = async (zoneData: any) => {
  const { data } = await api.post('/risk-zones', zoneData);
  return data;
};

// Weather
export const getWeather = async (district: string) => {
  const { data } = await api.get(`/weather/${district}`);
  return data.weather;
};

// Events
export const getEvents = async (filters?: any) => {
  const { data } = await api.get('/events', { params: filters });
  return data;
};

export const reportEvent = async (eventData: any) => {
  const { data } = await api.post('/events', eventData);
  return data;
};

// Field Reports
export const getFieldReports = async (filters?: any) => {
  const { data } = await api.get('/field-reports', { params: filters });
  return data;
};

export const assessReport = async (id: string, assessment: any) => {
  const { data } = await api.put(`/field-reports/${id}/assess`, assessment);
  return data;
};

// Alerts
export const getAlerts = async (filters?: any) => {
  const { data } = await api.get('/alerts', { params: filters });
  return data;
};

export const getActiveAlerts = async () => {
  const { data } = await api.get('/alerts/active');
  return data;
};

export const issueAlert = async (alertData: any) => {
  const { data } = await api.post('/alerts', alertData);
  return data;
};

export const resolveAlert = async (id: string) => {
  const { data } = await api.post(`/alerts/${id}/resolve`);
  return data;
};

// Dashboard Stats
export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data.stats;
};

// ML Service
export const getMLPrediction = async (lat: number, lng: number, features?: any) => {
  const { data } = await mlApi.post('/predict', {
    latitude: lat,
    longitude: lng,
    ...features,
  });
  return data;
};

export const getNERRiskGrid = async () => {
  const { data } = await mlApi.get('/demo/ner-grid');
  return data;
};

export const getRiskGrid = async (bounds?: any) => {
  const { data } = await mlApi.get('/risk/grid', { params: bounds });
  return data;
};

export const trainModel = async (csvPath?: string) => {
  const { data } = await mlApi.post('/train', null, { params: csvPath ? { csv_path: csvPath } : {} });
  return data;
};

export default api;
