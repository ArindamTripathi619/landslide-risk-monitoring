import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert as RNAlert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const LANGUAGES = [
  { key: 'en', label: 'English', flag: '🇬🇧' },
  { key: 'as', label: 'অসমীয়া (Assamese)', flag: '🇮🇳' },
  { key: 'bn', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { key: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { key: 'ne', label: 'नेपाली (Nepali)', flag: '🇮🇳' },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
    const lang = await AsyncStorage.getItem('language');
    if (lang) setSelectedLang(lang);
    const notif = await AsyncStorage.getItem('notifications');
    if (notif !== null) setNotifications(notif === 'true');
    const sound = await AsyncStorage.getItem('sound');
    if (sound !== null) setSoundEnabled(sound === 'true');
  };

  const handleLanguageChange = async (langKey: string) => {
    setSelectedLang(langKey);
    await AsyncStorage.setItem('language', langKey);
    RNAlert.alert('Language Changed', 'App language will update on next restart.');
  };

  const handleLogout = () => {
    RNAlert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '🛡️ Super Admin',
      district_admin: '🏛️ District Admin',
      field_officer: '👷 Field Officer',
      villager: '👤 Citizen',
    };
    return labels[role] || role;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>👤 Profile</Text>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Not logged in'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role || 'villager')}</Text>
        </View>
        {user?.district && (
          <Text style={styles.userDistrict}>📍 {user.district}, {user.state || 'NER'}</Text>
        )}
      </View>

      {/* Language Selection */}
      <Text style={styles.sectionTitle}>🌐 Language</Text>
      <View style={styles.card}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.key}
            style={[styles.langOption, selectedLang === lang.key && styles.langActive]}
            onPress={() => handleLanguageChange(lang.key)}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[styles.langLabel, selectedLang === lang.key && styles.langLabelActive]}>
              {lang.label}
            </Text>
            {selectedLang === lang.key && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>⚙️ Settings</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🔔 Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={async (val) => {
              setNotifications(val);
              await AsyncStorage.setItem('notifications', String(val));
            }}
            trackColor={{ false: '#374151', true: '#ff6f00' }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>🔊 Alert Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={async (val) => {
              setSoundEnabled(val);
              await AsyncStorage.setItem('sound', String(val));
            }}
            trackColor={{ false: '#374151', true: '#ff6f00' }}
          />
        </View>
      </View>

      {/* Emergency Contacts */}
      <Text style={styles.sectionTitle}>📞 Emergency Contacts</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.contactRow}>
          <Text style={styles.contactIcon}>🚔</Text>
          <View>
            <Text style={styles.contactName}>Police</Text>
            <Text style={styles.contactNumber}>100</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow}>
          <Text style={styles.contactIcon}>🚑</Text>
          <View>
            <Text style={styles.contactName}>Ambulance</Text>
            <Text style={styles.contactNumber}>108</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow}>
          <Text style={styles.contactIcon}>🔥</Text>
          <View>
            <Text style={styles.contactName}>Fire Brigade</Text>
            <Text style={styles.contactNumber}>101</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow}>
          <Text style={styles.contactIcon}>🏔️</Text>
          <View>
            <Text style={styles.contactName}>NDRF (Disaster Response)</Text>
            <Text style={styles.contactNumber}>1070</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>ℹ️ About</Text>
      <View style={styles.card}>
        <Text style={styles.aboutText}>AI-Based Landslide Risk Monitoring</Text>
        <Text style={styles.aboutSubtext}>Version 1.0.0 — SIH 2026</Text>
        <Text style={styles.aboutSubtext}>NER Region Coverage</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#ff6f00', marginBottom: 16 },
  userCard: { backgroundColor: '#111827', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#1f2937' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ff6f00', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: 'white' },
  userName: { fontSize: 20, fontWeight: '700', color: '#d1d5db', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  roleBadge: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  roleText: { color: '#ff6f00', fontSize: 13, fontWeight: '600' },
  userDistrict: { fontSize: 13, color: '#9ca3af' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#111827', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#1f2937' },
  langOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  langActive: { backgroundColor: '#1f2937' },
  langFlag: { fontSize: 20, marginRight: 12 },
  langLabel: { fontSize: 15, color: '#d1d5db', flex: 1 },
  langLabelActive: { color: '#ff6f00', fontWeight: '600' },
  checkmark: { color: '#ff6f00', fontSize: 18, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  settingLabel: { fontSize: 15, color: '#d1d5db' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  contactIcon: { fontSize: 24, marginRight: 12 },
  contactName: { fontSize: 15, color: '#d1d5db', fontWeight: '600' },
  contactNumber: { fontSize: 13, color: '#ff6f00' },
  aboutText: { fontSize: 15, color: '#d1d5db', fontWeight: '600', padding: 14 },
  aboutSubtext: { fontSize: 13, color: '#9ca3af', paddingHorizontal: 14, paddingBottom: 8 },
  logoutBtn: { backgroundColor: '#7f1d1d', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#fca5a5', fontWeight: '700', fontSize: 16 },
});

export default ProfileScreen;
