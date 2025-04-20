const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all document routes
router.use(authMiddleware.verifyToken);

// Document CRUD operations
router.post('/', documentController.uploadDocument);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

// Document categorization
router.post('/categorize', documentController.categorizeDocument);
router.post('/batch-categorize', documentController.batchCategorizeDocuments);

// Document search
router.get('/search', documentController.searchDocuments);

// Document version control
router.get('/:id/versions', documentController.getDocumentVersions);
router.get('/:id/versions/:versionId', documentController.getDocumentVersion);
router.post('/:id/revert/:versionId', documentController.revertToVersion);

module.exports = router;
