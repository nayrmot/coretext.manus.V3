const express = require('express');
const router = express.Router();
const { 
  getCases, 
  getCase, 
  createCase, 
  updateCase, 
  deleteCase, 
  getCaseDocuments,
  getCaseDashboard
} = require('../controllers/case.controller');

// Middleware
const { protect } = require('../middleware/auth');

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
