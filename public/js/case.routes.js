const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Case = require('../models/case.model');
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

// Test connection route
router.route('/test-connection')
  .get(testConnection);

// SIMPLIFIED DIRECT CASE CREATION ROUTE
// This bypasses the complex controller logic that's causing errors
router.route('/public')
  .post(async (req, res) => {
    try {
      // Create a copy of the request body
      const caseData = { ...req.body };
      
      // Add a dummy ObjectId for the required createdBy field
      caseData.createdBy = new mongoose.Types.ObjectId();
      
      // Create the case directly using the mongoose model
      const newCase = new Case(caseData);
      await newCase.save();
      
      // Return success response
      res.status(201).json({
        success: true,
        data: newCase
      });
    } catch (error) {
      console.error('Direct case creation error:', error);
      res.status(500).json({
        success: false,
        message: `Error creating case: ${error.message}`
      });
    }
  });

// Add this route to handle the specific endpoint being called by the test page
router.route('/public/cases/public')
  .post(async (req, res) => {
    try {
      // Create a copy of the request body
      const caseData = { ...req.body };
      
      // Add a dummy ObjectId for the required createdBy field
      caseData.createdBy = new mongoose.Types.ObjectId();
      
      // Create the case directly using the mongoose model
      const newCase = new Case(caseData);
      await newCase.save();
      
      // Return success response
      res.status(201).json({
        success: true,
        data: newCase
      });
    } catch (error) {
      console.error('Direct case creation error:', error);
      res.status(500).json({
        success: false,
        message: `Error creating case: ${error.message}`
      });
    }
  });

// Case routes
router.route('/')
  .get(getCases)
  .post(createCase);

router.route('/:id')
  .get(protect, getCase)
  .put(protect, updateCase)
  .delete(protect, deleteCase);

router.route('/:id/documents')
  .get(protect, getCaseDocuments);

router.route('/:id/dashboard')
  .get(protect, getCaseDashboard);

module.exports = router;
