/**
 * MongoDB Seed Script — NER Landslide Risk Monitoring Demo Data
 * Run: node scripts/seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

// Import models
const User = require('../models/User');
const RiskZone = require('../models/RiskZone');
const Alert = require('../models/Alert');
const WeatherData = require('../models/WeatherData');
const FieldReport = require('../models/FieldReport');
const LandslideEvent = require('../models/LandslideEvent');

// ============================================================
// NER Region Data
// ============================================================

const NER_DISTRICTS = [
  // Assam
  { name: 'Kamrup', state: 'Assam', lat: 26.22, lng: 91.58, pop: 1592000 },
  { name: 'Dibrugarh', state: 'Assam', lat: 27.47, lng: 94.91, pop: 1326000 },
  { name: 'Tinsukia', state: 'Assam', lat: 27.49, lng: 95.36, pop: 1327000 },
  { name: 'Cachar', state: 'Assam', lat: 24.84, lng: 92.78, pop: 1736000 },
  { name: 'Karbi Anglong', state: 'Assam', lat: 26.08, lng: 93.45, pop: 1011000 },
  { name: 'Nagaon', state: 'Assam', lat: 26.35, lng: 92.68, pop: 2306000 },
  { name: 'Sonitpur', state: 'Assam', lat: 26.71, lng: 92.85, pop: 1924000 },
  { name: 'Lakhimpur', state: 'Assam', lat: 27.23, lng: 94.10, pop: 1042000 },
  // Arunachal Pradesh
  { name: 'West Siang', state: 'Arunachal Pradesh', lat: 28.28, lng: 94.85, pop: 112000 },
  { name: 'East Siang', state: 'Arunachal Pradesh', lat: 28.14, lng: 95.25, pop: 99000 },
  { name: 'Lower Dibang Valley', state: 'Arunachal Pradesh', lat: 28.12, lng: 95.55, pop: 80000 },
  { name: 'Changlang', state: 'Arunachal Pradesh', lat: 27.13, lng: 96.00, pop: 148000 },
  { name: 'Papum Pare', state: 'Arunachal Pradesh', lat: 27.18, lng: 93.82, pop: 176000 },
  { name: 'Tawang', state: 'Arunachal Pradesh', lat: 27.58, lng: 91.88, pop: 50000 },
  { name: 'Bomdila', state: 'Arunachal Pradesh', lat: 27.25, lng: 92.42, pop: 75000 },
  // Nagaland
  { name: 'Kohima', state: 'Nagaland', lat: 25.67, lng: 94.11, pop: 270000 },
  { name: 'Dimapur', state: 'Nagaland', lat: 25.91, lng: 93.73, pop: 379000 },
  { name: 'Tuensang', state: 'Nagaland', lat: 26.27, lng: 94.83, pop: 200000 },
  { name: 'Mokokchung', state: 'Nagaland', lat: 26.32, lng: 94.52, pop: 194000 },
  // Manipur
  { name: 'Imphal West', state: 'Manipur', lat: 24.82, lng: 93.93, pop: 514000 },
  { name: 'Imphal East', state: 'Manipur', lat: 24.83, lng: 94.10, pop: 456000 },
  { name: 'Churachandpur', state: 'Manipur', lat: 24.33, lng: 93.68, pop: 283000 },
  { name: 'Senapati', state: 'Manipur', lat: 25.27, lng: 94.02, pop: 354000 },
  // Mizoram
  { name: 'Aizawl', state: 'Mizoram', lat: 23.73, lng: 92.72, pop: 400000 },
  { name: 'Lunglei', state: 'Mizoram', lat: 22.88, lng: 92.74, pop: 161000 },
  { name: 'Champhai', state: 'Mizoram', lat: 23.47, lng: 93.33, pop: 101000 },
  // Tripura
  { name: 'West Tripura', state: 'Tripura', lat: 23.83, lng: 91.29, pop: 1725000 },
  { name: 'South Tripura', state: 'Tripura', lat: 23.48, lng: 91.57, pop: 899000 },
  { name: 'Dhalai', state: 'Tripura', lat: 23.88, lng: 91.92, pop: 378000 },
  // Meghalaya
  { name: 'East Khasi Hills', state: 'Meghalaya', lat: 25.58, lng: 91.89, pop: 826000 },
  { name: 'West Khasi Hills', state: 'Meghalaya', lat: 25.50, lng: 91.58, pop: 383000 },
  { name: 'Jaintia Hills', state: 'Meghalaya', lat: 25.25, lng: 92.35, pop: 395000 },
  { name: 'Garohills', state: 'Meghalaya', lat: 25.47, lng: 90.22, pop: 620000 },
  // Sikkim
  { name: 'East Sikkim', state: 'Sikkim', lat: 27.35, lng: 88.61, pop: 283000 },
  { name: 'West Sikkim', state: 'Sikkim', lat: 27.30, lng: 88.20, pop: 146000 },
  { name: 'North Sikkim', state: 'Sikkim', lat: 27.65, lng: 88.50, pop: 43000 },
  { name: 'South Sikkim', state: 'Sikkim', lat: 27.15, lng: 88.35, pop: 147000 },
];

const RISK_LEVELS = ['low', 'moderate', 'high', 'very_high', 'critical'];
const SOIL_TYPES = ['alluvial', 'laterite', 'residual', 'colluvial', 'mountain'];
const LAND_COVERS = ['dense_forest', 'open_forest', 'grassland', 'cultivated', 'bare_rock', 'shrubland'];

// Helper: random between min and max
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// Helper: generate a polygon around a point
function makePolygon(lat, lng, radiusKm = 2) {
  const points = [];
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    const dlat = (radiusKm / 111) * Math.cos(angle);
    const dlng = (radiusKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    points.push([parseFloat((lng + dlng).toFixed(4)), parseFloat((lat + dlat).toFixed(4))]);
  }
  points.push(points[0]); // close polygon
  return { type: 'Polygon', coordinates: [points] };
}

// ============================================================
// Seed Functions
// ============================================================

async function seedUsers() {
  await User.deleteMany({});
  
  const users = [
    // Admin
    { name: 'System Admin', email: 'admin@landslide.gov.in', password: 'admin123', role: 'admin', phone: '9876543210', state: 'Assam' },
    // District admins
    { name: 'Rajesh Bora', email: 'rajesh@kamrup.gov.in', password: 'admin123', role: 'district_admin', phone: '9876543211', district: 'Kamrup', state: 'Assam' },
    { name: 'Priya Sharma', email: 'priya@dibrugarh.gov.in', password: 'admin123', role: 'district_admin', phone: '9876543212', district: 'Dibrugarh', state: 'Assam' },
    { name: 'Tenzin Norbu', email: 'tenzin@tawang.gov.in', password: 'admin123', role: 'district_admin', phone: '9876543213', district: 'Tawang', state: 'Arunachal Pradesh' },
    { name: 'Lalbiakzuala', email: 'lalbiak@aizawl.gov.in', password: 'admin123', role: 'district_admin', phone: '9876543214', district: 'Aizawl', state: 'Mizoram' },
    { name: 'Anita Das', email: 'anita@shillong.gov.in', password: 'admin123', role: 'district_admin', phone: '9876543215', district: 'East Khasi Hills', state: 'Meghalaya' },
    // Field officers
    { name: 'Bikram Thapa', email: 'bikram@field.gov.in', password: 'officer123', role: 'field_officer', phone: '9876543220', district: 'Dibrugarh', state: 'Assam' },
    { name: 'MongJam Kaba', email: 'mongjam@field.gov.in', password: 'officer123', role: 'field_officer', phone: '9876543221', district: 'Imphal West', state: 'Manipur' },
    { name: 'Lalrinkima', email: 'lalrin@field.gov.in', password: 'officer123', role: 'field_officer', phone: '9876543222', district: 'Champhai', state: 'Mizoram' },
    { name: 'Dipankar Das', email: 'dipankar@field.gov.in', password: 'officer123', role: 'field_officer', phone: '9876543223', district: 'East Khasi Hills', state: 'Meghalaya' },
    // Villagers/citizens
    { name: 'Haren Nath', email: 'haren@citizen.gov.in', password: 'citizen123', role: 'villager', phone: '9876543230', district: 'Kamrup', state: 'Assam', village: 'Hajo' },
    { name: 'Minati Devi', email: 'minati@citizen.gov.in', password: 'citizen123', role: 'villager', phone: '9876543231', district: 'Karbi Anglong', state: 'Assam', village: 'Diphu' },
    { name: 'Lalduhoma', email: 'lalduh@citizen.gov.in', password: 'citizen123', role: 'villager', phone: '9876543232', district: 'Lunglei', state: 'Mizoram', village: 'Hnahthial' },
    { name: 'Neeraj Singh', email: 'neeraj@citizen.gov.in', password: 'citizen123', role: 'villager', phone: '9876543233', district: 'East Sikkim', state: 'Sikkim', village: 'Gangtok' },
    { name: 'Amenla Aier', email: 'amenla@citizen.gov.in', password: 'citizen123', role: 'villager', phone: '9876543234', district: 'Tuensang', state: 'Nagaland', village: 'Tuensang Town' },
  ];

  // Hash passwords (insertMany bypasses pre-save hooks)
  for (const user of users) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  const created = await User.insertMany(users);
  console.log(`✅ Users: ${created.length}`);
  return created;
}

async function seedRiskZones() {
  await RiskZone.deleteMany({});
  
  const zones = [];
  
  NER_DISTRICTS.forEach(district => {
    // Each district gets 2-5 risk zones
    const numZones = randInt(2, 5);
    
    for (let i = 0; i < numZones; i++) {
      const offsetLat = rand(-0.15, 0.15);
      const offsetLng = rand(-0.15, 0.15);
      const lat = parseFloat((district.lat + offsetLat).toFixed(4));
      const lng = parseFloat((district.lng + offsetLng).toFixed(4));
      
      // Calculate risk based on geography
      const isMountainous = ['Arunachal Pradesh', 'Nagaland', 'Mizoram', 'Manipur', 'Sikkim', 'Meghalaya'].includes(district.state);
      const baseRisk = isMountainous ? rand(35, 95) : rand(10, 60);
      
      const slope = isMountainous ? rand(25, 55) : rand(5, 30);
      const elevation = isMountainous ? rand(500, 3500) : rand(50, 500);
      const ndvi = rand(0.25, 0.85);
      const soilMoisture = rand(0.3, 0.9);
      const rainfallThreshold = rand(50, 200);
      
      const riskScore = Math.min(100, Math.round(baseRisk));
      let riskLevel;
      if (riskScore >= 80) riskLevel = 'critical';
      else if (riskScore >= 60) riskLevel = 'very_high';
      else if (riskScore >= 40) riskLevel = 'high';
      else if (riskScore >= 20) riskLevel = 'moderate';
      else riskLevel = 'low';

      zones.push({
        name: `${district.name} Zone ${String.fromCharCode(65 + i)}`,
        district: district.name,
        state: district.state,
        riskLevel,
        riskScore,
        factors: {
          slope: parseFloat(slope.toFixed(1)),
          aspect: randInt(0, 360),
          elevation: parseFloat(elevation.toFixed(0)),
          soilType: pick(SOIL_TYPES),
          landCover: pick(LAND_COVERS),
          ndvi: parseFloat(ndvi.toFixed(3)),
          rainfallThreshold: parseFloat(rainfallThreshold.toFixed(0)),
          distanceToRoad: randInt(100, 5000),
          historicalEvents: randInt(0, 8),
        },
        geometry: makePolygon(lat, lng, rand(1, 4)),
        center: { type: 'Point', coordinates: [lng, lat] },
        lastAssessed: new Date(Date.now() - randInt(0, 15) * 86400000),
        source: pick(['ml_prediction', 'manual', 'ilsm']),
        isActive: true,
      });
    }
  });

  const created = await RiskZone.insertMany(zones);
  console.log(`✅ Risk Zones: ${created.length}`);
  
  const stats = {};
  created.forEach(z => { stats[z.riskLevel] = (stats[z.riskLevel] || 0) + 1; });
  console.log(`   Distribution:`, stats);
  return created;
}

async function seedWeatherData() {
  await WeatherData.deleteMany({});
  
  const weather = [];
  
  NER_DISTRICTS.forEach(district => {
    // Current weather + historical pattern
    const isMonsoon = true; // Assume monsoon season
    const baseRainfall = isMonsoon ? rand(10, 80) : rand(0, 15);
    
    weather.push({
      district: district.name,
      state: district.state,
      location: { type: 'Point', coordinates: [district.lng, district.lat] },
      rainfall: {
        current: parseFloat(rand(0, 20).toFixed(1)),
        last1hr: parseFloat(rand(0, 30).toFixed(1)),
        last6hr: parseFloat(rand(0, 60).toFixed(1)),
        last24hr: parseFloat(baseRainfall.toFixed(1)),
        last7days: parseFloat(rand(baseRainfall * 3, baseRainfall * 8).toFixed(1)),
      },
      temperature: {
        current: parseFloat(rand(22, 35).toFixed(1)),
        max: parseFloat(rand(30, 38).toFixed(1)),
        min: parseFloat(rand(18, 25).toFixed(1)),
      },
      humidity: parseFloat(rand(65, 98).toFixed(0)),
      windSpeed: parseFloat(rand(5, 35).toFixed(1)),
      imdWarning: baseRainfall > 60 ? {
        level: baseRainfall > 100 ? 'red' : 'orange',
        message: baseRainfall > 100 ? 'Heavy to very heavy rainfall warning' : 'Heavy rainfall expected',
        validUntil: new Date(Date.now() + 24 * 3600000),
      } : { level: 'none' },
      source: 'imd_api',
      fetchedAt: new Date(),
    });
  });

  const created = await WeatherData.insertMany(weather);
  console.log(`✅ Weather Data: ${created.length}`);
  return created;
}

async function seedAlerts() {
  await Alert.deleteMany({});
  
  const ALERT_TEMPLATES = [
    { type: 'landslide_warning', severity: 'critical', title: 'Landslide Risk — CRITICAL', message: 'AI prediction indicates imminent landslide risk in {district}. Immediate evacuation recommended for areas near steep slopes.', triggeredBy: 'ai_prediction' },
    { type: 'rainfall_warning', severity: 'high', title: 'Heavy Rainfall Alert', message: 'Rainfall exceeding {mm}mm in last 24 hours in {district}. Landslide-prone areas should remain on high alert.', triggeredBy: 'rainfall_threshold' },
    { type: 'rainfall_warning', severity: 'moderate', title: 'Moderate Rainfall Notice', message: 'Continuous rainfall observed in {district}. Monitor conditions closely.', triggeredBy: 'rainfall_threshold' },
    { type: 'road_blockage', severity: 'high', title: 'Road Blocked — Landslide', message: 'Major landslide on NH-37 near {district}. Road impassable. Avoid travel in affected area.', triggeredBy: 'field_report' },
    { type: 'evacuation', severity: 'critical', title: 'EVACUATION ORDER', message: 'Evacuation ordered for villages within 2km of active landslide zone in {district}. Report to nearest relief camp.', triggeredBy: 'manual' },
    { type: 'landslide_warning', severity: 'high', title: 'Slope Instability Detected', message: 'Satellite analysis shows ground movement in {district}. Residents in low-lying areas advised to relocate.', triggeredBy: 'satellite' },
    { type: 'landslide_warning', severity: 'moderate', title: 'Watch — Potential Landslide', message: 'Conditions favorable for landslides in {district}. Stay alert and avoid steep terrain.', triggeredBy: 'ai_prediction' },
    { type: 'all_clear', severity: 'low', title: 'All Clear — Risk Subsided', message: 'Risk levels in {district} have returned to normal. Road clearance underway.', triggeredBy: 'manual' },
  ];

  const alerts = [];
  const highRiskDistricts = NER_DISTRICTS.filter(d => 
    ['Arunachal Pradesh', 'Nagaland', 'Meghalaya', 'Sikkim'].includes(d.state)
  );

  // Generate 30-50 alerts
  const numAlerts = randInt(30, 50);
  for (let i = 0; i < numAlerts; i++) {
    const template = pick(ALERT_TEMPLATES);
    const district = pick(highRiskDistricts);
    const daysAgo = randInt(0, 14);
    const hoursAgo = randInt(0, 23);
    
    const statuses = ['active', 'active', 'active', 'acknowledged', 'resolved', 'resolved'];
    const status = pick(statuses);
    
    alerts.push({
      ...template,
      title: template.title,
      message: template.message.replace('{district}', district.name).replace('{mm}', String(randInt(60, 150))),
      district: district.name,
      state: district.state,
      center: { type: 'Point', coordinates: [district.lng, district.lat] },
      radius: randInt(2000, 15000),
      riskScore: template.severity === 'critical' ? randInt(80, 98) : template.severity === 'high' ? randInt(60, 80) : randInt(20, 60),
      rainfallMm: rand(10, 120),
      channels: ['in_app', 'dashboard'],
      recipientCount: randInt(50, 500),
      status,
      translations: {
        as: { title: template.title, message: `অসমীয়াত ${district.name} — ${template.message.substring(0, 50)}...` },
        hi: { title: template.title, message: `हिंदी में ${district.name} — ${template.message.substring(0, 50)}...` },
      },
      issuedAt: new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000),
      expiresAt: new Date(Date.now() - daysAgo * 86400000 + 48 * 3600000),
    });
  }

  const created = await Alert.insertMany(alerts);
  console.log(`✅ Alerts: ${created.length}`);
  return created;
}

async function seedLandslideEvents() {
  await LandslideEvent.deleteMany({});
  
  const events = [];
  const severities = ['minor', 'moderate', 'major', 'catastrophic'];
  const triggers = ['rainfall', 'earthquake', 'human_activity', 'natural_erosion'];
  const descriptions = [
    'Heavy rainfall triggered a debris flow blocking the local road',
    'Slope failure on hillside above residential area',
    'Road washed away near bridge crossing',
    'Minor rockfall on mountain pass',
    'Major earth movement blocking highway for 3 days',
    'Subsidence near construction site',
    'Flash flood caused soil erosion and slope collapse',
    'Prolonged rain destabilized hillside, multiple homes affected',
  ];

  // Generate 40-60 historical events
  const numEvents = randInt(40, 60);
  for (let i = 0; i < numEvents; i++) {
    const district = pick(NER_DISTRICTS);
    const severity = pick(severities);
    const daysAgo = randInt(1, 365);
    const offsetLat = rand(-0.1, 0.1);
    const offsetLng = rand(-0.1, 0.1);

    events.push({
      title: `${severity.charAt(0).toUpperCase() + severity.slice(1)} landslide in ${district.name}`,
      description: pick(descriptions),
      district: district.name,
      state: district.state,
      severity,
      triggerType: pick(triggers),
      rainfallAtEvent: rand(20, 250),
      affectedArea: randInt(500, 50000),
      roadBlocked: severity === 'major' || severity === 'catastrophic' ? Math.random() > 0.2 : Math.random() > 0.7,
      roadName: pick(['NH-37', 'NH-153', 'NH-29', 'State Highway 1', 'District Road 4', 'NULL']),
      casualties: severity === 'catastrophic' ? randInt(1, 15) : severity === 'major' ? randInt(0, 5) : 0,
      displaced: severity === 'catastrophic' ? randInt(50, 500) : severity === 'major' ? randInt(10, 100) : randInt(0, 20),
      infrastructureDamage: severity === 'catastrophic' ? 'Severe — multiple structures destroyed' : severity === 'major' ? 'Moderate — road and utilities damaged' : 'Minor',
      location: { type: 'Point', coordinates: [district.lng + offsetLng, district.lat + offsetLat] },
      status: daysAgo > 30 ? 'resolved' : daysAgo > 7 ? 'monitoring' : 'active',
      source: pick(['field_report', 'nasa_glc', 'news']),
      createdAt: new Date(Date.now() - daysAgo * 86400000),
    });
  }

  const created = await LandslideEvent.insertMany(events);
  console.log(`✅ Landslide Events: ${created.length}`);
  return created;
}

async function seedFieldReports(users) {
  await FieldReport.deleteMany({});
  
  const citizens = users.filter(u => u.role === 'villager' || u.role === 'field_officer');
  const categories = ['crack', 'slope_movement', 'road_block', 'water_seepage', 'subsidence', 'debris_flow', 'other'];
  const urgencies = ['low', 'medium', 'high', 'critical'];
  const reportTitles = {
    crack: ['Ground crack near houses', 'New crack in hillside', 'Crack expanding near road'],
    slope_movement: ['Visible slope movement', 'Hillside shifting detected', 'Ground bulging observed'],
    road_block: ['Landslide blocks road', 'Debris on highway', 'Road washed out'],
    water_seepage: ['Water seeping from hillside', 'Spring appeared on slope', 'Unusual water flow after rain'],
    subsidence: ['Ground sinking near foundation', 'Subsidence in agricultural land', 'Hole appeared in field'],
    debris_flow: ['Mudflow on mountain road', 'Debris flow threatens village', 'Rocks and mud blocking stream'],
    other: ['Unusual sounds from hillside', 'Trees leaning unnaturally', 'Fence post tilted after rain'],
  };

  const reports = [];
  const numReports = randInt(20, 35);

  for (let i = 0; i < numReports; i++) {
    const reporter = pick(citizens);
    const category = pick(categories);
    const district = NER_DISTRICTS.find(d => d.name === reporter.district) || pick(NER_DISTRICTS);
    const daysAgo = randInt(0, 10);

    reports.push({
      reporter: reporter._id,
      category,
      title: pick(reportTitles[category]),
      description: `Reported by ${reporter.name} via mobile app. ${category.replace('_', ' ')} observed after recent rainfall.`,
      location: {
        type: 'Point',
        coordinates: [
          district.lng + rand(-0.05, 0.05),
          district.lat + rand(-0.05, 0.05),
        ],
      },
      district: district.name,
      urgency: pick(urgencies),
      status: pick(['pending', 'pending', 'acknowledged', 'investigating', 'resolved']),
      clientTimestamp: new Date(Date.now() - daysAgo * 86400000),
      syncStatus: 'synced',
    });
  }

  const created = await FieldReport.insertMany(reports);
  console.log(`✅ Field Reports: ${created.length}`);
  return created;
}

// ============================================================
// Main
// ============================================================

async function seed() {
  try {
    console.log('🏔️  Landslide Risk Monitoring — Database Seeder');
    console.log('=' .repeat(50));
    
    await connectDB();
    
    console.log('\n🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      RiskZone.deleteMany({}),
      Alert.deleteMany({}),
      WeatherData.deleteMany({}),
      FieldReport.deleteMany({}),
      LandslideEvent.deleteMany({}),
    ]);
    console.log('   Old data cleared.\n');

    console.log('👥 Seeding users...');
    const users = await seedUsers();

    console.log('\n🗺️  Seeding risk zones...');
    await seedRiskZones();

    console.log('\n🌧️  Seeding weather data...');
    await seedWeatherData();

    console.log('\n🚨 Seeding alerts...');
    await seedAlerts();

    console.log('\n⛰️  Seeding landslide events...');
    await seedLandslideEvents();

    console.log('\n📱 Seeding field reports...');
    await seedFieldReports(users);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeded successfully!');
    console.log(`   Users: 15 (admin + officers + citizens)`);
    console.log(`   Risk Zones: ~80 across all NER districts`);
    console.log(`   Weather Data: ${NER_DISTRICTS.length} districts`);
    console.log(`   Alerts: 30-50 with multilingual translations`);
    console.log(`   Landslide Events: 40-60 historical`);
    console.log(`   Field Reports: 20-35 citizen reports`);
    console.log('\n🔑 Login credentials:');
    console.log('   Admin:   admin@landslide.gov.in / admin123');
    console.log('   Officer: bikram@field.gov.in / officer123');
    console.log('   Citizen: haren@citizen.gov.in / citizen123');
    console.log('=' .repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
