const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Document = require('../src/models/document.model');
const Case = require('../src/models/case.model');
const BatesRegistry = require('../src/models/batesregistry.model');
const Exhibit = require('../src/models/exhibit.model');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

let authToken;
let testUserId;
let testCaseId;
let testDocumentId;

// Setup before tests
beforeAll(async () => {
  // Create test user
  const testUser = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  await testUser.save();
  testUserId = testUser._id;
  
  // Generate auth token
  authToken = jwt.sign({ id: testUserId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  
  // Create test case
  const testCase = new Case({
    name: 'Test Case',
    description: 'Test case for API testing',
    createdBy: testUserId
  });
  
  const savedCase = await testCase.save();
  testCaseId = savedCase._id;
});

// Cleanup after tests
afterAll(async () => {
  // Remove test data
  await User.deleteMany({ email: 'test@example.com' });
  await Case.deleteMany({ name: 'Test Case' });
  await Document.deleteMany({ name: /^test-document/ });
  await BatesRegistry.deleteMany({ prefix: 'TEST' });
  await Exhibit.deleteMany({ description: /^Test Exhibit/ });
  
  // Close MongoDB connection
  await mongoose.connection.close();
});

// Auth API Tests
describe('Auth API', () => {
  test('POST /api/auth/register - Register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Test User',
        email: 'newtest@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual('newtest@example.com');
    
    // Clean up
    await User.deleteOne({ email: 'newtest@example.com' });
  });
  
  test('POST /api/auth/login - Login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toEqual('test@example.com');
  });
  
  test('GET /api/auth/me - Get current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email');
    expect(res.body.email).toEqual('test@example.com');
  });
});

// Document API Tests
describe('Document API', () => {
  test('POST /api/documents - Upload document', async () => {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(testFilePath, 'Test PDF content');
    
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'test-document.pdf')
      .field('caseId', testCaseId)
      .field('category', 'Test')
      .attach('document', testFilePath);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name');
    expect(res.body.name).toEqual('test-document.pdf');
    
    testDocumentId = res.body._id;
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
  });
  
  test('GET /api/documents - Get all documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
  
  test('GET /api/documents/:id - Get document by ID', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body.name).toEqual('test-document.pdf');
  });
  
  test('PUT /api/documents/:id - Update document', async () => {
    const res = await request(app)
      .put(`/api/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'Updated Test'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('category');
    expect(res.body.category).toEqual('Updated Test');
  });
});

// Bates API Tests
describe('Bates API', () => {
  let batesConfigId;
  
  test('POST /api/bates/configurations - Create Bates configuration', async () => {
    const res = await request(app)
      .post('/api/bates/configurations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prefix: 'TEST',
        startNumber: 1,
        padding: 5,
        suffix: '',
        caseId: testCaseId
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('prefix');
    expect(res.body.prefix).toEqual('TEST');
    
    batesConfigId = res.body._id;
  });
  
  test('GET /api/bates/configurations - Get all Bates configurations', async () => {
    const res = await request(app)
      .get('/api/bates/configurations')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
  
  test('POST /api/bates/apply - Apply Bates label', async () => {
    const res = await request(app)
      .post('/api/bates/apply')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentIds: [testDocumentId],
        batesConfigId: batesConfigId,
        position: 'bottom-right',
        uploadToDrive: false
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBeTruthy();
  });
  
  test('GET /api/bates/registry - Get Bates registry', async () => {
    const res = await request(app)
      .get('/api/bates/registry')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

// Exhibit API Tests
describe('Exhibit API', () => {
  let exhibitId;
  
  test('POST /api/exhibits - Create exhibit', async () => {
    const res = await request(app)
      .post('/api/exhibits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentId: testDocumentId,
        caseId: testCaseId,
        exhibitNumber: 'A',
        description: 'Test Exhibit A',
        applySticker: true
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('exhibitNumber');
    expect(res.body.exhibitNumber).toEqual('A');
    
    exhibitId = res.body._id;
  });
  
  test('GET /api/exhibits - Get all exhibits', async () => {
    const res = await request(app)
      .get('/api/exhibits')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
  
  test('GET /api/exhibits/:id - Get exhibit by ID', async () => {
    const res = await request(app)
      .get(`/api/exhibits/${exhibitId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('exhibitNumber');
    expect(res.body.exhibitNumber).toEqual('A');
  });
  
  test('POST /api/exhibits/packages - Create exhibit package', async () => {
    const res = await request(app)
      .post('/api/exhibits/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Package',
        description: 'Test exhibit package',
        caseId: testCaseId,
        exhibits: [exhibitId],
        eventType: 'deposition'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name');
    expect(res.body.name).toEqual('Test Package');
  });
});

// Drive API Tests
describe('Drive API', () => {
  test('GET /api/drive/status - Get Drive connection status', async () => {
    const res = await request(app)
      .get('/api/drive/status')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('connected');
  });
  
  // Note: Full Drive API tests would require Google OAuth credentials
  // These tests are simplified for demonstration purposes
  
  test('POST /api/drive/sync - Sync with Drive', async () => {
    const res = await request(app)
      .post('/api/drive/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        caseId: testCaseId,
        syncDirection: 'bidirectional'
      });
    
    // This would normally return 200, but without actual Google credentials,
    // we expect it to fail with 401 or similar
    expect(res.statusCode).not.toEqual(500);
  });
});

// Email API Tests
describe('Email API', () => {
  test('GET /api/email/status - Get Gmail connection status', async () => {
    const res = await request(app)
      .get('/api/email/status')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('connected');
  });
  
  // Note: Full Email API tests would require Gmail API credentials
  // These tests are simplified for demonstration purposes
  
  test('POST /api/email/monitoring - Set up email monitoring', async () => {
    const res = await request(app)
      .post('/api/email/monitoring')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        caseId: testCaseId,
        labelIds: ['INBOX'],
        category: 'Email',
        frequency: 'hourly',
        attachmentsOnly: true
      });
    
    // This would normally return 200, but without actual Gmail credentials,
    // we expect it to fail with 401 or similar
    expect(res.statusCode).not.toEqual(500);
  });
});
