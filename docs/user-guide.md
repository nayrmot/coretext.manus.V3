# Document Management System - User Guide

## Introduction

This user guide provides detailed instructions for using the Document Management System. The system is designed to streamline document handling, organization, and processing for legal professionals, with features including Google Drive integration, Bates labeling, exhibit management, and email processing.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Document Management](#document-management)
4. [Bates Labeling](#bates-labeling)
5. [Exhibit Management](#exhibit-management)
6. [Google Drive Integration](#google-drive-integration)
7. [Email Integration](#email-integration)
8. [Settings](#settings)

## Getting Started

### Logging In

1. Open your web browser and navigate to the application URL
2. Enter your email and password
3. Click "Login" to access the system
4. Alternatively, click "Sign in with Google" to use your Google account

### First-Time Setup

When logging in for the first time, you should:

1. Connect your Google account for Drive and Gmail integration
2. Create at least one case to organize your documents
3. Configure your Bates labeling preferences
4. Set up email monitoring if needed

## Dashboard

The dashboard provides an overview of your document management system:

### Key Elements

- **Document Statistics**: Total count of documents in the system
- **Case Overview**: List of active cases
- **Exhibit Count**: Number of designated exhibits
- **Processing Queue**: Documents currently being processed
- **Recent Documents**: Latest documents added to the system
- **Recent Activity**: Timeline of recent actions in the system

### Navigation

Use the sidebar to navigate to different sections of the application:

- **Dashboard**: Overview and recent activity
- **Documents**: Document management and upload
- **Cases**: Case management
- **Bates Labeling**: Apply and manage Bates labels
- **Exhibits**: Create and manage exhibits
- **Email Integration**: Connect Gmail and process emails
- **Google Drive**: Synchronize with Google Drive
- **Settings**: Configure application settings

## Document Management

### Viewing Documents

1. Navigate to Documents > All Documents
2. Use filters to narrow down the document list:
   - Select a case from the Case dropdown
   - Select a category from the Category dropdown
   - Enter search terms in the Search field
3. Click "Apply Filters" to update the document list
4. Documents are displayed in a table with the following information:
   - Document name and type
   - Case assignment
   - Category
   - Bates number (if applied)
   - Upload date
   - Available actions

### Uploading Documents

1. Navigate to Documents > Upload
2. Select a case from the dropdown menu
3. Choose a document category or leave as "Uncategorized" to let the system categorize automatically
4. Check "Upload to Google Drive" if you want documents to be uploaded to Drive
5. Check "Apply Bates Labels" if you want to automatically apply Bates labels
6. If applying Bates labels, select a Bates configuration
7. Upload files by:
   - Dragging and dropping files onto the upload zone
   - Clicking "Browse Files" to select files from your computer
8. The selected files will appear in the file list
9. Click "Upload Documents" to start the upload process
10. A progress bar will show the upload status
11. Once complete, you'll see a success message

### Document Actions

For each document, you can:

- **View**: Open the document in the browser
- **Download**: Download the document to your computer
- **Edit**: Modify document metadata
- **Apply Bates Label**: Apply a Bates label to the document
- **Create Exhibit**: Create an exhibit from the document
- **Upload to Drive**: Upload the document to Google Drive
- **Delete**: Remove the document from the system

### Bulk Actions

To perform actions on multiple documents:

1. Select documents using the checkboxes
2. Click the "Bulk Actions" dropdown
3. Choose an action:
   - Apply Bates Labels
   - Create Exhibits
   - Upload to Drive
   - Change Category
   - Delete Selected

## Bates Labeling

### Creating Bates Configurations

1. Navigate to Bates Labeling > Configurations
2. Click "New Configuration"
3. Enter the following information:
   - Prefix: The text that appears before the number (e.g., "SMITH")
   - Starting Number: The first number in the sequence
   - Padding: The number of digits to use (e.g., 5 for "00001")
   - Suffix: Optional text that appears after the number
4. Select the case this configuration applies to
5. Click "Save Configuration"

### Applying Bates Labels

1. Navigate to Bates Labeling > Apply Labels
2. Select a case from the dropdown
3. Select a Bates configuration
4. Alternatively, check "Use Custom Bates Format" to create a one-time format
5. If using a custom format, enter:
   - Prefix
   - Starting Number
   - Padding
   - Suffix
   - Label Position
6. Click "Preview Bates Number" to see how the label will look
7. Select documents to label using the checkboxes
8. Check "Upload labeled documents to Google Drive" if needed
9. Check "Send email notification when complete" if needed
10. Click "Apply Bates Labels" to start the process
11. A progress bar will show the processing status
12. Once complete, you'll see a success message

### Viewing the Bates Registry

1. Navigate to Bates Labeling > Registry
2. The registry shows all Bates numbers that have been assigned
3. You can filter by:
   - Case
   - Prefix
   - Date range
4. The registry includes:
   - Bates number
   - Document name
   - Date applied
   - Applied by
   - Case

## Exhibit Management

### Creating Exhibits

1. Navigate to Exhibits > Create Exhibit
2. Select a case from the dropdown
3. Enter an exhibit number/letter (e.g., "A" or "1")
4. Enter a description for the exhibit
5. Select a document to use as the exhibit
6. Check "Apply exhibit sticker to document" to add a sticker to the first page
7. Check "Add to exhibit package" if you want to include this in a package
8. If adding to a package:
   - Select an existing package or "Create new package"
   - If creating a new package, enter:
     - Package Name
     - Package Description
     - Event Type (Deposition, Hearing, Trial, Other)
9. Click "Create Exhibit" to process the exhibit
10. A progress bar will show the processing status
11. Once complete, you'll see a success message

### Managing Exhibits

1. Navigate to Exhibits > All Exhibits
2. Use filters to narrow down the exhibit list:
   - Select a case
   - Select an event type
   - Enter search terms
3. For each exhibit, you can:
   - View the exhibit
   - Download the exhibit
   - Edit exhibit details
   - Add to a package
   - Delete the exhibit

### Working with Exhibit Packages

1. Navigate to Exhibits > Packages
2. View existing packages or create a new one
3. For each package, you can:
   - View all exhibits in the package
   - Add or remove exhibits
   - Generate a package report
   - Export the package as a ZIP file
   - Share the package via email

## Google Drive Integration

### Connecting to Google Drive

1. Navigate to Google Drive > Synchronization
2. If not connected, click "Connect Google Drive"
3. Follow the Google authentication process
4. Once connected, you'll see your Google account information

### Synchronizing Documents

1. Navigate to Google Drive > Synchronization
2. Select a case to synchronize
3. Choose the synchronization direction:
   - Bidirectional (Two-way): Changes in both systems are synchronized
   - Upload Only: Only uploads documents from the system to Drive
   - Download Only: Only downloads documents from Drive to the system
4. Check "Enable automatic synchronization" if you want regular syncs
5. If enabling automatic synchronization, select a frequency:
   - Hourly
   - Daily
   - Weekly
6. Check "Send notification after synchronization" if needed
7. Click "Save Settings" to store your preferences
8. Click "Sync with Drive" to start an immediate synchronization
9. The sync status will show the progress and results

### Browsing Google Drive Files

1. Navigate to Google Drive > File Browser
2. Browse your Google Drive folders and files
3. Select files to import into the document management system
4. Assign case and category information to imported files

## Email Integration

### Connecting to Gmail

1. Navigate to Email Integration > Connect Gmail
2. If not connected, click "Connect Gmail"
3. Follow the Google authentication process
4. Once connected, you'll see your Gmail account information

### Setting Up Email Monitoring

1. Navigate to Email Integration > Connect Gmail
2. Select a case from the dropdown
3. Select Gmail labels to monitor (e.g., Inbox, Important, etc.)
4. Choose a default document category for imported documents
5. Select a monitoring frequency:
   - Hourly
   - Daily
   - Weekly
6. Check "Process attachments only" if you only want to import attachments
7. Check "Automatically apply Bates labels" if needed
8. If applying Bates labels, select a Bates configuration
9. Check "Send notification when documents are processed" if needed
10. Click "Save Settings" to activate email monitoring

### Viewing Processed Emails

1. Navigate to Email Integration > Messages
2. View emails that have been processed by the system
3. For each email, you can:
   - View the email content
   - View imported attachments
   - Re-process the email
   - Delete the email from the system

## Settings

### User Profile

1. Click on your username in the top-right corner
2. Select "Profile" from the dropdown
3. Update your profile information:
   - Name
   - Email
   - Password
   - Profile picture
4. Click "Save Changes" to update your profile

### Application Settings

1. Navigate to Settings
2. Configure general settings:
   - Default case for new documents
   - Default document category
   - Default Bates configuration
   - Automatic document processing options
3. Configure notification settings:
   - Email notifications
   - In-app notifications
4. Configure storage settings:
   - Document storage location
   - Backup frequency
5. Click "Save Settings" to apply changes

## Keyboard Shortcuts

The application supports the following keyboard shortcuts:

- `Ctrl+U`: Upload documents
- `Ctrl+F`: Focus search box
- `Ctrl+B`: Navigate to Bates labeling
- `Ctrl+E`: Navigate to Exhibits
- `Ctrl+D`: Navigate to Documents
- `Ctrl+G`: Navigate to Google Drive
- `Ctrl+M`: Navigate to Email (Mail)
- `Esc`: Close modals or dialogs

## Troubleshooting

### Common Issues

1. **Document Upload Failures**
   - Verify the file size is within limits (default: 10MB)
   - Check that the file type is supported
   - Try uploading a smaller file or a different file format

2. **Google Integration Issues**
   - Try disconnecting and reconnecting your Google account
   - Ensure you've granted all necessary permissions
   - Check your internet connection

3. **Bates Labeling Problems**
   - Verify the document is in a supported format (PDF, DOCX)
   - Check that you have the correct permissions
   - Try using a different Bates configuration

### Getting Help

If you encounter issues not covered in this guide:

1. Check the FAQ section in the application
2. Contact your system administrator
3. Email support@example.com for assistance
