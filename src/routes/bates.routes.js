const express = require('express');
const router = express.Router();
const batesController = require('../controllers/bates.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all bates routes
router.use(authMiddleware.verifyToken);

// Bates numbering configuration
router.post('/config', batesController.createBatesConfig);
router.get('/config', batesController.getBatesConfigs);
router.get('/config/:id', batesController.getBatesConfigById);
router.put('/config/:id', batesController.updateBatesConfig);
router.delete('/config/:id', batesController.deleteBatesConfig);

// Bates labeling operations
router.post('/label', batesController.applyBatesLabel);
router.post('/batch-label', batesController.batchApplyBatesLabels);
router.get('/registry', batesController.getBatesRegistry);
router.get('/registry/search', batesController.searchBatesRegistry);

// Bates reports
router.get('/reports', batesController.generateBatesReport);

module.exports = router;
