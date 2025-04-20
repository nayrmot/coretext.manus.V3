// Updated sample-data.js with correct ObjectId usage
const mongoose = require('mongoose');
const path = require('path');

// Adjust paths for running from tests directory
const configPath = path.join(__dirname, '..', 'src', 'config', 'config');
const config = require(configPath);

const casePath = path.join(__dirname, '..', 'src', 'models', 'case.model');
const Case = require(casePath);

// Connect to MongoDB
mongoose.connect(config.database.uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if cases already exist
    const existingCases = await Case.countDocuments();
    if (existingCases > 0) {
      console.log(`${existingCases} cases already exist in the database. Skipping sample data creation.`);
      mongoose.disconnect();
      return;
    }
    
    // Create a valid ObjectId for the user
    const userId = new mongoose.Types.ObjectId();
    
    // Sample cases
    const sampleCases = [
      {
        name: 'Smith v. Johnson',
        caseNumber: '2025-CV-1234',
        status: 'active',
        client: 'Smith',
        description: 'Personal injury case involving a car accident',
        createdBy: userId,
        createdAt: new Date('2025-04-05')
      },
      {
        name: 'Williams v. City Hospital',
        caseNumber: '2025-CV-2468',
        status: 'active',
        client: 'Williams',
        description: 'Medical malpractice case',
        createdBy: userId,
        createdAt: new Date('2025-03-15')
      },
      {
        name: 'Brown v. Insurance Co.',
        caseNumber: '2025-CV-3579',
        status: 'active',
        client: 'Brown',
        description: 'Insurance dispute case',
        createdBy: userId,
        createdAt: new Date('2025-02-28')
      }
    ];
    
    // Insert sample cases
    await Case.insertMany(sampleCases);
    console.log(`${sampleCases.length} sample cases created successfully`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });
