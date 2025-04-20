const Case = require('../models/case.model');
const Document = require('../models/document.model');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');

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
        error: `Case not found with id of ${req.params.id}`
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
    // Create a copy of the request body to modify
    const caseData = { ...req.body };
    
    // For public routes, we need to handle the createdBy field differently
    // Since it's required in the schema and must be an ObjectId
    caseData.createdBy = new mongoose.Types.ObjectId();
    
    // Create case with the modified data
    const caseItem = await Case.create(caseData);
    
    res.status(201).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    console.error('Case creation error:', error);
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
        error: `Case not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is case owner if req.user exists
    if (req.user && caseItem.createdBy && caseItem.createdBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: `User ${req.user.id} is not authorized to update this case`
      });
    }
    
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
        error: `Case not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is case owner if req.user exists
    if (req.user && caseItem.createdBy && caseItem.createdBy.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: `User ${req.user.id} is not authorized to delete this case`
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
        error: `Case not found with id of ${req.params.id}`
      });
    }
    
    const documents = await Document.find({ case: req.params.id })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
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
        error: `Case not found with id of ${req.params.id}`
      });
    }
    
    // Get document counts by category - using a safe approach to avoid undefined errors
    let documentsByCategory = [];
    try {
      documentsByCategory = await Document.aggregate([
        { $match: { case: mongoose.Types.ObjectId(req.params.id) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
    } catch (err) {
      console.error('Error aggregating documents by category:', err);
      // Continue execution even if this fails
    }
    
    // Get recent documents
    let recentDocuments = [];
    try {
      recentDocuments = await Document.find({ case: req.params.id })
        .sort('-createdAt')
        .limit(5);
      
      // Only try to populate if documents were found
      if (recentDocuments.length > 0) {
        recentDocuments = await Document.populate(recentDocuments, {
          path: 'uploadedBy',
          select: 'name'
        });
      }
    } catch (err) {
      console.error('Error fetching recent documents:', err);
      // Continue execution even if this fails
    }
    
    res.status(200).json({
      success: true,
      data: {
        case: caseItem,
        documentsByCategory,
        recentDocuments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
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
      version: serverInfo.version,
      state: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error testing connection: ${error.message}`
    });
  }
});
