# Document Management System

A comprehensive document management system with Google Drive integration, Bates labeling, exhibit management, and Gmail integration.

## Project Overview

This document management system is designed for legal professionals to efficiently organize, label, and manage case documents. It features bidirectional synchronization with Google Drive, advanced Bates labeling capabilities, exhibit management for litigation, and Gmail integration for email processing.

### Key Features

- **Google Drive Integration**: Sync documents between the application and Google Drive
- **Intelligent Document Organization**: Organize documents by case, category, and type
- **Advanced Bates Labeling**: Apply customizable Bates labels to documents
- **Exhibit Management**: Create and manage exhibits for litigation
- **Gmail Integration**: Process and import emails as documents
- **Case-Centric Workflow**: All operations are organized within case contexts

## Current Implementation Status

The current version is a functional prototype with:

- Complete frontend interface with responsive design
- Backend structure with API endpoints (currently using mock data)
- All UI pages and navigation implemented
- Sample data for demonstration purposes

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Authentication**: JWT, Google OAuth 2.0
- **Storage**: MongoDB for metadata, Google Drive for documents
- **Email Processing**: Gmail API

## Installation Instructions

### Prerequisites

- Node.js 14.x or higher
- MongoDB 4.x or higher
- npm or yarn package manager

### Setup Steps

1. Clone the repository:
   ```
   git clone https://github.com/nayrmot/coretext.manus.V3.git
   cd coretext.manus.V3
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Configure environment variables in the `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/document-management
   JWT_SECRET=your_random_secret_key
   ```

5. Start MongoDB:
   ```
   mongod --dbpath ./data/db
   ```

6. Start the application:
   ```
   npm start
   ```

7. Access the application at http://localhost:3000

## Next Steps

We are currently working on Phase 1 of the implementation plan:

- Database Implementation & Case Selection Functionality
- See the [ROADMAP.md](ROADMAP.md) file for detailed development plans

## Documentation

- [User Guide](docs/user-guide.md)
- [Installation Guide](docs/installation-guide.md)
- [Implementation Plans](docs/implementation-plans/)

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact the development team.
