/**
 * HubSpot Forms Submission Handler with File Upload Support
 * 
 * This script handles form submissions to HubSpot for different form types:
 * - contact: Contact form submissions
 * - partnership: Partnership inquiry form submissions
 * - job-application: Job application form submissions
 * - open-application: Open job application form submissions
 */

// HubSpot portal ID and form IDs
const HUBSPOT_CONFIG = {
  portalId: '144004543',
  formIds: {
    contact: '38a469e8-0b58-4f1c-a366-73c025967494', // Contact form
    partnership: '8aec090e-bb14-402b-873f-acaf00071d67', // Partnership form
    'job-application': '2de8f97b-1017-4a0b-bf46-b3529960d69f', // Job application
    'open-application': 'c0055920-ed4c-4c01-b747-99dfdbfb561b' // Open application
  }
};

/**
 * Initialize form handlers when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  // Handle contact form (already working)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      submitToHubSpot(event, 'contact');
    });
  }

  // Handle partnership form
  const partnershipForm = document.querySelector('form[name="partnership-form"]');
  if (partnershipForm) {
    partnershipForm.addEventListener('submit', function(event) {
      event.preventDefault();
      submitToHubSpot(event, 'partnership');
    });
  }

  // Handle job application forms
  const jobApplicationForm = document.getElementById('job-application-form');
  if (jobApplicationForm) {
    jobApplicationForm.addEventListener('submit', function(event) {
      event.preventDefault();
      submitToHubSpot(event, 'job-application', true);
    });
  }

  // Handle open application form
  const openApplicationForm = document.getElementById('open-application-form');
  if (openApplicationForm) {
    openApplicationForm.addEventListener('submit', function(event) {
      event.preventDefault();
      submitToHubSpot(event, 'open-application', true);
    });
  }

  // Find any other forms with action="/thank-you" that might need HubSpot integration
  const thankyouForms = document.querySelectorAll('form[action="/thank-you"]');
  thankyouForms.forEach(form => {
    if (!form.hasAttribute('data-hubspot-handled')) {
      form.setAttribute('data-hubspot-handled', 'true');
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Determine form type based on hidden input or form ID
        let formType = 'contact'; // Default
        let hasFileUpload = false;
        
        // Check if the form has file inputs
        if (form.querySelector('input[type="file"]')) {
          hasFileUpload = true;
        }
        
        const hiddenFormType = form.querySelector('input[name="form_type"]');
        if (hiddenFormType && hiddenFormType.value) {
          formType = hiddenFormType.value;
        } else if (form.id.includes('partnership')) {
          formType = 'partnership';
        } else if (form.id.includes('job-application')) {
          formType = 'job-application';
          hasFileUpload = true;
        } else if (form.id.includes('open-application')) {
          formType = 'open-application';
          hasFileUpload = true;
        }
        
        submitToHubSpot(event, formType, hasFileUpload);
      });
    }
  });

  // Check for button click handlers
  const submitOpenApplicationBtn = document.querySelector('button[onclick="submitOpenApplication()"]');
  if (submitOpenApplicationBtn) {
    // Override the click handler
    submitOpenApplicationBtn.onclick = function() {
      const form = document.getElementById('open-application-form');
      if (form) {
        const event = new Event('submit', {
          bubbles: true,
          cancelable: true
        });
        form.dispatchEvent(event);
      }
    };
  }

  const submitJobApplicationBtn = document.querySelector('button[onclick="submitJobApplication()"]');
  if (submitJobApplicationBtn) {
    // Override the click handler
    submitJobApplicationBtn.onclick = function() {
      const form = document.getElementById('job-application-form');
      if (form) {
        const event = new Event('submit', {
          bubbles: true,
          cancelable: true
        });
        form.dispatchEvent(event);
      }
    };
  }
});

/**
 * Submit form data to HubSpot
 * @param {Event} event - The form submission event
 * @param {string} formType - The type of form (contact, partnership, job-application, open-application)
 * @param {boolean} hasFileUpload - Whether the form has file uploads
 */
function submitToHubSpot(event, formType, hasFileUpload = false) {
  if (event) {
    event.preventDefault();
  }
  
  const form = event ? event.target : document.getElementById(formType === 'open-application' ? 'open-application-form' : 'job-application-form');
  if (!form) {
    console.error('Form not found');
    return;
  }
  
  // Show loading state
  const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], button[type="button"]');
  let originalText = '';
  if (submitBtn) {
    originalText = submitBtn.value || submitBtn.textContent;
    submitBtn.disabled = true;
    if (submitBtn.tagName === 'INPUT') {
      submitBtn.value = 'Submitting...';
    } else {
      submitBtn.textContent = 'Submitting...';
    }
  }
  
  // If this form has file uploads, we need to use a different approach
  if (hasFileUpload) {
    // Use native form submission to HubSpot with multipart/form-data
    submitFormWithFileToHubSpot(form, formType, originalText, submitBtn);
    return;
  }
  
  // For forms without files, use the existing JSON submission method
  const formData = new FormData(form);
  const submissionData = {};
  
  // Convert FormData to object for HubSpot
  for (const [key, value] of formData.entries()) {
    submissionData[key] = value;
  }
  
  // Log submission for debugging
  console.log(`Submitting ${formType} form to HubSpot:`, submissionData);
  
  // Create HubSpot form submission
  const formId = HUBSPOT_CONFIG.formIds[formType];
  if (!formId) {
    console.error(`No HubSpot form ID configured for form type: ${formType}`);
    showFormError(form, 'Configuration error. Please try again later or contact support.');
    resetSubmitButton(submitBtn, originalText);
    return;
  }
  
  // Prepare data for HubSpot
  const hubspotData = {
    portalId: HUBSPOT_CONFIG.portalId,
    formId: formId,
    fields: Object.entries(submissionData).map(([name, value]) => ({
      name: name,
      value: value
    })),
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  };
  
  // Send to HubSpot
  fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_CONFIG.portalId + '/' + formId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hubspotData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.message || 'Form submission failed');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('HubSpot submission successful:', data);
    
    // Send form submission event to Google Tag Manager if available
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        'event': 'formSubmission',
        'formType': formType,
        'formLocation': form.id
      });
    }
    
    // Redirect to thank you page
    window.location.href = '/thank-you';
  })
  .catch(error => {
    console.error('HubSpot submission error:', error);
    showFormError(form, 'There was a problem submitting the form. Please try again.');
    resetSubmitButton(submitBtn, originalText);
  });
}

/**
 * Submit a form with file uploads directly to HubSpot
 * @param {HTMLFormElement} form - The form element
 * @param {string} formType - The type of form
 * @param {string} originalText - Original button text
 * @param {HTMLElement} submitBtn - The submit button
 */
function submitFormWithFileToHubSpot(form, formType, originalText, submitBtn) {
  // Get the form ID from config
  const formId = HUBSPOT_CONFIG.formIds[formType];
  if (!formId) {
    console.error(`No HubSpot form ID configured for form type: ${formType}`);
    showFormError(form, 'Configuration error. Please try again later or contact support.');
    resetSubmitButton(submitBtn, originalText);
    return;
  }
  
  // Create a new FormData object from the form
  const formData = new FormData(form);
  
  // Log what we're submitting for debugging
  console.log(`Submitting ${formType} form with file to HubSpot`);
  let hasFile = false;
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      console.log(`File input: ${key}, filename: ${value.name}, size: ${value.size} bytes`);
      hasFile = true;
    } else {
      console.log(`Form field: ${key} = ${value}`);
    }
  }
  
  if (!hasFile) {
    console.warn('No file found in the form data');
  }
  
  // The URL for the HubSpot form submission API with files support
  const url = `https://forms.hubspot.com/uploads/form/v2/${HUBSPOT_CONFIG.portalId}/${formId}`;
  
  // Ensure required HubSpot fields are present
  ensureHiddenField(form, 'hs_context', JSON.stringify({
    pageUri: window.location.href,
    pageName: document.title
  }));
  
  // Create a formData object for submission
  const submitFormData = new FormData(form);
  
  // Use fetch API with formData instead of iframe
  fetch(url, {
    method: 'POST',
    body: submitFormData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Form submission failed: ${response.status} ${response.statusText}`);
    }
    console.log('Form submitted successfully with file');
    
    // Send form submission event to Google Tag Manager if available
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        'event': 'formSubmission',
        'formType': formType,
        'formLocation': form.id
      });
    }
    
    // Redirect to thank you page
    window.location.href = '/thank-you';
  })
  .catch(error => {
    console.error('Error submitting form with file:', error);
    showFormError(form, 'There was a problem submitting the form. Please try again.');
    resetSubmitButton(submitBtn, originalText);
  });
}

/**
 * Ensure a hidden field exists in the form
 * @param {HTMLFormElement} form - The form element
 * @param {string} name - Field name
 * @param {string} value - Field value
 */
function ensureHiddenField(form, name, value) {
  let field = form.querySelector(`input[name="${name}"]`);
  if (!field) {
    field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    form.appendChild(field);
  }
  field.value = value;
}

/**
 * Reset the submit button to its original state
 * @param {HTMLElement} submitBtn - The submit button
 * @param {string} originalText - The original button text
 */
function resetSubmitButton(submitBtn, originalText) {
  if (submitBtn) {
    submitBtn.disabled = false;
    if (submitBtn.tagName === 'INPUT') {
      submitBtn.value = originalText;
    } else {
      submitBtn.textContent = originalText;
    }
  }
}

/**
 * Display an error message on the form
 * @param {HTMLFormElement} form - The form element
 * @param {string} message - The error message to display
 */
function showFormError(form, message) {
  // Check if error element already exists
  let errorElement = form.querySelector('.form-error-message');
  
  if (!errorElement) {
    // Create error element if it doesn't exist
    errorElement = document.createElement('div');
    errorElement.className = 'form-error-message bg-alert-red/10 text-alert-red p-4 rounded-md mt-4';
    form.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Scroll to error message
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}