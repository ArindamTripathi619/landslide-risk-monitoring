const ENV = {
  development: {
    API_URL: 'http://10.0.2.2:5000/api',   // Android emulator
    ML_URL: 'http://10.0.2.2:8000',
    SOCKET_URL: 'http://10.0.2.2:5000',
  },
  production: {
    API_URL: 'https://your-api-domain.com/api',
    ML_URL: 'https://your-ml-domain.com',
    SOCKET_URL: 'https://your-api-domain.com',
  },
};

const config = __DEV__ ? ENV.development : ENV.production;

export default config;
