const mongoose = require('mongoose');

const BatesConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bates configuration name is required']
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  startNumber: {
    type: Number,
    default: 1
  },
  padding: {
    type: Number,
    default: 5
  },
  format: {
    type: String,
    enum: ['sequential', 'alphanumeric'],
    default: 'sequential'
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
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
BatesConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BatesConfig', BatesConfigSchema);
