const express = require('express');
const router = express.Router();
const { 
  getCases, 
  getCase, 
  createCase, 
  updateCase, 
  deleteCase, 
  getCaseDocuments,
  getCaseDashboard,
  testConnection
} = require('../controllers/case.controller');

// Middleware
const { protect } = require('../middleware/auth');

router.get('/test-connection', testConnection);

// Test connection route
router.route('/test-connection')
  .get(testConnection);

// Case routes
router.route('/')
  .get(protect, getCases)
  .post(protect, createCase);

router.route('/:id')
  .get(protect, getCase)
  .put(protect, updateCase)
  .delete(protect, deleteCase);

router.route('/:id/documents')
  .get(protect, getCaseDocuments);

router.route('/:id/dashboard')
  .get(protect, getCaseDashboard);

module.exports = router;
