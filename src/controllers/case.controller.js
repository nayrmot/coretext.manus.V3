const Case = require('../models/case.model');
const Document = require('../models/document.model');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');

/**
 * @desc    Get all cases
 * @route   GET /api/cases
 * @access  Private/Public
 */
exports.getCases = asyncHandler(async (req, res) => {
  try {
    // Implement pagination, filtering, and sorting
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Case.countDocuments();

    const query = Case.find();

    // Apply filters if provided
    if (req.query.status) {
      query.where('status').equals(req.query.status);
    }

    if (req.query.client) {
      query.where('client').equals(req.query.client);
    }

    // Apply sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query.sort(sortBy);
    } else {
      query.sort('-createdAt');
    }

    // Pagination
    query.skip(startIndex).limit(limit);

    // Execute query
    const cases = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: cases.length,
      pagination,
      data: cases
    });
  } catch (error) {
    console.error('Error getting cases:', error);
    res.status(500).json({
      success: false,
      message: `Error getting cases: ${error.message}`
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
    console.error('Error getting case:', error);
    res.status(500).json({
      success: false,
      message: `Error getting case: ${error.message}`
    });
  }
});

/**
 * @desc    Create new case
 * @route   POST /api/cases
 * @access  Private/Public
 */
exports.createCase = asyncHandler(async (req, res) => {
  try {
    // Create a copy of the request body to modify
    const caseData = { ...req.body };
    
    // Check if this is an authenticated request
    if (req.user) {
      // If authenticated, add user to caseData
      caseData.createdBy = req.user.id;
    }
    // If not authenticated, createdBy will be undefined/null
    // This is now allowed because we made the field optional in the schema
    
    // Create case with the modified data
    const caseItem = await Case.create(caseData);
    
    res.status(201).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    console.error('Error creating case:', error);
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

    // Make sure user is case owner if authentication is enabled
    // and if the case has a createdBy field
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
    console.error('Error updating case:', error);
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

    // Make sure user is case owner if authentication is enabled
    // and if the case has a createdBy field
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
    console.error('Error deleting case:', error);
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
    console.error('Error getting case documents:', error);
    res.status(500).json({
      success: false,
      message: `Error getting case documents: ${error.message}`
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

    // Get document counts by category - safely
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

    // Get recent documents - safely
    let recentDocuments = [];
    try {
      recentDocuments = await Document.find({ case: req.params.id })
        .sort('-createdAt')
        .limit(5);
      
      // Only try to populate if documents were found
      if (recentDocuments.length > 0) {
        try {
          recentDocuments = await Document.populate(recentDocuments, {
            path: 'uploadedBy',
            select: 'name'
          });
        } catch (err) {
          console.error('Error populating uploadedBy:', err);
          // Continue execution even if this fails
        }
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
    console.error('Error getting case dashboard:', error);
    res.status(500).json({
      success: false,
      message: `Error getting case dashboard: ${error.message}`
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
    let serverInfo = { host: 'unknown', version: 'unknown' };
    
    try {
      serverInfo = await dbConnection.db.admin().serverInfo();
    } catch (err) {
      console.error('Error getting server info:', err);
      // Continue execution even if this fails
    }
    
    res.status(200).json({
      success: true,
      database: dbName,
      server: serverInfo.host,
      version: serverInfo.version,
      state: 'connected'
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: `Error testing connection: ${error.message}`
    });
  }
});
