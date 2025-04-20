const mongoose = require('mongoose');

const ExhibitSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Exhibit title is required']
  },
  description: {
    type: String
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  exhibitNumber: {
    type: String
  },
  exhibitPath: {
    type: String
  },
  status: {
    type: String,
    enum: ['designated', 'prepared', 'used', 'admitted', 'rejected'],
    default: 'designated'
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
ExhibitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Exhibit', ExhibitSchema);
