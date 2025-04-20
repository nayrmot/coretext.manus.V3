// Updated case controller with proper getCases implementation
const Case = require('../models/case.model');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Get all cases
 * @route   GET /api/cases
 * @access  Private
 */
exports.getCases = asyncHandler(async (req, res) => {
  try {
    // Get all cases
    const cases = await Case.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching cases: ${error.message}`
    });
  }
});

/**
 * @desc    Get single case
 * @route   GET /api/cases/:id
 * @access  Private
 */
exports.getCase = asyncHandler(async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching case: ${error.message}`
    });
  }
});

/**
 * @desc    Create new case
 * @route   POST /api/cases
 * @access  Private
 */
exports.createCase = asyncHandler(async (req, res) => {
  try {
    // Create case
    const caseItem = await Case.create(req.body);
    
    res.status(201).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error creating case: ${error.message}`
    });
  }
});

/**
 * @desc    Update case
 * @route   PUT /api/cases/:id
 * @access  Private
 */
exports.updateCase = asyncHandler(async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Update case
    caseItem = await Case.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error updating case: ${error.message}`
    });
  }
});

/**
 * @desc    Delete case
 * @route   DELETE /api/cases/:id
 * @access  Private
 */
exports.deleteCase = asyncHandler(async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    await caseItem.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error deleting case: ${error.message}`
    });
  }
});

/**
 * @desc    Get case documents
 * @route   GET /api/cases/:id/documents
 * @access  Private
 */
exports.getCaseDocuments = asyncHandler(async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // In a real implementation, you would fetch documents related to this case
    // For now, we'll return an empty array
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching case documents: ${error.message}`
    });
  }
});

/**
 * @desc    Get case dashboard data
 * @route   GET /api/cases/:id/dashboard
 * @access  Private
 */
exports.getCaseDashboard = asyncHandler(async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // In a real implementation, you would fetch dashboard data for this case
    // For now, we'll return a simple object
    res.status(200).json({
      success: true,
      data: {
        caseId: caseItem._id,
        caseName: caseItem.name,
        documentCount: 0,
        lastUpdated: caseItem.updatedAt || caseItem.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error fetching case dashboard: ${error.message}`
    });
  }
});

/**
 * @desc    Test MongoDB connection
 * @route   GET /api/cases/test-connection
 * @access  Public
 */
exports.testConnection = asyncHandler(async (req, res) => {
  try {
    // Get connection information
    const dbConnection = mongoose.connection;
    
    // Check if connected
    if (dbConnection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Not connected to MongoDB'
      });
    }
    
    // Get database information
    const dbName = dbConnection.db.databaseName;
    const serverInfo = await dbConnection.db.admin().serverInfo();
    
    res.status(200).json({
      success: true,
      database: dbName,
      server: serverInfo.host,
      version: serverInfo.version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error testing connection: ${error.message}`
    });
  }
});
