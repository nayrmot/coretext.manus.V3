const Case = require('../models/case.model');
const Document = require('../models/document.model');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Get all cases
 * @route   GET /api/cases
 * @access  Private
 */
exports.getCases = asyncHandler(async (req, res) => {
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
});

/**
 * @desc    Get single case
 * @route   GET /api/cases/:id
 * @access  Private
 */
exports.getCase = asyncHandler(async (req, res) => {
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
});

/**
 * @desc    Create new case
 * @route   POST /api/cases
 * @access  Private
 */
exports.createCase = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const caseItem = await Case.create(req.body);

  res.status(201).json({
    success: true,
    data: caseItem
  });
});

/**
 * @desc    Update case
 * @route   PUT /api/cases/:id
 * @access  Private
 */
exports.updateCase = asyncHandler(async (req, res) => {
  let caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({
      success: false,
      error: `Case not found with id of ${req.params.id}`
    });
  }

  // Make sure user is case owner
  if (caseItem.createdBy.toString() !== req.user.id) {
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
});

/**
 * @desc    Delete case
 * @route   DELETE /api/cases/:id
 * @access  Private
 */
exports.deleteCase = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({
      success: false,
      error: `Case not found with id of ${req.params.id}`
    });
  }

  // Make sure user is case owner
  if (caseItem.createdBy.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      error: `User ${req.user.id} is not authorized to delete this case`
    });
  }

  await Case.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get case documents
 * @route   GET /api/cases/:id/documents
 * @access  Private
 */
exports.getCaseDocuments = asyncHandler(async (req, res) => {
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
});

/**
 * @desc    Get case dashboard data
 * @route   GET /api/cases/:id/dashboard
 * @access  Private
 */
exports.getCaseDashboard = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return res.status(404).json({
      success: false,
      error: `Case not found with id of ${req.params.id}`
    });
  }

  // Get document counts by category
  const documentsByCategory = await Document.aggregate([
    { $match: { case: mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Get recent documents
  const recentDocuments = await Document.find({ case: req.params.id })
    .sort('-createdAt')
    .limit(5)
    .populate('uploadedBy', 'name');

  res.status(200).json({
    success: true,
    data: {
      case: caseItem,
      documentsByCategory,
      recentDocuments
    }
  });
});
