const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to protect routes
exports.protect = (req, res, next) => {
  // For now, this is just an alias for verifyToken
  // In a more complex app, this could include additional checks
  exports.verifyToken(req, res, next);
};
