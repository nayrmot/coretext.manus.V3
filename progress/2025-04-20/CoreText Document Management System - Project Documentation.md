# CoreText Document Management System - Project Documentation

## Project Overview

The CoreText Document Management System is a comprehensive web application designed to manage legal cases and their associated documents. The system is being developed in two main phases:

1. **Phase 1: Database Implementation & Case Selection** - Implementing the core database functionality and case management features
2. **Phase 2: Document Upload & Management** - Adding document upload, storage, organization, and management capabilities

This document serves as the central reference point for all project documentation, providing links to detailed documentation for each aspect of the system.

## Phase 1 Documentation

### Implementation Status

- [Phase 1 Completion Status](/home/ubuntu/Phase1_Completion_Status.md) - Detailed status report of Phase 1 implementation
- [Todo List](/home/ubuntu/todo.md) - Current tasks and their status

### Implementation Guides

- [Phase 1 Integration Steps](/home/ubuntu/Phase1_Integration_Steps.md) - Step-by-step guide for completing database integration
- [Database Integration Testing Strategy](/home/ubuntu/Database_Integration_Testing_Strategy.md) - Comprehensive testing strategy for database components

### Key Components

#### Server-Side Components

- **Models**
  - `case.model.js` - MongoDB schema for case data
  - `user.model.js` - MongoDB schema for user data

- **Controllers**
  - `case.controller.js` - Business logic for case operations
  - `user.controller.js` - Business logic for user operations

- **Routes**
  - `case.routes.js` - API endpoints for case operations
  - `user.routes.js` - API endpoints for user operations

- **Configuration**
  - `app.js` - Main application configuration
  - `server.js` - Server setup and initialization

#### Client-Side Components

- **JavaScript Files**
  - `case-listing.js` - Handles the case listing page functionality
  - `case-form.js` - Manages the case creation form
  - `global-case-selector.js` - Controls the global case selector in the navigation

- **HTML Templates**
  - `cases.html` - Main case listing page
  - `cases/new.html` - Case creation form

## Phase 2 Documentation

### Implementation Plan

- [Phase 2 Document Management Plan](/home/ubuntu/Phase2_Document_Management_Plan.md) - Detailed implementation plan for Phase 2
- [Phase 1 to Phase 2 Transition Guide](/home/ubuntu/Phase1_to_Phase2_Transition_Guide.md) - Guide for transitioning between phases

### Planned Components

#### Server-Side Components

- **Models**
  - `document.model.js` - MongoDB schema for document data
  - `version.model.js` - MongoDB schema for document versioning
  - `permission.model.js` - MongoDB schema for document permissions

- **Controllers**
  - `document.controller.js` - Business logic for document operations
  - `upload.controller.js` - Logic for handling file uploads
  - `preview.controller.js` - Logic for document preview generation

- **Routes**
  - `document.routes.js` - API endpoints for document operations
  - `upload.routes.js` - API endpoints for file uploads

#### Client-Side Components

- **JavaScript Files**
  - `document-upload.js` - Handles document upload functionality
  - `document-listing.js` - Manages document listing and filtering
  - `document-preview.js` - Controls document preview functionality

- **HTML Templates**
  - `documents.html` - Main document listing page
  - `documents/upload.html` - Document upload page
  - `documents/view.html` - Document viewer page

## Technical Architecture

### Database Schema

The system uses MongoDB with the following main collections:

1. **Cases** - Stores case information
   - Basic case details (name, number, type, status)
   - Client information
   - Court information
   - References to associated documents

2. **Users** - Stores user information
   - Authentication details
   - User profile information
   - Permissions and roles

3. **Documents** (Phase 2) - Stores document metadata
   - File information (name, type, size)
   - Storage location
   - Version information
   - Associated case
   - Access permissions

### API Structure

The API follows RESTful principles with the following main endpoints:

1. **Case Endpoints**
   - `GET /api/public/cases` - Get all cases (public)
   - `POST /api/public/cases` - Create a new case (public)
   - `GET /api/cases/:id` - Get a specific case (protected)
   - `PUT /api/cases/:id` - Update a case (protected)
   - `DELETE /api/cases/:id` - Delete a case (protected)

2. **User Endpoints**
   - `POST /api/users/register` - Register a new user
   - `POST /api/users/login` - User login
   - `GET /api/users/profile` - Get user profile (protected)

3. **Document Endpoints** (Phase 2)
   - `POST /api/documents/upload` - Upload documents
   - `GET /api/documents` - Get all documents
   - `GET /api/documents/:id` - Get a specific document
   - `PUT /api/documents/:id` - Update document metadata
   - `DELETE /api/documents/:id` - Delete a document

### Authentication

The system uses JSON Web Tokens (JWT) for authentication:

- Public endpoints do not require authentication
- Protected endpoints require a valid JWT in the Authorization header
- Tokens expire after a configurable time period
- Refresh tokens are used for maintaining sessions

## Development Workflow

### Environment Setup

1. **Prerequisites**
   - Node.js (v14+)
   - MongoDB (v4+)
   - npm or yarn

2. **Installation**
   ```bash
   git clone <repository-url>
   cd coretext.manus.V3
   npm install
   ```

3. **Configuration**
   - Create a `.env` file with required environment variables
   - Configure MongoDB connection string
   - Set JWT secret and expiration

4. **Running the Application**
   ```bash
   npm run dev  # Development mode with hot reloading
   npm start    # Production mode
   ```

### Testing

The testing strategy includes:

- Unit testing for individual components
- Integration testing for API endpoints
- End-to-end testing for complete workflows
- Performance testing for critical operations

See the [Database Integration Testing Strategy](/home/ubuntu/Database_Integration_Testing_Strategy.md) for detailed testing procedures.

### Deployment

The application can be deployed using:

- Traditional server deployment
- Docker containers
- Cloud services (AWS, Azure, GCP)

## Future Enhancements

Beyond Phase 2, potential enhancements include:

1. **Advanced Document Processing**
   - Automated document classification
   - Natural language processing for document analysis
   - Machine learning for document insights

2. **Integration Capabilities**
   - Integration with court filing systems
   - Integration with client communication platforms
   - Integration with billing and time tracking systems

3. **Mobile Applications**
   - Native mobile apps for iOS and Android
   - Offline document access and synchronization
   - Mobile document scanning and upload

## Conclusion

The CoreText Document Management System is designed to provide a comprehensive solution for managing legal cases and their associated documents. With the completion of Phase 1 and the upcoming implementation of Phase 2, the system will offer a robust platform for document management that integrates seamlessly with case management workflows.

This documentation will be continuously updated as the project progresses, ensuring that all team members have access to the latest information about the system's design, implementation, and usage.
