const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/alerts — list alerts
router.get('/', auth, async (req, res) => {
  try {
    const { status, severity, district, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (district) query.district = district;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate('issuedBy', 'name role')
      .sort({ issuedAt: -1 })
      .limit(100);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/alerts — issue new alert (admin/field_officer)
router.post('/', auth, requireRole('admin', 'district_admin', 'field_officer'), async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      issuedBy: req.user._id,
      channels: req.body.channels || ['in_app', 'dashboard'],
    });
    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { acknowledgedBy: req.user._id } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', auth, requireRole('admin', 'district_admin'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/alerts/active — active alerts for mobile/dashboard
router.get('/active', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' })
      .sort({ severity: -1, issuedAt: -1 })
      .limit(50);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
