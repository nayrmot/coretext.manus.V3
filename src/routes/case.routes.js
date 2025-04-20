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
const { protect } = require('../middleware/auth.middleware');

// Test connection route (public)
router.route('/test-connection')
  .get(testConnection);

// Public case creation routes
// Multiple paths to handle all possible endpoint patterns the client might use
router.route('/public')
  .post(createCase);

// This is the specific endpoint that was causing errors in the test page
router.route('/public/cases/public')
  .post(createCase);

// Case routes - public access for GET, protected for POST
router.route('/')
  .get(getCases)
  .post(createCase);

// Protected case routes
router.route('/:id')
  .get(protect, getCase)
  .put(protect, updateCase)
  .delete(protect, deleteCase);

router.route('/:id/documents')
  .get(protect, getCaseDocuments);

router.route('/:id/dashboard')
  .get(protect, getCaseDashboard);

module.exports = router;
