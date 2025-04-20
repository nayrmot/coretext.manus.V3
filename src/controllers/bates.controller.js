const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const BatesConfig = require('../models/bates.model');
const Document = require('../models/document.model');
const BatesRegistry = require('../models/batesregistry.model');

// Create Bates configuration
exports.createBatesConfig = async (req, res) => {
  try {
    const { 
      name, 
      prefix, 
      suffix, 
      startNumber, 
      padding, 
      caseId,
      format
    } = req.body;
    
    // Validate required fields
    if (!name || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Name and case ID are required'
      });
    }
    
    // Create Bates configuration
    const batesConfig = await BatesConfig.create({
      name,
      prefix: prefix || '',
      suffix: suffix || '',
      startNumber: startNumber || 1,
      padding: padding || 5,
      caseId,
      format: format || 'sequential',
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      batesConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating Bates configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all Bates configurations
exports.getBatesConfigs = async (req, res) => {
  try {
    const { caseId } = req.query;
    
    // Build query
    const query = {};
    if (caseId) query.caseId = caseId;
    
    // Get Bates configurations
    const batesConfigs = await BatesConfig.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('caseId', 'name');
    
    res.status(200).json({
      success: true,
      count: batesConfigs.length,
      batesConfigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving Bates configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Bates configuration by ID
exports.getBatesConfigById = async (req, res) => {
  try {
    const batesConfig = await BatesConfig.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('caseId', 'name');
    
    if (!batesConfig) {
      return res.status(404).json({
        success: false,
        message: 'Bates configuration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      batesConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving Bates configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update Bates configuration
exports.updateBatesConfig = async (req, res) => {
  try {
    const { 
      name, 
      prefix, 
      suffix, 
      startNumber, 
      padding,
      format
    } = req.body;
    
    const batesConfig = await BatesConfig.findById(req.params.id);
    
    if (!batesConfig) {
      return res.status(404).json({
        success: false,
        message: 'Bates configuration not found'
      });
    }
    
    // Check if Bates config has been used
    const hasBeenUsed = await BatesRegistry.exists({ configId: batesConfig._id });
    
    if (hasBeenUsed && (startNumber !== undefined || prefix !== undefined || suffix !== undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify prefix, suffix, or start number of a Bates configuration that has been used'
      });
    }
    
    // Update Bates configuration
    if (name) batesConfig.name = name;
    if (prefix !== undefined) batesConfig.prefix = prefix;
    if (suffix !== undefined) batesConfig.suffix = suffix;
    if (startNumber !== undefined) batesConfig.startNumber = startNumber;
    if (padding !== undefined) batesConfig.padding = padding;
    if (format) batesConfig.format = format;
    
    await batesConfig.save();
    
    res.status(200).json({
      success: true,
      batesConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating Bates configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete Bates configuration
exports.deleteBatesConfig = async (req, res) => {
  try {
    const batesConfig = await BatesConfig.findById(req.params.id);
    
    if (!batesConfig) {
      return res.status(404).json({
        success: false,
        message: 'Bates configuration not found'
      });
    }
    
    // Check if Bates config has been used
    const hasBeenUsed = await BatesRegistry.exists({ configId: batesConfig._id });
    
    if (hasBeenUsed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a Bates configuration that has been used'
      });
    }
    
    // Delete Bates configuration
    await batesConfig.remove();
    
    res.status(200).json({
      success: true,
      message: 'Bates configuration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting Bates configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apply Bates label to document
exports.applyBatesLabel = async (req, res) => {
  try {
    const { documentId, configId, position } = req.body;
    
    if (!documentId || !configId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and config ID are required'
      });
    }
    
    // Get document
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if document already has Bates label
    if (document.batesLabel) {
      return res.status(400).json({
        success: false,
        message: 'Document already has a Bates label'
      });
    }
    
    // Get Bates configuration
    const batesConfig = await BatesConfig.findById(configId);
    
    if (!batesConfig) {
      return res.status(404).json({
        success: false,
        message: 'Bates configuration not found'
      });
    }
    
    // Get next Bates number
    let nextNumber = batesConfig.startNumber;
    
    // Check if there are existing Bates numbers for this config
    const lastBatesEntry = await BatesRegistry.findOne({ configId })
      .sort({ number: -1 })
      .limit(1);
    
    if (lastBatesEntry) {
      nextNumber = lastBatesEntry.number + 1;
    }
    
    // Format Bates number
    const paddedNumber = String(nextNumber).padStart(batesConfig.padding, '0');
    const batesNumber = `${batesConfig.prefix}${paddedNumber}${batesConfig.suffix}`;
    
    // Apply Bates label to document
    // This would typically involve PDF manipulation using pdf-lib
    // For simplicity, we'll just create a copy of the document with a new name
    
    const originalPath = document.path;
    const fileExt = path.extname(originalPath);
    const fileName = path.basename(originalPath, fileExt);
    const labeledPath = path.join(
      path.dirname(originalPath),
      `${fileName}_BATES${fileExt}`
    );
    
    // If PDF, apply Bates label using pdf-lib
    if (document.mimeType === 'application/pdf') {
      const pdfBytes = fs.readFileSync(originalPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Apply Bates label to each page
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        // Determine position (default to bottom right)
        let x = width - 150;
        let y = 20;
        
        if (position === 'top-left') {
          x = 20;
          y = height - 20;
        } else if (position === 'top-right') {
          x = width - 150;
          y = height - 20;
        } else if (position === 'bottom-left') {
          x = 20;
          y = 20;
        }
        
        page.drawText(batesNumber, {
          x,
          y,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
      });
      
      const labeledPdfBytes = await pdfDoc.save();
      fs.writeFileSync(labeledPath, labeledPdfBytes);
    } else {
      // For non-PDF files, just copy the file for now
      // In a real implementation, you would use appropriate libraries
      // to add Bates labels to different file types
      fs.copyFileSync(originalPath, labeledPath);
    }
    
    // Create Bates registry entry
    const batesRegistry = await BatesRegistry.create({
      configId,
      documentId,
      number: nextNumber,
      batesNumber,
      appliedBy: req.user.id,
      originalPath,
      labeledPath
    });
    
    // Update document with Bates label info
    document.batesLabel = {
      registryId: batesRegistry._id,
      batesNumber
    };
    await document.save();
    
    res.status(200).json({
      success: true,
      batesRegistry,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying Bates label',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Batch apply Bates labels
exports.batchApplyBatesLabels = async (req, res) => {
  try {
    const { documentIds, configId, position } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs are required'
      });
    }
    
    if (!configId) {
      return res.status(400).json({
        success: false,
        message: 'Config ID is required'
      });
    }
    
    // Get Bates configuration
    const batesConfig = await BatesConfig.findById(configId);
    
    if (!batesConfig) {
      return res.status(404).json({
        success: false,
        message: 'Bates configuration not found'
      });
    }
    
    // Get next Bates number
    let nextNumber = batesConfig.startNumber;
    
    // Check if there are existing Bates numbers for this config
    const lastBatesEntry = await BatesRegistry.findOne({ configId })
      .sort({ number: -1 })
      .limit(1);
    
    if (lastBatesEntry) {
      nextNumber = lastBatesEntry.number + 1;
    }
    
    // Process each document
    const results = [];
    for (const documentId of documentIds) {
      // Get document
      const document = await Document.findById(documentId);
      
      if (!document) {
        results.push({
          documentId,
          success: false,
          message: 'Document not found'
        });
        continue;
      }
      
      // Check if document already has Bates label
      if (document.batesLabel) {
        results.push({
          documentId,
          success: false,
          message: 'Document already has a Bates label'
        });
        continue;
      }
      
      // Format Bates number
      const paddedNumber = String(nextNumber).padStart(batesConfig.padding, '0');
      const batesNumber = `${batesConfig.prefix}${paddedNumber}${batesConfig.suffix}`;
      
      // Apply Bates label to document
      const originalPath = document.path;
      const fileExt = path.extname(originalPath);
      const fileName = path.basename(originalPath, fileExt);
      const labeledPath = path.join(
        path.dirname(originalPath),
        `${fileName}_BATES${fileExt}`
      );
      
      // If PDF, apply Bates label using pdf-lib
      if (document.mimeType === 'application/pdf') {
        const pdfBytes = fs.readFileSync(originalPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Apply Bates label to each page
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
          const { width, height } = page.getSize();
          
          // Determine position (default to bottom right)
          let x = width - 150;
          let y = 20;
          
          if (position === 'top-left') {
            x = 20;
            y = height - 20;
          } else if (position === 'top-right') {
            x = width - 150;
            y = height - 20;
          } else if (position === 'bottom-left') {
            x = 20;
            y = 20;
          }
          
          page.drawText(batesNumber, {
            x,
            y,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          });
        });
        
        const labeledPdfBytes = await pdfDoc.save();
        fs.writeFileSync(labeledPath, labeledPdfBytes);
      } else {
        // For non-PDF files, just copy the file for now
        fs.copyFileSync(originalPath, labeledPath);
      }
      
      // Create Bates registry entry
      const batesRegistry = await BatesRegistry.create({
        configId,
        documentId,
        number: nextNumber,
        batesNumber,
        appliedBy: req.user.id,
        originalPath,
        labeledPath
      });
      
      // Update document with Bates label info
      document.batesLabel = {
        registryId: batesRegistry._id,
        batesNumber
      };
      await document.save();
      
      results.push({
        documentId,
        success: true,
        batesNumber,
        registryId: batesRegistry._id
      });
      
      // Increment number for next document
      nextNumber++;
    }
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error batch applying Bates labels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Bates registry
exports.getBatesRegistry = async (req, res) => {
  try {
    const { configId, caseId, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (configId) query.configId = configId;
    
    // If caseId is provided, find all configs for that case
    if (caseId) {
      const configs = await BatesConfig.find({ caseId }).select('_id');
      query.configId = { $in: configs.map(config => config._id) };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get Bates registry entries
    const registryEntries = await BatesRegistry.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ number: 1 })
      .populate('configId', 'name prefix suffix padding')
      .populate('documentId', 'name')
      .populate('appliedBy', 'name email');
    
    // Get total count
    const total = await BatesRegistry.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: registryEntries.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      registryEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving Bates registry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search Bates registry
exports.searchBatesRegistry = async (req, res) => {
  try {
    const { batesNumber, caseId, page = 1, limit = 10 } = req.query;
    
    if (!batesNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bates number is required'
      });
    }
    
    // Build query
    const query = {
      batesNumber: { $regex: batesNumber, $options: 'i' }
    };
    
    // If caseId is provided, find all configs for that case
    if (caseId) {
      const configs = await BatesConfig.find({ caseId }).select('_id');
      query.configId = { $in: configs.map(config => config._id) };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get Bates registry entries
    const registryEntries = await BatesRegistry.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ number: 1 })
      .populate('configId', 'name prefix suffix padding')
      .populate('documentId', 'name')
      .populate('appliedBy', 'name email');
    
    // Get total count
    const total = await BatesRegistry.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: registryEntries.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      registryEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching Bates registry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate Bates report
exports.generateBatesReport = async (req, res) => {
  try {
    const { configId, caseId, format = 'json' } = req.query;
    
    // Build query
    const query = {};
    if (configId) query.configId = configId;
    
    // If caseId is provided, find all configs for that case
    if (caseId) {
      const configs = await BatesConfig.find({ caseId }).select('_id');
      query.configId = { $in: configs.map(config => config._id) };
    }
    
    // Get Bates registry entries
    const registryEntries = await BatesRegistry.find(query)
      .sort({ number: 1 })
      .populate('configId', 'name prefix suffix padding')
      .populate('documentId', 'name')
      .populate('appliedBy', 'name email');
    
    if (format === 'csv') {
      // Generate CSV
      const csvRows = [];
      
      // Add header row
      csvRows.push('Bates Number,Document Name,Applied By,Applied Date');
      
      // Add data rows
      registryEntries.forEach(entry => {
        csvRows.push(`"${entry.batesNumber}","${entry.documentId.name}","${entry.appliedBy.name}","${entry.createdAt}"`);
      });
      
      const csvContent = csvRows.join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bates_report.csv');
      
      res.status(200).send(csvContent);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        count: registryEntries.length,
        registryEntries
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating Bates report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
