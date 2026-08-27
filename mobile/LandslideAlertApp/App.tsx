import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './src/screens/DashboardScreen';
import ReportScreen from './src/screens/ReportScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import socketService from './src/services/socketService';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  useEffect(() => {
    socketService.connect();
    return () => { socketService.disconnect(); };
  }, []);

  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
      tabBarActiveTintColor: '#ff6f00',
      tabBarInactiveTintColor: '#6b7280',
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
      }} />
      <Tab.Screen name="Report" component={ReportScreen} options={{
        tabBarLabel: 'Report',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📝</Text>,
      }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🚨</Text>,
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
      }} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
