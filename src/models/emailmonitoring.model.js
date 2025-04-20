const mongoose = require('mongoose');
const config = require('../config/config');

const EmailMonitoringSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  labelIds: [{
    type: String,
    required: true
  }],
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  category: {
    type: String,
    default: 'Email'
  },
  frequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'hourly'
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'stopped'],
    default: 'active'
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
EmailMonitoringSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailMonitoring', EmailMonitoringSchema);
