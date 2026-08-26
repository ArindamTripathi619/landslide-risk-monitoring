const express = require('express');
const router = express.Router();
const RiskZone = require('../models/RiskZone');
const LandslideEvent = require('../models/LandslideEvent');
const WeatherData = require('../models/WeatherData');
const Alert = require('../models/Alert');
const FieldReport = require('../models/FieldReport');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/risk-zones — all risk zones (for heatmap)
router.get('/risk-zones', auth, async (req, res) => {
  try {
    const { district, riskLevel, state } = req.query;
    const query = { isActive: true };
    if (district) query.district = district;
    if (riskLevel) query.riskLevel = riskLevel;
    if (state) query.state = state;

    const zones = await RiskZone.find(query).sort({ riskScore: -1 });

    // Convert to GeoJSON for map rendering
    const geojson = {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        geometry: zone.geometry,
        properties: {
          id: zone._id,
          name: zone.name,
          district: zone.district,
          riskLevel: zone.riskLevel,
          riskScore: zone.riskScore,
          factors: zone.factors,
          lastAssessed: zone.lastAssessed,
        },
      })),
    };

    res.json({ success: true, zones, geojson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/risk-zones — create risk zone (ML service or admin)
router.post('/risk-zones', auth, requireRole('admin', 'district_admin'), async (req, res) => {
  try {
    const zone = await RiskZone.create(req.body);
    res.status(201).json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/risk-zones/:id
router.get('/risk-zones/:id', auth, async (req, res) => {
  try {
    const zone = await RiskZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Risk zone not found' });
    res.json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/weather/:district — latest weather for a district
router.get('/weather/:district', auth, async (req, res) => {
  try {
    const data = await WeatherData.findOne({ district: req.params.district })
      .sort({ fetchedAt: -1 });
    res.json({ success: true, weather: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/weather — ingest weather data (from IMD polling or ML service)
router.post('/weather', auth, requireRole('admin'), async (req, res) => {
  try {
    const data = await WeatherData.create(req.body);
    res.status(201).json({ success: true, weather: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events — landslide events
router.get('/events', auth, async (req, res) => {
  try {
    const { district, severity, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (district) query.district = district;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const events = await LandslideEvent.find(query)
      .populate('reportedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await LandslideEvent.countDocuments(query);

    res.json({ success: true, events, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events — report a landslide event
router.post('/events', auth, async (req, res) => {
  try {
    const event = await LandslideEvent.create({ ...req.body, reportedBy: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/field-reports
router.get('/field-reports', auth, async (req, res) => {
  try {
    const { status, urgency, district, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (district) query.district = district;

    const reports = await FieldReport.find(query)
      .populate('reporter', 'name role district')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await FieldReport.countDocuments(query);
    res.json({ success: true, reports, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/field-reports — submit a field report
router.post('/field-reports', auth, async (req, res) => {
  try {
    const report = await FieldReport.create({
      ...req.body,
      reporter: req.user._id,
      district: req.body.district || req.user.district,
      syncStatus: 'synced',
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/field-reports/:id/assess — officer assessment
router.put('/field-reports/:id/assess', auth, requireRole('admin', 'district_admin', 'field_officer'), async (req, res) => {
  try {
    const report = await FieldReport.findByIdAndUpdate(
      req.params.id,
      {
        status: 'investigating',
        officialAssessment: {
          assessedBy: req.user._id,
          severity: req.body.severity,
          actionTaken: req.body.actionTaken,
          assessedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/stats — aggregated dashboard stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const [riskStats, eventStats, alertStats, reportStats] = await Promise.all([
      RiskZone.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),
      LandslideEvent.aggregate([
        { $group: { _id: { severity: '$severity', status: '$status' }, count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      FieldReport.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRiskZones = riskStats.reduce((sum, r) => sum + r.count, 0);
    const criticalZones = riskStats.find(r => r._id === 'critical')?.count || 0;
    const activeAlerts = alertStats.reduce((sum, r) => sum + r.count, 0);
    const pendingReports = reportStats.find(r => r._id === 'pending')?.count || 0;

    res.json({
      success: true,
      stats: {
        riskZones: { total: totalRiskZones, critical: criticalZones, breakdown: riskStats },
        events: { breakdown: eventStats },
        alerts: { active: activeAlerts, breakdown: alertStats },
        reports: { pending: pendingReports, breakdown: reportStats },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
