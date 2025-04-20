const express = require('express');
const router = express.Router();
const driveController = require('../controllers/drive.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all drive routes
router.use(authMiddleware.verifyToken);

// Google Drive integration routes
router.get('/folders', driveController.getFolders);
router.post('/folders', driveController.createFolder);
router.get('/files', driveController.getFiles);
router.get('/files/:fileId', driveController.getFileById);

// Synchronization routes
router.post('/sync', driveController.syncWithDrive);
router.get('/sync/status', driveController.getSyncStatus);

// Folder structure management
router.post('/folders/structure', driveController.createFolderStructure);
router.get('/folders/structure', driveController.getFolderStructure);

// Permissions management
router.get('/permissions/:fileId', driveController.getFilePermissions);
router.post('/permissions/:fileId', driveController.updateFilePermissions);

module.exports = router;
