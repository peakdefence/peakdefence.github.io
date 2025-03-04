/**
 * HubSpot Forms Submission Handler
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
    // Keep existing functionality
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
  const jobForms = document.querySelectorAll('form[id^="job-application-form"]');
  jobForms.forEach(form => {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      // Check if it's a specific job or open application
      const formType = form.id.includes('open') ? 'open-application' : 'job-application';
      submitToHubSpot(event, formType);
    });
  });

  // Find any other forms with action="/thank-you" that might need HubSpot integration
  const thankyouForms = document.querySelectorAll('form[action="/thank-you"]');
  thankyouForms.forEach(form => {
    if (!form.hasAttribute('data-hubspot-handled')) {
      form.setAttribute('data-hubspot-handled', 'true');
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Determine form type based on hidden input or form ID
        let formType = 'contact'; // Default
        
        const hiddenFormType = form.querySelector('input[name="form_type"]');
        if (hiddenFormType && hiddenFormType.value) {
          formType = hiddenFormType.value;
        } else if (form.id.includes('partnership')) {
          formType = 'partnership';
        } else if (form.id.includes('job-application')) {
          formType = 'job-application';
        } else if (form.id.includes('open-application')) {
          formType = 'open-application';
        }
        
        submitToHubSpot(event, formType);
      });
    }
  });
});

/**
 * Submit form data to HubSpot
 * @param {Event} event - The form submission event
 * @param {string} formType - The type of form (contact, partnership, job-application, open-application)
 */
function submitToHubSpot(event, formType) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const submissionData = {};
  
  // Convert FormData to object for HubSpot
  for (const [key, value] of formData.entries()) {
    // Skip file inputs for now - they require special handling
    if (!(value instanceof File)) {
      submissionData[key] = value;
    }
  }
  
  // Log submission for debugging
  console.log(`Submitting ${formType} form to HubSpot:`, submissionData);
  
  // Show loading state
  const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
  if (submitBtn) {
    const originalText = submitBtn.value || submitBtn.textContent;
    submitBtn.disabled = true;
    if (submitBtn.tagName === 'INPUT') {
      submitBtn.value = 'Submitting...';
    } else {
      submitBtn.textContent = 'Submitting...';
    }
  }
  
  // Create HubSpot form submission
  const formId = HUBSPOT_CONFIG.formIds[formType];
  if (!formId) {
    console.error(`No HubSpot form ID configured for form type: ${formType}`);
    showFormError(form, 'Configuration error. Please try again later or contact support.');
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
    
    // Handle file uploads separately if needed
    const fileInputs = form.querySelectorAll('input[type="file"]');
    if (fileInputs.length > 0) {
      // For now, we're just redirecting without handling file uploads
      // In a production environment, you'd want to implement file uploads to HubSpot
      console.log('File uploads detected but not implemented in this version');
    }
    
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
    
    // Reset submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.tagName === 'INPUT') {
        submitBtn.value = originalText;
      } else {
        submitBtn.textContent = originalText;
      }
    }
  });
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