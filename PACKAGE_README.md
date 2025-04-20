# Document Management System - Local Deployment Package

This package contains the Document Management System application for local testing. Follow the instructions below to set up and run the application on your machine.

## Quick Start

1. Extract this ZIP file to a directory on your computer
2. Open a terminal/command prompt in the extracted directory
3. Run the setup script:
   ```
   # On Linux/macOS
   ./setup.sh
   
   # On Windows
   # Use Git Bash or WSL to run the setup.sh script
   ```
4. Start the application:
   ```
   npm start
   ```
5. Access the application at http://localhost:3000

## Package Contents

- `src/`: Source code for the backend
- `public/`: Frontend HTML, CSS, and JavaScript files
- `tests/`: Test files for the application
- `docs/`: Documentation files
- `setup.sh`: Setup script to prepare the application
- `package.json`: Node.js package configuration
- `README.md`: Overview and general information

## Documentation

- `README.md`: Overview and general information
- `docs/installation-guide.md`: Detailed installation instructions
- `docs/user-guide.md`: How to use the application

## System Requirements

- Node.js 14.x or higher
- MongoDB 4.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Google Integration (Optional)

To use Google Drive and Gmail integration features, you'll need to:

1. Create a Google Cloud project
2. Enable the Google Drive API and Gmail API
3. Set up OAuth 2.0 credentials
4. Add the credentials to your `.env` file

Refer to the installation guide for detailed instructions.

## Support

If you encounter any issues, please refer to the troubleshooting section in the installation guide or contact support@example.com.
