const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Create OAuth2 client
const createOAuth2Client = (credentials) => {
  const { client_id, client_secret, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
};

// Get default credentials
const getCredentials = () => {
  return {
    web: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_CALLBACK_URL]
    }
  };
};

// Get user's OAuth2 client
const getUserAuth = async (userId) => {
  try {
    // In a real implementation, you would retrieve the user's tokens from the database
    const credentials = getCredentials();
    const oAuth2Client = createOAuth2Client(credentials);
    
    // Set credentials if available
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    
    if (user && user.googleTokens) {
      oAuth2Client.setCredentials(user.googleTokens);
    }
    
    return oAuth2Client;
  } catch (error) {
    console.error('Error getting user auth:', error);
    throw error;
  }
};

// Get auth URL for Gmail
exports.getAuthUrl = (userId) => {
  try {
    const credentials = getCredentials();
    const oAuth2Client = createOAuth2Client(credentials);
    
    const SCOPES = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels'
    ];
    
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId
    });
    
    return authUrl;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw error;
  }
};

// Handle OAuth callback
exports.handleAuthCallback = async (code, userId) => {
  try {
    const credentials = getCredentials();
    const oAuth2Client = createOAuth2Client(credentials);
    
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Save tokens to user
    const User = require('../models/user.model');
    await User.findByIdAndUpdate(userId, {
      googleTokens: tokens
    });
    
    return tokens;
  } catch (error) {
    console.error('Error handling auth callback:', error);
    throw error;
  }
};

// Get Gmail connection status
exports.getConnectionStatus = async (userId) => {
  try {
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    
    if (!user || !user.googleTokens) {
      return {
        connected: false
      };
    }
    
    // Check if tokens are valid
    const auth = await getUserAuth(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    try {
      await gmail.users.getProfile({ userId: 'me' });
      
      return {
        connected: true,
        email: user.email
      };
    } catch (error) {
      // Tokens may be expired
      return {
        connected: false,
        error: 'Tokens expired'
      };
    }
  } catch (error) {
    console.error('Error getting connection status:', error);
    throw error;
  }
};

// Get emails from Gmail
exports.getEmails = async (userId, query, labelIds, maxResults = 10, pageToken) => {
  try {
    const auth = await getUserAuth(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    const params = {
      userId: 'me',
      maxResults,
      q: query
    };
    
    if (labelIds) {
      params.labelIds = labelIds;
    }
    
    if (pageToken) {
      params.pageToken = pageToken;
    }
    
    const response = await gmail.users.messages.list(params);
    
    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken
    };
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

// Get email by ID
exports.getEmailById = async (userId, emailId) => {
  try {
    const auth = await getUserAuth(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting email by ID:', error);
    throw error;
  }
};

// Process email
exports.processEmail = async (userId, emailId, caseId, category) => {
  try {
    // Get email
    const email = await this.getEmailById(userId, emailId);
    
    // Extract email content
    const headers = email.payload.headers;
    const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
    const to = headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
    const date = headers.find(header => header.name === 'Date')?.value || 'Unknown Date';
    
    // Create PDF from email content
    const emailPdfPath = await this.createEmailPdf(email, subject, from, to, date);
    
    // Save email as document
    const Document = require('../models/document.model');
    const emailDocument = await Document.create({
      name: subject,
      path: emailPdfPath,
      mimeType: 'application/pdf',
      size: fs.statSync(emailPdfPath).size,
      uploadedBy: userId,
      case: caseId,
      category: category || 'Email',
      metadata: {
        emailId,
        from,
        to,
        date,
        subject
      }
    });
    
    // Extract and process attachments
    const attachments = await this.extractAttachments(userId, emailId, caseId, category);
    
    return {
      emailDocument,
      attachments
    };
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
};

// Create PDF from email content
exports.createEmailPdf = async (email, subject, from, to, date) => {
  try {
    // In a real implementation, this would create a PDF from the email content
    // For now, we'll just create a text file
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const emailPath = path.join(uploadDir, `email_${Date.now()}.txt`);
    
    let content = `Subject: ${subject}\n`;
    content += `From: ${from}\n`;
    content += `To: ${to}\n`;
    content += `Date: ${date}\n\n`;
    
    // Extract body
    let body = '';
    if (email.payload.parts) {
      // Multipart email
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf8');
          break;
        }
      }
    } else if (email.payload.body.data) {
      // Single part email
      body = Buffer.from(email.payload.body.data, 'base64').toString('utf8');
    }
    
    content += body;
    
    fs.writeFileSync(emailPath, content);
    
    return emailPath;
  } catch (error) {
    console.error('Error creating email PDF:', error);
    throw error;
  }
};

// Get email attachments
exports.getEmailAttachments = async (userId, emailId) => {
  try {
    const email = await this.getEmailById(userId, emailId);
    
    const attachments = [];
    
    // Extract attachments
    if (email.payload.parts) {
      for (const part of email.payload.parts) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            attachmentId: part.body.attachmentId
          });
        }
      }
    }
    
    return attachments;
  } catch (error) {
    console.error('Error getting email attachments:', error);
    throw error;
  }
};

// Extract attachments from email
exports.extractAttachments = async (userId, emailId, caseId, category) => {
  try {
    const auth = await getUserAuth(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Get attachments
    const attachments = await this.getEmailAttachments(userId, emailId);
    
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const Document = require('../models/document.model');
    const results = [];
    
    // Download and save each attachment
    for (const attachment of attachments) {
      try {
        // Get attachment data
        const response = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: emailId,
          id: attachment.attachmentId
        });
        
        // Decode attachment data
        const data = Buffer.from(response.data.data, 'base64');
        
        // Save attachment to file
        const attachmentPath = path.join(uploadDir, `${Date.now()}_${attachment.filename}`);
        fs.writeFileSync(attachmentPath, data);
        
        // Save attachment as document
        const document = await Document.create({
          name: attachment.filename,
          path: attachmentPath,
          mimeType: attachment.mimeType,
          size: fs.statSync(attachmentPath).size,
          uploadedBy: userId,
          case: caseId,
          category: category || 'Email Attachment',
          metadata: {
            emailId,
            attachmentId: attachment.attachmentId
          }
        });
        
        results.push({
          filename: attachment.filename,
          document
        });
      } catch (error) {
        console.error(`Error processing attachment ${attachment.filename}:`, error);
        results.push({
          filename: attachment.filename,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error extracting attachments:', error);
    throw error;
  }
};

// Setup email monitoring
exports.setupMonitoring = async (userId, labelIds, caseId, category, frequency) => {
  try {
    // In a real implementation, this would set up a scheduled job to monitor emails
    // For now, we'll just return a mock monitoring configuration
    return {
      userId,
      labelIds,
      caseId,
      category,
      frequency,
      status: 'active',
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error setting up monitoring:', error);
    throw error;
  }
};

// Get email monitoring status
exports.getMonitoringStatus = async (userId) => {
  try {
    // In a real implementation, this would retrieve the monitoring configuration from the database
    // For now, we'll just return a mock status
    return {
      status: 'active',
      lastChecked: new Date(),
      emailsProcessed: 0
    };
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    throw error;
  }
};

// Stop email monitoring
exports.stopMonitoring = async (userId) => {
  try {
    // In a real implementation, this would stop the scheduled job
    // For now, we'll just return success
    return true;
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    throw error;
  }
};
