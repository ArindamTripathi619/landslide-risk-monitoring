import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

class SocketService {
  private socket: Socket | null = null;

  async connect() {
    const token = await AsyncStorage.getItem('auth_token');
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    this.socket = io(config.SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.socket?.emit('authenticate', {
        role: user?.role || 'villager',
        district: user?.district,
      });
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    return this.socket;
  }

  onAlert(callback: (alert: any) => void) {
    this.socket?.on('alert', callback);
    this.socket?.on('district_alert', callback);
  }

  onRiskUpdate(callback: (data: any) => void) {
    this.socket?.on('risk_update', callback);
  }

  onWeatherUpdate(callback: (data: any) => void) {
    this.socket?.on('weather_update', callback);
    this.socket?.on('district_weather', callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketService();
