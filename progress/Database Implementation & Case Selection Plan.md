# Database Implementation & Case Selection Plan

This document outlines the detailed implementation plan for Phase 1 of the Document Management System development: Database Implementation and Case Selection Functionality.

## Overview

The goal of this phase is to transform the prototype application with hard-coded data into a real-world solution with proper database storage and case-centric workflow. This includes setting up MongoDB, implementing data models, creating API endpoints, adding state management for case context, and updating the UI to respect the selected case.

## Timeline

This phase is estimated to take 5 weeks to complete.

## Detailed Implementation Plan

### Week 1: Database Setup

#### MongoDB Server Setup
- Install MongoDB server (production or cloud-hosted MongoDB Atlas)
- Configure database users and authentication
- Set up network security and access controls
- Implement connection pooling for performance optimization
- Configure database logging and monitoring

#### Database Configuration in Application
```javascript
// src/config/db.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      poolSize: 10
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### Backup and Recovery Procedures
- Set up automated daily backups
- Create backup rotation policy
- Implement backup verification
- Document recovery procedures

### Week 1-2: Data Models

#### Core Data Models
- User Model
- Case Model
- Document Model
- Bates Configuration Model
- Bates Registry Model
- Exhibit Model
- Exhibit Package Model
- Email Monitoring Model
- Processing Queue Model

#### Example Case Model Implementation
```javascript
// src/models/case.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const caseSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Case name is required'],
    trim: true,
    index: true
  },
  caseNumber: { 
    type: String, 
    required: [true, 'Case number is required'],
    unique: true,
    trim: true
  },
  court: { 
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'pending', 'archived'],
    default: 'active'
  },
  description: String,
  clientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client'
  },
  assignedUsers: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  metadata: {
    type: Map,
    of: String
  },
  tags: [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for document count
caseSchema.virtual('documentCount', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'caseId',
  count: true
});

// Virtual for exhibit count
caseSchema.virtual('exhibitCount', {
  ref: 'Exhibit',
  localField: '_id',
  foreignField: 'caseId',
  count: true
});

// Pre-save middleware
caseSchema.pre('save', function(next) {
  // Custom logic before saving
  next();
});

// Methods
caseSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Static methods
caseSchema.statics.findActiveCases = function() {
  return this.find({ status: 'active' });
};

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
```

#### Example Document Model Implementation
```javascript
// src/models/document.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Document name is required'],
    trim: true,
    index: true
  },
  originalName: {
    type: String,
    trim: true
  },
  description: String,
  caseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Case',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['pleadings', 'discovery', 'correspondence', 'research', 'evidence', 'other'],
    default: 'other',
    index: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'jpg', 'png', 'other'],
    default: 'other'
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  driveFileId: {
    type: String,
    sparse: true
  },
  batesNumbers: [{
    prefix: String,
    startNumber: Number,
    endNumber: Number,
    suffix: String,
    dateApplied: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  metadata: {
    type: Map,
    of: String
  },
  tags: [String],
  uploadedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ name: 'text', description: 'text' });
documentSchema.index({ caseId: 1, category: 1 });
documentSchema.index({ 'batesNumbers.prefix': 1, 'batesNumbers.startNumber': 1 });

// Methods
documentSchema.methods.getLatestBatesNumber = function() {
  if (this.batesNumbers && this.batesNumbers.length > 0) {
    return this.batesNumbers[this.batesNumbers.length - 1];
  }
  return null;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
```

#### Database Indexes
- Create indexes for frequently queried fields
- Implement text indexes for search functionality
- Set up compound indexes for common query patterns

#### Data Validation Middleware
- Implement Mongoose middleware for data validation
- Create custom validators for complex validation rules
- Set up error handling for validation failures

### Week 2-3: API Development

#### RESTful API Endpoints

##### Case Management API
- GET /api/cases - List all cases
- GET /api/cases/:id - Get case details
- POST /api/cases - Create new case
- PUT /api/cases/:id - Update case
- DELETE /api/cases/:id - Delete case
- GET /api/cases/:id/documents - Get case documents
- GET /api/cases/:id/exhibits - Get case exhibits
- GET /api/cases/:id/dashboard - Get case dashboard data

##### Example Case Controller Implementation
```javascript
// src/controllers/case.controller.js
const Case = require('../models/case.model');
const Document = require('../models/document.model');
const Exhibit = require('../models/exhibit.model');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
exports.getCases = asyncHandler(async (req, res, next) => {
  // Implement pagination, filtering, and sorting
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Case.countDocuments();

  const query = Case.find({ createdBy: req.user.id });

  // Apply filters if provided
  if (req.query.status) {
    query.where('status').equals(req.query.status);
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

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id)
    .populate('documentCount')
    .populate('exhibitCount')
    .populate('assignedUsers', 'name email');

  if (!caseItem) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is case owner or has admin role
  if (caseItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 401));
  }

  res.status(200).json({
    success: true,
    data: caseItem
  });
});

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
exports.createCase = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const caseItem = await Case.create(req.body);

  res.status(201).json({
    success: true,
    data: caseItem
  });
});

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private
exports.updateCase = asyncHandler(async (req, res, next) => {
  let caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is case owner or has admin role
  if (caseItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this case`, 401));
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

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private
exports.deleteCase = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is case owner or has admin role
  if (caseItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this case`, 401));
  }

  await caseItem.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get case documents
// @route   GET /api/cases/:id/documents
// @access  Private
exports.getCaseDocuments = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is case owner or has admin role
  if (caseItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 401));
  }

  const documents = await Document.find({ caseId: req.params.id, isDeleted: false })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get case dashboard data
// @route   GET /api/cases/:id/dashboard
// @access  Private
exports.getCaseDashboard = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id)
    .populate('documentCount')
    .populate('exhibitCount');

  if (!caseItem) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is case owner or has admin role
  if (caseItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 401));
  }

  // Get recent documents
  const recentDocuments = await Document.find({ caseId: req.params.id, isDeleted: false })
    .sort('-createdAt')
    .limit(5)
    .populate('uploadedBy', 'name');

  // Get document counts by category
  const documentsByCategory = await Document.aggregate([
    { $match: { caseId: mongoose.Types.ObjectId(req.params.id), isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Get recent activity
  const recentActivity = await Activity.find({ caseId: req.params.id })
    .sort('-createdAt')
    .limit(10)
    .populate('user', 'name');

  res.status(200).json({
    success: true,
    data: {
      case: caseItem,
      recentDocuments,
      documentsByCategory,
      recentActivity
    }
  });
});
```

#### Error Handling and Validation
- Implement global error handling middleware
- Create validation middleware for request data
- Set up error logging and monitoring

#### Authentication Middleware
- Implement JWT authentication
- Create role-based access control
- Set up Google OAuth integration

#### API Documentation
- Create Swagger/OpenAPI documentation
- Document all API endpoints and parameters
- Provide example requests and responses

### Week 3: State Management

#### Global State Management for Case Context
```javascript
// src/client/context/CaseContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import axios from 'axios';

// Initial state
const initialState = {
  currentCase: null,
  cases: [],
  loading: false,
  error: null
};

// Create context
const CaseContext = createContext(initialState);

// Reducer
const caseReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'SET_CASES':
      return {
        ...state,
        cases: action.payload,
        loading: false
      };
    case 'SET_CURRENT_CASE':
      // Save to localStorage
      localStorage.setItem('selectedCaseId', action.payload ? action.payload._id : '');
      
      return {
        ...state,
        currentCase: action.payload,
        loading: false
      };
    case 'CASE_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// Provider component
export const CaseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(caseReducer, initialState);

  // Actions
  const fetchCases = async () => {
    dispatch({ type: 'SET_LOADING' });
    
    try {
      const res = await axios.get('/api/cases');
      
      dispatch({
        type: 'SET_CASES',
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: 'CASE_ERROR',
        payload: err.response?.data?.error || 'Error fetching cases'
      });
    }
  };

  const selectCase = async (caseId) => {
    dispatch({ type: 'SET_LOADING' });
    
    if (!caseId) {
      dispatch({
        type: 'SET_CURRENT_CASE',
        payload: null
      });
      return;
    }
    
    try {
      const res = await axios.get(`/api/cases/${caseId}`);
      
      dispatch({
        type: 'SET_CURRENT_CASE',
        payload: res.data.data
      });
    } catch (err) {
      dispatch({
        type: 'CASE_ERROR',
        payload: err.response?.data?.error || 'Error selecting case'
      });
    }
  };

  // Load previously selected case on initial render
  useEffect(() => {
    const loadSavedCase = async () => {
      const savedCaseId = localStorage.getItem('selectedCaseId');
      if (savedCaseId) {
        await selectCase(savedCaseId);
      }
    };
    
    fetchCases();
    loadSavedCase();
  }, []);

  return (
    <CaseContext.Provider
      value={{
        currentCase: state.currentCase,
        cases: state.cases,
        loading: state.loading,
        error: state.error,
        fetchCases,
        selectCase
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

// Create custom hook
export const useCase = () => useContext(CaseContext);
```

#### Hooks for Accessing Case Context
```javascript
// src/client/hooks/useCase.js
import { useContext } from 'react';
import { CaseContext } from '../context/CaseContext';

export const useCase = () => {
  const context = useContext(CaseContext);
  
  if (context === undefined) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  
  return context;
};
```

#### Persistence of Selected Case
- Implement localStorage for case selection persistence
- Create session management for case context
- Handle case selection across page refreshes

### Week 4: UI Updates

#### Global Case Selector Component
```javascript
// src/client/components/CaseSelector.js
import React from 'react';
import { useCase } from '../hooks/useCase';

const CaseSelector = () => {
  const { cases, currentCase, selectCase, loading } = useCase();
  
  const handleCaseChange = (e) => {
    const caseId = e.target.value;
    selectCase(caseId === 'all' ? null : caseId);
  };
  
  return (
    <div className="case-selector-container ms-3">
      <select 
        id="globalCaseSelector" 
        className="form-select form-select-sm"
        value={currentCase?._id || 'all'}
        onChange={handleCaseChange}
        disabled={loading}
      >
        <option value="all">All Cases</option>
        {cases.map(c => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
};

export default CaseSelector;
```

#### Case-Aware Components
- Update document list component to filter by case
- Modify dashboard to show case-specific data
- Create case-specific navigation components

#### Visual Indicators for Current Case
- Add case context header to all pages
- Implement color coding for case context
- Create breadcrumb navigation with case context

#### Case-Specific Dashboard Components
```javascript
// src/client/components/CaseDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCase } from '../hooks/useCase';

const CaseDashboard = () => {
  const { currentCase } = useCase();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentCase) {
        setDashboardData(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await axios.get(`/api/cases/${currentCase._id}/dashboard`);
        setDashboardData(res.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentCase]);
  
  if (loading) {
    return <div className="text-center"><div className="spinner-border" role="status"></div></div>;
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  if (!currentCase) {
    return (
      <div className="alert alert-info">
        Please select a case to view case-specific dashboard.
      </div>
    );
  }
  
  return (
    <div className="case-dashboard">
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Case Overview: {currentCase.name}</h5>
              <h6 className="card-subtitle mb-2 text-muted">Case Number: {currentCase.caseNumber}</h6>
              <p className="card-text">{currentCase.description}</p>
              <div className="row">
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h2>{dashboardData.documentCount || 0}</h2>
                      <p className="mb-0">Documents</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h2>{dashboardData.exhibitCount || 0}</h2>
                      <p className="mb-0">Exhibits</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h2>{dashboardData.recentActivity?.length || 0}</h2>
                      <p className="mb-0">Recent Activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Documents</h5>
            </div>
            <div className="card-body">
              {dashboardData.recentDocuments?.length > 0 ? (
                <ul className="list-group">
                  {dashboardData.recentDocuments.map(doc => (
                    <li key={doc._id} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{doc.name}</h6>
                        <small>{new Date(doc.createdAt).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1">Category: {doc.category}</p>
                      <small>Uploaded by: {doc.uploadedBy?.name}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No documents found for this case.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {dashboardData.recentActivity?.length > 0 ? (
                <ul className="list-group">
                  {dashboardData.recentActivity.map(activity => (
                    <li key={activity._id} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{activity.description}</h6>
                        <small>{new Date(activity.createdAt).toLocaleDateString()}</small>
                      </div>
                      <small>By: {activity.user?.name}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No recent activity for this case.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Documents by Category</h5>
            </div>
            <div className="card-body">
              {dashboardData.documentsByCategory?.length > 0 ? (
                <div className="row">
                  {dashboardData.documentsByCategory.map(category => (
                    <div key={category._id} className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h3>{category.count}</h3>
                          <p className="mb-0">{category._id || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No document categories found for this case.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDashboard;
```

### Week 5: Testing & Deployment

#### Unit Tests for Case-Related Models and APIs
- Write unit tests for Case model
- Create tests for case-related API endpoints
- Implement test database setup and teardown

#### Integration Tests for Case Selection
- Test case selection functionality
- Verify case context persistence
- Test case-specific data loading

#### End-to-End Testing
- Create end-to-end tests for case workflow
- Test case creation, selection, and document management
- Verify UI updates based on case context

#### Deployment to Staging
- Set up staging environment
- Deploy updated application
- Perform smoke tests and validation

## Conclusion

This implementation plan provides a comprehensive approach to transforming the document management prototype into a real-world solution with proper database storage and case-centric workflow. By following this plan, we will create a solid foundation for the application that can be built upon in subsequent phases.
