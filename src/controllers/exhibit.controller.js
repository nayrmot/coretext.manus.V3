const Exhibit = require('../models/exhibit.model');
const Document = require('../models/document.model');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Create exhibit
exports.createExhibit = async (req, res) => {
  try {
    const { 
      documentId, 
      title, 
      description, 
      caseId,
      exhibitNumber,
      status = 'designated'
    } = req.body;
    
    if (!documentId || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and case ID are required'
      });
    }
    
    // Check if document exists
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if exhibit number is already used in this case
    if (exhibitNumber) {
      const existingExhibit = await Exhibit.findOne({
        caseId,
        exhibitNumber
      });
      
      if (existingExhibit) {
        return res.status(400).json({
          success: false,
          message: 'Exhibit number is already used in this case'
        });
      }
    }
    
    // Create exhibit
    const exhibit = await Exhibit.create({
      documentId,
      title: title || document.name,
      description,
      caseId,
      exhibitNumber,
      status,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      exhibit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating exhibit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all exhibits
exports.getAllExhibits = async (req, res) => {
  try {
    const { caseId, status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (caseId) query.caseId = caseId;
    if (status) query.status = status;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get exhibits
    const exhibits = await Exhibit.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ exhibitNumber: 1 })
      .populate('documentId', 'name path mimeType batesLabel')
      .populate('createdBy', 'name email')
      .populate('caseId', 'name');
    
    // Get total count
    const total = await Exhibit.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: exhibits.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      exhibits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving exhibits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get exhibit by ID
exports.getExhibitById = async (req, res) => {
  try {
    const exhibit = await Exhibit.findById(req.params.id)
      .populate('documentId', 'name path mimeType batesLabel')
      .populate('createdBy', 'name email')
      .populate('caseId', 'name');
    
    if (!exhibit) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      exhibit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving exhibit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update exhibit
exports.updateExhibit = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      exhibitNumber,
      status
    } = req.body;
    
    const exhibit = await Exhibit.findById(req.params.id);
    
    if (!exhibit) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit not found'
      });
    }
    
    // Check if exhibit number is already used in this case
    if (exhibitNumber && exhibitNumber !== exhibit.exhibitNumber) {
      const existingExhibit = await Exhibit.findOne({
        caseId: exhibit.caseId,
        exhibitNumber,
        _id: { $ne: exhibit._id }
      });
      
      if (existingExhibit) {
        return res.status(400).json({
          success: false,
          message: 'Exhibit number is already used in this case'
        });
      }
    }
    
    // Update exhibit
    if (title) exhibit.title = title;
    if (description !== undefined) exhibit.description = description;
    if (exhibitNumber) exhibit.exhibitNumber = exhibitNumber;
    if (status) exhibit.status = status;
    
    await exhibit.save();
    
    res.status(200).json({
      success: true,
      exhibit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating exhibit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete exhibit
exports.deleteExhibit = async (req, res) => {
  try {
    const exhibit = await Exhibit.findById(req.params.id);
    
    if (!exhibit) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit not found'
      });
    }
    
    // Delete exhibit
    await exhibit.remove();
    
    res.status(200).json({
      success: true,
      message: 'Exhibit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting exhibit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Assign exhibit numbers
exports.assignExhibitNumbers = async (req, res) => {
  try {
    const { exhibitId, exhibitNumber } = req.body;
    
    if (!exhibitId || !exhibitNumber) {
      return res.status(400).json({
        success: false,
        message: 'Exhibit ID and exhibit number are required'
      });
    }
    
    const exhibit = await Exhibit.findById(exhibitId);
    
    if (!exhibit) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit not found'
      });
    }
    
    // Check if exhibit number is already used in this case
    const existingExhibit = await Exhibit.findOne({
      caseId: exhibit.caseId,
      exhibitNumber,
      _id: { $ne: exhibit._id }
    });
    
    if (existingExhibit) {
      return res.status(400).json({
        success: false,
        message: 'Exhibit number is already used in this case'
      });
    }
    
    // Update exhibit number
    exhibit.exhibitNumber = exhibitNumber;
    await exhibit.save();
    
    // Apply exhibit sticker to document if it's a PDF
    const document = await Document.findById(exhibit.documentId);
    
    if (document && document.mimeType === 'application/pdf') {
      const originalPath = document.path;
      const fileExt = path.extname(originalPath);
      const fileName = path.basename(originalPath, fileExt);
      const exhibitPath = path.join(
        path.dirname(originalPath),
        `${fileName}_EXHIBIT${fileExt}`
      );
      
      const pdfBytes = fs.readFileSync(originalPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Apply exhibit sticker to first page only
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      
      // Draw exhibit sticker in top-right corner
      firstPage.drawRectangle({
        x: width - 150,
        y: height - 50,
        width: 130,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(1, 1, 1)
      });
      
      firstPage.drawText(`EXHIBIT ${exhibitNumber}`, {
        x: width - 145,
        y: height - 35,
        size: 14,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      const exhibitPdfBytes = await pdfDoc.save();
      fs.writeFileSync(exhibitPath, exhibitPdfBytes);
      
      // Update exhibit with path to labeled document
      exhibit.exhibitPath = exhibitPath;
      await exhibit.save();
    }
    
    res.status(200).json({
      success: true,
      exhibit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning exhibit number',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Batch assign exhibit numbers
exports.batchAssignExhibitNumbers = async (req, res) => {
  try {
    const { exhibits, startNumber, prefix = '', suffix = '' } = req.body;
    
    if (!exhibits || !Array.isArray(exhibits) || exhibits.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exhibits array is required'
      });
    }
    
    if (!startNumber) {
      return res.status(400).json({
        success: false,
        message: 'Start number is required'
      });
    }
    
    // Process each exhibit
    const results = [];
    let currentNumber = parseInt(startNumber);
    
    for (const exhibitId of exhibits) {
      const exhibit = await Exhibit.findById(exhibitId);
      
      if (!exhibit) {
        results.push({
          exhibitId,
          success: false,
          message: 'Exhibit not found'
        });
        continue;
      }
      
      const exhibitNumber = `${prefix}${currentNumber}${suffix}`;
      
      // Check if exhibit number is already used in this case
      const existingExhibit = await Exhibit.findOne({
        caseId: exhibit.caseId,
        exhibitNumber,
        _id: { $ne: exhibit._id }
      });
      
      if (existingExhibit) {
        results.push({
          exhibitId,
          success: false,
          message: 'Exhibit number is already used in this case'
        });
        continue;
      }
      
      // Update exhibit number
      exhibit.exhibitNumber = exhibitNumber;
      await exhibit.save();
      
      // Apply exhibit sticker to document if it's a PDF
      const document = await Document.findById(exhibit.documentId);
      
      if (document && document.mimeType === 'application/pdf') {
        const originalPath = document.path;
        const fileExt = path.extname(originalPath);
        const fileName = path.basename(originalPath, fileExt);
        const exhibitPath = path.join(
          path.dirname(originalPath),
          `${fileName}_EXHIBIT${fileExt}`
        );
        
        const pdfBytes = fs.readFileSync(originalPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Apply exhibit sticker to first page only
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        
        // Draw exhibit sticker in top-right corner
        firstPage.drawRectangle({
          x: width - 150,
          y: height - 50,
          width: 130,
          height: 30,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1)
        });
        
        firstPage.drawText(`EXHIBIT ${exhibitNumber}`, {
          x: width - 145,
          y: height - 35,
          size: 14,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
        
        const exhibitPdfBytes = await pdfDoc.save();
        fs.writeFileSync(exhibitPath, exhibitPdfBytes);
        
        // Update exhibit with path to labeled document
        exhibit.exhibitPath = exhibitPath;
        await exhibit.save();
      }
      
      results.push({
        exhibitId,
        success: true,
        exhibitNumber
      });
      
      // Increment number for next exhibit
      currentNumber++;
    }
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error batch assigning exhibit numbers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate exhibit list
exports.generateExhibitList = async (req, res) => {
  try {
    const { caseId, format = 'json' } = req.query;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Get exhibits for case
    const exhibits = await Exhibit.find({ caseId })
      .sort({ exhibitNumber: 1 })
      .populate('documentId', 'name batesLabel')
      .populate('caseId', 'name');
    
    if (format === 'csv') {
      // Generate CSV
      const csvRows = [];
      
      // Add header row
      csvRows.push('Exhibit Number,Title,Description,Bates Number,Status');
      
      // Add data rows
      exhibits.forEach(exhibit => {
        const batesNumber = exhibit.documentId.batesLabel ? exhibit.documentId.batesLabel.batesNumber : '';
        csvRows.push(`"${exhibit.exhibitNumber || ''}","${exhibit.title}","${exhibit.description || ''}","${batesNumber}","${exhibit.status}"`);
      });
      
      const csvContent = csvRows.join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=exhibit_list.csv');
      
      res.status(200).send(csvContent);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        count: exhibits.length,
        exhibits
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating exhibit list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create exhibit package
exports.createExhibitPackage = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      caseId, 
      exhibitIds,
      eventType
    } = req.body;
    
    if (!name || !caseId || !exhibitIds || !Array.isArray(exhibitIds) || exhibitIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, case ID, and exhibit IDs are required'
      });
    }
    
    // Create exhibit package
    const exhibitPackage = await ExhibitPackage.create({
      name,
      description,
      caseId,
      exhibits: exhibitIds,
      eventType,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      exhibitPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating exhibit package',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get exhibit package
exports.getExhibitPackage = async (req, res) => {
  try {
    const exhibitPackage = await ExhibitPackage.findById(req.params.id)
      .populate({
        path: 'exhibits',
        populate: {
          path: 'documentId',
          select: 'name path mimeType batesLabel'
        }
      })
      .populate('createdBy', 'name email')
      .populate('caseId', 'name');
    
    if (!exhibitPackage) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit package not found'
      });
    }
    
    res.status(200).json({
      success: true,
      exhibitPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving exhibit package',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get exhibit status
exports.getExhibitStatus = async (req, res) => {
  try {
    const { caseId } = req.query;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }
    
    // Get count of exhibits by status
    const statusCounts = await Exhibit.aggregate([
      { $match: { caseId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format result
    const result = {};
    statusCounts.forEach(item => {
      result[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      statusCounts: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving exhibit status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update exhibit status
exports.updateExhibitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const exhibit = await Exhibit.findById(req.params.id);
    
    if (!exhibit) {
      return res.status(404).json({
        success: false,
        message: 'Exhibit not found'
      });
    }
    
    // Update status
    exhibit.status = status;
    await exhibit.save();
    
    res.status(200).json({
      success: true,
      exhibit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating exhibit status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
