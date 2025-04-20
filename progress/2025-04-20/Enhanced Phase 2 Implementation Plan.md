# Enhanced Phase 2 Implementation Plan
# CoreText Document Management System

## Overview

This enhanced implementation plan for Phase 2 of the CoreText Document Management System incorporates the AI-assisted folder management feature and Google Drive integration based on the user's requirements. The plan builds upon the successful completion of Phase 1 (Database Implementation & Case Selection) and provides a comprehensive roadmap for implementing Phase 2 (Document Upload & Management).

## Table of Contents

1. [Project Background](#project-background)
2. [Phase 2 Objectives](#phase-2-objectives)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Components](#implementation-components)
5. [Data Models](#data-models)
6. [Core Services](#core-services)
7. [API Routes](#api-routes)
8. [User Interface Components](#user-interface-components)
9. [Google Drive Integration](#google-drive-integration)
10. [AI-Assisted Folder Management](#ai-assisted-folder-management)
11. [Bates Labeling Workflow](#bates-labeling-workflow)
12. [Implementation Timeline](#implementation-timeline)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Plan](#deployment-plan)
15. [Future Enhancements](#future-enhancements)

## Project Background

The CoreText Document Management System is designed to help law firms manage case documents efficiently. Phase 1 of the project implemented the database structure and case selection functionality. Phase 2 will focus on document management, with special emphasis on maintaining compatibility with the existing Google Drive folder structure and implementing AI-assisted folder management.

The system must support the following folder structure:
- Client folders organized by "[Last Name], [First Name]" (or "Estate of [First Name] [Last Name]" for estate cases)
- A "Documents" subfolder within each client folder
- Two main document categories:
  - "Original" folder for original documents
  - "Bates Labeled" folder for documents that have been tagged and labeled
- Mirror folder structures beneath both Original and Bates Labeled folders

## Phase 2 Objectives

1. Implement document upload and management functionality
2. Integrate with Google Drive for document storage
3. Implement AI-assisted folder suggestion and creation
4. Support the existing folder structure and naming conventions
5. Implement Bates labeling workflow
6. Provide a user-friendly interface for document management
7. Ensure security and access control for documents

## Technical Architecture

The enhanced architecture for Phase 2 includes the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  CoreText Document Management System            │
│                                                                 │
├─────────────┬─────────────────────────────┬───────────────────┤
│             │                             │                   │
│  Case       │  Document                   │  User             │
│  Management │  Management                 │  Management       │
│             │                             │                   │
└─────────────┴─────────────────────────────┴───────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  AI-Assisted Folder Management                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  Google Drive Integration Layer                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  Google Drive API                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Components

Phase 2 implementation consists of the following major components:

1. **Data Models**
   - Enhanced Case Model
   - Enhanced Client Model
   - Document Model
   - Bates Label Model

2. **Core Services**
   - Document Service
   - Google Drive Service
   - Folder Suggestion Service
   - Bates Labeling Service

3. **API Routes**
   - Document Routes
   - Folder Management Routes
   - Bates Labeling Routes

4. **User Interface Components**
   - Document Upload Interface
   - Document Browser Interface
   - Folder Management Interface
   - Bates Labeling Interface

5. **Integration Components**
   - Google Drive Integration
   - AI-Assisted Folder Management
   - Case-Document Integration

## Data Models

### Enhanced Case Model

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

### Enhanced Client Model

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

### Document Model

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

### Bates Label Model

```javascript
// src/models/bates-label.model.js
const mongoose = require('mongoose');

const batesLabelSchema = mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  prefix: {
    type: String,
    required: true,
    trim: true
  },
  startNumber: {
    type: Number,
    required: true,
    default: 1
  },
  currentNumber: {
    type: Number,
    required: true,
    default: 1
  },
  digitCount: {
    type: Number,
    required: true,
    default: 5
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate next Bates number
batesLabelSchema.methods.getNextNumber = function() {
  const paddedNumber = String(this.currentNumber).padStart(this.digitCount, '0');
  const batesNumber = `${this.prefix}${paddedNumber}`;
  
  // Increment current number
  this.currentNumber += 1;
  
  return batesNumber;
};

module.exports = mongoose.model('BatesLabel', batesLabelSchema);
```

## Core Services

### Document Service

The Document Service handles all document-related operations, including:
- Document upload and download
- Document metadata management
- Document search and filtering
- Integration with Google Drive
- Folder path resolution

Key methods:
- `createDocument(documentData, file)`
- `getDocumentById(id)`
- `getDocumentsByCase(caseId, options)`
- `getDocumentsByClient(clientId, options)`
- `getDocumentPath(documentId)`
- `createBatesLabeledVersion(documentId, batesData, file)`
- `deleteDocument(id)`

### Google Drive Service

The Google Drive Service handles all interactions with the Google Drive API, including:
- File upload and download
- Folder creation and management
- File and folder search
- Permission management

Key methods:
- `uploadFile(fileBuffer, fileName, mimeType, folderId)`
- `downloadFile(fileId)`
- `createFolder(folderName, parentFolderId)`
- `createFolderStructure(folderPaths, parentFolderId)`
- `findFoldersByPattern(namePattern, parentFolderId)`
- `getFolderDetails(folderId)`
- `getDownloadUrl(fileId)`

### Folder Suggestion Service

The Folder Suggestion Service implements the AI-assisted folder suggestion feature, including:
- Client folder suggestion based on name similarity
- Folder structure creation
- Path resolution

Key methods:
- `suggestClientFolder(clientId)`
- `getClientNameFormats(client)`
- `createClientFolderStructure(clientId, parentFolderId, folderStructure)`

### Bates Labeling Service

The Bates Labeling Service handles all Bates labeling operations, including:
- Bates number generation
- Bates label application to documents
- Bates label management

Key methods:
- `createBatesLabel(caseId, prefix, startNumber, digitCount)`
- `getNextBatesNumber(caseId)`
- `applyBatesLabel(documentId, batesNumber)`
- `getBatesLabelsByCaseId(caseId)`

## API Routes

### Document Routes

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

### Folder Management Routes

```javascript
// src/routes/folder-management.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  suggestClientFolder,
  createClientFolderStructure,
  setCaseDocumentFolderLocation,
  updateCaseFolderStructure
} = require('../controllers/folder-management.controller');

const router = express.Router();

// Client folder routes
router.route('/client/:clientId/suggest')
  .get(protect, suggestClientFolder);

router.route('/client/:clientId/create')
  .post(protect, createClientFolderStructure);

// Case folder routes
router.route('/case/:caseId/document-location')
  .put(protect, setCaseDocumentFolderLocation);

router.route('/case/:caseId/folder-structure')
  .put(protect, updateCaseFolderStructure);

module.exports = router;
```

### Bates Labeling Routes

```javascript
// src/routes/bates-label.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createBatesLabel,
  getBatesLabelsByCaseId,
  getNextBatesNumber,
  updateBatesLabel
} = require('../controllers/bates-label.controller');

const router = express.Router();

// Bates label routes
router.route('/case/:caseId')
  .get(protect, getBatesLabelsByCaseId)
  .post(protect, createBatesLabel);

router.route('/case/:caseId/next')
  .get(protect, getNextBatesNumber);

router.route('/:id')
  .put(protect, updateBatesLabel);

module.exports = router;
```

## User Interface Components

### Document Upload Interface

The Document Upload Interface allows users to upload documents to the system, with the following features:
- Case and client selection
- Document category selection
- File selection and upload
- Document metadata input
- Folder path preview
- Upload progress tracking

### Document Browser Interface

The Document Browser Interface allows users to browse and search documents, with the following features:
- Document listing with thumbnails
- Filtering by case, client, category, and tags
- Search functionality
- Pagination
- Document preview
- Download functionality
- Bates labeling functionality

### Folder Management Interface

The Folder Management Interface allows users to manage document folders, with the following features:
- Case document folder location setting
- Client folder suggestion
- Folder structure customization
- Google Drive integration
- Folder creation

### Bates Labeling Interface

The Bates Labeling Interface allows users to apply Bates labels to documents, with the following features:
- Bates label configuration
- Bates number generation
- Bates label application to documents
- Bates labeled document preview
- Bates label management

## Google Drive Integration

The Google Drive integration is a critical component of Phase 2, enabling the system to store and manage documents in Google Drive while maintaining the existing folder structure.

### Authentication

The system will use OAuth 2.0 to authenticate with the Google Drive API, with the following flow:
1. User authenticates with Google
2. System receives OAuth tokens
3. Tokens are securely stored for future API calls
4. Refresh tokens are used to maintain access

### Folder Structure

The system will maintain the following folder structure in Google Drive:
```
[Last Name], [First Name]/
├── CaseMap/
├── Communications/
├── Contract/
├── Costs/
├── Discovery/
├── Documents/
│   ├── Bates Labeled/
│   │   ├── 01-Medical Records/
│   │   └── 02-Medical Bills/
│   └── Original/
│       ├── 01-Medical Records/
│       └── 02-Medical Bills/
├── Experts/
│   ├── Plaintiffs/
│   └── Defendants/
├── Motions/
├── Notices/
├── Pleadings/
├── Research/
├── Settlement/
└── Trial/
```

### File Operations

The system will perform the following file operations in Google Drive:
- Create folders and subfolders
- Upload files to specific folders
- Download files
- Search for files and folders
- Get file and folder metadata
- Generate download links

## AI-Assisted Folder Management

The AI-Assisted Folder Management feature is a key enhancement for Phase 2, enabling the system to suggest and create client folders in Google Drive.

### Client Folder Suggestion

The system will use string similarity algorithms to suggest client folders in Google Drive, with the following process:
1. Generate various formats of client name (e.g., "Last, First", "First Last", "Estate of First Last")
2. Search for folders in Google Drive that match these formats
3. Calculate similarity scores between folder names and client name formats
4. Rank folders by similarity score
5. Present top matches to the user

### Folder Creation

If a client folder doesn't exist, the system will create it with the appropriate structure, with the following process:
1. Determine the correct folder name format based on client type (regular or estate)
2. Create the main client folder
3. Create subfolders based on the folder structure defined in the case
4. Set appropriate permissions

### Integration with Case Management

Each case will be able to define its top-level "Documents" folder location, with the following features:
- Set document folder location for a case
- Link case to Google Drive folder
- Customize folder structure for a case
- View folder structure in a tree view

## Bates Labeling Workflow

The Bates Labeling Workflow is a critical component for legal document management, enabling the system to apply Bates labels to documents and maintain the mirror folder structure.

### Bates Number Generation

The system will generate Bates numbers with the following format:
- Prefix (e.g., "SMITH")
- Sequential number (e.g., "00001")
- Full Bates number (e.g., "SMITH00001")

### Bates Label Application

The system will apply Bates labels to documents with the following process:
1. User selects original document
2. System generates next Bates number
3. User uploads Bates labeled version of document
4. System stores Bates labeled version in the corresponding "Bates Labeled" folder
5. System links original and Bates labeled versions

### Mirror Folder Structure

The system will maintain a mirror folder structure between "Original" and "Bates Labeled" folders, with the following features:
- Same subfolder structure in both folders
- Automatic creation of missing folders
- Consistent naming conventions
- Linked documents across folders

## Implementation Timeline

The implementation of Phase 2 is planned over an 8-week period, with the following schedule:

### Week 1: Setup and Data Models
- Set up Google Drive API integration
- Implement enhanced Case and Client models
- Implement Document and Bates Label models
- Set up authentication with Google Drive

### Week 2: Core Services (Part 1)
- Implement Google Drive Service
- Implement Document Service (basic functionality)
- Implement folder path resolution
- Set up file upload and download functionality

### Week 3: Core Services (Part 2)
- Implement Folder Suggestion Service
- Implement AI-assisted folder suggestion
- Implement folder creation functionality
- Implement Bates Labeling Service

### Week 4: API Routes and Controllers
- Implement Document Routes and Controllers
- Implement Folder Management Routes and Controllers
- Implement Bates Labeling Routes and Controllers
- Set up middleware and error handling

### Week 5: User Interface (Part 1)
- Implement Document Upload Interface
- Implement Document Browser Interface
- Implement folder path preview
- Implement upload progress tracking

### Week 6: User Interface (Part 2)
- Implement Folder Management Interface
- Implement Bates Labeling Interface
- Implement document preview
- Implement download functionality

### Week 7: Integration and Testing
- Integrate all components
- Implement end-to-end workflows
- Conduct unit and integration testing
- Fix bugs and issues

### Week 8: Finalization and Deployment
- Conduct user acceptance testing
- Finalize documentation
- Deploy to production
- Provide user training

## Testing Strategy

The testing strategy for Phase 2 includes the following types of tests:

### Unit Tests
- Test individual components and functions
- Test data models and validation
- Test service methods
- Test utility functions

### Integration Tests
- Test API endpoints
- Test service interactions
- Test database operations
- Test Google Drive integration

### End-to-End Tests
- Test complete workflows
- Test user interfaces
- Test error handling
- Test performance

### User Acceptance Tests
- Test with real users
- Test with real data
- Test in production-like environment
- Gather feedback for improvements

## Deployment Plan

The deployment plan for Phase 2 includes the following steps:

### Pre-Deployment
- Finalize all code changes
- Run all tests
- Fix any remaining issues
- Prepare deployment package

### Deployment
- Deploy database changes
- Deploy backend services
- Deploy frontend components
- Configure Google Drive integration

### Post-Deployment
- Verify deployment
- Monitor system performance
- Address any deployment issues
- Provide user support

## Future Enhancements

After the completion of Phase 2, the following enhancements are planned for future phases:

### Phase 3: Advanced Document Management
- Document versioning
- Document comparison
- Document annotation
- Document collaboration

### Phase 4: Workflow Automation
- Document workflow automation
- Approval processes
- Notification system
- Task management

### Phase 5: Reporting and Analytics
- Document usage analytics
- Case activity reports
- User activity reports
- Custom reporting

## Conclusion

This enhanced implementation plan for Phase 2 of the CoreText Document Management System provides a comprehensive roadmap for implementing document management functionality with AI-assisted folder management and Google Drive integration. The plan ensures compatibility with the existing folder structure and provides a seamless user experience for managing case documents.

By following this plan, the development team will be able to implement Phase 2 efficiently and effectively, delivering a robust document management system that meets the needs of law firms and maintains compatibility with their existing workflows.
