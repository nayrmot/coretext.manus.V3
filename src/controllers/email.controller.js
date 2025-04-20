const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const Document = require('../models/document.model');
const emailService = require('../services/email.service');

// Connect to Gmail
exports.connectGmail = (req, res) => {
  try {
    const authUrl = emailService.getAuthUrl(req.user.id);
    
    res.status(200).json({
      success: true,
      authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error connecting to Gmail',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gmail OAuth callback
exports.gmailCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }
    
    // Exchange code for tokens
    await emailService.handleAuthCallback(code, req.user.id);
    
    res.redirect('/dashboard/email?status=connected');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error handling Gmail callback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Gmail connection status
exports.getConnectionStatus = async (req, res) => {
  try {
    const status = await emailService.getConnectionStatus(req.user.id);
    
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving Gmail connection status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get emails from Gmail
exports.getEmails = async (req, res) => {
  try {
    const { query, labelIds, maxResults = 10, pageToken } = req.query;
    
    const emails = await emailService.getEmails(
      req.user.id,
      query,
      labelIds ? labelIds.split(',') : undefined,
      parseInt(maxResults),
      pageToken
    );
    
    res.status(200).json({
      success: true,
      emails: emails.messages,
      nextPageToken: emails.nextPageToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get email by ID
exports.getEmailById = async (req, res) => {
  try {
    const email = await emailService.getEmailById(req.user.id, req.params.id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    res.status(200).json({
      success: true,
      email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process email
exports.processEmail = async (req, res) => {
  try {
    const { caseId, category } = req.body;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Process email
    const result = await emailService.processEmail(
      req.user.id,
      req.params.id,
      caseId,
      category
    );
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Batch process emails
exports.batchProcessEmails = async (req, res) => {
  try {
    const { emailIds, caseId, category } = req.body;
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email IDs are required'
      });
    }
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Process emails
    const results = [];
    
    for (const emailId of emailIds) {
      try {
        const result = await emailService.processEmail(
          req.user.id,
          emailId,
          caseId,
          category
        );
        
        results.push({
          emailId,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          emailId,
          success: false,
          message: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error batch processing emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Setup email monitoring
exports.setupEmailMonitoring = async (req, res) => {
  try {
    const { labelIds, caseId, category, frequency = 'hourly' } = req.body;
    
    if (!labelIds || !Array.isArray(labelIds) || labelIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Label IDs are required'
      });
    }
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Setup monitoring
    const monitoring = await emailService.setupMonitoring(
      req.user.id,
      labelIds,
      caseId,
      category,
      frequency
    );
    
    res.status(200).json({
      success: true,
      monitoring
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting up email monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get email monitoring status
exports.getMonitoringStatus = async (req, res) => {
  try {
    const monitoring = await emailService.getMonitoringStatus(req.user.id);
    
    res.status(200).json({
      success: true,
      monitoring
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving email monitoring status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Stop email monitoring
exports.stopEmailMonitoring = async (req, res) => {
  try {
    await emailService.stopMonitoring(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Email monitoring stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error stopping email monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get email attachments
exports.getEmailAttachments = async (req, res) => {
  try {
    const attachments = await emailService.getEmailAttachments(
      req.user.id,
      req.params.id
    );
    
    res.status(200).json({
      success: true,
      attachments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving email attachments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Extract attachments from email
exports.extractAttachments = async (req, res) => {
  try {
    const { caseId, category } = req.body;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Extract attachments
    const result = await emailService.extractAttachments(
      req.user.id,
      req.params.id,
      caseId,
      category
    );
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error extracting attachments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
