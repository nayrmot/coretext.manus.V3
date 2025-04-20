// Main JavaScript for Document Management System

$(document).ready(function() {
  // Toggle sidebar
  $('#sidebarCollapse').on('click', function() {
    $('#sidebar').toggleClass('active');
  });

  // Initialize tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });

  // Initialize popovers
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  });

  if ($('#globalCaseSelector').length) {
    const caseSelector = document.getElementById('globalCaseSelector');
    
    // Load saved case selection from localStorage
    const savedCase = localStorage.getItem('selectedCase');
    if (savedCase) {
      caseSelector.value = savedCase;
    }
    
    // Apply case filter on page load
    applyCaseFilter(caseSelector.value);
    
    // Handle case selection change
    caseSelector.addEventListener('change', function() {
      const selectedCase = this.value;
      localStorage.setItem('selectedCase', selectedCase);
      applyCaseFilter(selectedCase);
    });
  }

  function filterDocuments() {
    const caseId = $('#caseFilter').val();
    const category = $('#categoryFilter').val();
    const searchTerm = $('#searchInput').val().toLowerCase();
    
    // Show loading state
    showSpinner('Filtering documents...');
    
    // In a real implementation, this would make API calls to filter documents
    // For now, we'll simulate this with setTimeout
    
    setTimeout(() => {
      hideSpinner();
      
      // Filter document rows
      $('.document-row').each(function() {
        const rowCaseId = $(this).data('case-id');
        const rowCategory = $(this).data('category').toLowerCase();
        const rowName = $(this).data('name').toLowerCase();
        
        let showRow = true;
        
        if (caseId && rowCaseId !== caseId) {
          showRow = false;
        }
        
        if (category && rowCategory !== category) {
          showRow = false;
        }
        
        if (searchTerm && !rowName.includes(searchTerm)) {
          showRow = false;
        }
        
        $(this).toggle(showRow);
      });
      
      // Update document count
      const visibleCount = $('.document-row:visible').length;
      $('#visibleDocumentCount').text(visibleCount);
    }, 300);
  }

  // File upload handling
  if ($('#fileUpload').length) {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileUpload');
    const uploadZone = document.getElementById('uploadZone');
    const progressBar = document.getElementById('uploadProgress');
    const progressContainer = document.getElementById('progressContainer');

    // Drag and drop functionality
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('active');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('active');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('active');
      
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileList();
      }
    });

    function updateDashboardStats(caseId) {
      // In a real implementation, this would make API calls to get case-specific stats
      // For now, we'll simulate this with setTimeout
      
      showSpinner('Updating dashboard...');
      
      setTimeout(() => {
        hideSpinner();
        
        if (caseId !== 'all') {
          // Update with case-specific stats (simulated)
          $('#documentCount').text(caseId === '1' ? '42' : (caseId === '2' ? '37' : '29'));
          $('#exhibitCount').text(caseId === '1' ? '15' : (caseId === '2' ? '12' : '8'));
          $('#processingCount').text(caseId === '1' ? '2' : (caseId === '2' ? '1' : '0'));
        } else {
          // Update with all cases stats
          $('#documentCount').text('125');
          $('#exhibitCount').text('42');
          $('#processingCount').text('3');
        }
      }, 500);
    }

    // Click to upload
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      updateFileList();
    });

    // Update file list display
    function updateFileList() {
      const fileList = document.getElementById('fileList');
      fileList.innerHTML = '';
      
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Determine file icon
        let fileIconClass = 'bi-file-earmark';
        if (file.type === 'application/pdf') {
          fileIconClass = 'bi-file-earmark-pdf file-pdf';
        } else if (file.type.includes('word')) {
          fileIconClass = 'bi-file-earmark-word file-word';
        } else if (file.type.includes('image')) {
          fileIconClass = 'bi-file-earmark-image file-image';
        }
        
        fileItem.innerHTML = `
          <i class="bi ${fileIconClass}"></i>
          <span>${file.name}</span>
          <small>(${formatFileSize(file.size)})</small>
        `;
        
        fileList.appendChild(fileItem);
      }
      
      if (fileInput.files.length > 0) {
        document.getElementById('uploadButton').disabled = false;
      } else {
        document.getElementById('uploadButton').disabled = true;
      }
    }

    // Format file size
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle form submission
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
          showAlert('Please select files to upload', 'danger');
          return;
        }
        
        // Show progress
        progressContainer.classList.remove('d-none');
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        
        // Create FormData
        const formData = new FormData(uploadForm);
        
        // Simulate upload progress (in a real app, this would use fetch with progress tracking)
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          progressBar.style.width = progress + '%';
          progressBar.textContent = progress + '%';
          
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              showAlert('Files uploaded successfully!', 'success');
              progressContainer.classList.add('d-none');
              uploadForm.reset();
              updateFileList();
            }, 500);
          }
        }, 200);
      });
    }
  }

  // Bates labeling form handling
  if ($('#batesForm').length) {
    const batesForm = document.getElementById('batesForm');
    const previewButton = document.getElementById('previewBates');
    const batesPreview = document.getElementById('batesPreview');
    
    // Update Bates number preview
    function updateBatesPreview() {
      const prefix = document.getElementById('batesPrefix').value;
      const startNumber = parseInt(document.getElementById('batesStartNumber').value) || 1;
      const padding = parseInt(document.getElementById('batesPadding').value) || 5;
      const suffix = document.getElementById('batesSuffix').value;
      
      const paddedNumber = String(startNumber).padStart(padding, '0');
      const batesNumber = `${prefix}${paddedNumber}${suffix}`;
      
      batesPreview.textContent = batesNumber;
    }
    
    // Preview button click
    if (previewButton) {
      previewButton.addEventListener('click', (e) => {
        e.preventDefault();
        updateBatesPreview();
      });
    }
    
    // Form submission
    if (batesForm) {
      batesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Show loading spinner
        showSpinner('Applying Bates labels...');
        
        // Simulate processing (in a real app, this would be an API call)
        setTimeout(() => {
          hideSpinner();
          showAlert('Bates labels applied successfully!', 'success');
        }, 2000);
      });
    }
  }

  // Exhibit creation form handling
  if ($('#exhibitForm').length) {
    const exhibitForm = document.getElementById('exhibitForm');
    
    if (exhibitForm) {
      exhibitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Show loading spinner
        showSpinner('Creating exhibit...');
        
        // Simulate processing (in a real app, this would be an API call)
        setTimeout(() => {
          hideSpinner();
          showAlert('Exhibit created successfully!', 'success');
        }, 1500);
      });
    }
  }

  // Gmail connection handling
  if ($('#gmailConnectButton').length) {
    const connectButton = document.getElementById('gmailConnectButton');
    
    connectButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // In a real app, this would redirect to Google OAuth
      window.location.href = '/api/email/connect';
    });
  }

  // Drive sync handling
  if ($('#syncButton').length) {
    const syncButton = document.getElementById('syncButton');
    const syncStatus = document.getElementById('syncStatus');
    
    syncButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Show loading state
      syncButton.disabled = true;
      syncButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Syncing...';
      
      // Simulate sync process (in a real app, this would be an API call)
      setTimeout(() => {
        syncButton.disabled = false;
        syncButton.innerHTML = '<i class="bi bi-cloud-arrow-up-down"></i> Sync with Drive';
        
        // Update status
        syncStatus.innerHTML = `
          <div class="alert alert-success">
            <i class="bi bi-check-circle-fill"></i> Last sync: ${new Date().toLocaleString()}
            <br>
            <small>Added: 5 files, Updated: 2 files</small>
          </div>
        `;
      }, 3000);
    });
  }

  // Show alert message
  window.showAlert = function(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 150);
    }, 5000);
  };

  // Show loading spinner
  window.showSpinner = function(message = 'Loading...') {
    // Create spinner if it doesn't exist
    if (!document.getElementById('loadingSpinner')) {
      const spinner = document.createElement('div');
      spinner.id = 'loadingSpinner';
      spinner.className = 'spinner-overlay';
      spinner.innerHTML = `
        <div class="spinner-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div id="spinnerMessage" class="mt-2">${message}</div>
        </div>
      `;
      
      document.body.appendChild(spinner);
    } else {
      // Update existing spinner message
      document.getElementById('spinnerMessage').textContent = message;
      document.getElementById('loadingSpinner').classList.remove('d-none');
    }
  };

  // Hide loading spinner
  window.hideSpinner = function() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.classList.add('d-none');
    }
  };
});
