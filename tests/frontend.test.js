const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const path = require('path');

// Set up Chrome options
const options = new chrome.Options();
options.addArguments('--headless'); // Run in headless mode
options.addArguments('--no-sandbox');
options.addArguments('--disable-dev-shm-usage');

describe('Document Management System Frontend Tests', function() {
  // Increase timeout for Selenium tests
  this.timeout(30000);
  
  let driver;
  
  before(async function() {
    // Initialize the WebDriver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });
  
  after(async function() {
    // Quit the WebDriver after tests
    await driver.quit();
  });
  
  // Test navigation and basic page loading
  describe('Navigation Tests', function() {
    it('should load the dashboard page', async function() {
      await driver.get('http://localhost:3000');
      const title = await driver.getTitle();
      assert.strictEqual(title, 'Document Management System');
      
      // Check for dashboard elements
      const dashboardHeader = await driver.findElement(By.css('h2')).getText();
      assert.strictEqual(dashboardHeader, 'Dashboard');
    });
    
    it('should navigate to documents page', async function() {
      await driver.get('http://localhost:3000');
      
      // Click on Documents link
      await driver.findElement(By.linkText('All Documents')).click();
      
      // Wait for page to load
      await driver.wait(until.titleIs('Documents - Document Management System'), 5000);
      
      // Check for documents page elements
      const pageHeader = await driver.findElement(By.css('h2')).getText();
      assert.strictEqual(pageHeader, 'Documents');
    });
    
    it('should navigate to upload page', async function() {
      await driver.get('http://localhost:3000/documents.html');
      
      // Click on Upload Documents button
      await driver.findElement(By.linkText('Upload Documents')).click();
      
      // Wait for page to load
      await driver.wait(until.titleIs('Upload Documents - Document Management System'), 5000);
      
      // Check for upload page elements
      const pageHeader = await driver.findElement(By.css('h2')).getText();
      assert.strictEqual(pageHeader, 'Upload Documents');
    });
    
    it('should navigate to Bates labeling page', async function() {
      await driver.get('http://localhost:3000');
      
      // Click on Bates Labeling link
      await driver.findElement(By.linkText('Apply Labels')).click();
      
      // Wait for page to load
      await driver.wait(until.titleIs('Bates Labeling - Document Management System'), 5000);
      
      // Check for Bates labeling page elements
      const pageHeader = await driver.findElement(By.css('h2')).getText();
      assert.strictEqual(pageHeader, 'Apply Bates Labels');
    });
  });
  
  // Test document upload functionality
  describe('Document Upload Tests', function() {
    it('should show validation error when no case is selected', async function() {
      await driver.get('http://localhost:3000/documents/upload.html');
      
      // Click upload button without selecting a case
      await driver.findElement(By.id('uploadButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select a case'));
    });
    
    it('should show validation error when no files are selected', async function() {
      await driver.get('http://localhost:3000/documents/upload.html');
      
      // Select a case
      const caseSelect = await driver.findElement(By.id('caseSelect'));
      await caseSelect.click();
      await caseSelect.findElement(By.css('option[value="1"]')).click();
      
      // Click upload button without selecting files
      await driver.findElement(By.id('uploadButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select files'));
    });
  });
  
  // Test Bates labeling functionality
  describe('Bates Labeling Tests', function() {
    it('should show validation error when no case is selected', async function() {
      await driver.get('http://localhost:3000/bates/apply.html');
      
      // Click apply button without selecting a case
      await driver.findElement(By.id('applyBatesButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select a case'));
    });
    
    it('should show validation error when no documents are selected', async function() {
      await driver.get('http://localhost:3000/bates/apply.html');
      
      // Select a case
      const caseSelect = await driver.findElement(By.id('caseSelect'));
      await caseSelect.click();
      await caseSelect.findElement(By.css('option[value="1"]')).click();
      
      // Click apply button without selecting documents
      await driver.findElement(By.id('applyBatesButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select at least one document'));
    });
    
    it('should preview Bates number correctly', async function() {
      await driver.get('http://localhost:3000/bates/apply.html');
      
      // Enable custom Bates format
      await driver.findElement(By.id('customBates')).click();
      
      // Set Bates prefix
      await driver.findElement(By.id('batesPrefix')).sendKeys('TEST');
      
      // Set starting number
      const startNumberInput = await driver.findElement(By.id('batesStartNumber'));
      await startNumberInput.clear();
      await startNumberInput.sendKeys('42');
      
      // Set padding
      const paddingInput = await driver.findElement(By.id('batesPadding'));
      await paddingInput.clear();
      await paddingInput.sendKeys('4');
      
      // Click preview button
      await driver.findElement(By.id('previewBates')).click();
      
      // Check preview text
      const previewText = await driver.findElement(By.id('batesPreview')).getText();
      assert.strictEqual(previewText, 'TEST0042');
    });
  });
  
  // Test exhibit creation functionality
  describe('Exhibit Creation Tests', function() {
    it('should show validation error when no case is selected', async function() {
      await driver.get('http://localhost:3000/exhibits/create.html');
      
      // Click create button without selecting a case
      await driver.findElement(By.id('createExhibitButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select a case'));
    });
    
    it('should show validation error when no document is selected', async function() {
      await driver.get('http://localhost:3000/exhibits/create.html');
      
      // Select a case
      const caseSelect = await driver.findElement(By.id('exhibitCase'));
      await caseSelect.click();
      await caseSelect.findElement(By.css('option[value="1"]')).click();
      
      // Click create button without selecting a document
      await driver.findElement(By.id('createExhibitButton')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select a document'));
    });
    
    it('should toggle package options when checkbox is clicked', async function() {
      await driver.get('http://localhost:3000/exhibits/create.html');
      
      // Check initial state (hidden)
      const packageOptions = await driver.findElement(By.id('packageOptions'));
      assert.strictEqual(await packageOptions.isDisplayed(), false);
      
      // Click checkbox to show options
      await driver.findElement(By.id('exhibitAddToPackage')).click();
      
      // Check that options are now visible
      await driver.wait(until.elementIsVisible(packageOptions), 5000);
      assert.strictEqual(await packageOptions.isDisplayed(), true);
      
      // Click checkbox again to hide options
      await driver.findElement(By.id('exhibitAddToPackage')).click();
      
      // Check that options are hidden again
      await driver.wait(until.elementIsNotVisible(packageOptions), 5000);
      assert.strictEqual(await packageOptions.isDisplayed(), false);
    });
  });
  
  // Test Google Drive integration functionality
  describe('Google Drive Integration Tests', function() {
    it('should toggle automatic sync options when checkbox is clicked', async function() {
      await driver.get('http://localhost:3000/drive/sync.html');
      
      // Get automatic sync options element
      const automaticSyncOptions = await driver.findElement(By.id('automaticSyncOptions'));
      
      // Check initial state (visible since checkbox is checked by default)
      assert.strictEqual(await automaticSyncOptions.isDisplayed(), true);
      
      // Uncheck the checkbox
      await driver.findElement(By.id('syncAutomatic')).click();
      
      // Check that options are now hidden
      await driver.wait(until.elementIsNotVisible(automaticSyncOptions), 5000);
      assert.strictEqual(await automaticSyncOptions.isDisplayed(), false);
      
      // Check the checkbox again
      await driver.findElement(By.id('syncAutomatic')).click();
      
      // Check that options are visible again
      await driver.wait(until.elementIsVisible(automaticSyncOptions), 5000);
      assert.strictEqual(await automaticSyncOptions.isDisplayed(), true);
    });
    
    it('should show validation error when no case is selected', async function() {
      await driver.get('http://localhost:3000/drive/sync.html');
      
      // Submit form without selecting a case
      await driver.findElement(By.css('#syncSettingsForm button[type="submit"]')).click();
      
      // Check for error message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-danger')), 5000).getText();
      assert(alertText.includes('Please select a case'));
    });
  });
  
  // Test Email integration functionality
  describe('Email Integration Tests', function() {
    it('should toggle Bates options when checkbox is clicked', async function() {
      await driver.get('http://localhost:3000/email/connect.html');
      
      // Get Bates options element
      const batesOptions = await driver.findElement(By.id('monitoringBatesOptions'));
      
      // Check initial state (hidden)
      assert.strictEqual(await batesOptions.isDisplayed(), false);
      
      // Check the checkbox
      await driver.findElement(By.id('monitoringApplyBates')).click();
      
      // Check that options are now visible
      await driver.wait(until.elementIsVisible(batesOptions), 5000);
      assert.strictEqual(await batesOptions.isDisplayed(), true);
      
      // Uncheck the checkbox
      await driver.findElement(By.id('monitoringApplyBates')).click();
      
      // Check that options are hidden again
      await driver.wait(until.elementIsNotVisible(batesOptions), 5000);
      assert.strictEqual(await batesOptions.isDisplayed(), false);
    });
    
    it('should connect to Gmail when button is clicked', async function() {
      await driver.get('http://localhost:3000/email/connect.html');
      
      // Click connect button
      await driver.findElement(By.id('gmailConnectButton')).click();
      
      // Check for success message
      const alertText = await driver.wait(until.elementLocated(By.css('.alert-success')), 5000).getText();
      assert(alertText.includes('Successfully connected to Gmail'));
      
      // Check that connection status is updated
      const connectionStatus = await driver.findElement(By.css('#gmailConnectionStatus .alert')).getText();
      assert(connectionStatus.includes('Connected to Gmail'));
      
      // Check that connect button is hidden and disconnect button is shown
      assert.strictEqual(await driver.findElement(By.id('gmailConnectButton')).isDisplayed(), false);
      assert.strictEqual(await driver.findElement(By.id('gmailDisconnectButton')).isDisplayed(), true);
    });
  });
});
