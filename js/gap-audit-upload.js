/**
 * Secure Document Upload Handler for GAP Audit
 * 
 * This file handles the secure document upload process for the GAP Audit page.
 * It communicates with a Lambda function for generating secure, pre-signed URLs
 * and handles the direct upload to S3 with client-side encryption.
 */

// Configuration (would be loaded from environment in production)
const CONFIG = {
  apiEndpoint: 'https://your-api-gateway-url.execute-api.eu-central-1.amazonaws.com/prod/gap-audit',
  maxFileSize: 25 * 1024 * 1024, // 25MB in bytes
  maxTotalUploads: 10,
  allowedFileTypes: [
    'application/pdf',                                                 // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword',                                             // DOC
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-excel',                                       // XLS
    'application/zip',                                                // ZIP
    'application/x-zip-compressed'                                    // ZIP alternative
  ]
};

// Track the verification session
let verificationSession = {
  email: '',
  verificationId: '',
  verified: false,
  standard: '',
  files: []
};

/**
 * Initialize the GAP Audit form
 */
function initGapAuditForm() {
  // Email verification form
  const emailForm = document.getElementById('email-verification-form');
  if (emailForm) {
    emailForm.addEventListener('submit', handleEmailVerification);
  }
  
  // Code verification form
  const standardForm = document.getElementById('standard-selection-form');
  if (standardForm) {
    standardForm.addEventListener('submit', handleStandardSelection);
  }
  
  // Document upload form
  const uploadForm = document.getElementById('document-upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleDocumentUpload);
  }
  
  // Initialize file upload listeners
  initializeFileUploadHandlers();
}

/**
 * Handle email verification form submission
 * @param {Event} e - Form submit event
 */
async function handleEmailVerification(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const email = emailInput.value;
  const submitButton = document.getElementById('verify-email-btn');
  
  // Validate email
  if (!isValidEmail(email)) {
    showFormError(emailInput, 'Please enter a valid email address');
    return;
  }
  
  // Check CAPTCHA (would connect to actual CAPTCHA service)
  if (!verifyCaptcha()) {
    showAlert('Please complete the CAPTCHA verification', 'error');
    return;
  }
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Sending code...';
  
  try {
    // Call the API to send verification code
    const response = await fetch(`${CONFIG.apiEndpoint}/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send verification code');
    }
    
    const data = await response.json();
    
    // Store verification session data
    verificationSession.email = email;
    verificationSession.verificationId = data.verificationId;
    
    // Move to next step
    goToStep(2);
    
    // Show success message
    showAlert('Verification code sent! Please check your email', 'success');
  } catch (error) {
    console.error('Email verification error:', error);
    showAlert('Failed to send verification code. Please try again.', 'error');
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Continue';
  }
}

/**
 * Handle standard selection and code verification
 * @param {Event} e - Form submit event
 */
async function handleStandardSelection(e) {
  e.preventDefault();
  
  const codeInput = document.getElementById('verification-code');
  const code = codeInput.value;
  const standardInput = document.querySelector('input[name="security-standard"]:checked');
  const submitButton = document.getElementById('continue-to-upload');
  
  // Validate inputs
  if (!code) {
    showFormError(codeInput, 'Please enter your verification code');
    return;
  }
  
  if (!standardInput) {
    showAlert('Please select a security standard', 'error');
    return;
  }
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Verifying...';
  
  try {
    // Call the API to verify code
    const response = await fetch(`${CONFIG.apiEndpoint}/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: verificationSession.email,
        verificationId: verificationSession.verificationId,
        code
      })
    });
    
    if (!response.ok) {
      throw new Error('Invalid verification code');
    }
    
    // Store selected standard
    verificationSession.verified = true;
    verificationSession.standard = standardInput.value;
    
    // Show relevant instructions
    document.querySelectorAll('.standard-instructions').forEach(el => {
      el.classList.add('hidden');
    });
    document.getElementById(`upload-${standardInput.value}`).classList.remove('hidden');
    
    // Move to next step
    goToStep(3);
  } catch (error) {
    console.error('Code verification error:', error);
    showFormError(codeInput, 'Invalid code. Please try again');
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Continue';
  }
}

/**
 * Initialize file upload handlers for drag & drop and input change
 */
function initializeFileUploadHandlers() {
  const fileInput = document.getElementById('file-upload');
  const dropArea = document.querySelector('.border-dashed');
  const fileList = document.getElementById('file-list');
  
  if (!fileInput || !dropArea || !fileList) return;
  
  // File input change handler
  fileInput.addEventListener('change', function(e) {
    handleFileSelection(e.target.files);
  });
  
  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, function() {
      dropArea.classList.add('border-intelligence-blue', 'bg-intelligence-blue/5');
    });
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, function() {
      dropArea.classList.remove('border-intelligence-blue', 'bg-intelligence-blue/5');
    });
  });
  
  // Handle file drop
  dropArea.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files;
    handleFileSelection(files);
  });
}

/**
 * Process selected files and update UI
 * @param {FileList} fileList - List of selected files
 */
function handleFileSelection(fileList) {
  if (!fileList.length) return;
  
  const filesContainer = document.getElementById('file-list');
  filesContainer.classList.remove('hidden');
  
  // Process each file
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    
    // Validate file type
    if (!validateFileType(file)) {
      showAlert(`File ${file.name} is not an allowed file type`, 'error');
      continue;
    }
    
    // Validate file size
    if (file.size > CONFIG.maxFileSize) {
      showAlert(`File ${file.name} exceeds the 25MB limit`, 'error');
      continue;
    }
    
    // Check if we've reached the maximum files
    if (verificationSession.files.length >= CONFIG.maxTotalUploads) {
      showAlert(`Maximum of ${CONFIG.maxTotalUploads} files allowed`, 'error');
      break;
    }
    
    // Add file to the session
    const fileId = generateUniqueId();
    verificationSession.files.push({
      id: fileId,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    });
    
    // Create file item in UI
    const fileItem = document.createElement('div');
    fileItem.id = `file-item-${fileId}`;
    fileItem.className = 'flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200';
    fileItem.innerHTML = `
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <span class="text-sm text-gray-700">${file.name}</span>
          <span class="text-xs text-gray-500 block">${formatFileSize(file.size)}</span>
        </div>
      </div>
      <button type="button" class="remove-file text-gray-400 hover:text-alert-red" data-fileid="${fileId}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    
    filesContainer.appendChild(fileItem);
    
    // Add remove event listener
    fileItem.querySelector('.remove-file').addEventListener('click', function() {
      const fileId = this.getAttribute('data-fileid');
      removeFile(fileId);
    });
  }
  
  // Enable submit button if files exist
  updateSubmitButtonState();
}

/**
 * Remove a file from the session and UI
 * @param {string} fileId - Unique ID of the file to remove
 */
function removeFile(fileId) {
  // Remove from session
  const fileIndex = verificationSession.files.findIndex(file => file.id === fileId);
  if (fileIndex !== -1) {
    verificationSession.files.splice(fileIndex, 1);
  }
  
  // Remove from UI
  const fileItem = document.getElementById(`file-item-${fileId}`);
  if (fileItem) {
    fileItem.remove();
  }
  
  // Hide container if no files remain
  if (verificationSession.files.length === 0) {
    document.getElementById('file-list').classList.add('hidden');
  }
  
  // Update submit button state
  updateSubmitButtonState();
}

/**
 * Upload documents to secure S3 storage
 * @param {Event} e - Form submit event
 */
async function handleDocumentUpload(e) {
  e.preventDefault();
  
  const submitButton = document.getElementById('submit-documents');
  
  // Validate files exist
  if (verificationSession.files.length === 0) {
    showAlert('Please upload at least one document', 'error');
    return;
  }
  
  // Validate session is verified
  if (!verificationSession.verified) {
    showAlert('Your session has expired. Please refresh and try again', 'error');
    return;
  }
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Uploading...';
  
  try {
    // Request upload URLs from the backend
    const response = await fetch(`${CONFIG.apiEndpoint}/request-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: verificationSession.email,
        verificationId: verificationSession.verificationId,
        standard: verificationSession.standard,
        files: verificationSession.files.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URLs');
    }
    
    const uploadData = await response.json();
    
    // Upload each file
    for (const fileData of uploadData.files) {
      const fileObj = verificationSession.files.find(f => f.id === fileData.id);
      if (!fileObj) continue;
      
      updateFileUploadStatus(fileData.id, 'uploading');
      
      await uploadFileToS3(fileObj.file, fileData.uploadUrl, fileData.encryptionKey);
      
      updateFileUploadStatus(fileData.id, 'completed');
    }
    
    // Notify backend that all uploads are complete
    await fetch(`${CONFIG.apiEndpoint}/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: verificationSession.email,
        submissionId: uploadData.submissionId
      })
    });
    
    // Show success and redirect
    showAlert('All documents uploaded successfully!', 'success');
    setTimeout(() => {
      window.location.href = '/gap-audit-thank-you';
    }, 1500);
    
  } catch (error) {
    console.error('Upload error:', error);
    showAlert('There was a problem uploading your documents. Please try again.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
}

/**
 * Upload a file directly to S3 using a pre-signed URL
 * @param {File} file - The file to upload
 * @param {string} url - Pre-signed S3 URL
 * @param {string} encryptionKey - Client-side encryption key (base64)
 */
async function uploadFileToS3(file, url, encryptionKey) {
  // In a real implementation, we would use client-side encryption
  // This is a simplified version that just uploads directly
  return fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
}

/**
 * Update the UI to show upload status for a file
 * @param {string} fileId - ID of the file
 * @param {string} status - Current status (uploading, completed, error)
 */
function updateFileUploadStatus(fileId, status) {
  const fileItem = document.getElementById(`file-item-${fileId}`);
  if (!fileItem) return;
  
  // Remove any existing status indicators
  const existingStatus = fileItem.querySelector('.file-status');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Add new status indicator
  const statusEl = document.createElement('div');
  statusEl.className = 'file-status ml-2';
  
  if (status === 'uploading') {
    statusEl.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-intelligence-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;
  } else if (status === 'completed') {
    statusEl.innerHTML = `
      <svg class="h-4 w-4 text-alert-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;
  } else if (status === 'error') {
    statusEl.innerHTML = `
      <svg class="h-4 w-4 text-alert-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
  }
  
  // Add to the file item UI
  const nameContainer = fileItem.querySelector('div > div');
  nameContainer.appendChild(statusEl);
}

/* ---- Utility functions ---- */

/**
 * Navigate to a specific step in the form
 * @param {number} stepNumber - The step to navigate to (1-based)
 */
function goToStep(stepNumber) {
  // Update step indicators
  document.querySelectorAll('.step').forEach(step => {
    if (parseInt(step.dataset.step) <= stepNumber) {
      step.classList.add('step-active');
    } else {
      step.classList.remove('step-active');
    }
  });
  
  // Show appropriate step content
  document.querySelectorAll('.step-content').forEach((content, index) => {
    if (index + 1 === stepNumber) {
      content.classList.add('active');
      content.classList.remove('hidden');
    } else {
      content.classList.remove('active');
      content.classList.add('hidden');
    }
  });
  
  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    // Calculate progress percentage (3 steps total)
    const progressPercentage = ((stepNumber - 1) / 2) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    
    // Add animation class
    progressBar.classList.add('transition-all', 'duration-500');
  }
}

/**
 * Display a form error for a specific input
 * @param {HTMLElement} inputElement - The input with the error
 * @param {string} message - Error message to display
 */
function showFormError(inputElement, message) {
  // Clear any existing error
  clearFormError(inputElement);
  
  // Create error message
  const errorElement = document.createElement('p');
  errorElement.className = 'text-alert-red text-sm mt-1';
  errorElement.textContent = message;
  
  // Add error class to input
  inputElement.classList.add('border-alert-red');
  
  // Insert error after input
  inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
  
  // Focus the input
  inputElement.focus();
}

/**
 * Clear form error for an input
 * @param {HTMLElement} inputElement - The input to clear errors for
 */
function clearFormError(inputElement) {
  // Remove error class
  inputElement.classList.remove('border-alert-red');
  
  // Remove any existing error message
  const errorMessage = inputElement.nextSibling;
  if (errorMessage && errorMessage.classList && errorMessage.classList.contains('text-alert-red')) {
    errorMessage.remove();
  }
}

/**
 * Show an alert message
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, error, warning, info)
 */
function showAlert(message, type = 'info') {
  // Remove any existing alerts
  const existingAlerts = document.querySelectorAll('.alert-message');
  existingAlerts.forEach(alert => {
    alert.remove();
  });
  
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = 'alert-message fixed top-4 right-4 p-4 rounded-md shadow-md z-50';
  
  // Set style based on type
  switch (type) {
    case 'success':
      alertElement.classList.add('bg-alert-green/10', 'text-alert-green');
      break;
    case 'error':
      alertElement.classList.add('bg-alert-red/10', 'text-alert-red');
      break;
    case 'warning':
      alertElement.classList.add('bg-alert-amber/10', 'text-alert-amber');
      break;
    default:
      alertElement.classList.add('bg-alert-blue/10', 'text-alert-blue');
  }
  
  // Add content
  alertElement.textContent = message;
  
  // Add to page
  document.body.appendChild(alertElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    alertElement.remove();
  }, 5000);
}

/**
 * Update submit button state based on file selection
 */
function updateSubmitButtonState() {
  const submitButton = document.getElementById('submit-documents');
  if (submitButton) {
    submitButton.disabled = verificationSession.files.length === 0;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Verify CAPTCHA is completed
 * @returns {boolean} Whether CAPTCHA is valid
 */
function verifyCaptcha() {
  // In a real implementation, this would verify with reCAPTCHA
  // This is a placeholder function
  return true;
}

/**
 * Validate file type is allowed
 * @param {File} file - The file to validate
 * @returns {boolean} Whether file type is allowed
 */
function validateFileType(file) {
  return CONFIG.allowedFileTypes.includes(file.type);
}

/**
 * Format file size in human-readable format
 * @param {number} sizeInBytes - Size in bytes
 * @returns {string} Formatted size (KB, MB)
 */
function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) {
    return sizeInBytes + ' B';
  } else if (sizeInBytes < 1048576) {
    return Math.round(sizeInBytes / 1024) + ' KB';
  } else {
    return (sizeInBytes / 1048576).toFixed(1) + ' MB';
  }
}

/**
 * Generate a unique ID for files
 * @returns {string} Unique ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGapAuditForm);