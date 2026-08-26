import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const api = axios.create({ baseURL: config.API_URL });

api.interceptors.request.use(async (reqConfig) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) reqConfig.headers.Authorization = `Bearer ${token}`;
  return reqConfig;
});

// Auth
export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('auth_token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const register = async (userData: any) => {
  const { data } = await api.post('/auth/register', userData);
  await AsyncStorage.setItem('auth_token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

// Alerts
export const getActiveAlerts = async () => {
  const { data } = await api.get('/alerts/active');
  return data.alerts || [];
};

export const acknowledgeAlert = async (id: string) => {
  const { data } = await api.post(`/alerts/${id}/acknowledge`);
  return data;
};

// Field Reports
export const submitReport = async (report: any) => {
  const { data } = await api.post('/field-reports', report);
  return data;
};

export const getMyReports = async () => {
  const { data } = await api.get('/field-reports');
  return data.reports || [];
};

// Weather
export const getWeather = async (district: string) => {
  const { data } = await api.get(`/weather/${district}`);
  return data.weather;
};

// Dashboard
export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data.stats;
};

export default api;
