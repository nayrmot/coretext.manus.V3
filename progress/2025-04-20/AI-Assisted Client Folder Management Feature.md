# AI-Assisted Client Folder Management Feature

## Overview

This document outlines the design for enhancing the CoreText Document Management System with an AI-assisted client folder management feature. Based on the user's requirements and the provided Python script, this feature will allow each case to define its top-level "Documents" folder location, use AI to suggest the correct client location on Google Drive, and create client folders with the appropriate structure if they don't exist.

## Requirements Analysis

### Key Requirements

1. **Case-Specific Document Folder Location**:
   - Each case needs to define its top-level "Documents" folder location
   - This location may vary between cases

2. **AI-Assisted Client Folder Suggestion**:
   - Use AI to suggest the correct client folder on Google Drive
   - Match client names with existing folders using fuzzy matching and similarity algorithms

3. **Automated Folder Creation**:
   - Create client folders if they don't exist
   - Follow the standard folder structure as defined in the provided Python script
   - Allow customization of which subfolders to create

### Folder Structure from Python Script

The script creates the following folder structure:

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

## Technical Design

### 1. Enhanced Case Model

Update the Case model to include document folder location:

```javascript
// src/models/case.model.js - Add to existing schema
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
```

### 2. AI Folder Suggestion Service

Create a service to suggest client folders using AI techniques:

```javascript
// src/services/folder-suggestion.service.js
const { google } = require('googleapis');
const stringSimilarity = require('string-similarity');
const Case = require('../models/case.model');
const Client = require('../models/client.model');
const googleDriveService = require('./google-drive.service');

class FolderSuggestionService {
  /**
   * Suggest client folder on Google Drive
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} Suggested folders
   */
  async suggestClientFolder(clientId) {
    try {
      // Get client
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }
      
      // Get client name formats
      const clientFormats = this.getClientNameFormats(client);
      
      // Get Google Drive folders
      await googleDriveService.ensureInitialized();
      const clientsFolder = await googleDriveService.findOrCreateClientsFolder();
      const folders = await googleDriveService.listFiles(clientsFolder);
      
      // Filter folders (exclude files)
      const folderList = folders.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
      
      // Calculate similarity scores
      const suggestions = [];
      
      for (const folder of folderList) {
        const folderName = folder.name;
        
        // Calculate best match score across all client name formats
        let bestScore = 0;
        let bestFormat = '';
        
        for (const format of clientFormats) {
          const score = stringSimilarity.compareTwoStrings(folderName.toLowerCase(), format.toLowerCase());
          if (score > bestScore) {
            bestScore = score;
            bestFormat = format;
          }
        }
        
        // Add to suggestions if score is above threshold
        if (bestScore > 0.6) {
          suggestions.push({
            id: folder.id,
            name: folder.name,
            score: bestScore,
            matchedFormat: bestFormat,
            webViewLink: folder.webViewLink
          });
        }
      }
      
      // Sort by score (highest first)
      suggestions.sort((a, b) => b.score - a.score);
      
      return suggestions;
    } catch (error) {
      console.error('Error suggesting client folder:', error);
      throw error;
    }
  }
  
  /**
   * Get various formats of client name
   * @param {Object} client - Client object
   * @returns {Array} Client name formats
   */
  getClientNameFormats(client) {
    const formats = [];
    
    if (client.isEstate) {
      // Estate formats
      formats.push(`Estate of ${client.firstName} ${client.lastName}`);
      formats.push(`Estate of ${client.firstName} ${client.lastName.toUpperCase()}`);
      formats.push(`Estate of ${client.firstName.charAt(0)}. ${client.lastName}`);
      formats.push(`Estate - ${client.lastName}, ${client.firstName}`);
    } else {
      // Regular client formats
      formats.push(`${client.lastName}, ${client.firstName}`);
      formats.push(`${client.lastName.toUpperCase()}, ${client.firstName}`);
      formats.push(`${client.lastName}, ${client.firstName.charAt(0)}.`);
      formats.push(`${client.firstName} ${client.lastName}`);
    }
    
    return formats;
  }
  
  /**
   * Create client folder structure
   * @param {string} clientId - Client ID
   * @param {string} parentFolderId - Parent folder ID
   * @param {Array} folderStructure - Folder structure to create
   * @returns {Promise<Object>} Created folder structure
   */
  async createClientFolderStructure(clientId, parentFolderId, folderStructure) {
    try {
      // Get client
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }
      
      // Create client folder
      const clientFolderName = client.displayName;
      const clientFolderId = await googleDriveService.createFolder(clientFolderName, parentFolderId);
      
      // Update client with Google Drive folder ID
      client.googleDriveFolderId = clientFolderId;
      await client.save();
      
      // Create folder structure
      const createdFolders = {};
      
      for (const folderPath of folderStructure) {
        const pathParts = folderPath.split('/');
        let currentParentId = clientFolderId;
        let currentPath = '';
        
        for (const part of pathParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!createdFolders[currentPath]) {
            createdFolders[currentPath] = await googleDriveService.createFolder(part, currentParentId);
          }
          
          currentParentId = createdFolders[currentPath];
        }
      }
      
      return {
        clientFolderId,
        folderStructure: createdFolders
      };
    } catch (error) {
      console.error('Error creating client folder structure:', error);
      throw error;
    }
  }
}

module.exports = new FolderSuggestionService();
```

### 3. Enhanced Google Drive Service

Extend the Google Drive service to support folder suggestion and creation:

```javascript
// Add to src/services/google-drive.service.js

/**
 * Find folders by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {string} parentFolderId - Parent folder ID (optional)
 * @returns {Promise<Array>} Matching folders
 */
async findFoldersByPattern(namePattern, parentFolderId = null) {
  await this.ensureInitialized();
  
  try {
    let query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    
    if (namePattern) {
      // Use contains operator for partial matching
      query += ` and name contains '${namePattern}'`;
    }
    
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }
    
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink, createdTime)'
    });
    
    return response.data.files;
  } catch (error) {
    console.error('Error finding folders by pattern:', error);
    throw error;
  }
}

/**
 * Create folder structure
 * @param {Array} folderPaths - Array of folder paths
 * @param {string} parentFolderId - Parent folder ID
 * @returns {Promise<Object>} Created folder structure
 */
async createFolderStructure(folderPaths, parentFolderId) {
  await this.ensureInitialized();
  
  try {
    const createdFolders = {};
    
    for (const folderPath of folderPaths) {
      const pathParts = folderPath.split('/');
      let currentParentId = parentFolderId;
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!createdFolders[currentPath]) {
          // Check if folder already exists
          const existingFolder = await this.findOrCreateSubfolder(part, currentParentId);
          createdFolders[currentPath] = existingFolder;
        }
        
        currentParentId = createdFolders[currentPath];
      }
    }
    
    return createdFolders;
  } catch (error) {
    console.error('Error creating folder structure:', error);
    throw error;
  }
}
```

### 4. Client Folder Management Controller

Create a controller to handle client folder management:

```javascript
// src/controllers/folder-management.controller.js
const asyncHandler = require('express-async-handler');
const folderSuggestionService = require('../services/folder-suggestion.service');
const googleDriveService = require('../services/google-drive.service');
const Case = require('../models/case.model');
const Client = require('../models/client.model');

// Suggest client folder
const suggestClientFolder = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  
  const suggestions = await folderSuggestionService.suggestClientFolder(clientId);
  
  res.json({
    success: true,
    data: suggestions
  });
});

// Create client folder structure
const createClientFolderStructure = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { parentFolderId, folderStructure } = req.body;
  
  if (!parentFolderId) {
    res.status(400);
    throw new Error('Parent folder ID is required');
  }
  
  const client = await Client.findById(clientId);
  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }
  
  // Get folder structure from case if not provided
  let folders = folderStructure;
  if (!folders) {
    const caseItem = await Case.findById(client.caseId);
    folders = caseItem.folderStructure;
  }
  
  const result = await folderSuggestionService.createClientFolderStructure(
    clientId,
    parentFolderId,
    folders
  );
  
  res.json({
    success: true,
    data: result
  });
});

// Set case document folder location
const setCaseDocumentFolderLocation = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { documentFolderLocation, googleDriveFolderId } = req.body;
  
  const caseItem = await Case.findById(caseId);
  if (!caseItem) {
    res.status(404);
    throw new Error('Case not found');
  }
  
  caseItem.documentFolderLocation = documentFolderLocation;
  
  if (googleDriveFolderId) {
    caseItem.googleDriveFolderId = googleDriveFolderId;
  }
  
  await caseItem.save();
  
  res.json({
    success: true,
    data: caseItem
  });
});

// Update case folder structure
const updateCaseFolderStructure = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { folderStructure } = req.body;
  
  if (!folderStructure || !Array.isArray(folderStructure)) {
    res.status(400);
    throw new Error('Folder structure must be an array');
  }
  
  const caseItem = await Case.findById(caseId);
  if (!caseItem) {
    res.status(404);
    throw new Error('Case not found');
  }
  
  caseItem.folderStructure = folderStructure;
  await caseItem.save();
  
  res.json({
    success: true,
    data: caseItem
  });
});

module.exports = {
  suggestClientFolder,
  createClientFolderStructure,
  setCaseDocumentFolderLocation,
  updateCaseFolderStructure
};
```

### 5. Folder Management Routes

Create routes for folder management:

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

### 6. User Interface Components

#### 6.1 Case Document Location Setting

```html
<!-- public/case-document-location.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Document Location - Document Management System</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/css/styles.css">
  <script src="/js/case-document-location.js" defer></script>
  <script src="/js/global-case-selector.js" defer></script>
</head>
<body>
  <div class="wrapper">
    <!-- Sidebar (same as other pages) -->
    
    <!-- Page Content -->
    <div id="content" class="content">
      <!-- Navigation (same as other pages) -->
      
      <div class="container-fluid" id="main-content">
        <!-- Alert container -->
        <div id="alertContainer"></div>
        
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/cases.html">Cases</a></li>
            <li class="breadcrumb-item"><a href="#" id="caseLink">Case</a></li>
            <li class="breadcrumb-item active" aria-current="page">Document Location</li>
          </ol>
        </nav>
        
        <!-- Document Location Setting -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Set Document Location</h5>
          </div>
          <div class="card-body">
            <form id="documentLocationForm">
              <div class="mb-3">
                <label for="documentLocation" class="form-label">Document Folder Location</label>
                <input type="text" class="form-control" id="documentLocation" placeholder="Enter document folder location">
                <div class="form-text">Specify the location where case documents should be stored.</div>
              </div>
              
              <div class="mb-3">
                <label for="googleDriveFolder" class="form-label">Google Drive Folder</label>
                <div class="input-group">
                  <input type="text" class="form-control" id="googleDriveFolder" placeholder="Google Drive folder ID" readonly>
                  <button class="btn btn-outline-secondary" type="button" id="selectFolderBtn">
                    <i class="bi bi-folder"></i> Select Folder
                  </button>
                </div>
              </div>
              
              <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-outline-secondary me-2" id="cancelBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="saveBtn">Save Location</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Folder Structure Setting -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Folder Structure</h5>
            <button type="button" class="btn btn-sm btn-outline-primary" id="editStructureBtn">
              <i class="bi bi-pencil"></i> Edit Structure
            </button>
          </div>
          <div class="card-body">
            <div id="folderStructureDisplay">
              <div class="folder-tree">
                <!-- Folder structure will be displayed here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Select Folder Modal -->
  <div class="modal fade" id="selectFolderModal" tabindex="-1" aria-labelledby="selectFolderModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="selectFolderModalLabel">Select Google Drive Folder</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="clientSearch" class="form-label">Search Client</label>
            <div class="input-group">
              <input type="text" class="form-control" id="clientSearch" placeholder="Enter client name">
              <button class="btn btn-outline-secondary" type="button" id="searchClientBtn">
                <i class="bi bi-search"></i> Search
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Suggested Folders</label>
            <div class="list-group" id="suggestedFolders">
              <!-- Suggested folders will be displayed here -->
              <div class="text-center p-3">
                <p class="text-muted">Search for a client to see suggested folders</p>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="createIfNotExists">
              <label class="form-check-label" for="createIfNotExists">
                Create folder if it doesn't exist
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="confirmFolderBtn">Confirm Selection</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Folder Structure Modal -->
  <div class="modal fade" id="editStructureModal" tabindex="-1" aria-labelledby="editStructureModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editStructureModalLabel">Edit Folder Structure</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Select Folders to Include</label>
            <div id="folderCheckboxes">
              <!-- Folder checkboxes will be displayed here -->
            </div>
          </div>
          
          <div class="mb-3">
            <label for="newFolder" class="form-label">Add New Folder</label>
            <div class="input-group">
              <input type="text" class="form-control" id="newFolder" placeholder="Enter folder path (e.g., Documents/Category)">
              <button class="btn btn-outline-secondary" type="button" id="addFolderBtn">
                <i class="bi bi-plus-circle"></i> Add
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="saveStructureBtn">Save Structure</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

#### 6.2 Client Folder Creation Interface

```html
<!-- public/client-folder-creation.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Client Folders - Document Management System</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/css/styles.css">
  <script src="/js/client-folder-creation.js" defer></script>
  <script src="/js/global-case-selector.js" defer></script>
</head>
<body>
  <div class="wrapper">
    <!-- Sidebar (same as other pages) -->
    
    <!-- Page Content -->
    <div id="content" class="content">
      <!-- Navigation (same as other pages) -->
      
      <div class="container-fluid" id="main-content">
        <!-- Alert container -->
        <div id="alertContainer"></div>
        
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/cases.html">Cases</a></li>
            <li class="breadcrumb-item"><a href="#" id="caseLink">Case</a></li>
            <li class="breadcrumb-item"><a href="#" id="clientLink">Client</a></li>
            <li class="breadcrumb-item active" aria-current="page">Create Folders</li>
          </ol>
        </nav>
        
        <!-- Client Folder Creation -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Create Client Folders</h5>
          </div>
          <div class="card-body">
            <form id="folderCreationForm">
              <div class="mb-3">
                <label class="form-label">Client Information</label>
                <div class="card bg-light">
                  <div class="card-body">
                    <p><strong>Name:</strong> <span id="clientName">-</span></p>
                    <p><strong>Case:</strong> <span id="caseName">-</span></p>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Google Drive Location</label>
                <div class="input-group">
                  <input type="text" class="form-control" id="parentFolder" placeholder="Select parent folder" readonly>
                  <button class="btn btn-outline-secondary" type="button" id="selectParentBtn">
                    <i class="bi bi-folder"></i> Select
                  </button>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Folder Structure</label>
                <div class="card">
                  <div class="card-body">
                    <div id="folderStructureCheckboxes">
                      <!-- Folder structure checkboxes will be displayed here -->
                    </div>
                    <div class="d-flex justify-content-end mt-3">
                      <button type="button" class="btn btn-sm btn-outline-secondary" id="selectAllBtn">Select All</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary" id="cancelBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="createFoldersBtn">Create Folders</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Progress -->
        <div class="card mt-4 d-none" id="progressCard">
          <div class="card-header">
            <h5 class="mb-0">Creation Progress</h5>
          </div>
          <div class="card-body">
            <div class="progress mb-3">
              <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
            <div class="mt-3">
              <div class="card bg-light">
                <div class="card-body">
                  <pre id="progressLog" class="mb-0" style="max-height: 200px; overflow-y: auto;"></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Select Parent Folder Modal -->
  <div class="modal fade" id="selectParentModal" tabindex="-1" aria-labelledby="selectParentModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="selectParentModalLabel">Select Parent Folder</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <div class="form-check">
              <input class="form-check-input" type="radio" name="parentFolderOption" id="useClientsFolder" checked>
              <label class="form-check-label" for="useClientsFolder">
                Use default "Clients" folder
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="parentFolderOption" id="selectCustomFolder">
              <label class="form-check-label" for="selectCustomFolder">
                Select custom folder
              </label>
            </div>
          </div>
          
          <div class="mb-3 d-none" id="customFolderSection">
            <label for="folderSearch" class="form-label">Search Folders</label>
            <div class="input-group">
              <input type="text" class="form-control" id="folderSearch" placeholder="Enter folder name">
              <button class="btn btn-outline-secondary" type="button" id="searchFolderBtn">
                <i class="bi bi-search"></i> Search
              </button>
            </div>
            
            <div class="mt-3">
              <div class="list-group" id="folderSearchResults">
                <!-- Folder search results will be displayed here -->
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="confirmParentBtn">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### 7. JavaScript Implementation

#### 7.1 Case Document Location JavaScript

```javascript
// public/js/case-document-location.js

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const documentLocationForm = document.getElementById('documentLocationForm');
  const documentLocationInput = document.getElementById('documentLocation');
  const googleDriveFolderInput = document.getElementById('googleDriveFolder');
  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const folderStructureDisplay = document.getElementById('folderStructureDisplay');
  const editStructureBtn = document.getElementById('editStructureBtn');
  const caseLink = document.getElementById('caseLink');
  
  // Modal elements
  const selectFolderModal = new bootstrap.Modal(document.getElementById('selectFolderModal'));
  const clientSearchInput = document.getElementById('clientSearch');
  const searchClientBtn = document.getElementById('searchClientBtn');
  const suggestedFolders = document.getElementById('suggestedFolders');
  const createIfNotExists = document.getElementById('createIfNotExists');
  const confirmFolderBtn = document.getElementById('confirmFolderBtn');
  
  const editStructureModal = new bootstrap.Modal(document.getElementById('editStructureModal'));
  const folderCheckboxes = document.getElementById('folderCheckboxes');
  const newFolderInput = document.getElementById('newFolder');
  const addFolderBtn = document.getElementById('addFolderBtn');
  const saveStructureBtn = document.getElementById('saveStructureBtn');
  
  // State variables
  let caseId = null;
  let caseData = null;
  let selectedFolderId = null;
  let folderStructure = [];
  let selectedClient = null;
  
  // Initialize
  function init() {
    // Get case ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    caseId = urlParams.get('id');
    
    if (!caseId) {
      showAlert('danger', 'Case ID is required. Please select a case first.');
      return;
    }
    
    // Load case data
    loadCaseData();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  // Load case data
  async function loadCaseData() {
    try {
      const response = await fetch(`/api/cases/${caseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load case data');
      }
      
      caseData = data.data;
      
      // Update breadcrumb
      caseLink.href = `/cases/${caseId}`;
      caseLink.textContent = caseData.name;
      
      // Populate form
      documentLocationInput.value = caseData.documentFolderLocation || '';
      googleDriveFolderInput.value = caseData.googleDriveFolderId || '';
      
      // Load folder structure
      folderStructure = caseData.folderStructure || [];
      renderFolderStructure();
      
    } catch (error) {
      console.error('Error loading case data:', error);
      showAlert('danger', 'Failed to load case data. Please try again later.');
    }
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Form submission
    documentLocationForm.addEventListener('submit', handleFormSubmit);
    
    // Buttons
    selectFolderBtn.addEventListener('click', () => selectFolderModal.show());
    cancelBtn.addEventListener('click', handleCancel);
    editStructureBtn.addEventListener('click', handleEditStructure);
    
    // Modal buttons
    searchClientBtn.addEventListener('click', handleClientSearch);
    confirmFolderBtn.addEventListener('click', handleFolderConfirmation);
    addFolderBtn.addEventListener('click', handleAddFolder);
    saveStructureBtn.addEventListener('click', handleSaveStructure);
    
    // Enter key in search input
    clientSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleClientSearch();
      }
    });
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const documentFolderLocation = documentLocationInput.value.trim();
    const googleDriveFolderId = googleDriveFolderInput.value.trim();
    
    try {
      const response = await fetch(`/api/folders/case/${caseId}/document-location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentFolderLocation,
          googleDriveFolderId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update document location');
      }
      
      showAlert('success', 'Document location updated successfully');
      
      // Reload case data
      loadCaseData();
      
    } catch (error) {
      console.error('Error updating document location:', error);
      showAlert('danger', 'Failed to update document location. Please try again later.');
    }
  }
  
  // Handle cancel button
  function handleCancel() {
    window.location.href = `/cases/${caseId}`;
  }
  
  // Handle client search
  async function handleClientSearch() {
    const searchTerm = clientSearchInput.value.trim();
    
    if (!searchTerm) {
      showAlert('warning', 'Please enter a client name to search for.');
      return;
    }
    
    try {
      // Get clients for this case
      const response = await fetch(`/api/clients/case/${caseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load clients');
      }
      
      const clients = data.data;
      
      // Filter clients by search term
      const filteredClients = clients.filter(client => {
        const fullName = client.displayName.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      
      if (filteredClients.length === 0) {
        suggestedFolders.innerHTML = '<div class="text-center p-3"><p class="text-muted">No matching clients found</p></div>';
        return;
      }
      
      // Get folder suggestions for first matching client
      selectedClient = filteredClients[0];
      const suggestionsResponse = await fetch(`/api/folders/client/${selectedClient._id}/suggest`);
      const suggestionsData = await suggestionsResponse.json();
      
      if (!suggestionsResponse.ok) {
        throw new Error(suggestionsData.error || 'Failed to get folder suggestions');
      }
      
      const suggestions = suggestionsData.data;
      
      // Render suggestions
      if (suggestions.length === 0) {
        suggestedFolders.innerHTML = `
          <div class="text-center p-3">
            <p class="text-muted">No matching folders found for ${selectedClient.displayName}</p>
          </div>
        `;
      } else {
        let html = '';
        
        suggestions.forEach(folder => {
          html += `
            <button type="button" class="list-group-item list-group-item-action folder-suggestion" data-id="${folder.id}">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">${folder.name}</h6>
                  <small class="text-muted">Match score: ${Math.round(folder.score * 100)}%</small>
                </div>
                <span class="badge bg-primary rounded-pill">${folder.matchedFormat}</span>
              </div>
            </button>
          `;
        });
        
        suggestedFolders.innerHTML = html;
        
        // Add event listeners to folder suggestions
        document.querySelectorAll('.folder-suggestion').forEach(button => {
          button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.folder-suggestion').forEach(btn => {
              btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set selected folder ID
            selectedFolderId = this.dataset.id;
          });
        });
      }
      
    } catch (error) {
      console.error('Error searching for client:', error);
      showAlert('danger', 'Failed to search for client. Please try again later.');
    }
  }
  
  // Handle folder confirmation
  function handleFolderConfirmation() {
    if (selectedFolderId) {
      googleDriveFolderInput.value = selectedFolderId;
      selectFolderModal.hide();
    } else if (createIfNotExists.checked && selectedClient) {
      // Create client folder
      createClientFolder();
    } else {
      showAlert('warning', 'Please select a folder or check "Create if not exists".');
    }
  }
  
  // Create client folder
  async function createClientFolder() {
    try {
      // Get clients folder ID
      const clientsFolderResponse = await fetch('/api/google-drive/clients-folder');
      const clientsFolderData = await clientsFolderResponse.json();
      
      if (!clientsFolderResponse.ok) {
        throw new Error(clientsFolderData.error || 'Failed to get Clients folder');
      }
      
      const clientsFolderId = clientsFolderData.data.id;
      
      // Create client folder structure
      const response = await fetch(`/api/folders/client/${selectedClient._id}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentFolderId: clientsFolderId,
          folderStructure: folderStructure
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client folder');
      }
      
      // Set folder ID
      googleDriveFolderInput.value = data.data.clientFolderId;
      
      selectFolderModal.hide();
      
      showAlert('success', `Folder structure created for ${selectedClient.displayName}`);
      
    } catch (error) {
      console.error('Error creating client folder:', error);
      showAlert('danger', 'Failed to create client folder. Please try again later.');
    }
  }
  
  // Handle edit structure
  function handleEditStructure() {
    // Populate folder checkboxes
    renderFolderCheckboxes();
    
    // Show modal
    editStructureModal.show();
  }
  
  // Render folder checkboxes
  function renderFolderCheckboxes() {
    // Default folder structure if empty
    const defaultFolders = [
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
    ];
    
    // Combine current structure with defaults
    const allFolders = [...new Set([...folderStructure, ...defaultFolders])];
    
    // Sort folders
    allFolders.sort();
    
    // Create checkboxes
    let html = '';
    
    allFolders.forEach(folder => {
      const isChecked = folderStructure.includes(folder);
      
      html += `
        <div class="form-check">
          <input class="form-check-input folder-checkbox" type="checkbox" value="${folder}" id="folder-${folder.replace(/[^a-zA-Z0-9]/g, '-')}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label" for="folder-${folder.replace(/[^a-zA-Z0-9]/g, '-')}">
            ${folder}
          </label>
        </div>
      `;
    });
    
    folderCheckboxes.innerHTML = html;
  }
  
  // Handle add folder
  function handleAddFolder() {
    const newFolder = newFolderInput.value.trim();
    
    if (!newFolder) {
      showAlert('warning', 'Please enter a folder path.');
      return;
    }
    
    // Add checkbox for new folder
    const folderId = `folder-${newFolder.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Check if folder already exists
    if (document.getElementById(folderId)) {
      showAlert('warning', 'This folder already exists in the list.');
      return;
    }
    
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'form-check';
    checkboxDiv.innerHTML = `
      <input class="form-check-input folder-checkbox" type="checkbox" value="${newFolder}" id="${folderId}" checked>
      <label class="form-check-label" for="${folderId}">
        ${newFolder}
      </label>
    `;
    
    folderCheckboxes.appendChild(checkboxDiv);
    
    // Clear input
    newFolderInput.value = '';
  }
  
  // Handle save structure
  async function handleSaveStructure() {
    // Get selected folders
    const selectedFolders = [];
    
    document.querySelectorAll('.folder-checkbox:checked').forEach(checkbox => {
      selectedFolders.push(checkbox.value);
    });
    
    // Update folder structure
    folderStructure = selectedFolders;
    
    try {
      // Save to server
      const response = await fetch(`/api/folders/case/${caseId}/folder-structure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderStructure
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update folder structure');
      }
      
      // Close modal
      editStructureModal.hide();
      
      // Render folder structure
      renderFolderStructure();
      
      showAlert('success', 'Folder structure updated successfully');
      
    } catch (error) {
      console.error('Error updating folder structure:', error);
      showAlert('danger', 'Failed to update folder structure. Please try again later.');
    }
  }
  
  // Render folder structure
  function renderFolderStructure() {
    if (!folderStructure || folderStructure.length === 0) {
      folderStructureDisplay.innerHTML = '<p class="text-muted">No folder structure defined</p>';
      return;
    }
    
    // Build folder tree
    const tree = buildFolderTree(folderStructure);
    
    // Render tree
    folderStructureDisplay.innerHTML = renderFolderTree(tree);
  }
  
  // Build folder tree
  function buildFolderTree(folders) {
    const tree = {};
    
    folders.forEach(path => {
      const parts = path.split('/');
      let current = tree;
      
      parts.forEach(part => {
        if (!current[part]) {
          current[part] = {};
        }
        
        current = current[part];
      });
    });
    
    return tree;
  }
  
  // Render folder tree
  function renderFolderTree(tree, indent = 0) {
    let html = '<ul class="folder-tree-list">';
    
    Object.keys(tree).forEach(folder => {
      const hasChildren = Object.keys(tree[folder]).length > 0;
      
      html += `
        <li>
          <div class="folder-item">
            <i class="bi bi-folder-fill text-warning me-2"></i>
            ${folder}
          </div>
          ${hasChildren ? renderFolderTree(tree[folder], indent + 1) : ''}
        </li>
      `;
    });
    
    html += '</ul>';
    
    return html;
  }
  
  // Show alert message
  function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
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

#### 7.2 Client Folder Creation JavaScript

```javascript
// public/js/client-folder-creation.js

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const folderCreationForm = document.getElementById('folderCreationForm');
  const clientNameSpan = document.getElementById('clientName');
  const caseNameSpan = document.getElementById('caseName');
  const parentFolderInput = document.getElementById('parentFolder');
  const selectParentBtn = document.getElementById('selectParentBtn');
  const folderStructureCheckboxes = document.getElementById('folderStructureCheckboxes');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const createFoldersBtn = document.getElementById('createFoldersBtn');
  const progressCard = document.getElementById('progressCard');
  const progressBar = document.getElementById('progressBar');
  const progressLog = document.getElementById('progressLog');
  const caseLink = document.getElementById('caseLink');
  const clientLink = document.getElementById('clientLink');
  
  // Modal elements
  const selectParentModal = new bootstrap.Modal(document.getElementById('selectParentModal'));
  const useClientsFolder = document.getElementById('useClientsFolder');
  const selectCustomFolder = document.getElementById('selectCustomFolder');
  const customFolderSection = document.getElementById('customFolderSection');
  const folderSearchInput = document.getElementById('folderSearch');
  const searchFolderBtn = document.getElementById('searchFolderBtn');
  const folderSearchResults = document.getElementById('folderSearchResults');
  const confirmParentBtn = document.getElementById('confirmParentBtn');
  
  // State variables
  let clientId = null;
  let caseId = null;
  let clientData = null;
  let caseData = null;
  let parentFolderId = null;
  let folderStructure = [];
  let selectedFolders = [];
  
  // Initialize
  function init() {
    // Get client ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    clientId = urlParams.get('id');
    
    if (!clientId) {
      showAlert('danger', 'Client ID is required. Please select a client first.');
      return;
    }
    
    // Load client data
    loadClientData();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  // Load client data
  async function loadClientData() {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load client data');
      }
      
      clientData = data.data;
      caseId = clientData.caseId;
      
      // Load case data
      await loadCaseData();
      
      // Update breadcrumb and client info
      caseLink.href = `/cases/${caseId}`;
      caseLink.textContent = caseData.name;
      
      clientLink.href = `/clients/${clientId}`;
      clientLink.textContent = clientData.displayName;
      
      clientNameSpan.textContent = clientData.displayName;
      caseNameSpan.textContent = caseData.name;
      
      // Load folder structure
      folderStructure = caseData.folderStructure || getDefaultFolderStructure();
      renderFolderStructureCheckboxes();
      
    } catch (error) {
      console.error('Error loading client data:', error);
      showAlert('danger', 'Failed to load client data. Please try again later.');
    }
  }
  
  // Load case data
  async function loadCaseData() {
    try {
      const response = await fetch(`/api/cases/${caseId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load case data');
      }
      
      caseData = data.data;
      
    } catch (error) {
      console.error('Error loading case data:', error);
      showAlert('danger', 'Failed to load case data. Please try again later.');
    }
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Form submission
    folderCreationForm.addEventListener('submit', handleFormSubmit);
    
    // Buttons
    selectParentBtn.addEventListener('click', () => selectParentModal.show());
    selectAllBtn.addEventListener('click', handleSelectAll);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Modal radio buttons
    useClientsFolder.addEventListener('change', toggleCustomFolderSection);
    selectCustomFolder.addEventListener('change', toggleCustomFolderSection);
    
    // Modal buttons
    searchFolderBtn.addEventListener('click', handleFolderSearch);
    confirmParentBtn.addEventListener('click', handleParentConfirmation);
    
    // Enter key in search input
    folderSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFolderSearch();
      }
    });
  }
  
  // Toggle custom folder section
  function toggleCustomFolderSection() {
    if (selectCustomFolder.checked) {
      customFolderSection.classList.remove('d-none');
    } else {
      customFolderSection.classList.add('d-none');
    }
  }
  
  // Handle folder search
  async function handleFolderSearch() {
    const searchTerm = folderSearchInput.value.trim();
    
    if (!searchTerm) {
      showAlert('warning', 'Please enter a folder name to search for.');
      return;
    }
    
    try {
      const response = await fetch(`/api/google-drive/folders?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search folders');
      }
      
      const folders = data.data;
      
      // Render folder search results
      if (folders.length === 0) {
        folderSearchResults.innerHTML = '<div class="text-center p-3"><p class="text-muted">No matching folders found</p></div>';
      } else {
        let html = '';
        
        folders.forEach(folder => {
          html += `
            <button type="button" class="list-group-item list-group-item-action folder-result" data-id="${folder.id}">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">${folder.name}</h6>
                  <small class="text-muted">Created: ${new Date(folder.createdTime).toLocaleDateString()}</small>
                </div>
              </div>
            </button>
          `;
        });
        
        folderSearchResults.innerHTML = html;
        
        // Add event listeners to folder results
        document.querySelectorAll('.folder-result').forEach(button => {
          button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.folder-result').forEach(btn => {
              btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set selected folder ID
            parentFolderId = this.dataset.id;
          });
        });
      }
      
    } catch (error) {
      console.error('Error searching folders:', error);
      showAlert('danger', 'Failed to search folders. Please try again later.');
    }
  }
  
  // Handle parent confirmation
  async function handleParentConfirmation() {
    if (useClientsFolder.checked) {
      try {
        // Get clients folder
        const response = await fetch('/api/google-drive/clients-folder');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get Clients folder');
        }
        
        parentFolderId = data.data.id;
        parentFolderInput.value = 'Clients (Default)';
        
      } catch (error) {
        console.error('Error getting Clients folder:', error);
        showAlert('danger', 'Failed to get Clients folder. Please try again later.');
        return;
      }
    } else if (selectCustomFolder.checked && parentFolderId) {
      // Get folder name
      try {
        const response = await fetch(`/api/google-drive/folders/${parentFolderId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get folder details');
        }
        
        parentFolderInput.value = data.data.name;
        
      } catch (error) {
        console.error('Error getting folder details:', error);
        showAlert('danger', 'Failed to get folder details. Please try again later.');
        return;
      }
    } else {
      showAlert('warning', 'Please select a parent folder.');
      return;
    }
    
    selectParentModal.hide();
  }
  
  // Handle select all
  function handleSelectAll() {
    document.querySelectorAll('.folder-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  }
  
  // Handle cancel
  function handleCancel() {
    window.location.href = `/clients/${clientId}`;
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!parentFolderId) {
      showAlert('warning', 'Please select a parent folder.');
      return;
    }
    
    // Get selected folders
    selectedFolders = [];
    
    document.querySelectorAll('.folder-checkbox:checked').forEach(checkbox => {
      selectedFolders.push(checkbox.value);
    });
    
    if (selectedFolders.length === 0) {
      showAlert('warning', 'Please select at least one folder to create.');
      return;
    }
    
    // Show progress card
    progressCard.classList.remove('d-none');
    progressLog.textContent = 'Starting folder creation...\n';
    
    try {
      // Create folder structure
      const response = await fetch(`/api/folders/client/${clientId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentFolderId,
          folderStructure: selectedFolders
        })
      });
      
      // Stream progress updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let progress = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Parse progress update
        const text = decoder.decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (!line) continue;
          
          try {
            const update = JSON.parse(line);
            
            if (update.progress) {
              progress = update.progress;
              progressBar.style.width = `${progress}%`;
              progressBar.textContent = `${progress}%`;
              progressBar.setAttribute('aria-valuenow', progress);
            }
            
            if (update.message) {
              progressLog.textContent += update.message + '\n';
              progressLog.scrollTop = progressLog.scrollHeight;
            }
          } catch (e) {
            console.error('Error parsing progress update:', e);
          }
        }
      }
      
      // Complete
      progressBar.style.width = '100%';
      progressBar.textContent = '100%';
      progressBar.setAttribute('aria-valuenow', 100);
      progressLog.textContent += 'Folder creation completed successfully!\n';
      
      // Update client with Google Drive folder ID
      await updateClientFolderId();
      
      // Disable form
      createFoldersBtn.disabled = true;
      
      showAlert('success', 'Folder structure created successfully!');
      
    } catch (error) {
      console.error('Error creating folder structure:', error);
      progressLog.textContent += `Error: ${error.message}\n`;
      showAlert('danger', 'Failed to create folder structure. Please check the progress log for details.');
    }
  }
  
  // Update client with Google Drive folder ID
  async function updateClientFolderId() {
    try {
      // Get client folder ID
      const response = await fetch(`/api/google-drive/folders?name=${encodeURIComponent(clientData.displayName)}&parent=${parentFolderId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get client folder');
      }
      
      const folders = data.data;
      
      if (folders.length === 0) {
        throw new Error('Client folder not found');
      }
      
      const clientFolderId = folders[0].id;
      
      // Update client
      const updateResponse = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          googleDriveFolderId: clientFolderId
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update client');
      }
      
      progressLog.textContent += `Client updated with Google Drive folder ID: ${clientFolderId}\n`;
      
    } catch (error) {
      console.error('Error updating client:', error);
      progressLog.textContent += `Warning: Failed to update client with Google Drive folder ID: ${error.message}\n`;
    }
  }
  
  // Render folder structure checkboxes
  function renderFolderStructureCheckboxes() {
    let html = '';
    
    folderStructure.forEach(folder => {
      html += `
        <div class="form-check">
          <input class="form-check-input folder-checkbox" type="checkbox" value="${folder}" id="folder-${folder.replace(/[^a-zA-Z0-9]/g, '-')}" checked>
          <label class="form-check-label" for="folder-${folder.replace(/[^a-zA-Z0-9]/g, '-')}">
            ${folder}
          </label>
        </div>
      `;
    });
    
    folderStructureCheckboxes.innerHTML = html;
  }
  
  // Get default folder structure
  function getDefaultFolderStructure() {
    return [
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
    ];
  }
  
  // Show alert message
  function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
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

## Integration with Existing System

### 1. Update App.js

```javascript
// src/app.js - Add new routes
const folderManagementRoutes = require('./routes/folder-management.routes');

// Add routes
app.use('/api/folders', folderManagementRoutes);
```

### 2. Update Case Detail Page

Add a link to the document location setting page:

```html
<!-- Add to case detail page -->
<a href="/case-document-location.html?id=${caseId}" class="btn btn-outline-primary">
  <i class="bi bi-folder"></i> Set Document Location
</a>
```

### 3. Update Client Detail Page

Add a link to the client folder creation page:

```html
<!-- Add to client detail page -->
<a href="/client-folder-creation.html?id=${clientId}" class="btn btn-outline-primary">
  <i class="bi bi-folder-plus"></i> Create Client Folders
</a>
```

## Implementation Plan

### 1. Data Model Updates

1. Update the Case model to include document folder location and folder structure
2. Update the Client model to include Google Drive folder ID

### 2. Core Services

1. Implement the AI Folder Suggestion service
2. Enhance the Google Drive service with folder search and creation capabilities

### 3. API Routes and Controllers

1. Create folder management routes and controllers
2. Integrate with existing case and client routes

### 4. User Interface

1. Create the Case Document Location setting page
2. Create the Client Folder Creation page
3. Update existing pages with links to new functionality

### 5. Testing

1. Test folder suggestion functionality with various client names
2. Test folder creation with different folder structures
3. Test integration with existing case and client management

## Conclusion

This AI-assisted client folder management feature enhances the CoreText Document Management System by allowing each case to define its top-level "Documents" folder location, using AI to suggest the correct client location on Google Drive, and creating client folders with the appropriate structure if they don't exist.

The implementation follows the folder structure defined in the provided Python script while adapting it to the Node.js environment of the CoreText system. The AI suggestion feature uses string similarity algorithms to match client names with existing folders, providing a seamless experience for users.

By implementing this feature, the CoreText system will maintain compatibility with the existing Google Drive folder structure while adding intelligent folder management capabilities that streamline the document management workflow.
