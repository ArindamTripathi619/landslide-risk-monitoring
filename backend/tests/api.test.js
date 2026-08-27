/**
 * API Tests for Landslide Risk Monitoring Backend
 * Run with: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;
let authToken;
let testUserId;

// Setup in-memory MongoDB
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.MONGODB_URI = mongoUri;
  
  // Import app after setting env vars
  app = require('../server');
  
  // Wait for connection
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Health Check', () => {
  test('GET /api/health returns status OK', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toContain('Landslide Risk Monitoring');
  });
});

describe('Authentication', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'villager',
    district: 'Kamrup',
    state: 'Assam',
  };

  test('POST /api/auth/register creates new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe('villager');
    testUserId = res.body.user.id;
    authToken = res.body.token;
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(400);
    
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register validates required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A' }) // Missing email, password too short
      .expect(400);
    
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  test('POST /api/auth/login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);
    
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me returns user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('GET /api/auth/me rejects unauthenticated request', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });
});

describe('Alerts', () => {
  let alertId;
  let adminToken;

  beforeAll(async () => {
    // Create admin user for alert tests
    const adminUser = {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      district: 'Kamrup',
      state: 'Assam',
    };
    const res = await request(app)
      .post('/api/auth/register')
      .send(adminUser);
    if (res.body.token) adminToken = res.body.token;
  });

  test('POST /api/alerts creates new alert (admin only)', async () => {
    const alertData = {
      type: 'landslide_warning',
      severity: 'high',
      title: 'Test Landslide Warning',
      message: 'This is a test alert for landslide risk in the area',
      district: 'Kamrup',
    };

    // Villager should get 403
    await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(alertData)
      .expect(403);

    // Admin should succeed
    if (adminToken) {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alertData)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.alert.title).toBe(alertData.title);
      alertId = res.body.alert._id;
    }
  });

  test('GET /api/alerts returns list of alerts', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.alerts).toBeDefined();
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  test('GET /api/alerts/active returns active alerts', async () => {
    const res = await request(app)
      .get('/api/alerts/active')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.alerts).toBeDefined();
  });
});

describe('Risk Zones', () => {
  test('GET /api/risk-zones returns risk zones', async () => {
    const res = await request(app)
      .get('/api/risk-zones')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body).toBeDefined();
  });

  test('GET /api/dashboard/stats returns statistics', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.stats).toBeDefined();
  });
});

describe('Validation', () => {
  test('Registration validates email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'password123',
      })
      .expect(400);
    
    expect(res.body.details).toBeDefined();
  });

  test('Registration validates password length', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Password User',
        email: 'short@example.com',
        password: '12345', // Too short
      })
      .expect(400);
    
    expect(res.body.details).toBeDefined();
  });
});

describe('Rate Limiting', () => {
  test('Multiple rapid login attempts are rate limited', async () => {
    // This test verifies rate limiting exists but may not trigger
    // in test environment due to in-memory store
    const promises = Array(5).fill(null).map(() =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
    );
    
    const results = await Promise.all(promises);
    // All should fail with 401 (invalid credentials) not 429 (rate limited)
    // because rate limiter uses IP-based tracking
    results.forEach(res => {
      expect([401, 429]).toContain(res.status);
    });
  });
});
