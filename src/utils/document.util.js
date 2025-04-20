const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const driveService = require('../services/drive.service');
const documentAiService = require('../services/documentai.service');
const pdfUtil = require('../utils/pdf.util');
const config = require('../config/config');

// Document synchronization with Google Drive
exports.syncWithDrive = async (caseId, folderId, userId) => {
  try {
    // Get case folder structure
    const Case = require('../models/case.model');
    const caseDoc = await Case.findById(caseId);
    
    if (!caseDoc) {
      throw new Error('Case not found');
    }
    
    // If folder structure doesn't exist, create it
    if (!caseDoc.folderStructure || !caseDoc.folderStructure.caseFolder) {
      // Create case folder in Google Drive
      const caseFolder = await driveService.createFolder(caseDoc.name, folderId);
      
      // Create standard subfolders
      const originalDocsFolder = await driveService.createFolder('Original Documents', caseFolder.id);
      const labeledDocsFolder = await driveService.createFolder('Labeled Documents', caseFolder.id);
      const pleadingsFolder = await driveService.createFolder('Pleadings', caseFolder.id);
      const discoveryFolder = await driveService.createFolder('Discovery', caseFolder.id);
      const medicalRecordsFolder = await driveService.createFolder('Medical Records', caseFolder.id);
      const correspondenceFolder = await driveService.createFolder('Correspondence', caseFolder.id);
      
      // Update case with folder structure
      caseDoc.driveFolderId = caseFolder.id;
      caseDoc.folderStructure = {
        caseFolder: {
          id: caseFolder.id,
          name: caseFolder.name
        },
        subfolders: {
          originalDocs: {
            id: originalDocsFolder.id,
            name: originalDocsFolder.name
          },
          labeledDocs: {
            id: labeledDocsFolder.id,
            name: labeledDocsFolder.name
          },
          pleadings: {
            id: pleadingsFolder.id,
            name: pleadingsFolder.name
          },
          discovery: {
            id: discoveryFolder.id,
            name: discoveryFolder.name
          },
          medicalRecords: {
            id: medicalRecordsFolder.id,
            name: medicalRecordsFolder.name
          },
          correspondence: {
            id: correspondenceFolder.id,
            name: correspondenceFolder.name
          }
        }
      };
      
      await caseDoc.save();
    }
    
    // Get files from Google Drive
    const files = await driveService.getFiles(caseDoc.driveFolderId);
    
    // Sync files with database
    const Document = require('../models/document.model');
    const syncResults = {
      added: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };
    
    for (const file of files.files) {
      try {
        // Check if document already exists in database
        const existingDoc = await Document.findOne({ driveFileId: file.id });
        
        if (existingDoc) {
          // Update document if modified time is different
          if (new Date(existingDoc.updatedAt).getTime() !== new Date(file.modifiedTime).getTime()) {
            existingDoc.name = file.name;
            existingDoc.driveLink = file.webViewLink;
            existingDoc.updatedAt = new Date(file.modifiedTime);
            await existingDoc.save();
            syncResults.updated++;
          } else {
            syncResults.unchanged++;
          }
        } else {
          // Download file from Google Drive
          const auth = await driveService.getUserAuth(userId);
          const drive = google.drive({ version: 'v3', auth });
          
          const response = await drive.files.get({
            fileId: file.id,
            alt: 'media'
          }, { responseType: 'stream' });
          
          // Save file to local storage
          const uploadDir = path.join(__dirname, '../../', config.upload.directory);
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filePath = path.join(uploadDir, file.name);
          const dest = fs.createWriteStream(filePath);
          
          await new Promise((resolve, reject) => {
            response.data
              .on('end', () => resolve())
              .on('error', err => reject(err))
              .pipe(dest);
          });
          
          // Extract metadata using Document AI
          const metadata = await documentAiService.extractMetadata(filePath);
          
          // Determine category based on file location or content
          let category = 'Uncategorized';
          const parentFolderId = await driveService.getParentFolderId(file.id);
          
          if (parentFolderId === caseDoc.folderStructure.subfolders.pleadings.id) {
            category = 'Pleadings';
          } else if (parentFolderId === caseDoc.folderStructure.subfolders.discovery.id) {
            category = 'Discovery';
          } else if (parentFolderId === caseDoc.folderStructure.subfolders.medicalRecords.id) {
            category = 'Medical Records';
          } else if (parentFolderId === caseDoc.folderStructure.subfolders.correspondence.id) {
            category = 'Correspondence';
          } else {
            // Use AI to categorize document
            const aiCategory = await documentAiService.categorizeDocument(filePath);
            if (aiCategory.confidence > 0.7) {
              category = aiCategory.category;
            }
          }
          
          // Create document in database
          await Document.create({
            name: file.name,
            path: filePath,
            mimeType: file.mimeType,
            size: file.size,
            uploadedBy: userId,
            case: caseId,
            category,
            metadata,
            driveFileId: file.id,
            driveLink: file.webViewLink,
            createdAt: new Date(file.createdTime),
            updatedAt: new Date(file.modifiedTime)
          });
          
          syncResults.added++;
        }
      } catch (error) {
        console.error(`Error syncing file ${file.name}:`, error);
        syncResults.errors.push({
          fileId: file.id,
          fileName: file.name,
          error: error.message
        });
      }
    }
    
    return syncResults;
  } catch (error) {
    console.error('Error syncing with Drive:', error);
    throw error;
  }
};

// Upload document to Google Drive
exports.uploadToGoogleDrive = async (filePath, fileName, caseId, category, userId) => {
  try {
    // Get case folder structure
    const Case = require('../models/case.model');
    const caseDoc = await Case.findById(caseId);
    
    if (!caseDoc || !caseDoc.folderStructure) {
      throw new Error('Case folder structure not found');
    }
    
    // Determine target folder based on category
    let targetFolderId = caseDoc.folderStructure.subfolders.originalDocs.id;
    
    if (category === 'Pleadings') {
      targetFolderId = caseDoc.folderStructure.subfolders.pleadings.id;
    } else if (category === 'Discovery') {
      targetFolderId = caseDoc.folderStructure.subfolders.discovery.id;
    } else if (category === 'Medical Records') {
      targetFolderId = caseDoc.folderStructure.subfolders.medicalRecords.id;
    } else if (category === 'Correspondence') {
      targetFolderId = caseDoc.folderStructure.subfolders.correspondence.id;
    }
    
    // Get file MIME type
    const mimeType = getMimeType(filePath);
    
    // Upload file to Google Drive
    const driveFile = await driveService.uploadFile(
      filePath,
      fileName,
      mimeType,
      targetFolderId
    );
    
    return driveFile;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

// Upload Bates labeled document to Google Drive
exports.uploadBatesLabeledDocument = async (originalPath, labeledPath, fileName, caseId, userId) => {
  try {
    // Get case folder structure
    const Case = require('../models/case.model');
    const caseDoc = await Case.findById(caseId);
    
    if (!caseDoc || !caseDoc.folderStructure) {
      throw new Error('Case folder structure not found');
    }
    
    // Target folder for labeled documents
    const targetFolderId = caseDoc.folderStructure.subfolders.labeledDocs.id;
    
    // Get file MIME type
    const mimeType = getMimeType(labeledPath);
    
    // Upload labeled file to Google Drive
    const driveFile = await driveService.uploadFile(
      labeledPath,
      `${fileName} (Bates Labeled)`,
      mimeType,
      targetFolderId
    );
    
    return driveFile;
  } catch (error) {
    console.error('Error uploading Bates labeled document:', error);
    throw error;
  }
};

// Helper function to get MIME type based on file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.tiff':
    case '.tif':
      return 'image/tiff';
    default:
      return 'application/octet-stream';
  }
}
