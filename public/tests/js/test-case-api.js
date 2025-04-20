// test-case-api.js - Script to test case API endpoints

document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners
  document.getElementById('testDbBtn').addEventListener('click', testDatabaseConnection);
  document.getElementById('getCasesBtn').addEventListener('click', testGetCases);
  document.getElementById('testCaseForm').addEventListener('submit', testCreateCase);
});

// Test database connection
async function testDatabaseConnection() {
  const statusBadge = document.getElementById('dbStatus');
  const resultDiv = document.getElementById('dbResult');
  
  // Update status
  statusBadge.className = 'badge bg-warning';
  statusBadge.textContent = 'Testing...';
  resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Testing database connection...';
  
  try {
    // Call the test connection endpoint
    const response = await fetch('/api/public/cases/test-connection');
    const data = await response.json();
    
    // Display result
    if (response.ok && data.success) {
      statusBadge.className = 'badge bg-success';
      statusBadge.textContent = 'Connected';
      
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <strong>Connection successful!</strong><br>
          Connected to: ${data.database || 'Unknown'}<br>
          Server: ${data.server || 'Unknown'}<br>
          Version: ${data.version || 'Unknown'}
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    } else {
      statusBadge.className = 'badge bg-danger';
      statusBadge.textContent = 'Failed';
      
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          <strong>Connection failed!</strong><br>
          ${data.message || 'Unknown error'}
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    }
  } catch (error) {
    statusBadge.className = 'badge bg-danger';
    statusBadge.textContent = 'Error';
    
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error testing connection!</strong><br>
        ${error.message}
      </div>
    `;
    console.error('Error testing database connection:', error);
  }
}

// Test get cases endpoint
async function testGetCases() {
  const statusBadge = document.getElementById('getCasesStatus');
  const resultDiv = document.getElementById('getCasesResult');
  
  // Update status
  statusBadge.className = 'badge bg-warning';
  statusBadge.textContent = 'Testing...';
  resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Fetching cases...';
  
  try {
    // Try the public endpoint first
    let response = await fetch('/api/public/cases');
    let data = await response.json();
    
    // Display result
    if (response.ok) {
      statusBadge.className = 'badge bg-success';
      statusBadge.textContent = 'Success';
      
      const casesCount = data.data ? data.data.length : 0;
      
      // Create a success message
      let successHtml = `
        <div class="alert alert-success">
          <strong>Successfully retrieved cases!</strong><br>
          Found ${casesCount} cases in the database.
        </div>
      `;
      
      // Create a table to display the cases
      if (casesCount > 0) {
        successHtml += `
          <div class="table-responsive mt-3">
            <table class="table table-striped table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>Case Name</th>
                  <th>Case Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        // Add rows for each case
        data.data.forEach(caseItem => {
          const createdDate = new Date(caseItem.createdAt).toLocaleDateString();
          successHtml += `
            <tr>
              <td>${caseItem.name || 'N/A'}</td>
              <td>${caseItem.caseNumber || 'N/A'}</td>
              <td>${caseItem.client || 'N/A'}</td>
              <td><span class="badge bg-${getStatusBadgeColor(caseItem.status)}">${caseItem.status || 'N/A'}</span></td>
              <td>${createdDate}</td>
            </tr>
          `;
        });
        
        successHtml += `
              </tbody>
            </table>
          </div>
        `;
      }
      
      // Add the raw JSON data in a collapsible section
      successHtml += `
        <details class="mt-3">
          <summary>View Raw JSON Data</summary>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </details>
      `;
      
      resultDiv.innerHTML = successHtml;
    } else {
      statusBadge.className = 'badge bg-danger';
      statusBadge.textContent = 'Failed';
      
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          <strong>Failed to retrieve cases!</strong><br>
          ${data.message || 'Unknown error'}
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    }
  } catch (error) {
    statusBadge.className = 'badge bg-danger';
    statusBadge.textContent = 'Error';
    
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error retrieving cases!</strong><br>
        ${error.message}
      </div>
    `;
    console.error('Error retrieving cases:', error);
  }
}

// Helper function to get badge color based on status
function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'closed':
      return 'secondary';
    case 'archived':
      return 'info';
    default:
      return 'primary';
  }
}

// Test create case endpoint
async function testCreateCase(event) {
  event.preventDefault();
  
  const form = event.target;
  const statusBadge = document.getElementById('createCaseStatus');
  const resultDiv = document.getElementById('createCaseResult');
  
  // Update status
  statusBadge.className = 'badge bg-warning';
  statusBadge.textContent = 'Testing...';
  resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Creating test case...';
  
  try {
    // Get form data
    const formData = new FormData(form);
    const caseData = {};
    
    // Convert FormData to JSON object
    for (const [key, value] of formData.entries()) {
      // Only include non-empty values
      if (value.trim() !== '') {
        caseData[key] = value;
      }
    }
    
    console.log('Sending case data:', caseData);
    
    // Send data to API using the public endpoint
    const response = await fetch('/api/public/cases/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(caseData)
    });
    
    console.log('Response status:', response.status);
    
    // Parse response
    const data = await response.json();
    console.log('Response data:', data);
    
    // Display result
    if (response.ok && data.success) {
      statusBadge.className = 'badge bg-success';
      statusBadge.textContent = 'Success';
      
      // Safely access the case ID, providing a fallback if it doesn't exist
      const caseId = data.data && data.data._id ? data.data._id : 'Unknown';
      
      // Create a success message with case details in a card
      let successHtml = `
        <div class="alert alert-success">
          <strong>Case created successfully!</strong>
        </div>
        
        <div class="card mt-3">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">New Case Details</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Case ID:</strong> ${caseId}</p>
                <p><strong>Case Name:</strong> ${data.data?.name || 'N/A'}</p>
                <p><strong>Case Number:</strong> ${data.data?.caseNumber || 'N/A'}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Client:</strong> ${data.data?.client || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeColor(data.data?.status)}">${data.data?.status || 'N/A'}</span></p>
                <p><strong>Created:</strong> ${data.data?.createdAt ? new Date(data.data.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            ${data.data?.description ? `<p><strong>Description:</strong> ${data.data.description}</p>` : ''}
          </div>
        </div>
        
        <details class="mt-3">
          <summary>View Raw JSON Data</summary>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </details>
      `;
      
      resultDiv.innerHTML = successHtml;
      
      // Reset form with new random case number
      form.elements.caseNumber.value = 'TEST-' + Math.floor(Math.random() * 10000);
    } else {
      statusBadge.className = 'badge bg-danger';
      statusBadge.textContent = 'Failed';
      
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          <strong>Failed to create case!</strong><br>
          ${data.message || 'Unknown error'}
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    }
  } catch (error) {
    statusBadge.className = 'badge bg-danger';
    statusBadge.textContent = 'Error';
    
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error creating case!</strong><br>
        ${error.message}
      </div>
    `;
    console.error('Error creating case:', error);
  }
}

// Show alert message
function showAlert(type, message) {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alertDiv);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => {
      alertContainer.removeChild(alertDiv);
    }, 150);
  }, 5000);
}
