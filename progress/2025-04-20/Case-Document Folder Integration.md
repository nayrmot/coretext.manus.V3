# Case-Document Folder Integration

## Overview

This document outlines the integration between the CoreText case management system and the document folder structure in Google Drive. Based on the user's requirements and the provided Python script, this integration will ensure that each case can define its top-level "Documents" folder location, maintain compatibility with the existing Google Drive folder structure, and leverage the AI-assisted folder management capabilities.

## Integration Architecture

### 1. Data Model Integration

The case and document management systems will be integrated at the data model level to ensure seamless operation:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Case Model     │──────│  Client Model   │──────│  Document Model │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  Google Drive Integration Layer                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.1 Enhanced Case Model

```javascript
// src/models/case.model.js
const mongoose = require('mongoose');

const caseSchema = mongoose.Schema({
  // Existing fields
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active'
  },
  
  // New fields for document folder integration
  documentFolderLocation: {
    type: String,
    trim: true
  },
  googleDriveFolderId: {
    type: String
  },
  folderStructure: {
    type: [String],
    default: [
      "CaseMap", 
      "Communications", 
      "Contract", 
      "Costs", 
      "Discovery", 
      "Documents",
      "Documents/Bates Labeled", 
      "Documents/Bates Labeled/01-Medical Records",
      "Documents/Bates Labeled/02-Medical Bills",
      "Documents/Original",
      "Documents/Original/01-Medical Records",
      "Documents/Original/02-Medical Bills",
      "Experts", 
      "Experts/Plaintiffs",
      "Experts/Defendants", 
      "Motions", 
      "Notices", 
      "Pleadings", 
      "Research", 
      "Settlement", 
      "Trial"
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);
```

#### 1.2 Enhanced Client Model

```javascript
// src/models/client.model.js
const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
  // Existing fields
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  isEstate: {
    type: Boolean,
    default: false
  },
  
  // New fields for document folder integration
  googleDriveFolderId: {
    type: String
  },
  displayName: {
    type: String,
    get: function() {
      if (this.isEstate) {
        return `Estate of ${this.firstName} ${this.lastName}`;
      } else {
        return `${this.lastName}, ${this.firstName}`;
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Client', clientSchema);
```

#### 1.3 Document Model

```javascript
// src/models/document.model.js
const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  fileType: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  googleDriveFileId: {
    type: String
  },
  googleDriveFolderId: {
    type: String
  },
  path: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  tags: {
    type: [String]
  },
  isBatesLabeled: {
    type: Boolean,
    default: false
  },
  batesNumber: {
    type: String,
    trim: true
  },
  originalDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
```

### 2. Service Layer Integration

The service layer will handle the integration between the case management system and Google Drive:

#### 2.1 Document Service

```javascript
// src/services/document.service.js
const Document = require('../models/document.model');
const Case = require('../models/case.model');
const Client = require('../models/client.model');
const googleDriveService = require('./google-drive.service');
const folderSuggestionService = require('./folder-suggestion.service');

class DocumentService {
  /**
   * Get document folder path for a case
   * @param {string} caseId - Case ID
   * @returns {Promise<Object>} Folder information
   */
  async getDocumentFolderPath(caseId) {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }
      
      // If case has Google Drive folder ID, use it
      if (caseItem.googleDriveFolderId) {
        const folderDetails = await googleDriveService.getFolderDetails(caseItem.googleDriveFolderId);
        return {
          path: caseItem.documentFolderLocation || folderDetails.name,
          googleDriveFolderId: caseItem.googleDriveFolderId,
          webViewLink: folderDetails.webViewLink
        };
      }
      
      // If case has document folder location but no Google Drive ID
      if (caseItem.documentFolderLocation) {
        return {
          path: caseItem.documentFolderLocation,
          googleDriveFolderId: null,
          webViewLink: null
        };
      }
      
      // If case has neither, return null
      return null;
    } catch (error) {
      console.error('Error getting document folder path:', error);
      throw error;
    }
  }
  
  /**
   * Get document folder path for a client
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Folder information
   */
  async getClientFolderPath(clientId) {
    try {
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }
      
      // If client has Google Drive folder ID, use it
      if (client.googleDriveFolderId) {
        const folderDetails = await googleDriveService.getFolderDetails(client.googleDriveFolderId);
        return {
          path: client.displayName,
          googleDriveFolderId: client.googleDriveFolderId,
          webViewLink: folderDetails.webViewLink
        };
      }
      
      // If client has no Google Drive ID, try to find it
      const suggestions = await folderSuggestionService.suggestClientFolder(clientId);
      
      if (suggestions.length > 0) {
        const bestMatch = suggestions[0];
        
        // Update client with Google Drive folder ID
        client.googleDriveFolderId = bestMatch.id;
        await client.save();
        
        return {
          path: client.displayName,
          googleDriveFolderId: bestMatch.id,
          webViewLink: bestMatch.webViewLink,
          confidence: bestMatch.score
        };
      }
      
      // If no folder found, return just the path
      return {
        path: client.displayName,
        googleDriveFolderId: null,
        webViewLink: null
      };
    } catch (error) {
      console.error('Error getting client folder path:', error);
      throw error;
    }
  }
  
  /**
   * Get complete document path
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Complete path information
   */
  async getDocumentPath(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      const caseItem = await Case.findById(document.caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }
      
      let clientInfo = null;
      if (document.clientId) {
        const client = await Client.findById(document.clientId);
        if (client) {
          clientInfo = await this.getClientFolderPath(client._id);
        }
      }
      
      const caseInfo = await this.getDocumentFolderPath(caseItem._id);
      
      // Determine document category path
      let categoryPath = '';
      if (document.isBatesLabeled) {
        categoryPath = 'Documents/Bates Labeled';
        if (document.category) {
          categoryPath += `/${document.category}`;
        }
      } else {
        categoryPath = 'Documents/Original';
        if (document.category) {
          categoryPath += `/${document.category}`;
        }
      }
      
      return {
        document: {
          id: document._id,
          title: document.title,
          googleDriveFileId: document.googleDriveFileId
        },
        case: caseInfo,
        client: clientInfo,
        category: categoryPath,
        fullPath: clientInfo 
          ? `${clientInfo.path}/${categoryPath}/${document.title}`
          : `${caseInfo.path}/${categoryPath}/${document.title}`
      };
    } catch (error) {
      console.error('Error getting document path:', error);
      throw error;
    }
  }
  
  /**
   * Get documents by case
   * @param {string} caseId - Case ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Documents
   */
  async getDocumentsByCase(caseId, options = {}) {
    try {
      const query = { caseId };
      
      // Apply filters
      if (options.clientId) {
        query.clientId = options.clientId;
      }
      
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.isBatesLabeled !== undefined) {
        query.isBatesLabeled = options.isBatesLabeled;
      }
      
      if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }
      
      // Apply pagination
      const limit = options.limit || 20;
      const skip = options.page ? (options.page - 1) * limit : 0;
      
      // Apply sorting
      const sort = options.sort || { uploadedAt: -1 };
      
      const documents = await Document.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clientId', 'firstName lastName isEstate displayName')
        .populate('uploadedBy', 'name email');
      
      const total = await Document.countDocuments(query);
      
      return {
        documents,
        pagination: {
          total,
          page: options.page || 1,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting documents by case:', error);
      throw error;
    }
  }
  
  /**
   * Get documents by client
   * @param {string} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Documents
   */
  async getDocumentsByClient(clientId, options = {}) {
    try {
      const query = { clientId };
      
      // Apply filters
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.isBatesLabeled !== undefined) {
        query.isBatesLabeled = options.isBatesLabeled;
      }
      
      if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }
      
      // Apply pagination
      const limit = options.limit || 20;
      const skip = options.page ? (options.page - 1) * limit : 0;
      
      // Apply sorting
      const sort = options.sort || { uploadedAt: -1 };
      
      const documents = await Document.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('caseId', 'name status')
        .populate('uploadedBy', 'name email');
      
      const total = await Document.countDocuments(query);
      
      return {
        documents,
        pagination: {
          total,
          page: options.page || 1,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting documents by client:', error);
      throw error;
    }
  }
  
  /**
   * Create document
   * @param {Object} documentData - Document data
   * @param {Object} file - Uploaded file
   * @returns {Promise<Object>} Created document
   */
  async createDocument(documentData, file) {
    try {
      const { caseId, clientId, category, tags, description } = documentData;
      
      // Validate case
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }
      
      // Validate client if provided
      if (clientId) {
        const client = await Client.findById(clientId);
        if (!client) {
          throw new Error('Client not found');
        }
        
        // Ensure client belongs to case
        if (client.caseId.toString() !== caseId) {
          throw new Error('Client does not belong to the specified case');
        }
      }
      
      // Determine if document is Bates labeled
      const isBatesLabeled = documentData.isBatesLabeled === 'true' || documentData.isBatesLabeled === true;
      
      // Create document record
      const document = new Document({
        title: file.originalname,
        description,
        caseId,
        clientId: clientId || null,
        fileType: file.mimetype,
        fileSize: file.size,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isBatesLabeled,
        batesNumber: documentData.batesNumber || null,
        uploadedBy: documentData.userId,
        path: documentData.path || null
      });
      
      // Determine Google Drive folder path
      let folderPath;
      let parentFolderId;
      
      if (clientId) {
        // Get client folder
        const clientFolder = await this.getClientFolderPath(clientId);
        
        if (!clientFolder.googleDriveFolderId) {
          throw new Error('Client folder not found in Google Drive');
        }
        
        parentFolderId = clientFolder.googleDriveFolderId;
        folderPath = `${clientFolder.path}/${isBatesLabeled ? 'Documents/Bates Labeled' : 'Documents/Original'}`;
        
        if (category) {
          folderPath += `/${category}`;
        }
      } else {
        // Use case folder
        const caseFolder = await this.getDocumentFolderPath(caseId);
        
        if (!caseFolder.googleDriveFolderId) {
          throw new Error('Case folder not found in Google Drive');
        }
        
        parentFolderId = caseFolder.googleDriveFolderId;
        folderPath = `${caseFolder.path}/${isBatesLabeled ? 'Documents/Bates Labeled' : 'Documents/Original'}`;
        
        if (category) {
          folderPath += `/${category}`;
        }
      }
      
      // Create folder structure in Google Drive
      const folderStructure = folderPath.split('/').slice(1); // Remove client/case name
      const folders = await googleDriveService.createFolderStructure(folderStructure, parentFolderId);
      
      // Get the final folder ID (where the document will be uploaded)
      const finalFolderPath = folderPath.split('/').slice(1).join('/');
      const finalFolderId = folders[finalFolderPath];
      
      // Upload file to Google Drive
      const uploadedFile = await googleDriveService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        finalFolderId
      );
      
      // Update document with Google Drive file ID and folder ID
      document.googleDriveFileId = uploadedFile.id;
      document.googleDriveFolderId = finalFolderId;
      document.path = folderPath;
      
      await document.save();
      
      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  
  /**
   * Create Bates labeled version of document
   * @param {string} documentId - Original document ID
   * @param {Object} batesData - Bates labeling data
   * @param {Object} file - Bates labeled file
   * @returns {Promise<Object>} Created Bates labeled document
   */
  async createBatesLabeledVersion(documentId, batesData, file) {
    try {
      const originalDocument = await Document.findById(documentId);
      if (!originalDocument) {
        throw new Error('Original document not found');
      }
      
      if (originalDocument.isBatesLabeled) {
        throw new Error('Cannot create Bates labeled version of a Bates labeled document');
      }
      
      // Create Bates labeled document
      const batesDocument = new Document({
        title: file.originalname,
        description: originalDocument.description,
        caseId: originalDocument.caseId,
        clientId: originalDocument.clientId,
        fileType: file.mimetype,
        fileSize: file.size,
        category: originalDocument.category,
        tags: originalDocument.tags,
        isBatesLabeled: true,
        batesNumber: batesData.batesNumber,
        originalDocumentId: originalDocument._id,
        uploadedBy: batesData.userId,
        path: originalDocument.path.replace('Documents/Original', 'Documents/Bates Labeled')
      });
      
      // Determine Google Drive folder path
      let parentFolderId;
      
      if (originalDocument.clientId) {
        // Get client folder
        const clientFolder = await this.getClientFolderPath(originalDocument.clientId);
        
        if (!clientFolder.googleDriveFolderId) {
          throw new Error('Client folder not found in Google Drive');
        }
        
        parentFolderId = clientFolder.googleDriveFolderId;
      } else {
        // Use case folder
        const caseFolder = await this.getDocumentFolderPath(originalDocument.caseId);
        
        if (!caseFolder.googleDriveFolderId) {
          throw new Error('Case folder not found in Google Drive');
        }
        
        parentFolderId = caseFolder.googleDriveFolderId;
      }
      
      // Create folder structure in Google Drive
      const folderPath = originalDocument.path.replace('Documents/Original', 'Documents/Bates Labeled');
      const folderStructure = folderPath.split('/').slice(1); // Remove client/case name
      const folders = await googleDriveService.createFolderStructure(folderStructure, parentFolderId);
      
      // Get the final folder ID (where the document will be uploaded)
      const finalFolderPath = folderPath.split('/').slice(1).join('/');
      const finalFolderId = folders[finalFolderPath];
      
      // Upload file to Google Drive
      const uploadedFile = await googleDriveService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        finalFolderId
      );
      
      // Update document with Google Drive file ID and folder ID
      batesDocument.googleDriveFileId = uploadedFile.id;
      batesDocument.googleDriveFolderId = finalFolderId;
      
      await batesDocument.save();
      
      return batesDocument;
    } catch (error) {
      console.error('Error creating Bates labeled version:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
```

### 3. Controller Layer Integration

The controller layer will handle the HTTP requests and responses for document management:

#### 3.1 Document Controller

```javascript
// src/controllers/document.controller.js
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const documentService = require('../services/document.service');
const googleDriveService = require('../services/google-drive.service');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get documents by case
const getDocumentsByCase = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { page, limit, clientId, category, isBatesLabeled, tags, sort } = req.query;
  
  const options = {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    clientId,
    category,
    isBatesLabeled: isBatesLabeled === 'true',
    tags: tags ? tags.split(',') : undefined,
    sort: sort ? JSON.parse(sort) : undefined
  };
  
  const result = await documentService.getDocumentsByCase(caseId, options);
  
  res.json({
    success: true,
    data: result.documents,
    pagination: result.pagination
  });
});

// Get documents by client
const getDocumentsByClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { page, limit, category, isBatesLabeled, tags, sort } = req.query;
  
  const options = {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    category,
    isBatesLabeled: isBatesLabeled === 'true',
    tags: tags ? tags.split(',') : undefined,
    sort: sort ? JSON.parse(sort) : undefined
  };
  
  const result = await documentService.getDocumentsByClient(clientId, options);
  
  res.json({
    success: true,
    data: result.documents,
    pagination: result.pagination
  });
});

// Get document by ID
const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const document = await documentService.getDocumentById(id);
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  res.json({
    success: true,
    data: document
  });
});

// Get document path
const getDocumentPath = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const path = await documentService.getDocumentPath(id);
  
  res.json({
    success: true,
    data: path
  });
});

// Upload document
const uploadDocument = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }
    
    const documentData = {
      ...req.body,
      userId: req.user.id
    };
    
    const document = await documentService.createDocument(documentData, req.file);
    
    res.status(201).json({
      success: true,
      data: document
    });
  })
];

// Upload Bates labeled version
const uploadBatesLabeledVersion = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }
    
    const { documentId } = req.params;
    
    const batesData = {
      ...req.body,
      userId: req.user.id
    };
    
    const document = await documentService.createBatesLabeledVersion(documentId, batesData, req.file);
    
    res.status(201).json({
      success: true,
      data: document
    });
  })
];

// Delete document
const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const document = await documentService.deleteDocument(id);
  
  res.json({
    success: true,
    data: document
  });
});

// Get document download URL
const getDocumentDownloadUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const document = await documentService.getDocumentById(id);
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  if (!document.googleDriveFileId) {
    res.status(404);
    throw new Error('Document file not found in Google Drive');
  }
  
  const downloadUrl = await googleDriveService.getDownloadUrl(document.googleDriveFileId);
  
  res.json({
    success: true,
    data: {
      downloadUrl,
      fileName: document.title
    }
  });
});

module.exports = {
  getDocumentsByCase,
  getDocumentsByClient,
  getDocumentById,
  getDocumentPath,
  uploadDocument,
  uploadBatesLabeledVersion,
  deleteDocument,
  getDocumentDownloadUrl
};
```

#### 3.2 Document Routes

```javascript
// src/routes/document.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getDocumentsByCase,
  getDocumentsByClient,
  getDocumentById,
  getDocumentPath,
  uploadDocument,
  uploadBatesLabeledVersion,
  deleteDocument,
  getDocumentDownloadUrl
} = require('../controllers/document.controller');

const router = express.Router();

// Case document routes
router.route('/case/:caseId')
  .get(protect, getDocumentsByCase);

// Client document routes
router.route('/client/:clientId')
  .get(protect, getDocumentsByClient);

// Document routes
router.route('/:id')
  .get(protect, getDocumentById)
  .delete(protect, deleteDocument);

router.route('/:id/path')
  .get(protect, getDocumentPath);

router.route('/:id/download')
  .get(protect, getDocumentDownloadUrl);

router.route('/:documentId/bates')
  .post(protect, uploadBatesLabeledVersion);

router.route('/')
  .post(protect, uploadDocument);

module.exports = router;
```

### 4. User Interface Integration

The user interface will be enhanced to support the document folder integration:

#### 4.1 Document Upload Component

```javascript
// public/js/document-upload.js
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const uploadForm = document.getElementById('documentUploadForm');
  const caseSelect = document.getElementById('caseSelect');
  const clientSelect = document.getElementById('clientSelect');
  const categorySelect = document.getElementById('categorySelect');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressContainer = document.getElementById('uploadProgressContainer');
  const alertContainer = document.getElementById('alertContainer');
  const folderPathDisplay = document.getElementById('folderPathDisplay');
  
  // State variables
  let selectedCaseId = null;
  let selectedClientId = null;
  let folderPath = null;
  
  // Initialize
  function init() {
    setupEventListeners();
    loadCases();
  }
  
  // Set up event listeners
  function setupEventListeners() {
    uploadForm.addEventListener('submit', handleUpload);
    caseSelect.addEventListener('change', handleCaseChange);
    clientSelect.addEventListener('change', handleClientChange);
    categorySelect.addEventListener('change', updateFolderPath);
  }
  
  // Load cases
  async function loadCases() {
    try {
      const response = await fetch('/api/cases');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load cases');
      }
      
      const cases = data.data;
      
      // Populate case select
      caseSelect.innerHTML = '<option value="">Select Case</option>';
      
      cases.forEach(caseItem => {
        const option = document.createElement('option');
        option.value = caseItem._id;
        option.textContent = caseItem.name;
        caseSelect.appendChild(option);
      });
      
    } catch (error) {
      console.error('Error loading cases:', error);
      showAlert('danger', 'Failed to load cases. Please try again later.');
    }
  }
  
  // Handle case change
  async function handleCaseChange() {
    selectedCaseId = caseSelect.value;
    selectedClientId = null;
    
    // Reset client select
    clientSelect.innerHTML = '<option value="">Select Client (Optional)</option>';
    clientSelect.disabled = !selectedCaseId;
    
    if (!selectedCaseId) {
      folderPathDisplay.textContent = '';
      return;
    }
    
    try {
      // Load clients for selected case
      const response = await fetch(`/api/clients/case/${selectedCaseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load clients');
      }
      
      const clients = data.data;
      
      // Populate client select
      clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client._id;
        option.textContent = client.displayName;
        clientSelect.appendChild(option);
      });
      
      // Update folder path
      updateFolderPath();
      
    } catch (error) {
      console.error('Error loading clients:', error);
      showAlert('danger', 'Failed to load clients. Please try again later.');
    }
  }
  
  // Handle client change
  function handleClientChange() {
    selectedClientId = clientSelect.value;
    
    // Update folder path
    updateFolderPath();
  }
  
  // Update folder path display
  async function updateFolderPath() {
    if (!selectedCaseId) {
      folderPathDisplay.textContent = '';
      return;
    }
    
    try {
      let path;
      
      if (selectedClientId) {
        // Get client folder path
        const response = await fetch(`/api/folders/client/${selectedClientId}/path`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get client folder path');
        }
        
        path = data.data.path;
      } else {
        // Get case folder path
        const response = await fetch(`/api/folders/case/${selectedCaseId}/path`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get case folder path');
        }
        
        path = data.data.path;
      }
      
      // Add category if selected
      const category = categorySelect.value;
      const isBatesLabeled = document.querySelector('input[name="documentType"]:checked').value === 'bates';
      
      folderPath = path + (isBatesLabeled ? '/Documents/Bates Labeled' : '/Documents/Original');
      
      if (category) {
        folderPath += `/${category}`;
      }
      
      folderPathDisplay.textContent = folderPath;
      
    } catch (error) {
      console.error('Error updating folder path:', error);
      folderPathDisplay.textContent = 'Error: Could not determine folder path';
    }
  }
  
  // Handle document upload
  async function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedCaseId) {
      showAlert('warning', 'Please select a case.');
      return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
      showAlert('warning', 'Please select a file to upload.');
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    
    // Add form data
    formData.append('file', file);
    formData.append('caseId', selectedCaseId);
    
    if (selectedClientId) {
      formData.append('clientId', selectedClientId);
    }
    
    const category = categorySelect.value;
    if (category) {
      formData.append('category', category);
    }
    
    const tags = document.getElementById('documentTags').value;
    if (tags) {
      formData.append('tags', tags);
    }
    
    const description = document.getElementById('documentDescription').value;
    if (description) {
      formData.append('description', description);
    }
    
    const isBatesLabeled = document.querySelector('input[name="documentType"]:checked').value === 'bates';
    formData.append('isBatesLabeled', isBatesLabeled);
    
    if (isBatesLabeled) {
      const batesNumber = document.getElementById('batesNumber').value;
      if (batesNumber) {
        formData.append('batesNumber', batesNumber);
      }
    }
    
    // Show progress
    progressContainer.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    uploadBtn.disabled = true;
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', '/api/documents', true);
      
      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Track upload progress
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          progressBar.style.width = percentComplete + '%';
          progressBar.textContent = percentComplete + '%';
        }
      };
      
      // Handle response
      xhr.onload = function() {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          showAlert('success', 'Document uploaded successfully!');
          
          // Reset form
          uploadForm.reset();
          progressContainer.classList.add('d-none');
          folderPathDisplay.textContent = '';
          uploadBtn.disabled = false;
          
          // Redirect to document details
          setTimeout(() => {
            window.location.href = `/documents/${response.data._id}`;
          }, 1500);
        } else {
          let errorMessage = 'Failed to upload document.';
          
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.error || errorMessage;
          } catch (e) {
            console.error('Error parsing response:', e);
          }
          
          showAlert('danger', errorMessage);
          progressContainer.classList.add('d-none');
          uploadBtn.disabled = false;
        }
      };
      
      // Handle error
      xhr.onerror = function() {
        showAlert('danger', 'Network error occurred while uploading document.');
        progressContainer.classList.add('d-none');
        uploadBtn.disabled = false;
      };
      
      // Send request
      xhr.send(formData);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      showAlert('danger', 'Failed to upload document. Please try again later.');
      progressContainer.classList.add('d-none');
      uploadBtn.disabled = false;
    }
  }
  
  // Show alert message
  function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 150);
    }, 5000);
  }
  
  // Initialize
  init();
});
```

#### 4.2 Document Browser Component

```javascript
// public/js/document-browser.js
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const documentList = document.getElementById('documentList');
  const filterForm = document.getElementById('documentFilterForm');
  const categoryFilter = document.getElementById('categoryFilter');
  const typeFilter = document.getElementById('typeFilter');
  const searchInput = document.getElementById('documentSearch');
  const paginationContainer = document.getElementById('paginationContainer');
  const alertContainer = document.getElementById('alertContainer');
  const folderPathBreadcrumb = document.getElementById('folderPathBreadcrumb');
  
  // State variables
  let currentCaseId = null;
  let currentClientId = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentFilters = {};
  
  // Initialize
  function init() {
    // Get case/client ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCaseId = urlParams.get('caseId');
    currentClientId = urlParams.get('clientId');
    
    if (!currentCaseId && !currentClientId) {
      showAlert('danger', 'Case ID or Client ID is required.');
      return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load documents
    loadDocuments();
    
    // Load folder path
    loadFolderPath();
  }
  
  // Set up event listeners
  function setupEventListeners() {
    filterForm.addEventListener('submit', handleFilterSubmit);
    searchInput.addEventListener('keyup', debounce(handleSearch, 500));
    
    // Type filter change
    typeFilter.addEventListener('change', function() {
      currentFilters.isBatesLabeled = this.value === 'bates' ? true : this.value === 'original' ? false : undefined;
      loadDocuments();
    });
    
    // Category filter change
    categoryFilter.addEventListener('change', function() {
      currentFilters.category = this.value || undefined;
      loadDocuments();
    });
  }
  
  // Load folder path
  async function loadFolderPath() {
    try {
      let response;
      
      if (currentClientId) {
        response = await fetch(`/api/folders/client/${currentClientId}/path`);
      } else {
        response = await fetch(`/api/folders/case/${currentCaseId}/path`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load folder path');
      }
      
      const pathInfo = data.data;
      
      // Build breadcrumb
      let html = '';
      
      if (currentClientId) {
        // Case > Client > Documents
        html += `<li class="breadcrumb-item"><a href="/cases/${currentCaseId}">Case</a></li>`;
        html += `<li class="breadcrumb-item"><a href="/clients/${currentClientId}">Client</a></li>`;
        html += `<li class="breadcrumb-item active">${pathInfo.path}</li>`;
      } else {
        // Case > Documents
        html += `<li class="breadcrumb-item"><a href="/cases/${currentCaseId}">Case</a></li>`;
        html += `<li class="breadcrumb-item active">${pathInfo.path}</li>`;
      }
      
      folderPathBreadcrumb.innerHTML = html;
      
      // Add Google Drive link if available
      if (pathInfo.webViewLink) {
        const driveLink = document.createElement('a');
        driveLink.href = pathInfo.webViewLink;
        driveLink.target = '_blank';
        driveLink.className = 'btn btn-sm btn-outline-secondary ms-2';
        driveLink.innerHTML = '<i class="bi bi-google"></i> View in Google Drive';
        
        folderPathBreadcrumb.parentNode.appendChild(driveLink);
      }
      
    } catch (error) {
      console.error('Error loading folder path:', error);
      showAlert('danger', 'Failed to load folder path. Please try again later.');
    }
  }
  
  // Load documents
  async function loadDocuments() {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage);
      
      if (currentFilters.category) {
        queryParams.append('category', currentFilters.category);
      }
      
      if (currentFilters.isBatesLabeled !== undefined) {
        queryParams.append('isBatesLabeled', currentFilters.isBatesLabeled);
      }
      
      if (currentFilters.search) {
        queryParams.append('search', currentFilters.search);
      }
      
      // Make API request
      let url;
      
      if (currentClientId) {
        url = `/api/documents/client/${currentClientId}?${queryParams.toString()}`;
      } else {
        url = `/api/documents/case/${currentCaseId}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load documents');
      }
      
      const { documents, pagination } = data.data;
      
      // Update pagination state
      currentPage = pagination.page;
      totalPages = pagination.pages;
      
      // Render documents
      renderDocuments(documents);
      
      // Render pagination
      renderPagination(pagination);
      
    } catch (error) {
      console.error('Error loading documents:', error);
      showAlert('danger', 'Failed to load documents. Please try again later.');
    }
  }
  
  // Render documents
  function renderDocuments(documents) {
    if (documents.length === 0) {
      documentList.innerHTML = `
        <div class="text-center p-5">
          <p class="text-muted">No documents found</p>
          <a href="/documents/upload?caseId=${currentCaseId}${currentClientId ? `&clientId=${currentClientId}` : ''}" class="btn btn-primary">
            <i class="bi bi-upload"></i> Upload Document
          </a>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    documents.forEach(doc => {
      const fileIcon = getFileIcon(doc.fileType);
      const fileSize = formatFileSize(doc.fileSize);
      const uploadDate = new Date(doc.uploadedAt).toLocaleDateString();
      
      html += `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <div class="file-icon me-3">
                  <i class="${fileIcon} fs-1"></i>
                </div>
                <div>
                  <h5 class="card-title mb-1">${doc.title}</h5>
                  <p class="card-subtitle text-muted small">${fileSize} • ${uploadDate}</p>
                </div>
              </div>
              
              ${doc.description ? `<p class="card-text small">${doc.description}</p>` : ''}
              
              <div class="mt-3">
                ${doc.category ? `<span class="badge bg-secondary me-1">${doc.category}</span>` : ''}
                ${doc.isBatesLabeled ? `<span class="badge bg-primary me-1">Bates Labeled</span>` : ''}
                ${doc.batesNumber ? `<span class="badge bg-info me-1">${doc.batesNumber}</span>` : ''}
                ${doc.tags && doc.tags.length > 0 ? doc.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('') : ''}
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <a href="/documents/${doc._id}" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-info-circle"></i> Details
                </a>
                <a href="/api/documents/${doc._id}/download" class="btn btn-sm btn-outline-secondary" target="_blank">
                  <i class="bi bi-download"></i> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    documentList.innerHTML = `<div class="row">${html}</div>`;
  }
  
  // Render pagination
  function renderPagination(pagination) {
    if (pagination.pages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let html = `
      <nav aria-label="Document pagination">
        <ul class="pagination justify-content-center">
          <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.page - 1}" aria-label="Previous">
              <span aria-hidden="true">&laquo;</span>
            </a>
          </li>
    `;
    
    // Generate page links
    for (let i = 1; i <= pagination.pages; i++) {
      // Show first, last, and pages around current page
      if (
        i === 1 ||
        i === pagination.pages ||
        (i >= pagination.page - 2 && i <= pagination.page + 2)
      ) {
        html += `
          <li class="page-item ${i === pagination.page ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
      } else if (
        (i === 2 && pagination.page > 4) ||
        (i === pagination.pages - 1 && pagination.page < pagination.pages - 3)
      ) {
        html += `
          <li class="page-item disabled">
            <span class="page-link">...</span>
          </li>
        `;
      }
    }
    
    html += `
          <li class="page-item ${pagination.page === pagination.pages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${pagination.page + 1}" aria-label="Next">
              <span aria-hidden="true">&raquo;</span>
            </a>
          </li>
        </ul>
      </nav>
    `;
    
    paginationContainer.innerHTML = html;
    
    // Add event listeners to pagination links
    document.querySelectorAll('.page-link').forEach(link => {
      if (!link.classList.contains('disabled') && link.dataset.page) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          currentPage = parseInt(this.dataset.page);
          loadDocuments();
          
          // Scroll to top of document list
          documentList.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });
  }
  
  // Handle filter form submission
  function handleFilterSubmit(e) {
    e.preventDefault();
    
    // Reset page
    currentPage = 1;
    
    // Load documents
    loadDocuments();
  }
  
  // Handle search input
  function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
      delete currentFilters.search;
    } else if (searchTerm.length >= 3) {
      currentFilters.search = searchTerm;
    } else {
      return; // Don't search with less than 3 characters
    }
    
    // Reset page
    currentPage = 1;
    
    // Load documents
    loadDocuments();
  }
  
  // Get file icon based on file type
  function getFileIcon(fileType) {
    if (!fileType) return 'bi bi-file-earmark';
    
    if (fileType.includes('pdf')) {
      return 'bi bi-file-earmark-pdf text-danger';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'bi bi-file-earmark-word text-primary';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return 'bi bi-file-earmark-excel text-success';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return 'bi bi-file-earmark-ppt text-warning';
    } else if (fileType.includes('image')) {
      return 'bi bi-file-earmark-image text-info';
    } else if (fileType.includes('text')) {
      return 'bi bi-file-earmark-text';
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return 'bi bi-file-earmark-zip';
    } else {
      return 'bi bi-file-earmark';
    }
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    
    return `${bytes.toFixed(1)} ${units[i]}`;
  }
  
  // Debounce function for search input
  function debounce(func, delay) {
    let timeout;
    
    return function() {
      const context = this;
      const args = arguments;
      
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }
  
  // Show alert message
  function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 150);
    }, 5000);
  }
  
  // Initialize
  init();
});
```

## Implementation Plan

### 1. Database Schema Updates

1. Update the Case model to include document folder location and folder structure
2. Update the Client model to include Google Drive folder ID
3. Create the Document model with all necessary fields

### 2. Service Implementation

1. Implement the Document Service with methods for managing documents
2. Enhance the Google Drive Service with folder management capabilities
3. Integrate with the AI Folder Suggestion Service

### 3. API Routes and Controllers

1. Create document routes and controllers
2. Implement document upload functionality
3. Implement Bates labeling functionality

### 4. User Interface Development

1. Create document upload page
2. Create document browser page
3. Enhance case and client pages with document management features

### 5. Testing

1. Test document upload and download
2. Test folder path resolution
3. Test Bates labeling workflow
4. Test integration with Google Drive

## Conclusion

This case-document folder integration design ensures that the CoreText Document Management System maintains compatibility with the existing Google Drive folder structure while adding powerful document management capabilities. The integration leverages the AI-assisted folder management feature to suggest and create client folders, maintains the mirror structure between original and Bates labeled documents, and provides a seamless user experience for managing case documents.

By implementing this design, users will be able to:

1. Define the top-level "Documents" folder location for each case
2. Use AI to suggest the correct client location on Google Drive
3. Create client folders with the appropriate structure if they don't exist
4. Upload documents to the correct location based on case, client, and document type
5. Create Bates labeled versions of documents that maintain the mirror folder structure
6. Browse and search documents with a user-friendly interface

This integration forms the foundation for Phase 2 of the CoreText Document Management System, enabling robust document management capabilities while maintaining compatibility with existing workflows and folder structures.
