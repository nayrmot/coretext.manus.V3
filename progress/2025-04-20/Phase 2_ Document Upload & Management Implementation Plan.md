# Phase 2: Document Upload & Management Implementation Plan

## Overview

This document outlines the detailed implementation plan for Phase 2 of the CoreText Document Management System. Building upon the database implementation and case selection functionality completed in Phase 1, Phase 2 will focus on document upload, storage, organization, and management features.

## Goals

1. Implement document upload functionality with support for various file types
2. Create document management features including versioning and metadata
3. Integrate document functionality with the existing case management system
4. Implement security features for document access and modification
5. Add advanced document processing capabilities

## Implementation Roadmap

### 1. Document Upload Functionality (Week 1-2)

#### 1.1 Backend Implementation

1. **Create Document Model**
   ```javascript
   // src/models/document.model.js
   const mongoose = require('mongoose');

   const DocumentSchema = new mongoose.Schema({
     filename: {
       type: String,
       required: true,
       trim: true
     },
     originalName: {
       type: String,
       required: true
     },
     mimeType: {
       type: String,
       required: true
     },
     size: {
       type: Number,
       required: true
     },
     path: {
       type: String,
       required: true
     },
     caseId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Case',
       required: true
     },
     uploadedBy: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: false
     },
     version: {
       type: Number,
       default: 1
     },
     metadata: {
       title: String,
       description: String,
       tags: [String],
       category: String,
       customFields: mongoose.Schema.Types.Mixed
     },
     isPublic: {
       type: Boolean,
       default: false
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

   // Add text index for search functionality
   DocumentSchema.index({
     'originalName': 'text',
     'metadata.title': 'text',
     'metadata.description': 'text',
     'metadata.tags': 'text'
   });

   module.exports = mongoose.model('Document', DocumentSchema);
   ```

2. **Set Up File Storage**
   - Configure multer middleware for file uploads
   - Create directory structure for document storage
   - Implement file naming and organization strategy

3. **Create Document Controller**
   - Implement upload functionality
   - Add validation for file types and sizes
   - Create CRUD operations for documents
   - Add version control functionality

4. **Define Document Routes**
   - Create routes for document upload
   - Add routes for document retrieval, update, and deletion
   - Implement routes for document search and filtering

#### 1.2 Frontend Implementation

1. **Create Document Upload Page**
   - Implement drag-and-drop interface
   - Add file type and size validation
   - Create progress indicators for uploads
   - Add metadata input fields

2. **Implement Document Upload JavaScript**
   ```javascript
   // public/js/document-upload.js
   
   document.addEventListener('DOMContentLoaded', function() {
     // DOM elements
     const uploadForm = document.querySelector('#documentUploadForm');
     const dropZone = document.querySelector('#dropZone');
     const fileInput = document.querySelector('#fileInput');
     const uploadBtn = document.querySelector('#uploadBtn');
     const progressBar = document.querySelector('.progress-bar');
     const fileList = document.querySelector('#fileList');
     const caseSelector = document.querySelector('#caseSelector');
     
     // State variables
     let files = [];
     let currentCaseId = '';
     
     // Initialize
     loadCasesForSelector();
     
     // Load cases for the selector
     async function loadCasesForSelector() {
       try {
         const response = await fetch('/api/public/cases?status=active');
         const data = await response.json();
         
         if (!response.ok) {
           throw new Error(data.error || 'Failed to load cases');
         }
         
         // Clear existing options
         while (caseSelector.options.length > 1) {
           caseSelector.remove(1);
         }
         
         // Add cases to selector
         if (data.data && data.data.length > 0) {
           data.data.forEach(caseItem => {
             const option = document.createElement('option');
             option.value = caseItem._id;
             option.textContent = caseItem.name;
             caseSelector.appendChild(option);
           });
           
           // Check for selected case from localStorage
           const selectedCaseId = localStorage.getItem('selectedCaseId');
           if (selectedCaseId) {
             caseSelector.value = selectedCaseId;
             currentCaseId = selectedCaseId;
           }
         }
       } catch (error) {
         console.error('Error loading cases:', error);
         showAlert('danger', 'Failed to load cases. Please try again later.');
       }
     }
     
     // Handle file selection
     function handleFiles(selectedFiles) {
       for (let i = 0; i < selectedFiles.length; i++) {
         const file = selectedFiles[i];
         
         // Check if file is already in the list
         if (!files.some(f => f.name === file.name && f.size === file.size)) {
           files.push(file);
           
           // Create file item in the list
           const fileItem = document.createElement('div');
           fileItem.className = 'file-item';
           fileItem.innerHTML = `
             <div class="file-info">
               <span class="file-name">${file.name}</span>
               <span class="file-size">${formatFileSize(file.size)}</span>
             </div>
             <button type="button" class="btn btn-sm btn-danger remove-file" data-name="${file.name}">
               <i class="bi bi-x"></i>
             </button>
           `;
           fileList.appendChild(fileItem);
         }
       }
       
       // Enable upload button if files are selected and case is selected
       uploadBtn.disabled = !(files.length > 0 && currentCaseId);
     }
     
     // Format file size
     function formatFileSize(bytes) {
       if (bytes === 0) return '0 Bytes';
       
       const k = 1024;
       const sizes = ['Bytes', 'KB', 'MB', 'GB'];
       const i = Math.floor(Math.log(bytes) / Math.log(k));
       
       return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
     }
     
     // Upload files
     async function uploadFiles() {
       if (files.length === 0 || !currentCaseId) return;
       
       // Disable upload button
       uploadBtn.disabled = true;
       
       // Reset progress bar
       progressBar.style.width = '0%';
       progressBar.textContent = '0%';
       progressBar.parentElement.classList.remove('d-none');
       
       // Create FormData
       const formData = new FormData();
       formData.append('caseId', currentCaseId);
       
       // Add metadata
       const title = document.querySelector('#documentTitle').value;
       const description = document.querySelector('#documentDescription').value;
       const category = document.querySelector('#documentCategory').value;
       const tags = document.querySelector('#documentTags').value;
       
       if (title) formData.append('title', title);
       if (description) formData.append('description', description);
       if (category) formData.append('category', category);
       if (tags) formData.append('tags', tags);
       
       // Add files
       files.forEach(file => {
         formData.append('documents', file);
       });
       
       try {
         // Upload files
         const xhr = new XMLHttpRequest();
         
         xhr.open('POST', '/api/documents/upload', true);
         
         // Progress handler
         xhr.upload.onprogress = function(e) {
           if (e.lengthComputable) {
             const percentComplete = Math.round((e.loaded / e.total) * 100);
             progressBar.style.width = percentComplete + '%';
             progressBar.textContent = percentComplete + '%';
           }
         };
         
         // Load handler
         xhr.onload = function() {
           if (xhr.status === 200 || xhr.status === 201) {
             const response = JSON.parse(xhr.responseText);
             
             // Show success message
             showAlert('success', `Successfully uploaded ${files.length} document(s)`);
             
             // Clear file list
             fileList.innerHTML = '';
             files = [];
             
             // Reset form
             uploadForm.reset();
             
             // Hide progress bar after a delay
             setTimeout(() => {
               progressBar.parentElement.classList.add('d-none');
             }, 2000);
             
             // Disable upload button
             uploadBtn.disabled = true;
           } else {
             const response = JSON.parse(xhr.responseText);
             throw new Error(response.error || 'Upload failed');
           }
         };
         
         // Error handler
         xhr.onerror = function() {
           throw new Error('Network error occurred during upload');
         };
         
         // Send the form data
         xhr.send(formData);
       } catch (error) {
         console.error('Error uploading files:', error);
         showAlert('danger', `Upload failed: ${error.message}`);
         
         // Hide progress bar
         progressBar.parentElement.classList.add('d-none');
         
         // Re-enable upload button
         uploadBtn.disabled = false;
       }
     }
     
     // Show alert message
     function showAlert(type, message) {
       const alertContainer = document.querySelector('#alertContainer');
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
     
     // Event: Case selector change
     caseSelector.addEventListener('change', function() {
       currentCaseId = this.value;
       uploadBtn.disabled = !(files.length > 0 && currentCaseId);
     });
     
     // Event: File input change
     fileInput.addEventListener('change', function() {
       handleFiles(this.files);
     });
     
     // Event: Drop zone drag over
     dropZone.addEventListener('dragover', function(e) {
       e.preventDefault();
       dropZone.classList.add('drag-over');
     });
     
     // Event: Drop zone drag leave
     dropZone.addEventListener('dragleave', function() {
       dropZone.classList.remove('drag-over');
     });
     
     // Event: Drop zone drop
     dropZone.addEventListener('drop', function(e) {
       e.preventDefault();
       dropZone.classList.remove('drag-over');
       handleFiles(e.dataTransfer.files);
     });
     
     // Event: Drop zone click
     dropZone.addEventListener('click', function() {
       fileInput.click();
     });
     
     // Event: Remove file button click
     fileList.addEventListener('click', function(e) {
       if (e.target.closest('.remove-file')) {
         const button = e.target.closest('.remove-file');
         const fileName = button.dataset.name;
         
         // Remove file from array
         files = files.filter(file => file.name !== fileName);
         
         // Remove file item from list
         button.closest('.file-item').remove();
         
         // Disable upload button if no files
         uploadBtn.disabled = !(files.length > 0 && currentCaseId);
       }
     });
     
     // Event: Form submission
     uploadForm.addEventListener('submit', function(e) {
       e.preventDefault();
       uploadFiles();
     });
   });
   ```

3. **Create Document Listing Page**
   - Implement document grid/list view
   - Add sorting and filtering options
   - Create document preview functionality
   - Implement pagination for large document sets

### 2. Document Management Features (Week 3-4)

#### 2.1 Document Versioning

1. **Backend Implementation**
   - Create version tracking system
   - Implement version comparison functionality
   - Add version history API endpoints

2. **Frontend Implementation**
   - Create version history UI
   - Implement version comparison view
   - Add version rollback functionality

#### 2.2 Document Metadata Management

1. **Backend Implementation**
   - Create metadata schema and validation
   - Implement metadata search functionality
   - Add metadata update API endpoints

2. **Frontend Implementation**
   - Create metadata editor UI
   - Implement tag management system
   - Add category management functionality

#### 2.3 Document Preview

1. **Backend Implementation**
   - Implement document conversion for preview
   - Create thumbnail generation system
   - Add preview API endpoints

2. **Frontend Implementation**
   - Create document preview UI
   - Implement viewer for different file types
   - Add zoom and navigation controls

### 3. Case Integration (Week 5)

#### 3.1 Document-Case Association

1. **Backend Implementation**
   - Update Case model to include document references
   - Create API endpoints for case-document operations
   - Implement document organization within cases

2. **Frontend Implementation**
   - Update case detail page to show documents
   - Create document organization UI within cases
   - Implement drag-and-drop for document organization

#### 3.2 Case-Specific Document Views

1. **Backend Implementation**
   - Create filtered document views by case
   - Implement case-specific document search
   - Add case-specific document statistics

2. **Frontend Implementation**
   - Create case document dashboard
   - Implement case-specific document filters
   - Add document statistics visualization

### 4. Security Features (Week 6)

#### 4.1 Document Permissions

1. **Backend Implementation**
   - Create document permission model
   - Implement permission checking middleware
   - Add permission management API endpoints

2. **Frontend Implementation**
   - Create permission management UI
   - Implement user/role selector for permissions
   - Add permission visualization

#### 4.2 Document Encryption

1. **Backend Implementation**
   - Implement document encryption system
   - Create key management functionality
   - Add encrypted document API endpoints

2. **Frontend Implementation**
   - Create encryption settings UI
   - Implement encryption status indicators
   - Add encryption/decryption controls

#### 4.3 Audit Trails

1. **Backend Implementation**
   - Create audit log model
   - Implement audit logging middleware
   - Add audit log API endpoints

2. **Frontend Implementation**
   - Create audit log viewer
   - Implement audit log filtering
   - Add audit log export functionality

### 5. Advanced Features (Week 7-8)

#### 5.1 OCR Capabilities

1. **Backend Implementation**
   - Integrate OCR library (Tesseract.js)
   - Implement text extraction functionality
   - Add searchable text storage

2. **Frontend Implementation**
   - Create OCR processing UI
   - Implement text search highlighting
   - Add OCR status indicators

#### 5.2 Document Comparison

1. **Backend Implementation**
   - Implement document comparison algorithms
   - Create diff generation functionality
   - Add comparison API endpoints

2. **Frontend Implementation**
   - Create comparison view UI
   - Implement side-by-side comparison
   - Add difference highlighting

#### 5.3 Document Annotation

1. **Backend Implementation**
   - Create annotation model
   - Implement annotation storage
   - Add annotation API endpoints

2. **Frontend Implementation**
   - Create annotation tools
   - Implement annotation display
   - Add annotation management UI

## Technical Requirements

### Backend

1. **Storage System**
   - File system storage for documents
   - MongoDB for metadata and references
   - Configurable storage paths

2. **Processing Libraries**
   - Multer for file uploads
   - Sharp for image processing
   - PDF.js for PDF handling
   - Tesseract.js for OCR

3. **Security Components**
   - Crypto for encryption
   - JWT for authentication
   - Role-based access control

### Frontend

1. **UI Components**
   - Drag-and-drop file upload
   - Document preview
   - Version comparison
   - Annotation tools

2. **Libraries**
   - PDF.js for PDF rendering
   - Dropzone.js for drag-and-drop
   - Chart.js for statistics visualization
   - DiffMatchPatch for text comparison

## Integration Points

1. **Case Management Integration**
   - Document listing within case view
   - Case selector in document upload
   - Case-based document filtering

2. **User Management Integration**
   - User permissions for documents
   - User audit trails
   - User notifications for document changes

## Testing Strategy

1. **Unit Testing**
   - Test document model validation
   - Test controller functions
   - Test permission checking

2. **Integration Testing**
   - Test document upload flow
   - Test document-case association
   - Test version control functionality

3. **UI Testing**
   - Test drag-and-drop functionality
   - Test document preview
   - Test responsive design

## Deployment Considerations

1. **Storage Requirements**
   - Estimate storage needs based on document types
   - Plan for storage scaling
   - Consider backup strategy

2. **Performance Optimization**
   - Implement caching for document metadata
   - Use streaming for large file downloads
   - Optimize database queries

3. **Security Measures**
   - Implement virus scanning for uploads
   - Set up proper file permissions
   - Configure CORS policies

## Conclusion

This implementation plan provides a comprehensive roadmap for Phase 2 of the CoreText Document Management System. By following this plan, we will successfully implement document upload and management functionality that integrates seamlessly with the existing case management system developed in Phase 1.

The plan is designed to be modular, allowing for incremental implementation and testing of features. Each component builds upon the previous ones, ensuring a cohesive and well-integrated system by the end of Phase 2.
