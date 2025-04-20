const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all email routes
router.use(authMiddleware.verifyToken);

// Gmail integration routes
router.get('/connect', emailController.connectGmail);
router.get('/connect/callback', emailController.gmailCallback);
router.get('/status', emailController.getConnectionStatus);

// Email management
router.get('/messages', emailController.getEmails);
router.get('/messages/:id', emailController.getEmailById);
router.post('/messages/:id/process', emailController.processEmail);
router.post('/messages/batch-process', emailController.batchProcessEmails);

// Email monitoring
router.post('/monitor', emailController.setupEmailMonitoring);
router.get('/monitor', emailController.getMonitoringStatus);
router.delete('/monitor', emailController.stopEmailMonitoring);

// Email attachments
router.get('/messages/:id/attachments', emailController.getEmailAttachments);
router.post('/messages/:id/attachments/extract', emailController.extractAttachments);

module.exports = router;
