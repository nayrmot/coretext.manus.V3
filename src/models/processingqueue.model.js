const mongoose = require('mongoose');
const config = require('../config/config');

const ProcessingQueueSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  processType: {
    type: String,
    enum: ['bates_labeling', 'ocr', 'categorization', 'exhibit_sticker', 'watermark'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 1
  },
  params: {
    type: Object,
    default: {}
  },
  result: {
    type: Object,
    default: null
  },
  error: {
    type: String
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProcessingQueue', ProcessingQueueSchema);
