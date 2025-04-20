# Document Management System - Installation Guide

This guide provides detailed instructions for installing and running the Document Management System on your local machine.

## Prerequisites

Before installing the application, ensure you have the following prerequisites installed:

- **Node.js** (version 14.x or higher)
- **MongoDB** (version 4.x or higher)
- **Git** (for cloning the repository)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/document-management-app.git
cd document-management-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/document-management
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

Notes:
- Replace `your_jwt_secret` with a secure random string
- For Google integration, you'll need to create OAuth credentials in the Google Cloud Console

### 4. Set Up MongoDB

Ensure MongoDB is running on your system. You can start it with:

```bash
# On Linux/macOS
mongod --dbpath /path/to/data/directory

# On Windows
"C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe" --dbpath="C:\data\db"
```

### 5. Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Google API Setup (Optional)

To use Google Drive and Gmail integration features:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Drive API and Gmail API
4. Create OAuth 2.0 credentials
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Add the credentials to your `.env` file

## Running Tests

To run the API tests:

```bash
npm test
```

To run the frontend tests:

```bash
npm run test:frontend
```

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection issues:

1. Verify MongoDB is running with `mongo` command
2. Check your connection string in the `.env` file
3. Ensure the MongoDB port (default: 27017) is not blocked by a firewall

### Node.js Version Issues

If you encounter Node.js compatibility issues:

1. Check your Node.js version with `node -v`
2. Use a Node version manager like `nvm` to install the correct version

### Google API Issues

If Google integration doesn't work:

1. Verify your credentials in the `.env` file
2. Ensure the APIs are enabled in the Google Cloud Console
3. Check that your OAuth consent screen is properly configured

## Next Steps

After installation, refer to the [User Guide](./user-guide.md) for instructions on using the application.
