// cases.js - Script to load cases from MongoDB database
document.addEventListener('DOMContentLoaded', function() {
    // Load cases from the database
    loadCasesFromDatabase();
    
    // Set up event listeners
    document.getElementById('applyFilters').addEventListener('click', function() {
      loadCasesFromDatabase();
    });
    
    document.getElementById('selectAll').addEventListener('change', function() {
      const isChecked = this.checked;
      document.querySelectorAll('.case-select').forEach(checkbox => {
        checkbox.checked = isChecked;
      });
    });
    
    // Set up global case selector
    loadGlobalCaseSelector();
  });
  
  // Load cases from the database
  function loadCasesFromDatabase() {
    // Show loading indicator
    const casesTableBody = document.querySelector('#casesList tbody');
    casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading cases...</td></tr>';
    
    // Get filter values
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchFilter = document.getElementById('searchInput').value;
    
    // Build query string
    let queryParams = new URLSearchParams();
    if (statusFilter) queryParams.append('status', statusFilter);
    if (typeFilter) queryParams.append('type', typeFilter);
    if (searchFilter) queryParams.append('search', searchFilter);
    
    // Build API URL
    let apiUrl = '/api/public-cases';
    if (queryParams.toString()) {
      apiUrl += '?' + queryParams.toString();
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
          
          showAlert('success', `Loaded ${data.data.length} cases successfully`);
        } else {
          // No cases found - show a more friendly message
          casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No cases found. Create a new case to get started.</td></tr>';
          showAlert('warning', 'No cases found matching your criteria');
        }
      })
      .catch(error => {
        console.error('Error loading cases:', error);
        casesTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to load cases. Please try again later.</td></tr>';
        showAlert('error', 'Failed to load cases: ' + error.message);
      });
  }
  
  // Load global case selector
  function loadGlobalCaseSelector() {
    const selector = document.getElementById('globalCaseSelector');
    
    // Clear existing options except "All Cases"
    while (selector.options.length > 1) {
      selector.remove(1);
    }
    
    // Fetch cases from the API
    fetch('/api/public-cases')
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
      updatePageTitle(selectedCaseId);
      
      // Reload cases if a specific case is selected
      loadCasesFromDatabase();
    });
  }
  
  // Create a table row for a case
  function createCaseRow(caseItem) {
    const row = document.createElement('tr');
    row.className = 'case-row';
    row.dataset.status = caseItem.status;
    row.dataset.type = caseItem.type;
    
    // Checkbox cell
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input case-select';
    checkbox.name = 'caseIds[]';
    checkbox.value = caseItem._id;
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);
    
    // Case name cell
    const nameCell = document.createElement('td');
    const nameLink = document.createElement('a');
    nameLink.href = `/cases/detail.html?id=${caseItem._id}`;
    nameLink.className = 'fw-bold';
    nameLink.textContent = caseItem.name;
    nameCell.appendChild(nameLink);
    row.appendChild(nameCell);
    
    // Case number cell
    const numberCell = document.createElement('td');
    numberCell.textContent = caseItem.caseNumber;
    row.appendChild(numberCell);
    
    // Type cell
    const typeCell = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = `badge ${getTypeBadgeClass(caseItem.type)}`;
    typeBadge.textContent = formatCaseType(caseItem.type);
    typeCell.appendChild(typeBadge);
    row.appendChild(typeCell);
    
    // Status cell
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${getStatusBadgeClass(caseItem.status)}`;
    statusBadge.textContent = caseItem.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);
    
    // Documents cell
    const docsCell = document.createElement('td');
    docsCell.textContent = caseItem.documentCount || '0';
    row.appendChild(docsCell);
    
    // Created date cell
    const createdCell = document.createElement('td');
    createdCell.textContent = formatDate(caseItem.createdAt);
    row.appendChild(createdCell);
    
    // Actions cell
    const actionsCell = document.createElement('td');
    const actionsDropdown = document.createElement('div');
    actionsDropdown.className = 'dropdown';
    
    const actionsButton = document.createElement('button');
    actionsButton.className = 'btn btn-sm btn-outline-secondary dropdown-toggle';
    actionsButton.type = 'button';
    actionsButton.id = `dropdownMenuButton${caseItem._id}`;
    actionsButton.dataset.bsToggle = 'dropdown';
    actionsButton.setAttribute('aria-expanded', 'false');
    actionsButton.textContent = 'Actions';
    
    const actionsMenu = document.createElement('ul');
    actionsMenu.className = 'dropdown-menu';
    actionsMenu.setAttribute('aria-labelledby', `dropdownMenuButton${caseItem._id}`);
    
    // View action
    const viewAction = document.createElement('li');
    const viewLink = document.createElement('a');
    viewLink.className = 'dropdown-item';
    viewLink.href = `/cases/detail.html?id=${caseItem._id}`;
    viewLink.innerHTML = '<i class="bi bi-eye"></i> View';
    viewAction.appendChild(viewLink);
    actionsMenu.appendChild(viewAction);
    
    // Edit action
    const editAction = document.createElement('li');
    const editLink = document.createElement('a');
    editLink.className = 'dropdown-item';
    editLink.href = `/cases/edit.html?id=${caseItem._id}`;
    editLink.innerHTML = '<i class="bi bi-pencil"></i> Edit';
    editAction.appendChild(editLink);
    actionsMenu.appendChild(editAction);
    
    // Documents action
    const docsAction = document.createElement('li');
    const docsLink = document.createElement('a');
    docsLink.className = 'dropdown-item';
    docsLink.href = `/documents.html?case=${caseItem._id}`;
    docsLink.innerHTML = '<i class="bi bi-file-earmark-text"></i> Documents';
    docsAction.appendChild(docsLink);
    actionsMenu.appendChild(docsAction);
    
    // Exhibits action
    const exhibitsAction = document.createElement('li');
    const exhibitsLink = document.createElement('a');
    exhibitsLink.className = 'dropdown-item';
    exhibitsLink.href = `/exhibits.html?case=${caseItem._id}`;
    exhibitsLink.innerHTML = '<i class="bi bi-card-list"></i> Exhibits';
    exhibitsAction.appendChild(exhibitsLink);
    actionsMenu.appendChild(exhibitsAction);
    
    // Divider
    const divider = document.createElement('li');
    const dividerHr = document.createElement('hr');
    dividerHr.className = 'dropdown-divider';
    divider.appendChild(dividerHr);
    actionsMenu.appendChild(divider);
    
    // Delete action
    const deleteAction = document.createElement('li');
    const deleteLink = document.createElement('a');
    deleteLink.className = 'dropdown-item text-danger';
    deleteLink.href = '#';
    deleteLink.innerHTML = '<i class="bi bi-trash"></i> Delete';
    deleteLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm(`Are you sure you want to delete the case "${caseItem.name}"?`)) {
        deleteCase(caseItem._id);
      }
    });
    deleteAction.appendChild(deleteLink);
    actionsMenu.appendChild(deleteAction);
    
    actionsDropdown.appendChild(actionsButton);
    actionsDropdown.appendChild(actionsMenu);
    actionsCell.appendChild(actionsDropdown);
    row.appendChild(actionsCell);
    
    return row;
  }
  
  // Delete a case
  function deleteCase(caseId) {
    fetch(`/api/cases/${caseId}`, {
      method: 'DELETE'
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
          loadCasesFromDatabase();
          loadGlobalCaseSelector();
        } else {
          showAlert('error', data.message || 'Failed to delete case');
        }
      })
      .catch(error => {
        console.error('Error deleting case:', error);
        showAlert('error', 'Failed to delete case: ' + error.message);
      });
  }
  
  // Update page title based on selected case
  function updatePageTitle(caseId) {
    const pageTitleElement = document.querySelector('[data-base-title]');
    if (!pageTitleElement) return;
    
    const baseTitle = pageTitleElement.getAttribute('data-base-title');
    
    if (caseId === 'all') {
      pageTitleElement.textContent = baseTitle;
    } else {
      // Find the case name from the selector
      const selector = document.getElementById('globalCaseSelector');
      const selectedOption = selector.options[selector.selectedIndex];
      if (selectedOption) {
        pageTitleElement.textContent = `${baseTitle} - ${selectedOption.textContent}`;
      }
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
  
  // Helper functions
  function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'closed':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  }
  
  function getTypeBadgeClass(type) {
    switch (type?.toLowerCase()) {
      case 'personal_injury':
        return 'bg-info';
      case 'medical_malpractice':
        return 'bg-danger';
      case 'contract':
        return 'bg-primary';
      case 'employment':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }
  
  function formatCaseType(type) {
    if (!type) return 'N/A';
    
    // Convert snake_case to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  