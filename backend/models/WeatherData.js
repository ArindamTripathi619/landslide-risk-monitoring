const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  district: { type: String, required: true, index: true },
  state: { type: String, default: 'Assam' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  // Current conditions
  rainfall: {
    current: { type: Number, default: 0 },        // mm/hr
    last1hr: { type: Number, default: 0 },
    last6hr: { type: Number, default: 0 },
    last24hr: { type: Number, default: 0 },
    last7days: { type: Number, default: 0 },
  },
  temperature: {
    current: { type: Number },
    max: { type: Number },
    min: { type: Number },
  },
  humidity: { type: Number },
  windSpeed: { type: Number },
  // IMD warning
  imdWarning: {
    level: { type: String, enum: ['none', 'yellow', 'orange', 'red'], default: 'none' },
    message: { type: String },
    validUntil: { type: Date },
  },
  // Source tracking
  source: { type: String, default: 'imd_api' },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

weatherDataSchema.index({ location: '2dsphere' });
weatherDataSchema.index({ district: 1, fetchedAt: -1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);
