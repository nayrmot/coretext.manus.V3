const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const config = require('./config/config');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', config.upload.directory);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const driveRoutes = require('./routes/drive.routes');
const batesRoutes = require('./routes/bates.routes');
const exhibitRoutes = require('./routes/exhibit.routes');
const emailRoutes = require('./routes/email.routes');

// Import middleware
const { verifyToken } = require('./middleware/auth.middleware');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', verifyToken, documentRoutes);
app.use('/api/drive', verifyToken, driveRoutes);
app.use('/api/bates', verifyToken, batesRoutes);
app.use('/api/exhibits', verifyToken, exhibitRoutes);
app.use('/api/email', verifyToken, emailRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.server.env} mode on port ${PORT}`);
});

module.exports = app;
