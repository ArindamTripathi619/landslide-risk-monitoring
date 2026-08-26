const mongoose = require('mongoose');

const riskZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
    default: 'Assam',
  },
  // Risk scoring
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high', 'critical'],
    required: true,
    index: true,
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  // Contributing factors
  factors: {
    slope: { type: Number },           // degrees
    aspect: { type: Number },          // compass direction
    elevation: { type: Number },       // meters
    soilType: { type: String },
    landCover: { type: String },
    ndvi: { type: Number },            // vegetation index (-1 to 1)
    rainfallThreshold: { type: Number }, // mm/day trigger
    distanceToRoad: { type: Number },   // meters
    historicalEvents: { type: Number, default: 0 },
  },
  // Geospatial
  geometry: {
    type: { type: String, enum: ['Polygon', 'Point'], required: true },
    coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  // Metadata
  lastAssessed: { type: Date, default: Date.now },
  source: { type: String, default: 'manual' }, // 'manual', 'ml_prediction', 'ilsm'
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

riskZoneSchema.index({ center: '2dsphere' });
riskZoneSchema.index({ riskLevel: 1, district: 1 });

module.exports = mongoose.model('RiskZone', riskZoneSchema);
