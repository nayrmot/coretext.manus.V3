const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// JWT authentication routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
