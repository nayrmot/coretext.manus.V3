const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Apply Bates label to PDF document
exports.applyBatesLabel = async (pdfPath, batesNumber, position = config.bates.defaultPosition) => {
  try {
    // Read PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Apply Bates label to each page
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // Determine position
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
      
      // Draw Bates label
      page.drawText(batesNumber, {
        x,
        y,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
    });
    
    // Save modified PDF
    const outputPath = path.join(
      path.dirname(pdfPath),
      `${path.basename(pdfPath, '.pdf')}_BATES.pdf`
    );
    
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error applying Bates label:', error);
    throw error;
  }
};

// Apply exhibit sticker to PDF document
exports.applyExhibitSticker = async (pdfPath, exhibitNumber) => {
  try {
    // Read PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
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
    
    // Save modified PDF
    const outputPath = path.join(
      path.dirname(pdfPath),
      `${path.basename(pdfPath, '.pdf')}_EXHIBIT.pdf`
    );
    
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error applying exhibit sticker:', error);
    throw error;
  }
};

// Apply watermark to PDF document
exports.applyWatermark = async (pdfPath, watermarkText) => {
  try {
    // Read PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Apply watermark to each page
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // Draw watermark diagonally across page
      page.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 60,
        font: helveticaFont,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: Math.PI / 4
      });
    });
    
    // Save modified PDF
    const outputPath = path.join(
      path.dirname(pdfPath),
      `${path.basename(pdfPath, '.pdf')}_WATERMARK.pdf`
    );
    
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw error;
  }
};

// Merge multiple PDFs into a single document
exports.mergePDFs = async (pdfPaths, outputFilename) => {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    
    // Add pages from each PDF
    for (const pdfPath of pdfPaths) {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    // Save merged PDF
    const outputPath = path.join(
      path.dirname(pdfPaths[0]),
      outputFilename
    );
    
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
};
