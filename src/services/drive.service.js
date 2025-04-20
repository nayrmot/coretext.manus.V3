const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Create OAuth2 client
const createOAuth2Client = (credentials) => {
  const { client_id, client_secret, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
};

// Get default credentials
const getCredentials = () => {
  return {
    web: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_CALLBACK_URL]
    }
  };
};

// Initialize Drive API
const initializeDrive = (auth) => {
  return google.drive({ version: 'v3', auth });
};

// Get user's OAuth2 client
const getUserAuth = async (userId) => {
  try {
    // In a real implementation, you would retrieve the user's tokens from the database
    // For now, we'll use the default credentials
    const credentials = getCredentials();
    const oAuth2Client = createOAuth2Client(credentials);
    
    // Set credentials if available
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    
    if (user && user.googleTokens) {
      oAuth2Client.setCredentials(user.googleTokens);
    }
    
    return oAuth2Client;
  } catch (error) {
    console.error('Error getting user auth:', error);
    throw error;
  }
};

// Get folders from Google Drive
exports.getFolders = async (parentId = 'root') => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const query = parentId === 'root' 
      ? "mimeType='application/vnd.google-apps.folder' and 'root' in parents"
      : `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents`;
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime)',
      orderBy: 'name'
    });
    
    return response.data.files;
  } catch (error) {
    console.error('Error getting folders:', error);
    throw error;
  }
};

// Create folder in Google Drive
exports.createFolder = async (name, parentId = 'root') => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Get files from Google Drive
exports.getFiles = async (folderId = 'root', pageToken) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const query = folderId === 'root' 
      ? "'root' in parents"
      : `'${folderId}' in parents`;
    
    const response = await drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
      orderBy: 'name',
      pageToken
    });
    
    return {
      files: response.data.files,
      nextPageToken: response.data.nextPageToken
    };
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
};

// Get file by ID from Google Drive
exports.getFileById = async (fileId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, createdTime, modifiedTime, size, webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting file by ID:', error);
    throw error;
  }
};

// Upload file to Google Drive
exports.uploadFile = async (filePath, fileName, mimeType, folderId = 'root') => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Update file in Google Drive
exports.updateFile = async (fileId, { name }) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const fileMetadata = {};
    if (name) fileMetadata.name = name;
    
    const response = await drive.files.update({
      fileId,
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

// Delete file from Google Drive
exports.deleteFile = async (fileId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    await drive.files.delete({
      fileId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Get file versions from Google Drive
exports.getFileVersions = async (fileId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const response = await drive.revisions.list({
      fileId,
      fields: 'revisions(id, modifiedTime, lastModifyingUser)'
    });
    
    return response.data.revisions || [];
  } catch (error) {
    console.error('Error getting file versions:', error);
    throw error;
  }
};

// Get specific file version from Google Drive
exports.getFileVersion = async (fileId, revisionId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const response = await drive.revisions.get({
      fileId,
      revisionId,
      fields: 'id, modifiedTime, lastModifyingUser'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting file version:', error);
    throw error;
  }
};

// Revert to specific file version in Google Drive
exports.revertToVersion = async (fileId, revisionId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    await drive.revisions.update({
      fileId,
      revisionId,
      resource: {
        published: true
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error reverting to version:', error);
    throw error;
  }
};

// Start sync process with Google Drive
exports.startSync = async (caseId, folderId, userId) => {
  try {
    // In a real implementation, this would be a background process
    // For now, we'll just log the sync request
    console.log(`Starting sync for case ${caseId} with folder ${folderId} by user ${userId}`);
    
    // Return a sync ID for tracking
    return `${caseId}-${Date.now()}`;
  } catch (error) {
    console.error('Error starting sync:', error);
    throw error;
  }
};

// Get sync status
exports.getSyncStatus = async (syncId) => {
  try {
    // In a real implementation, this would check the status of the background process
    // For now, we'll just return a mock status
    return {
      syncId,
      status: 'completed',
      progress: 100,
      message: 'Sync completed successfully',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
};

// Get folder structure for a case
exports.getFolderStructure = async (caseId) => {
  try {
    // In a real implementation, this would retrieve the folder structure from the database
    // and then get folder details from Google Drive
    const Case = require('../models/case.model');
    const caseDoc = await Case.findById(caseId);
    
    if (!caseDoc || !caseDoc.folderStructure) {
      throw new Error('Case folder structure not found');
    }
    
    return caseDoc.folderStructure;
  } catch (error) {
    console.error('Error getting folder structure:', error);
    throw error;
  }
};

// Get file permissions
exports.getFilePermissions = async (fileId) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const response = await drive.permissions.list({
      fileId,
      fields: 'permissions(id, type, role, emailAddress)'
    });
    
    return response.data.permissions || [];
  } catch (error) {
    console.error('Error getting file permissions:', error);
    throw error;
  }
};

// Update file permissions
exports.updateFilePermissions = async (fileId, { role, type, emailAddress }) => {
  try {
    const auth = await getUserAuth();
    const drive = initializeDrive(auth);
    
    const permissionMetadata = {
      role,
      type
    };
    
    if (type === 'user' && emailAddress) {
      permissionMetadata.emailAddress = emailAddress;
    }
    
    const response = await drive.permissions.create({
      fileId,
      resource: permissionMetadata,
      fields: 'id, type, role, emailAddress'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating file permissions:', error);
    throw error;
  }
};
