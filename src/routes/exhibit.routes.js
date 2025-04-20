const express = require('express');
const router = express.Router();
const exhibitController = require('../controllers/exhibit.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all exhibit routes
router.use(authMiddleware.verifyToken);

// Exhibit management routes
router.post('/', exhibitController.createExhibit);
router.get('/', exhibitController.getAllExhibits);
router.get('/:id', exhibitController.getExhibitById);
router.put('/:id', exhibitController.updateExhibit);
router.delete('/:id', exhibitController.deleteExhibit);

// Exhibit numbering
router.post('/number', exhibitController.assignExhibitNumbers);
router.post('/batch-number', exhibitController.batchAssignExhibitNumbers);

// Exhibit lists and packages
router.get('/list', exhibitController.generateExhibitList);
router.post('/package', exhibitController.createExhibitPackage);
router.get('/package/:id', exhibitController.getExhibitPackage);

// Exhibit tracking
router.get('/status', exhibitController.getExhibitStatus);
router.put('/status/:id', exhibitController.updateExhibitStatus);

module.exports = router;
