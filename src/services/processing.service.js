const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const ProcessingQueue = require('../models/processingqueue.model');
const Document = require('../models/document.model');
const pdfUtil = require('../utils/pdf.util');
const documentUtil = require('../utils/document.util');
const notificationUtil = require('../utils/notification.util');

// Process next item in queue
exports.processNextItem = async () => {
  try {
    // Find next pending item with highest priority
    const queueItem = await ProcessingQueue.findOne({ status: 'pending' })
      .sort({ priority: -1, createdAt: 1 })
      .populate('documentId');
    
    if (!queueItem) {
      return null; // No pending items
    }
    
    // Update status to processing
    queueItem.status = 'processing';
    queueItem.startTime = new Date();
    await queueItem.save();
    
    try {
      // Process based on type
      let result;
      
      switch (queueItem.processType) {
        case 'bates_labeling':
          result = await processBatesLabeling(queueItem);
          break;
        case 'ocr':
          result = await processOCR(queueItem);
          break;
        case 'categorization':
          result = await processCategorization(queueItem);
          break;
        case 'exhibit_sticker':
          result = await processExhibitSticker(queueItem);
          break;
        case 'watermark':
          result = await processWatermark(queueItem);
          break;
        default:
          throw new Error(`Unknown process type: ${queueItem.processType}`);
      }
      
      // Update queue item with result
      queueItem.status = 'completed';
      queueItem.result = result;
      queueItem.endTime = new Date();
      await queueItem.save();
      
      return queueItem;
    } catch (error) {
      // Update queue item with error
      queueItem.status = 'failed';
      queueItem.error = error.message;
      queueItem.endTime = new Date();
      await queueItem.save();
      
      throw error;
    }
  } catch (error) {
    console.error('Error processing queue item:', error);
    throw error;
  }
};

// Process Bates labeling
async function processBatesLabeling(queueItem) {
  const { documentId, params } = queueItem;
  const { batesNumber, position, uploadToDrive, notifyEmail } = params;
  
  // Apply Bates label to document
  const labeledPath = await pdfUtil.applyBatesLabel(
    documentId.path,
    batesNumber,
    position
  );
  
  // Update document with Bates label info
  const document = await Document.findById(documentId._id);
  document.batesLabel = {
    batesNumber,
    labeledPath
  };
  await document.save();
  
  // Upload labeled document to Google Drive if requested
  if (uploadToDrive) {
    const driveFile = await documentUtil.uploadBatesLabeledDocument(
      documentId.path,
      labeledPath,
      documentId.name,
      documentId.case,
      queueItem.submittedBy
    );
    
    // Update document with Drive file info
    document.batesLabel.driveFileId = driveFile.id;
    document.batesLabel.driveLink = driveFile.webViewLink;
    await document.save();
  }
  
  // Send notification if requested
  if (notifyEmail) {
    await notificationUtil.sendBatesLabeledNotification(
      queueItem.submittedBy,
      document,
      batesNumber,
      notifyEmail
    );
  }
  
  return {
    labeledPath,
    batesNumber,
    driveFileId: document.batesLabel.driveFileId,
    driveLink: document.batesLabel.driveLink
  };
}

// Process OCR
async function processOCR(queueItem) {
  const { documentId } = queueItem;
  
  // In a real implementation, this would use Google Cloud Document AI
  // For now, we'll just return mock data
  const ocrText = 'Sample text extracted from document via OCR';
  
  // Update document with OCR text
  const document = await Document.findById(documentId._id);
  document.metadata = {
    ...document.metadata,
    ocrText,
    ocrProcessed: true,
    ocrProcessedAt: new Date()
  };
  await document.save();
  
  return {
    ocrText,
    ocrProcessed: true
  };
}

// Process categorization
async function processCategorization(queueItem) {
  const { documentId } = queueItem;
  
  // In a real implementation, this would use Google Cloud AI Platform
  // For now, we'll just categorize based on file extension
  const document = await Document.findById(documentId._id);
  const fileExt = path.extname(document.path).toLowerCase();
  
  let category = 'Uncategorized';
  
  if (fileExt === '.pdf') {
    category = 'Document';
  } else if (['.doc', '.docx'].includes(fileExt)) {
    category = 'Correspondence';
  } else if (['.jpg', '.jpeg', '.png', '.tiff'].includes(fileExt)) {
    category = 'Image';
  }
  
  // Update document with category
  document.category = category;
  await document.save();
  
  return {
    category,
    confidence: 0.85
  };
}

// Process exhibit sticker
async function processExhibitSticker(queueItem) {
  const { documentId, params } = queueItem;
  const { exhibitNumber } = params;
  
  // Apply exhibit sticker to document
  const exhibitPath = await pdfUtil.applyExhibitSticker(
    documentId.path,
    exhibitNumber
  );
  
  // Update document with exhibit info
  const document = await Document.findById(documentId._id);
  document.metadata = {
    ...document.metadata,
    exhibitNumber,
    exhibitPath
  };
  await document.save();
  
  return {
    exhibitPath,
    exhibitNumber
  };
}

// Process watermark
async function processWatermark(queueItem) {
  const { documentId, params } = queueItem;
  const { watermarkText } = params;
  
  // Apply watermark to document
  const watermarkedPath = await pdfUtil.applyWatermark(
    documentId.path,
    watermarkText
  );
  
  // Update document with watermark info
  const document = await Document.findById(documentId._id);
  document.metadata = {
    ...document.metadata,
    watermarked: true,
    watermarkedPath
  };
  await document.save();
  
  return {
    watermarkedPath,
    watermarkText
  };
}
