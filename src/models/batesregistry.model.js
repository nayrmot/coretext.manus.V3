const mongoose = require('mongoose');

const BatesRegistrySchema = new mongoose.Schema({
  configId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatesConfig',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  batesNumber: {
    type: String,
    required: true
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalPath: {
    type: String,
    required: true
  },
  labeledPath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BatesRegistry', BatesRegistrySchema);
