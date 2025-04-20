# MongoDB Integration & Case Selection Implementation

This document outlines the implementation of MongoDB integration and case-centric workflow for the Document Management System.

## Overview

The implementation follows Phase 1 of the development roadmap, focusing on:
1. MongoDB integration for data persistence
2. Case-centric workflow implementation
3. API endpoints for case management
4. Frontend components for case selection

## Implementation Details

### 1. MongoDB Integration

The MongoDB integration leverages the existing configuration in `src/config/db.js` and `src/config/config.js`. The database connection is established using Mongoose with the following configuration:

```javascript
// src/config/db.js
const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

The MongoDB URI is configured in `src/config/config.js` and can be overridden using environment variables:

```javascript
// MongoDB configuration
database: {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/document-management'
}
```

### 2. Data Models

The application uses the following data models:

- **Case Model**: Represents a legal case with properties like name, description, status, etc.
- **Document Model**: Represents a document associated with a case
- **User Model**: Represents a user of the system
- **Bates Model**: Represents Bates labeling configurations
- **Exhibit Model**: Represents exhibits created from documents

The models are implemented using Mongoose schemas in the `src/models` directory.

### 3. API Endpoints

The following API endpoints were implemented for case management:

- `GET /api/cases`: Get all cases with pagination, filtering, and sorting
- `GET /api/cases/:id`: Get a specific case by ID
- `POST /api/cases`: Create a new case
- `PUT /api/cases/:id`: Update an existing case
- `DELETE /api/cases/:id`: Delete a case
- `GET /api/cases/:id/documents`: Get all documents for a specific case
- `GET /api/cases/:id/dashboard`: Get dashboard data for a specific case

The API endpoints are implemented in `src/controllers/case.controller.js` and exposed through routes in `src/routes/case.routes.js`.

### 4. Case Selection Functionality

The case selection functionality allows users to select a case and have that selection persist across the application. This is implemented using:

- A global case selector in the navigation bar
- Local storage to persist the selected case
- JavaScript to update UI elements based on the selected case

The implementation is in `public/js/case-selection.js` and includes:

- `initGlobalCaseSelector()`: Initializes the global case selector and loads cases from the API
- `loadCaseDetails()`: Loads details for the selected case
- `updateUIForSelectedCase()`: Updates UI elements based on the selected case
- `loadCasesList()`: Loads the list of cases for the cases page
- `initCaseFilters()`: Initializes filters for the cases list

## Testing

The implementation includes comprehensive testing:

- `public/js/case-selection.test.js`: Contains tests for the case selection functionality
- `public/test.html`: A test page to manually verify the implementation

The tests cover:
- Global case selector functionality
- Cases list loading and display
- Case filtering and search

## Usage

To use the case selection functionality:

1. Select a case from the global case selector in the navigation bar
2. The selected case will be persisted across page navigation
3. UI elements will update to show context for the selected case
4. Case-specific pages will automatically filter content for the selected case

## Next Steps

Future enhancements could include:

1. Implementing real-time updates using WebSockets
2. Adding more advanced filtering and sorting options
3. Implementing case-specific dashboards with analytics
4. Adding case sharing and collaboration features
