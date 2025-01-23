const mongoose = require('mongoose');

const reviewedLocationSchema = new mongoose.Schema({
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
  approved_by: { type: String, required: true },
  approved_datetime: { type: Date, required: true }
}, {
  timestamps: true,
  collection: 'reviewed_data'
});

module.exports = mongoose.model('ReviewedLocation', reviewedLocationSchema);