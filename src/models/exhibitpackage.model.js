const mongoose = require('mongoose');
const config = require('../config/config');

const ExhibitPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exhibit package name is required']
  },
  description: {
    type: String
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  exhibits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exhibit'
  }],
  eventType: {
    type: String,
    enum: ['deposition', 'hearing', 'trial', 'other'],
    default: 'other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ExhibitPackageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExhibitPackage', ExhibitPackageSchema);
