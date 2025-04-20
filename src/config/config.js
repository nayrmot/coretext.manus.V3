// Configuration for the document management application
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // MongoDB configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/document-management'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  
  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    driveApiKey: process.env.GOOGLE_DRIVE_API_KEY,
    gmailApiKey: process.env.GOOGLE_GMAIL_API_KEY
  },
  
  // Document AI configuration
  documentAi: {
    projectId: process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID,
    location: process.env.GOOGLE_DOCUMENT_AI_LOCATION || 'us',
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID
  },
  
  // Cloud Storage configuration
  cloudStorage: {
    bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  },
  
  // Upload configuration
  upload: {
    directory: process.env.UPLOAD_DIRECTORY || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ]
  },
  
  // Bates labeling configuration
  bates: {
    defaultPadding: 5,
    defaultPosition: 'bottom-right'
  },
  
  // Exhibit configuration
  exhibit: {
    defaultStatus: 'designated'
  }
};

module.exports = config;
