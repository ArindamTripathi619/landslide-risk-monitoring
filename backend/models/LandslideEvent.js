const mongoose = require('mongoose');

const landslideEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  district: { type: String, required: true, index: true },
  state: { type: String, default: 'Assam' },
  // Event details
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'catastrophic'],
    required: true,
  },
  triggerType: {
    type: String,
    enum: ['rainfall', 'earthquake', 'human_activity', 'natural_erosion', 'unknown'],
    default: 'rainfall',
  },
  rainfallAtEvent: { type: Number }, // mm
  // Impact
  affectedArea: { type: Number },     // sq meters
  roadBlocked: { type: Boolean, default: false },
  roadName: { type: String },
  casualties: { type: Number, default: 0 },
  displaced: { type: Number, default: 0 },
  infrastructureDamage: { type: String },
  // Geospatial
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  // Media
  photos: [{ url: String, caption: String }],
  // Status
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved'],
    default: 'active',
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, default: 'field_report' }, // 'field_report', 'nasa_glc', 'news', 'sensor'
  // Resolution
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

landslideEventSchema.index({ location: '2dsphere' });
landslideEventSchema.index({ district: 1, severity: 1 });
landslideEventSchema.index({ status: 1 });

module.exports = mongoose.model('LandslideEvent', landslideEventSchema);
