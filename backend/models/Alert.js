const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['landslide_warning', 'rainfall_warning', 'road_blockage', 'evacuation', 'all_clear'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  // Location
  district: { type: String, required: true, index: true },
  state: { type: String, default: 'Assam' },
  affectedArea: {
    type: { type: String, enum: ['Polygon', 'Point'], default: 'Point' },
    coordinates: mongoose.Schema.Types.Mixed,
  },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  radius: { type: Number, default: 5000 }, // meters
  // Trigger info
  triggeredBy: {
    type: String,
    enum: ['ai_prediction', 'rainfall_threshold', 'field_report', 'manual', 'satellite'],
    required: true,
  },
  riskScore: { type: Number },
  rainfallMm: { type: Number },
  // Distribution
  channels: [{
    type: String,
    enum: ['in_app', 'sms', 'dashboard', 'push'],
  }],
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  recipientCount: { type: Number, default: 0 },
  // Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'expired'],
    default: 'active',
  },
  // Multilingual
  translations: {
    as: { title: String, message: String },  // Assamese
    bn: { title: String, message: String },  // Bengali
    hi: { title: String, message: String },  // Hindi
    mni: { title: String, message: String }, // Manipuri
    lus: { title: String, message: String }, // Mizo
  },
  // Lifecycle
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

alertSchema.index({ district: 1, status: 1 });
alertSchema.index({ severity: 1, issuedAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
