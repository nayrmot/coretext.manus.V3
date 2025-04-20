// Direct test endpoint for MongoDB cases
app.get('/api/direct-cases-test', async (req, res) => {
    try {
      // Get connection information
      const dbConnection = mongoose.connection;
      
      // Check if connected
      if (dbConnection.readyState !== 1) {
        return res.status(500).json({
          success: false,
          message: 'Not connected to MongoDB'
        });
      }
      
      // Get the Case model
      const Case = require('./models/case.model');
      
      // Directly query the database
      const cases = await Case.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        count: cases.length,
        cases: cases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching cases: ${error.message}`
      });
    }
  });
  