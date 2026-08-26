import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert as RNAlert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { login, register } from '../services/api';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      RNAlert.alert('Missing Info', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password, district, role: 'villager' });
      } else {
        await login(email, password);
      }
      navigation.replace('Main');
    } catch (e: any) {
      RNAlert.alert('Error', e.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏔️</Text>
      <Text style={styles.title}>Landslide Risk Monitor</Text>
      <Text style={styles.subtitle}>North Eastern Region</Text>

      {isRegister && (
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#6b7280" value={name} onChangeText={setName} />
      )}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6b7280" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#6b7280" value={password} onChangeText={setPassword} secureTextEntry />
      {isRegister && (
        <TextInput style={styles.input} placeholder="District (e.g., Guwahati)" placeholderTextColor="#6b7280" value={district} onChangeText={setDistrict} />
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : (
          <Text style={styles.submitText}>{isRegister ? 'Register' : 'Sign In'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.toggleText}>{isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 24, justifyContent: 'center' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#ff6f00', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#111827', borderRadius: 10, padding: 16, color: '#d1d5db', marginBottom: 14, borderWidth: 1, borderColor: '#1f2937', fontSize: 16 },
  submitBtn: { backgroundColor: '#ff6f00', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
  toggleText: { color: '#ff6f00', textAlign: 'center', marginTop: 16, fontSize: 14 },
});

export default LoginScreen;
