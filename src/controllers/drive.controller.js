const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const driveService = require('../services/drive.service');

// Get folders from Google Drive
exports.getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const folders = await driveService.getFolders(parentId);
    
    res.status(200).json({
      success: true,
      folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving folders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create folder in Google Drive
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }
    
    const folder = await driveService.createFolder(name, parentId);
    
    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating folder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get files from Google Drive
exports.getFiles = async (req, res) => {
  try {
    const { folderId, pageToken } = req.query;
    const result = await driveService.getFiles(folderId, pageToken);
    
    res.status(200).json({
      success: true,
      files: result.files,
      nextPageToken: result.nextPageToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get file by ID from Google Drive
exports.getFileById = async (req, res) => {
  try {
    const file = await driveService.getFileById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.status(200).json({
      success: true,
      file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Sync with Google Drive
exports.syncWithDrive = async (req, res) => {
  try {
    const { caseId, folderId } = req.body;
    
    if (!caseId || !folderId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and folder ID are required'
      });
    }
    
    // Start sync process in background
    driveService.startSync(caseId, folderId, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Sync process started',
      syncId: `${caseId}-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting sync process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get sync status
exports.getSyncStatus = async (req, res) => {
  try {
    const { syncId } = req.query;
    
    if (!syncId) {
      return res.status(400).json({
        success: false,
        message: 'Sync ID is required'
      });
    }
    
    const status = await driveService.getSyncStatus(syncId);
    
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving sync status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create folder structure in Google Drive
exports.createFolderStructure = async (req, res) => {
  try {
    const { caseId, caseName, parentFolderId } = req.body;
    
    if (!caseId || !caseName || !parentFolderId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID, case name, and parent folder ID are required'
      });
    }
    
    // Create case folder
    const caseFolder = await driveService.createFolder(caseName, parentFolderId);
    
    // Create standard subfolders
    const originalDocsFolder = await driveService.createFolder('Original Documents', caseFolder.id);
    const labeledDocsFolder = await driveService.createFolder('Labeled Documents', caseFolder.id);
    const pleadingsFolder = await driveService.createFolder('Pleadings', caseFolder.id);
    const discoveryFolder = await driveService.createFolder('Discovery', caseFolder.id);
    const medicalRecordsFolder = await driveService.createFolder('Medical Records', caseFolder.id);
    const correspondenceFolder = await driveService.createFolder('Correspondence', caseFolder.id);
    
    // Save folder structure to database
    // This would typically update a Case model with the folder IDs
    
    res.status(201).json({
      success: true,
      folderStructure: {
        caseFolder,
        subfolders: {
          originalDocs: originalDocsFolder,
          labeledDocs: labeledDocsFolder,
          pleadings: pleadingsFolder,
          discovery: discoveryFolder,
          medicalRecords: medicalRecordsFolder,
          correspondence: correspondenceFolder
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating folder structure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get folder structure from Google Drive
exports.getFolderStructure = async (req, res) => {
  try {
    const { caseId } = req.query;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // This would typically retrieve folder IDs from a Case model
    // and then get folder details from Google Drive
    
    const folderStructure = await driveService.getFolderStructure(caseId);
    
    res.status(200).json({
      success: true,
      folderStructure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving folder structure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get file permissions
exports.getFilePermissions = async (req, res) => {
  try {
    const permissions = await driveService.getFilePermissions(req.params.fileId);
    
    res.status(200).json({
      success: true,
      permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving file permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update file permissions
exports.updateFilePermissions = async (req, res) => {
  try {
    const { role, type, emailAddress } = req.body;
    
    if (!role || !type) {
      return res.status(400).json({
        success: false,
        message: 'Role and type are required'
      });
    }
    
    if (type === 'user' && !emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required for user permission'
      });
    }
    
    const permission = await driveService.updateFilePermissions(
      req.params.fileId,
      { role, type, emailAddress }
    );
    
    res.status(200).json({
      success: true,
      permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating file permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
