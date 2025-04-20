#!/bin/bash

# Document Management System Setup Script
# This script prepares the application for local testing

echo "=========================================="
echo "Document Management System Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 14.x or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB is not installed. Please install MongoDB 4.x or higher."
    echo "The application requires MongoDB to function properly."
    echo "Would you like to continue anyway? (y/n)"
    read -r continue_without_mongo
    if [ "$continue_without_mongo" != "y" ]; then
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/document-management
JWT_SECRET=$(openssl rand -hex 32)
# Add your Google API credentials below for Drive and Gmail integration
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
EOL
    echo ".env file created with default values."
    echo "Please update the Google API credentials if you want to use Drive and Gmail integration."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create required directories
echo "Creating required directories..."
mkdir -p uploads/documents
mkdir -p uploads/exhibits
mkdir -p logs

# Set up MongoDB (if installed)
if command -v mongod &> /dev/null; then
    echo "Setting up MongoDB..."
    # Check if MongoDB is running
    if pgrep -x "mongod" > /dev/null; then
        echo "MongoDB is already running."
    else
        echo "Starting MongoDB..."
        mongod --fork --logpath logs/mongodb.log --dbpath ./data/db
        if [ $? -ne 0 ]; then
            echo "Failed to start MongoDB. Please start it manually."
            echo "You can use: mongod --dbpath ./data/db"
        fi
    fi
fi

# Build the application
echo "Building the application..."
npm run build

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo "To start the application, run: npm start"
echo "Then access the application at: http://localhost:3000"
echo ""
echo "For more information, please refer to:"
echo "- README.md: Overview and general information"
echo "- docs/installation-guide.md: Detailed installation instructions"
echo "- docs/user-guide.md: How to use the application"
echo "=========================================="
