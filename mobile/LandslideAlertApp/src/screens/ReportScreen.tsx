import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert as RNAlert, ActivityIndicator, Image,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { submitReport } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineQueue from '../services/offlineQueue';
import NetInfo from '@react-native-community/netinfo';

const CATEGORIES = [
  { key: 'crack', label: '🔴 Crack Detected', description: 'Visible cracks in ground, walls, or road' },
  { key: 'slope_movement', label: '⛰️ Slope Movement', description: 'Noticeable displacement of hillside' },
  { key: 'road_block', label: '🚧 Road Blocked', description: 'Road obstructed by debris or landslide' },
  { key: 'water_seepage', label: '💧 Water Seepage', description: 'Unusual water flow or spring emergence' },
  { key: 'subsidence', label: '⬇️ Ground Subsidence', description: 'Ground sinking or settling' },
  { key: 'debris_flow', label: '🪨 Debris Flow', description: 'Mud, rocks, or debris flowing downslope' },
  { key: 'other', label: '⚠️ Other', description: 'Other concerning observation' },
];

const URGENCY_LEVELS = [
  { key: 'low', label: '🟢 Low', description: 'Notable but not immediately dangerous' },
  { key: 'medium', label: '🟡 Medium', description: 'Concerning, monitor closely' },
  { key: 'high', label: '🟠 High', description: 'Potential danger, needs attention' },
  { key: 'critical', label: '🔴 Critical', description: 'Immediate danger to life/property' },
];

const ReportScreen: React.FC = () => {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    // Load pending count
    offlineQueue.getPendingCount().then(setPendingCount);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.error('Location error:', error);
        RNAlert.alert('Location Error', 'Could not get your location. Please enable GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const addPhoto = async () => {
    const options = { mediaType: 'photo' as const, maxWidth: 1200, maxHeight: 1200, quality: 0.8 };
    RNAlert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: async () => {
        const result = await launchCamera(options);
        if (result.assets?.[0]?.uri) setPhotos(prev => [...prev, result.assets[0].uri!]);
      }},
      { text: 'Gallery', onPress: async () => {
        const result = await launchImageLibrary(options);
        if (result.assets?.[0]?.uri) setPhotos(prev => [...prev, result.assets[0].uri!]);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!category || !title) {
      RNAlert.alert('Missing Info', 'Please select a category and enter a title.');
      return;
    }
    if (!location) {
      RNAlert.alert('No Location', 'Please enable GPS and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const reportData = {
        category,
        title,
        description,
        urgency,
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
        photos,
        district: user?.district || 'Unknown',
      };

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        // Online: submit directly
        await submitReport(reportData);
        RNAlert.alert('✅ Report Submitted', 'Your field report has been submitted successfully.');
      } else {
        // Offline: queue for later sync
        await offlineQueue.enqueue(reportData);
        const newCount = await offlineQueue.getPendingCount();
        setPendingCount(newCount);
        RNAlert.alert(
          '📤 Saved Offline',
          `Report saved locally. It will sync automatically when you're back online.\n\n${newCount} report(s) pending sync.`
        );
      }

      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setUrgency('medium');
      setPhotos([]);
      setStep(1);
    } catch (error: any) {
      RNAlert.alert('Submission Failed', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📝 Field Report</Text>
      <Text style={styles.subheader}>Report ground conditions, cracks, or hazards</Text>

      {/* Network Status */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>📴 Offline Mode — Reports will sync when online</Text>
          {pendingCount > 0 && (
            <TouchableOpacity onPress={async () => {
              const result = await offlineQueue.syncAll();
              const newCount = await offlineQueue.getPendingCount();
              setPendingCount(newCount);
              RNAlert.alert('Sync Complete', `Synced: ${result.synced}, Failed: ${result.failed}`);
            }}>
              <Text style={styles.syncBtn}>🔄 Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {isOnline && pendingCount > 0 && (
        <View style={styles.syncBar}>
          <Text style={styles.syncText}>📤 {pendingCount} report(s) pending sync</Text>
          <TouchableOpacity onPress={async () => {
            const result = await offlineQueue.syncAll();
            const newCount = await offlineQueue.getPendingCount();
            setPendingCount(newCount);
            RNAlert.alert('Sync Complete', `Synced: ${result.synced}, Failed: ${result.failed}`);
          }}>
            <Text style={styles.syncBtn}>🔄 Sync</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location */}
      <View style={styles.locationBar}>
        <Text style={styles.locationText}>
          {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '⏳ Getting location...'}
        </Text>
        <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Step 1: Category */}
      {step === 1 && (
        <View>
          <Text style={styles.sectionTitle}>What are you reporting?</Text>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.optionCard, category === cat.key && styles.optionActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={styles.optionLabel}>{cat.label}</Text>
              <Text style={styles.optionDesc}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.nextBtn, !category && styles.nextBtnDisabled]} disabled={!category} onPress={() => setStep(2)}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <View>
          <Text style={styles.sectionTitle}>Describe the situation</Text>
          <TextInput style={styles.input} placeholder="Brief title (e.g., Crack near bridge)" placeholderTextColor="#6b7280" value={title} onChangeText={setTitle} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Detailed description (optional)" placeholderTextColor="#6b7280" value={description} onChangeText={setDescription} multiline numberOfLines={4} />

          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <View style={styles.urgencyRow}>
            {URGENCY_LEVELS.map(u => (
              <TouchableOpacity
                key={u.key}
                style={[styles.urgencyOption, urgency === u.key && styles.urgencyActive]}
                onPress={() => setUrgency(u.key)}
              >
                <Text style={styles.urgencyLabel}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Photos + Submit */}
      {step === 3 && (
        <View>
          <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={addPhoto}>
            <Text style={styles.addPhotoText}>📷 Add Photo</Text>
          </TouchableOpacity>
          <View style={styles.photoRow}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photoThumb} />
            ))}
          </View>

          <View style={[styles.summaryCard, { marginTop: 16 }]}>
            <Text style={styles.summaryTitle}>📋 Summary</Text>
            <Text style={styles.summaryItem}>Category: {CATEGORIES.find(c => c.key === category)?.label}</Text>
            <Text style={styles.summaryItem}>Title: {title}</Text>
            <Text style={styles.summaryItem}>Urgency: {URGENCY_LEVELS.find(u => u.key === urgency)?.label}</Text>
            <Text style={styles.summaryItem}>Photos: {photos.length}</Text>
            <Text style={styles.summaryItem}>Location: {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'N/A'}</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} disabled={submitting} onPress={handleSubmit}>
              {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>📤 Submit Report</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#ff6f00' },
  subheader: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  offlineBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7f1d1d', padding: 12, borderRadius: 8, marginBottom: 12 },
  offlineText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  syncBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: 12, borderRadius: 8, marginBottom: 12 },
  syncText: { color: '#d1d5db', fontSize: 13, flex: 1 },
  syncBtn: { color: '#ff6f00', fontSize: 13, fontWeight: '600' },
  locationBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 12, borderRadius: 8, marginBottom: 16 },
  locationText: { color: '#d1d5db', fontSize: 13 },
  refreshBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  refreshText: { color: '#ff6f00', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db', marginBottom: 12 },
  optionCard: { backgroundColor: '#111827', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  optionActive: { borderColor: '#ff6f00', backgroundColor: '#1f2937' },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#d1d5db' },
  optionDesc: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  input: { backgroundColor: '#111827', borderRadius: 10, padding: 14, color: '#d1d5db', marginBottom: 12, borderWidth: 1, borderColor: '#1f2937', fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  urgencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  urgencyOption: { backgroundColor: '#111827', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#1f2937' },
  urgencyActive: { borderColor: '#ff6f00', backgroundColor: '#1f2937' },
  urgencyLabel: { color: '#d1d5db', fontSize: 13 },
  nextBtn: { backgroundColor: '#ff6f00', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  backBtn: { backgroundColor: '#1f2937', borderRadius: 10, padding: 16, alignItems: 'center', flex: 1 },
  backBtnText: { color: '#9ca3af', fontWeight: '600', fontSize: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  addPhotoBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937', borderStyle: 'dashed' },
  addPhotoText: { color: '#ff6f00', fontWeight: '600' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  summaryCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1f2937' },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db', marginBottom: 8 },
  summaryItem: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  submitBtn: { backgroundColor: '#1b5e20', borderRadius: 10, padding: 16, alignItems: 'center', flex: 1 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

export default ReportScreen;
