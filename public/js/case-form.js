// case-form.js - Script to handle new case form submission
document.addEventListener('DOMContentLoaded', function() {
  // Get the form element
  const newCaseForm = document.getElementById('newCaseForm');
  
  // Add event listener for form submission
  newCaseForm.addEventListener('submit', handleFormSubmit);
  
  // Load global case selector
  loadGlobalCaseSelector();
});

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Get the form element
  const form = event.target;
  
  // Validate the form
  if (!validateForm(form)) {
    return;
  }
  
  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
  
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
    
    // Send data to API
    const response = await fetch('/api/cases/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(caseData)
    });
    
    // Parse response
    const result = await response.json();
    
    // Check if successful
    if (response.ok && result.success) {
      // Show success message
      showAlert('success', 'Case created successfully!');
      
      // Reset the form
      form.reset();
      
      // Redirect to case list or case detail page after a short delay
      setTimeout(() => {
        window.location.href = `/cases.html`;
      }, 1500);
    } else {
      // Show error message
      showAlert('error', result.message || 'Failed to create case. Please try again.');
      
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  } catch (error) {
    console.error('Error creating case:', error);
    showAlert('error', 'An error occurred while creating the case. Please try again.');
    
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

// Validate the form
function validateForm(form) {
  // Reset previous validation
  form.classList.remove('was-validated');
  
  // Check if the form is valid
  if (!form.checkValidity()) {
    // Show validation messages
    form.classList.add('was-validated');
    
    // Show error message
    showAlert('error', 'Please fill in all required fields.');
    
    return false;
  }
  
  return true;
}

// Load global case selector
function loadGlobalCaseSelector() {
  const selector = document.getElementById('globalCaseSelector');
  if (!selector) return;
  
  // Clear existing options except "All Cases"
  while (selector.options.length > 1) {
    selector.remove(1);
  }
  
  // Fetch cases from the API
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
  });
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
