const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create email transport for sending notifications
const createTransport = async (userId) => {
  try {
    // In a real implementation, this would use the user's Gmail credentials
    // For now, we'll use a mock transport
    return nodemailer.createTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password'
      }
    });
  } catch (error) {
    console.error('Error creating email transport:', error);
    throw error;
  }
};

// Send notification email
exports.sendNotificationEmail = async (userId, to, subject, text, attachments = []) => {
  try {
    const transport = await createTransport(userId);
    
    const mailOptions = {
      from: 'Document Management System <noreply@example.com>',
      to,
      subject,
      text,
      attachments: attachments.map(attachment => ({
        filename: path.basename(attachment),
        path: attachment
      }))
    };
    
    const info = await transport.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

// Send Bates labeled document notification
exports.sendBatesLabeledNotification = async (userId, document, batesNumber, recipientEmail) => {
  try {
    const subject = `Document Bates Labeled: ${batesNumber}`;
    const text = `
The following document has been Bates labeled:

Document: ${document.name}
Bates Number: ${batesNumber}
Case: ${document.case.name}
Category: ${document.category}

This is an automated notification from the Document Management System.
`;
    
    return await this.sendNotificationEmail(
      userId,
      recipientEmail,
      subject,
      text,
      [document.path]
    );
  } catch (error) {
    console.error('Error sending Bates labeled notification:', error);
    throw error;
  }
};

// Send exhibit package notification
exports.sendExhibitPackageNotification = async (userId, exhibitPackage, recipientEmail) => {
  try {
    const subject = `Exhibit Package Created: ${exhibitPackage.name}`;
    const text = `
A new exhibit package has been created:

Package Name: ${exhibitPackage.name}
Description: ${exhibitPackage.description || 'N/A'}
Case: ${exhibitPackage.caseId.name}
Number of Exhibits: ${exhibitPackage.exhibits.length}

This is an automated notification from the Document Management System.
`;
    
    // Get paths of all exhibit documents
    const attachmentPaths = exhibitPackage.exhibits.map(exhibit => 
      exhibit.exhibitPath || exhibit.documentId.path
    );
    
    return await this.sendNotificationEmail(
      userId,
      recipientEmail,
      subject,
      text,
      attachmentPaths
    );
  } catch (error) {
    console.error('Error sending exhibit package notification:', error);
    throw error;
  }
};

// Send document upload notification
exports.sendDocumentUploadNotification = async (userId, document, recipientEmail) => {
  try {
    const subject = `New Document Uploaded: ${document.name}`;
    const text = `
A new document has been uploaded:

Document: ${document.name}
Case: ${document.case.name}
Category: ${document.category}
Uploaded By: ${document.uploadedBy.name}
Upload Date: ${document.createdAt}

This is an automated notification from the Document Management System.
`;
    
    return await this.sendNotificationEmail(
      userId,
      recipientEmail,
      subject,
      text,
      [document.path]
    );
  } catch (error) {
    console.error('Error sending document upload notification:', error);
    throw error;
  }
};
