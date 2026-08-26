const mongoose = require('mongoose');

const fieldReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['crack', 'slope_movement', 'road_block', 'water_seepage', 'subsidence', 'debris_flow', 'other'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  address: { type: String },
  district: { type: String, index: true },
  // Media
  photos: [{ type: String }], // file paths
  videos: [{ type: String }],
  // Assessment
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  officialAssessment: {
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    severity: { type: String, enum: ['minor', 'moderate', 'major', 'catastrophic'] },
    actionTaken: { type: String },
    assessedAt: { type: Date },
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
  },
  // Offline sync support
  clientTimestamp: { type: Date }, // when created on device
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'synced',
  },
}, { timestamps: true });

fieldReportSchema.index({ location: '2dsphere' });
fieldReportSchema.index({ status: 1, urgency: 1 });

module.exports = mongoose.model('FieldReport', fieldReportSchema);
