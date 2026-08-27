/**
 * Simulation Routes for Live Demo
 * Provides endpoints to simulate landslide events, generate alerts,
 * and create realistic demo data on-the-fly during presentations.
 */

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const LandslideEvent = require('../models/LandslideEvent');
const FieldReport = require('../models/FieldReport');
const { auth, requireRole } = require('../middleware/auth');

// NER districts with realistic coordinates and risk profiles
const NER_DISTRICTS = [
  { name: 'Kamrup', state: 'Assam', lat: 26.22, lng: 91.58, riskLevel: 'high' },
  { name: 'Dima Hasao', state: 'Assam', lat: 25.50, lng: 93.10, riskLevel: 'critical' },
  { name: 'Karbi Anglong', state: 'Assam', lat: 26.00, lng: 93.80, riskLevel: 'high' },
  { name: 'Cachar', state: 'Assam', lat: 24.80, lng: 92.80, riskLevel: 'very_high' },
  { name: 'Jorhat', state: 'Assam', lat: 26.75, lng: 94.22, riskLevel: 'moderate' },
  { name: 'Tinsukia', state: 'Assam', lat: 27.50, lng: 95.36, riskLevel: 'high' },
  { name: 'Dibrugarh', state: 'Assam', lat: 27.47, lng: 94.91, riskLevel: 'high' },
  { name: 'Sonitpur', state: 'Assam', lat: 26.65, lng: 92.80, riskLevel: 'high' },
  { name: 'West Karbi Anglong', state: 'Assam', lat: 26.15, lng: 93.50, riskLevel: 'moderate' },
  { name: 'East Khasi Hills', state: 'Meghalaya', lat: 25.58, lng: 91.89, riskLevel: 'critical' },
  { name: 'West Garo Hills', state: 'Meghalaya', lat: 25.52, lng: 90.22, riskLevel: 'moderate' },
  { name: 'South Garo Hills', state: 'Meghalaya', lat: 25.20, lng: 90.50, riskLevel: 'high' },
  { name: 'Imphal West', state: 'Manipur', lat: 24.81, lng: 93.94, riskLevel: 'very_high' },
  { name: 'Chandel', state: 'Manipur', lat: 24.33, lng: 94.75, riskLevel: 'high' },
  { name: 'Senapati', state: 'Manipur', lat: 25.45, lng: 94.02, riskLevel: 'critical' },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.73, lng: 92.72, riskLevel: 'critical' },
  { name: 'Champhai', state: 'Mizoram', lat: 23.48, lng: 93.33, riskLevel: 'very_high' },
  { name: 'Kolasib', state: 'Mizoram', lat: 24.22, lng: 92.68, riskLevel: 'high' },
  { name: 'Kohima', state: 'Nagaland', lat: 25.66, lng: 94.11, riskLevel: 'very_high' },
  { name: 'Mon', state: 'Nagaland', lat: 26.75, lng: 95.10, riskLevel: 'critical' },
  { name: 'Tuensang', state: 'Nagaland', lat: 26.25, lng: 94.82, riskLevel: 'critical' },
  { name: 'Papum Pare', state: 'Arunachal Pradesh', lat: 27.10, lng: 93.70, riskLevel: 'high' },
  { name: 'West Siang', state: 'Arunachal Pradesh', lat: 27.60, lng: 94.80, riskLevel: 'very_high' },
  { name: 'Lower Dibang Valley', state: 'Arunachal Pradesh', lat: 27.90, lng: 95.60, riskLevel: 'critical' },
  { name: 'West Tripura', state: 'Tripura', lat: 23.83, lng: 91.28, riskLevel: 'moderate' },
  { name: 'North Tripura', state: 'Tripura', lat: 24.20, lng: 92.00, riskLevel: 'high' },
  { name: 'South Sikkim', state: 'Sikkim', lat: 27.10, lng: 88.50, riskLevel: 'very_high' },
  { name: 'West Sikkim', state: 'Sikkim', lat: 27.30, lng: 88.20, riskLevel: 'critical' },
];

const EVENT_TYPES = ['landslide', 'mudslide', 'rockfall', 'debris_flow', 'soil_erosion', 'sinkhole'];
// LandslideEvent model uses minor/moderate/major/catastrophic
const EVENT_SEVERITY = ['minor', 'moderate', 'major', 'catastrophic'];
// Alert model uses low/moderate/high/critical
const ALERT_SEVERITY = ['low', 'moderate', 'high', 'critical'];
// Map event severity to alert severity
const severityMap = { minor: 'low', moderate: 'moderate', major: 'high', catastrophic: 'critical' };

// Helper: get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: random float in range
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Helper: get risk-weighted district (higher risk districts more likely to be selected)
const getWeightedDistrict = () => {
  const weights = { critical: 4, very_high: 3, high: 2, moderate: 1, low: 0.5 };
  const weighted = NER_DISTRICTS.map(d => ({ ...d, weight: weights[d.riskLevel] || 1 }));
  const totalWeight = weighted.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;
  for (const d of weighted) {
    random -= d.weight;
    if (random <= 0) return d;
  }
  return weighted[0];
};

/**
 * POST /api/simulate/landslide — Simulate a landslide event
 * Creates a realistic landslide event in a random NER district
 * Also creates an alert if severity is high or critical
 */
router.post('/landslide', auth, requireRole('admin', 'district_admin', 'field_officer'), async (req, res) => {
  try {
    const district = getWeightedDistrict();
    const eventType = randomItem(EVENT_TYPES);
    const eventSeverity = req.body.severity || randomItem(EVENT_SEVERITY);
    const alertSeverity = severityMap[eventSeverity];
    const affectedPopulation = Math.floor(randomFloat(50, 5000));
    const damageLevel = eventSeverity === 'catastrophic' ? 'severe' : eventSeverity === 'major' ? 'moderate' : 'minor';

    // Create the landslide event
    const event = await LandslideEvent.create({
      type: eventType,
      severity: eventSeverity,
      title: `${eventType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} in ${district.name}`,
      description: `A ${eventSeverity} ${eventType.replace('_', ' ')} occurred in ${district.name}, ${district.state}. ` +
        `Estimated ${affectedPopulation} people affected. Road access may be impacted.`,
      district: district.name,
      state: district.state,
      location: {
        type: 'Point',
        coordinates: [
          district.lng + randomFloat(-0.1, 0.1),
          district.lat + randomFloat(-0.1, 0.1),
        ],
      },
      severity: eventSeverity,
      affectedPopulation,
      damageLevel,
      reportedBy: req.user._id,
      source: 'simulation',
    });

    // Create alert for high/critical events
    let alert = null;
    if (eventSeverity === 'major' || eventSeverity === 'catastrophic') {
      const alertTitle = eventSeverity === 'catastrophic'
        ? `🚨 CRITICAL: ${eventType.replace('_', ' ')} in ${district.name}`
        : `⚠️ HIGH RISK: ${eventType.replace('_', ' ')} in ${district.name}`;

      const alertMessage = eventSeverity === 'catastrophic'
        ? `IMMEDIATE ACTION REQUIRED. A ${eventType.replace('_', ' ')} has been reported in ${district.name}, ${district.state}. ` +
          `Affected population: ~${affectedPopulation}. Evacuate low-lying areas immediately. ` +
          `Avoid travel on roads connecting to ${district.name}.`
        : `A ${eventType.replace('_', ' ')} has been reported in ${district.name}, ${district.state}. ` +
          `Affected population: ~${affectedPopulation}. Monitor the situation closely.`;

      alert = await Alert.create({
        type: 'landslide_warning',
        severity: alertSeverity,
        title: alertTitle,
        message: alertMessage,
        district: district.name,
        state: district.state,
        affectedArea: {
          type: 'Polygon',
          coordinates: [[
            [district.lng - 0.2, district.lat - 0.15],
            [district.lng + 0.2, district.lat - 0.15],
            [district.lng + 0.2, district.lat + 0.15],
            [district.lng - 0.2, district.lat + 0.15],
            [district.lng - 0.2, district.lat - 0.15],
          ]],
        },
        rainfallMm: Math.floor(randomFloat(20, 150)),
        triggeredBy: 'ai_prediction',
        issuedBy: req.user._id,
        channels: ['in_app', 'dashboard'],
        status: 'active',
      });
    }

    res.status(201).json({
      success: true,
      message: `Simulated ${eventType} event created in ${district.name}`,
      event,
      alert,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/simulate/batch — Generate multiple events for demo
 * Creates 5-15 random events across NER
 */
router.post('/batch', auth, requireRole('admin', 'district_admin'), async (req, res) => {
  try {
    const count = req.body.count || Math.floor(randomFloat(5, 15));
    const events = [];
    const alerts = [];

    for (let i = 0; i < count; i++) {
      const district = getWeightedDistrict();
      const eventType = randomItem(EVENT_TYPES);
      const eventSeverity = randomItem(EVENT_SEVERITY);

      const event = await LandslideEvent.create({
        type: eventType,
        severity: eventSeverity,
        title: `${eventType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} in ${district.name}`,
        description: `Simulated ${eventType} event for demo purposes.`,
        district: district.name,
        state: district.state,
        location: {
          type: 'Point',
          coordinates: [
            district.lng + randomFloat(-0.15, 0.15),
            district.lat + randomFloat(-0.15, 0.15),
          ],
        },
        severity: eventSeverity,
        affectedPopulation: Math.floor(randomFloat(50, 3000)),
        reportedBy: req.user._id,
        source: 'simulation_batch',
      });
      events.push(event);

      // Create alerts for major/catastrophic events
      const batchAlertSeverity = severityMap[eventSeverity];
      if (eventSeverity === 'catastrophic' || (eventSeverity === 'major' && Math.random() > 0.5)) {
        const alert = await Alert.create({
          type: 'landslide_warning',
          severity: batchAlertSeverity,
          title: `Simulated Alert: ${eventType.replace('_', ' ')} in ${district.name}`,
          message: `Demo alert for ${district.name} — severity: ${eventSeverity}`,
          district: district.name,
          state: district.state,
          rainfallMm: Math.floor(randomFloat(20, 120)),
          triggeredBy: 'ai_prediction',
          issuedBy: req.user._id,
          channels: ['in_app', 'dashboard'],
          status: 'active',
        });
        alerts.push(alert);
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${events.length} events and ${alerts.length} alerts`,
      summary: {
        events: events.length,
        alerts: alerts.length,
        districts: [...new Set(events.map(e => e.district))],
      },
    });
  } catch (error) {
    console.error('Batch simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/simulate/field-report — Create a simulated citizen report
 */
router.post('/field-report', auth, async (req, res) => {
  try {
    const district = getWeightedDistrict();
    const categories = ['crack', 'slope_movement', 'road_block', 'water_seepage', 'subsidence', 'debris_flow'];
    const urgencies = ['low', 'medium', 'high', 'critical'];

    const report = await FieldReport.create({
      category: randomItem(categories),
      title: `Simulated report from ${district.name}`,
      description: `A citizen reported suspicious ground activity in ${district.name}. ` +
        `This is a demo report to show the field reporting workflow.`,
      urgency: randomItem(urgencies),
      location: {
        type: 'Point',
        coordinates: [
          district.lng + randomFloat(-0.05, 0.05),
          district.lat + randomFloat(-0.05, 0.05),
        ],
      },
      district: district.name,
      state: district.state,
      reporter: req.user._id,
      status: 'pending',
      syncStatus: 'synced',
    });

    res.status(201).json({
      success: true,
      message: `Simulated field report created for ${district.name}`,
      report,
    });
  } catch (error) {
    console.error('Field report simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/simulate/stats — Get simulation status
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const [eventCount, alertCount, reportCount] = await Promise.all([
      LandslideEvent.countDocuments({ source: { $regex: /simulation/ } }),
      Alert.countDocuments({ title: { $regex: /^Simulated/ } }),
      FieldReport.countDocuments({ title: { $regex: /^Simulated/ } }),
    ]);

    res.json({
      success: true,
      stats: {
        simulatedEvents: eventCount,
        simulatedAlerts: alertCount,
        simulatedReports: reportCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
