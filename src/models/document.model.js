const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required']
  },
  path: {
    type: String,
    required: [true, 'Document path is required']
  },
  mimeType: {
    type: String,
    required: [true, 'Document MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'Document size is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  metadata: {
    type: Object,
    default: {}
  },
  driveFileId: {
    type: String
  },
  driveLink: {
    type: String
  },
  batesLabel: {
    registryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BatesRegistry'
    },
    batesNumber: String
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
DocumentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);
