const express = require('express');
const colors = require('colors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const verifyToken = require('./middleware/auth.middleware').protect;

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files with safe imports
const caseRoutes = require('./routes/case.routes');
let userRoutes;
let documentRoutes;

// Safely import optional route files
try {
  userRoutes = require('./routes/user.routes');
} catch (error) {
  console.warn('Warning: user.routes.js not found. User routes will not be available.');
  // Create a minimal router that returns 404 for all user routes
  userRoutes = express.Router();
  userRoutes.all('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'User routes are not configured on this server'
    });
  });
}

try {
  documentRoutes = require('./routes/document.routes');
} catch (error) {
  console.warn('Warning: document.routes.js not found. Document routes will not be available.');
  // Create a minimal router that returns 404 for all document routes
  documentRoutes = express.Router();
  documentRoutes.all('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Document routes are not configured on this server'
    });
  });
}

const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static('public'));

// Mount routers
// Public routes for testing (no authentication required)
app.use('/api/public/cases', caseRoutes);

// Protected routes (authentication required)
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', verifyToken, documentRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Not found - ${req.originalUrl}`
  });
});

module.exports = app;
