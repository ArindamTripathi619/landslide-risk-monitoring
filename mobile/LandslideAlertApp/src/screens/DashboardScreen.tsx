import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert as RNAlert,
} from 'react-native';
import { getActiveAlerts, getDashboardStats, getWeather } from '../services/api';
import socketService from '../services/socketService';

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  moderate: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

const DashboardScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    socketService.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev]);
      RNAlert.alert('⚠️ New Alert', `${alert.title}\n${alert.message}`);
    });
    socketService.onRiskUpdate((data) => {
      console.log('Risk update received:', data);
    });
  }, []);

  const loadData = async () => {
    try {
      const [alertsData, statsData, weatherData] = await Promise.allSettled([
        getActiveAlerts(),
        getDashboardStats(),
        getWeather('Guwahati'),
      ]);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (weatherData.status === 'fulfilled') setWeather(weatherData.value);
    } catch (e) { console.error(e); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>🏔️ Landslide Risk Monitor</Text>
      <Text style={styles.subheader}>North Eastern Region</Text>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#ff6f0020' }]}>
          <Text style={[styles.statValue, { color: '#ff6f00' }]}>{stats?.alerts?.active || alerts.length}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#d32f2f20' }]}>
          <Text style={[styles.statValue, { color: '#d32f2f' }]}>{stats?.riskZones?.critical || '—'}</Text>
          <Text style={styles.statLabel}>Critical Zones</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1b5e2020' }]}>
          <Text style={[styles.statValue, { color: '#1b5e20' }]}>{stats?.reports?.pending || '—'}</Text>
          <Text style={styles.statLabel}>Pending Reports</Text>
        </View>
      </View>

      {/* Weather */}
      {weather && (
        <View style={styles.weatherCard}>
          <Text style={styles.cardTitle}>🌦️ Current Weather</Text>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherItem}>🌧️ Rainfall: {weather.rainfall?.last24hr || 0} mm</Text>
            <Text style={styles.weatherItem}>🌡️ Temp: {weather.temperature?.current || '—'}°C</Text>
          </View>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherItem}>💧 Humidity: {weather.humidity || '—'}%</Text>
            {weather.imdWarning?.level !== 'none' && (
              <Text style={[styles.weatherItem, { color: '#ff9800' }]}>
                ⚠️ IMD Warning: {weather.imdWarning?.level}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Active Alerts */}
      <Text style={styles.sectionTitle}>🚨 Active Alerts</Text>
      {alerts.length > 0 ? alerts.map((alert) => (
        <TouchableOpacity key={alert._id} style={[styles.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] || '#666' }]}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[alert.severity] || '#666' }]}>
              <Text style={styles.severityText}>{alert.severity}</Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <Text style={styles.alertMeta}>{alert.district} • {new Date(alert.issuedAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>✅ No active alerts in your area</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#ff6f00' },
  subheader: { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  weatherCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1f2937' },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weatherItem: { color: '#d1d5db', fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#d1d5db', marginBottom: 12 },
  alertCard: { backgroundColor: '#111827', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1f2937' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: '#d1d5db', flex: 1 },
  severityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { color: 'white', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  alertMessage: { fontSize: 13, color: '#9ca3af', marginBottom: 6 },
  alertMeta: { fontSize: 11, color: '#6b7280' },
  emptyState: { backgroundColor: '#111827', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
});

export default DashboardScreen;
