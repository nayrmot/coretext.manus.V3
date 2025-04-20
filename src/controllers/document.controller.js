const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/document.model');
const driveService = require('../services/drive.service');
const documentAiService = require('../services/documentai.service');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, PNG, and TIFF files are allowed.'));
    }
  }
}).single('document');

// Upload document
exports.uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    try {
      // Extract metadata using Document AI
      const metadata = await documentAiService.extractMetadata(req.file.path);
      
      // Create document in database
      const document = await Document.create({
        name: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user.id,
        case: req.body.caseId,
        category: req.body.category || 'Uncategorized',
        metadata
      });
      
      // Upload to Google Drive if enabled
      if (req.body.uploadToDrive === 'true') {
        const driveFile = await driveService.uploadFile(
          req.file.path,
          req.file.originalname,
          req.file.mimetype,
          req.body.folderId
        );
        
        // Update document with Drive file ID
        document.driveFileId = driveFile.id;
        document.driveLink = driveFile.webViewLink;
        await document.save();
      }
      
      res.status(201).json({
        success: true,
        document
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const { caseId, category, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (caseId) query.case = caseId;
    if (category) query.category = category;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get documents
    const documents = await Document.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .populate('case', 'name');
    
    // Get total count
    const total = await Document.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('case', 'name');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const { name, category, metadata } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Update document
    if (name) document.name = name;
    if (category) document.category = category;
    if (metadata) document.metadata = { ...document.metadata, ...metadata };
    
    await document.save();
    
    // Update on Google Drive if file exists there
    if (document.driveFileId) {
      await driveService.updateFile(document.driveFileId, { name });
    }
    
    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete from Google Drive if file exists there
    if (document.driveFileId) {
      await driveService.deleteFile(document.driveFileId);
    }
    
    // Delete local file
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }
    
    // Delete document from database
    await document.remove();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Categorize document
exports.categorizeDocument = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Update category
    document.category = category;
    await document.save();
    
    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error categorizing document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Batch categorize documents
exports.batchCategorizeDocuments = async (req, res) => {
  try {
    const { documentIds, category } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs are required'
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    // Update documents
    const result = await Document.updateMany(
      { _id: { $in: documentIds } },
      { $set: { category } }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.nModified} documents categorized successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error batch categorizing documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search documents
exports.searchDocuments = async (req, res) => {
  try {
    const { query, caseId, category, page = 1, limit = 10 } = req.query;
    
    // Build search query
    const searchQuery = {};
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { 'metadata.text': { $regex: query, $options: 'i' } }
      ];
    }
    if (caseId) searchQuery.case = caseId;
    if (category) searchQuery.category = category;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get documents
    const documents = await Document.find(searchQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .populate('case', 'name');
    
    // Get total count
    const total = await Document.countDocuments(searchQuery);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get document versions
exports.getDocumentVersions = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get versions from Google Drive if file exists there
    if (document.driveFileId) {
      const versions = await driveService.getFileVersions(document.driveFileId);
      
      res.status(200).json({
        success: true,
        versions
      });
    } else {
      res.status(200).json({
        success: true,
        versions: []
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving document versions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get specific document version
exports.getDocumentVersion = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get version from Google Drive if file exists there
    if (document.driveFileId) {
      const version = await driveService.getFileVersion(
        document.driveFileId,
        req.params.versionId
      );
      
      if (!version) {
        return res.status(404).json({
          success: false,
          message: 'Version not found'
        });
      }
      
      res.status(200).json({
        success: true,
        version
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Document has no versions'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving document version',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Revert to specific document version
exports.revertToVersion = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Revert to version in Google Drive if file exists there
    if (document.driveFileId) {
      await driveService.revertToVersion(
        document.driveFileId,
        req.params.versionId
      );
      
      res.status(200).json({
        success: true,
        message: 'Document reverted to specified version'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Document has no versions'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reverting document to version',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
