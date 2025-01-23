const mongoose = require('mongoose');

const pendingLocationSchema = new mongoose.Schema({
  parcel: { type: String, default: '' },
  designer: { type: String, default: '' },
  constructionCompany: { type: String, default: '' },
  landUseZone: { type: String, default: '' },
  aboveGroundFloors: { type: String, default: '' },
  undergroundFloors: { type: String, default: '' },
  solarPower: { type: String, default: '' },
  universalBathroom: { type: String, default: '' },
  universalCommonRoom: { type: String, default: '' },
  universalElevator: { type: String, default: '' },
  landscapeBalcony: { type: String, default: '' },
  rainwaterCollection: { type: String, default: '' },
  frontGreenEnergy: { type: String, default: '' },
  backGreenEnergy: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  uploaded_by: { type: String, required: true },
  collection: { type: String, required: true, enum: ['sample_data', 'pending_data', 'reviewed_data'] }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true,
  collection: 'data.pending_data'
});

module.exports = mongoose.model('PendingLocation', pendingLocationSchema);