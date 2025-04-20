# Document Management System Documentation

## Overview

The Document Management System is a comprehensive solution designed to streamline document handling, organization, and processing for legal professionals. The system integrates with Google Drive for storage and Gmail for email processing, providing a complete document lifecycle management solution.

## Features

- **Document Management**: Upload, categorize, and organize documents
- **Google Drive Integration**: Bidirectional synchronization with Google Drive
- **Bates Labeling**: Apply customizable Bates labels to documents
- **Exhibit Management**: Create and organize exhibits for litigation
- **Email Integration**: Process email attachments from Gmail
- **Intelligent Organization**: AI-powered document categorization

## System Requirements

- Node.js 14.x or higher
- MongoDB 4.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google account for Drive and Gmail integration

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/document-management-app.git
   cd document-management-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/document-management
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

4. Start the application:
   ```
   npm start
   ```

5. Access the application at `http://localhost:3000`

## Configuration

### Google API Setup

To use Google Drive and Gmail integration features, you need to set up Google API credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Drive API and Gmail API
4. Create OAuth 2.0 credentials
5. Add the credentials to your `.env` file

### MongoDB Setup

The application requires MongoDB for data storage:

1. Install MongoDB on your system or use a cloud-hosted solution
2. Create a database named `document-management`
3. Update the `MONGODB_URI` in your `.env` file if needed

## User Guide

### Authentication

1. **Register**: Create a new account with your name, email, and password
2. **Login**: Access your account using your email and password
3. **Google Login**: Alternatively, sign in with your Google account

### Document Management

#### Uploading Documents

1. Navigate to Documents > Upload
2. Select a case from the dropdown menu
3. Choose a document category or let the system categorize it automatically
4. Drag and drop files or click "Browse Files" to select documents
5. Optionally enable Bates labeling during upload
6. Click "Upload Documents" to complete the process

#### Managing Documents

1. Navigate to Documents > All Documents
2. Use filters to find specific documents by case, category, or search term
3. Click on document actions to view, download, edit, apply Bates labels, create exhibits, or delete documents
4. Use bulk actions to process multiple documents at once

### Bates Labeling

#### Creating Bates Configurations

1. Navigate to Bates Labeling > Configurations
2. Click "New Configuration"
3. Enter a prefix, starting number, padding, and optional suffix
4. Select the case this configuration applies to
5. Click "Save Configuration"

#### Applying Bates Labels

1. Navigate to Bates Labeling > Apply Labels
2. Select a case and Bates configuration
3. Choose documents to label
4. Optionally customize the label position
5. Click "Apply Bates Labels" to process the documents

### Exhibit Management

#### Creating Exhibits

1. Navigate to Exhibits > Create Exhibit
2. Select a case
3. Enter an exhibit number/letter and description
4. Select the document to use as the exhibit
5. Optionally apply an exhibit sticker to the document
6. Optionally add the exhibit to a package
7. Click "Create Exhibit" to complete the process

#### Managing Exhibit Packages

1. Navigate to Exhibits > Packages
2. View existing packages or create a new one
3. Add or remove exhibits from packages
4. Generate package reports or export packages

### Google Drive Integration

#### Connecting to Google Drive

1. Navigate to Google Drive > Synchronization
2. Click "Connect Google Drive"
3. Follow the Google authentication process
4. Once connected, your Google Drive account will be linked to the system

#### Synchronizing Documents

1. Navigate to Google Drive > Synchronization
2. Select a case to synchronize
3. Choose the synchronization direction (bidirectional, upload only, or download only)
4. Optionally enable automatic synchronization
5. Click "Sync with Drive" to start the synchronization process

### Email Integration

#### Connecting to Gmail

1. Navigate to Email Integration > Connect Gmail
2. Click "Connect Gmail"
3. Follow the Google authentication process
4. Once connected, your Gmail account will be linked to the system

#### Setting Up Email Monitoring

1. Navigate to Email Integration > Connect Gmail
2. Select a case
3. Choose Gmail labels to monitor
4. Set the default document category
5. Choose the monitoring frequency
6. Optionally enable automatic Bates labeling
7. Click "Save Settings" to activate email monitoring

## API Documentation

The Document Management System provides a comprehensive RESTful API for integration with other systems.

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/me`: Get current user information
- `GET /api/auth/google`: Initiate Google OAuth flow
- `GET /api/auth/google/callback`: Google OAuth callback

### Document Endpoints

- `GET /api/documents`: Get all documents
- `GET /api/documents/:id`: Get a specific document
- `POST /api/documents`: Upload a new document
- `PUT /api/documents/:id`: Update a document
- `DELETE /api/documents/:id`: Delete a document
- `GET /api/documents/case/:caseId`: Get documents for a specific case
- `GET /api/documents/category/:category`: Get documents by category

### Bates Labeling Endpoints

- `GET /api/bates/configurations`: Get all Bates configurations
- `GET /api/bates/configurations/:id`: Get a specific Bates configuration
- `POST /api/bates/configurations`: Create a new Bates configuration
- `PUT /api/bates/configurations/:id`: Update a Bates configuration
- `DELETE /api/bates/configurations/:id`: Delete a Bates configuration
- `POST /api/bates/apply`: Apply Bates labels to documents
- `GET /api/bates/registry`: Get the Bates registry

### Exhibit Endpoints

- `GET /api/exhibits`: Get all exhibits
- `GET /api/exhibits/:id`: Get a specific exhibit
- `POST /api/exhibits`: Create a new exhibit
- `PUT /api/exhibits/:id`: Update an exhibit
- `DELETE /api/exhibits/:id`: Delete an exhibit
- `GET /api/exhibits/case/:caseId`: Get exhibits for a specific case
- `GET /api/exhibits/packages`: Get all exhibit packages
- `GET /api/exhibits/packages/:id`: Get a specific exhibit package
- `POST /api/exhibits/packages`: Create a new exhibit package
- `PUT /api/exhibits/packages/:id`: Update an exhibit package
- `DELETE /api/exhibits/packages/:id`: Delete an exhibit package

### Google Drive Endpoints

- `GET /api/drive/status`: Get Drive connection status
- `GET /api/drive/connect`: Connect to Google Drive
- `GET /api/drive/disconnect`: Disconnect from Google Drive
- `POST /api/drive/sync`: Synchronize documents with Drive
- `GET /api/drive/files`: Get files from Google Drive
- `POST /api/drive/upload`: Upload a file to Google Drive

### Email Endpoints

- `GET /api/email/status`: Get Gmail connection status
- `GET /api/email/connect`: Connect to Gmail
- `GET /api/email/disconnect`: Disconnect from Gmail
- `POST /api/email/monitoring`: Set up email monitoring
- `GET /api/email/messages`: Get emails from Gmail
- `POST /api/email/process`: Process emails manually

## Troubleshooting

### Common Issues

1. **Connection Issues with Google APIs**
   - Verify your Google API credentials are correct
   - Ensure the necessary APIs are enabled in your Google Cloud Console
   - Check that your OAuth consent screen is properly configured

2. **Document Upload Failures**
   - Verify the file size is within limits (default: 10MB)
   - Check that the file type is supported
   - Ensure the upload directory is writable

3. **MongoDB Connection Issues**
   - Verify your MongoDB connection string
   - Ensure MongoDB is running
   - Check network connectivity to the MongoDB server

### Error Logging

The application logs errors to the console and to log files in the `logs` directory. Check these logs for detailed error information when troubleshooting issues.

## Development

### Project Structure

```
document-management-app/
├── public/               # Static frontend files
│   ├── css/              # CSS stylesheets
│   ├── js/               # JavaScript files
│   ├── images/           # Image assets
│   └── index.html        # Main HTML file
├── src/                  # Server-side code
│   ├── config/           # Configuration files
│   ├── controllers/      # API controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── app.js            # Express application
│   └── server.js         # Server entry point
├── tests/                # Test files
│   ├── api.test.js       # API tests
│   └── frontend.test.js  # Frontend tests
├── uploads/              # Document upload directory
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # NPM package file
└── README.md             # Project readme
```

### Running Tests

To run the API tests:
```
npm test
```

To run the frontend tests:
```
npm run test:frontend
```

### Building for Production

To build the application for production:
```
npm run build
```

This will create optimized files in the `dist` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact support@example.com or open an issue on the GitHub repository.
