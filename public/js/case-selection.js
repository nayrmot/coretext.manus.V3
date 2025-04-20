// Updated case-selection.js with proper API handling
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the global case selector
  initGlobalCaseSelector();
  
  // Load cases list if on the cases list page
  if (document.getElementById('casesList')) {
    loadCasesList();
  }
  
  // Initialize filters if on the case filters page
  if (document.getElementById('applyFilters')) {
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
  }
});

// Initialize the global case selector
function initGlobalCaseSelector() {
  const selector = document.getElementById('globalCaseSelector');
  if (!selector) return;
  
  // Load cases for the selector
  fetch('/api/cases')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        // Add cases to the selector
        data.data.forEach(caseItem => {
          const option = document.createElement('option');
          option.value = caseItem._id;
          option.textContent = caseItem.name;
          selector.appendChild(option);
        });
        
        // Set the selected case from localStorage if available
        const selectedCaseId = localStorage.getItem('selectedCaseId');
        if (selectedCaseId) {
          selector.value = selectedCaseId;
        }
      }
    })
    .catch(error => {
      console.error('Error loading cases for selector:', error);
      showAlert('error', 'Failed to load cases for selector. Please try again later.');
    });
  
  // Add event listener for case selection
  selector.addEventListener('change', function() {
    const selectedCaseId = this.value;
    
    // Store the selected case ID in localStorage
    if (selectedCaseId === 'all') {
      localStorage.removeItem('selectedCaseId');
    } else {
      localStorage.setItem('selectedCaseId', selectedCaseId);
    }
    
    // Update UI based on selected case
    updateUIForSelectedCase(selectedCaseId);
  });
}

// Update UI elements based on selected case
function updateUIForSelectedCase(caseId) {
  // Update page title if it has the data-base-title attribute
  const pageTitleElement = document.querySelector('[data-base-title]');
  if (pageTitleElement) {
    const baseTitle = pageTitleElement.getAttribute('data-base-title');
    
    if (caseId === 'all') {
      pageTitleElement.textContent = baseTitle;
    } else {
      // Fetch case details
      fetch(`/api/cases/${caseId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch case details');
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.data) {
            pageTitleElement.textContent = `${baseTitle} - ${data.data.name}`;
          }
        })
        .catch(error => {
          console.error('Error fetching case details:', error);
        });
    }
  }
  
  // Reload cases list if on the cases list page
  if (document.getElementById('casesList')) {
    loadCasesList();
  }
}

// Load cases list
function loadCasesList() {
  const casesList = document.getElementById('casesList');
  if (!casesList) return;
  
  const casesTableBody = casesList.querySelector('tbody');
  
  // Clear existing rows
  casesTableBody.innerHTML = '';
  
  // Show loading indicator
  casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading cases...</td></tr>';
  
  // Get selected case ID
  const selectedCaseId = localStorage.getItem('selectedCaseId');
  
  // Build API URL
  let apiUrl = '/api/cases';
  if (selectedCaseId && selectedCaseId !== 'all') {
    apiUrl = `/api/cases?caseId=${selectedCaseId}`;
  }
  
  // Fetch cases from the API
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    })
    .then(data => {
      // Clear loading indicator
      casesTableBody.innerHTML = '';
      
      if (data.success && data.data && data.data.length > 0) {
        // Add cases to the table
        data.data.forEach(caseItem => {
          const row = createCaseRow(caseItem);
          casesTableBody.appendChild(row);
        });
      } else {
        // No cases found - show a more friendly message
        casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No cases found. Create a new case to get started.</td></tr>';
      }
    })
    .catch(error => {
      console.error('Error loading cases:', error);
      casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to load cases. Please try again later.</td></tr>';
      showAlert('error', 'Failed to load cases. Please try again later.');
    });
}

// Create a table row for a case
function createCaseRow(caseItem) {
  const row = document.createElement('tr');
  
  // Checkbox cell
  const checkboxCell = document.createElement('td');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'form-check-input case-checkbox';
  checkbox.dataset.caseId = caseItem._id;
  checkboxCell.appendChild(checkbox);
  row.appendChild(checkboxCell);
  
  // Case name cell
  const nameCell = document.createElement('td');
  const nameLink = document.createElement('a');
  nameLink.href = `/cases/${caseItem._id}`;
  nameLink.textContent = caseItem.name;
  nameCell.appendChild(nameLink);
  row.appendChild(nameCell);
  
  // Case number cell
  const numberCell = document.createElement('td');
  numberCell.textContent = caseItem.caseNumber;
  row.appendChild(numberCell);
  
  // Type cell
  const typeCell = document.createElement('td');
  typeCell.textContent = caseItem.type || 'N/A';
  row.appendChild(typeCell);
  
  // Status cell
  const statusCell = document.createElement('td');
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge bg-${getStatusColor(caseItem.status)}`;
  statusBadge.textContent = caseItem.status;
  statusCell.appendChild(statusBadge);
  row.appendChild(statusCell);
  
  // Documents cell
  const docsCell = document.createElement('td');
  docsCell.textContent = caseItem.documentCount || '0';
  row.appendChild(docsCell);
  
  // Created date cell
  const createdCell = document.createElement('td');
  createdCell.textContent = new Date(caseItem.createdAt).toLocaleDateString();
  row.appendChild(createdCell);
  
  // Actions cell
  const actionsCell = document.createElement('td');
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'dropdown';
  
  const actionsButton = document.createElement('button');
  actionsButton.className = 'btn btn-sm btn-outline-secondary dropdown-toggle';
  actionsButton.type = 'button';
  actionsButton.dataset.bsToggle = 'dropdown';
  actionsButton.innerHTML = '<i class="bi bi-three-dots"></i>';
  
  const actionsMenu = document.createElement('ul');
  actionsMenu.className = 'dropdown-menu';
  
  const viewAction = createActionItem('View', `/cases/${caseItem._id}`, 'bi-eye');
  const editAction = createActionItem('Edit', `/cases/${caseItem._id}/edit`, 'bi-pencil');
  const deleteAction = createActionItem('Delete', '#', 'bi-trash');
  deleteAction.addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete the case "${caseItem.name}"?`)) {
      deleteCase(caseItem._id);
    }
  });
  
  actionsMenu.appendChild(viewAction);
  actionsMenu.appendChild(editAction);
  actionsMenu.appendChild(deleteAction);
  
  actionsDiv.appendChild(actionsButton);
  actionsDiv.appendChild(actionsMenu);
  actionsCell.appendChild(actionsDiv);
  row.appendChild(actionsCell);
  
  return row;
}

// Create an action item for the dropdown menu
function createActionItem(text, href, iconClass) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'dropdown-item';
  a.href = href;
  
  const icon = document.createElement('i');
  icon.className = `bi ${iconClass} me-2`;
  
  a.appendChild(icon);
  a.appendChild(document.createTextNode(text));
  li.appendChild(a);
  
  return li;
}

// Get color for status badge
function getStatusColor(status) {
  switch (status.toLowerCase()) {
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

// Delete a case
function deleteCase(caseId) {
  fetch(`/api/cases/${caseId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete case');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        showAlert('success', 'Case deleted successfully');
        loadCasesList();
      } else {
        showAlert('error', data.message || 'Failed to delete case');
      }
    })
    .catch(error => {
      console.error('Error deleting case:', error);
      showAlert('error', 'Failed to delete case. Please try again later.');
    });
}

// Apply filters to cases list
function applyFilters() {
  const statusFilter = document.getElementById('statusFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const searchFilter = document.getElementById('searchInput').value;
  
  // Store filters in localStorage
  localStorage.setItem('caseFilters', JSON.stringify({
    status: statusFilter,
    type: typeFilter,
    search: searchFilter
  }));
  
  // Reload cases list with filters
  loadCasesList();
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
