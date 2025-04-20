const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Case name is required']
  },
  description: {
    type: String
  },
  client: {
    type: String
  },
  caseNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed from required: true to make this field optional
  },
  driveFolderId: {
    type: String
  },
  folderStructure: {
    caseFolder: {
      id: String,
      name: String
    },
    subfolders: {
      originalDocs: {
        id: String,
        name: String
      },
      labeledDocs: {
        id: String,
        name: String
      },
      pleadings: {
        id: String,
        name: String
      },
      discovery: {
        id: String,
        name: String
      },
      medicalRecords: {
        id: String,
        name: String
      },
      correspondence: {
        id: String,
        name: String
      }
    }
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
CaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Case', CaseSchema);
