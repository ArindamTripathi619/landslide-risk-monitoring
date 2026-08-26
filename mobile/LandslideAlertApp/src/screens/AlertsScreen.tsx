import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert as RNAlert } from 'react-native';
import { getActiveAlerts, acknowledgeAlert } from '../services/api';

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4caf50', moderate: '#ff9800', high: '#f44336', critical: '#9c27b0',
};

const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const data = await getActiveAlerts();
      setAlerts(data);
    } catch (e) { console.error(e); }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      RNAlert.alert('✅ Acknowledged', 'Alert has been acknowledged.');
      loadAlerts();
    } catch (e) {
      RNAlert.alert('Error', 'Failed to acknowledge alert.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>🚨 Active Alerts</Text>
      <Text style={styles.subheader}>Real-time early warnings for your area</Text>

      {alerts.length > 0 ? alerts.map((alert) => (
        <View key={alert._id} style={[styles.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] || '#666' }]}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[alert.severity] || '#666' }]}>
              <Text style={styles.badgeText}>{alert.severity}</Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.metaText}>📍 {alert.district}</Text>
            <Text style={styles.metaText}>🕐 {new Date(alert.issuedAt).toLocaleString()}</Text>
          </View>
          <View style={styles.alertTags}>
            <Text style={styles.tag}>{alert.type?.replace('_', ' ')}</Text>
            {alert.rainfallMm && <Text style={styles.tag}>🌧️ {alert.rainfallMm}mm</Text>}
          </View>
          {alert.status === 'active' && (
            <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge(alert._id)}>
              <Text style={styles.ackBtnText}>✓ Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptyText}>No active alerts in your area</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#ff6f00' },
  subheader: { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  alertCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1f2937' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db', flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  alertMessage: { fontSize: 14, color: '#9ca3af', marginBottom: 8, lineHeight: 20 },
  alertMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 12, color: '#6b7280' },
  alertTags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: '#1f2937', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, color: '#d1d5db', textTransform: 'capitalize' },
  ackBtn: { backgroundColor: '#1b5e20', borderRadius: 8, padding: 12, alignItems: 'center' },
  ackBtnText: { color: 'white', fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60, backgroundColor: '#111827', borderRadius: 12, padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#d1d5db', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});

export default AlertsScreen;
