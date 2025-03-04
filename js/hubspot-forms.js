// HubSpot Form Handlers
const HUBSPOT_PORTAL_ID = '144004543';
const HUBSPOT_FORMS = {
  contact: '38a469e8-0b58-4f1c-a366-73c025967494',
  job_application: '2de8f97b-1017-4a0b-bf46-b3529960d69f',
  partnership: '8aec090e-bb14-402b-873f-acaf00071d67',
  open_application: 'c0055920-ed4c-4c01-b747-99dfdbfb561b'
};

/**
 * Handles regular form submissions (contact, partnership)
 * @param {Event} event - Form submission event
 * @param {string} formType - Type of form being submitted (contact, partnership)
 */
function submitToHubSpot(event, formType) {
  event.preventDefault();
  
  // Get form data
  const form = event.target;
  const formData = new FormData(form);
  
  // Show loading state
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  const originalText = submitButton.innerText || submitButton.value;
  submitButton.disabled = true;
  
  // Handle button with or without span inside
  const submitTextEl = submitButton.querySelector('#submit-text');
  const submitLoaderEl = submitButton.querySelector('#submit-loader');
  
  if (submitTextEl && submitLoaderEl) {
    submitTextEl.classList.add('hidden');
    submitLoaderEl.classList.remove('hidden');
  } else {
    submitButton.innerText = submitButton.value = 'Submitting...';
  }
  
  // Create or get feedback element
  let feedbackEl = form.querySelector('#form-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'form-feedback';
    feedbackEl.className = 'mt-4 p-4 rounded-lg hidden';
    form.appendChild(feedbackEl);
  }
  
  // Hide any existing feedback
  feedbackEl.classList.add('hidden');
  
  // Prepare data for HubSpot
  const fields = [];
  
  // Map common fields
  if (formData.get('firstName')) fields.push({name: 'firstname', value: formData.get('firstName')});
  if (formData.get('lastName')) fields.push({name: 'lastname', value: formData.get('lastName')});
  if (formData.get('email')) fields.push({name: 'email', value: formData.get('email')});
  if (formData.get('phone')) fields.push({name: 'phone', value: formData.get('phone')});
  if (formData.get('company')) fields.push({name: 'company', value: formData.get('company')});
  if (formData.get('message')) fields.push({name: 'message', value: formData.get('message')});
  
  // Map form-specific fields
  if (formType === 'contact') {
    if (formData.get('inquiry_type')) fields.push({name: 'inquiry_type', value: formData.get('inquiry_type')});
  } else if (formType === 'partnership') {
    if (formData.get('partnership_type')) fields.push({name: 'partnership_type', value: formData.get('partnership_type')});
  }
  
  // Create data object for HubSpot
  const data = {
    submittedAt: Date.now(),
    fields: fields,
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  };
  
  // Get the appropriate form ID
  const formId = HUBSPOT_FORMS[formType] || HUBSPOT_FORMS.contact;
  
  // Log the URL for debugging
  console.log(`Submitting to: https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}`);
  
  // Submit to HubSpot
  fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      return response.text().then(text => {
        console.error('Error response:', text);
        throw new Error('Network response was not ok: ' + response.status);
      });
    }
    return response.json();
  })
  .then(result => {
    console.log('Success:', result);
    // Track form submission in Google Analytics if available
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        'event': 'formSubmission',
        'formType': formType
      });
    }
    // Redirect to thank you page
    window.location.href = '/thank-you';
  })
  .catch(error => {
    console.error('Error:', error);
    
    // Show error message
    feedbackEl.innerHTML = `
      <div class="p-4 bg-alert-red/10 border border-alert-red rounded-md text-alert-red">
        <p>There was a problem submitting your form. Please try again or contact us directly.</p>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    
    // Reset submit button
    if (submitTextEl && submitLoaderEl) {
      submitTextEl.classList.remove('hidden');
      submitLoaderEl.classList.add('hidden');
    } else {
      submitButton.innerText = submitButton.value = originalText;
    }
    submitButton.disabled = false;
  });
}

/**
 * Handles job application form submissions with file uploads
 * @param {Event} event - Form submission event
 * @param {string} jobTitle - Job title from the page
 */
function submitJobApplication(event, jobTitle) {
  event.preventDefault();
  
  // Get form data
  const form = event.target;
  const formData = new FormData(form);
  
  // Show loading state
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  const originalText = submitButton.innerText || submitButton.value;
  submitButton.disabled = true;
  
  // Handle button with or without span inside
  const submitTextEl = submitButton.querySelector('#job-submit-text');
  const submitLoaderEl = submitButton.querySelector('#job-submit-loader');
  
  if (submitTextEl && submitLoaderEl) {
    submitTextEl.classList.add('hidden');
    submitLoaderEl.classList.remove('hidden');
  } else {
    submitButton.innerText = submitButton.value = 'Submitting...';
  }
  
  // Create or get feedback element
  let feedbackEl = form.querySelector('#job-form-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'job-form-feedback';
    feedbackEl.className = 'mt-4 p-4 rounded-lg hidden';
    form.appendChild(feedbackEl);
  }
  
  // Hide any existing feedback
  feedbackEl.classList.add('hidden');
  
  // Prepare data for HubSpot
  const fields = [];
  
  // Map common fields
  if (formData.get('firstName')) fields.push({name: 'firstname', value: formData.get('firstName')});
  if (formData.get('lastName')) fields.push({name: 'lastname', value: formData.get('lastName')});
  if (formData.get('email')) fields.push({name: 'email', value: formData.get('email')});
  if (formData.get('phone')) fields.push({name: 'phone', value: formData.get('phone')});
  if (formData.get('linkedin')) fields.push({name: 'linkedin_url', value: formData.get('linkedin')});
  if (formData.get('message')) fields.push({name: 'why_interested', value: formData.get('message')});
  
  // Map job-specific fields
  if (jobTitle) fields.push({name: 'job_title', value: jobTitle});
  if (formData.get('job_title')) fields.push({name: 'job_title', value: formData.get('job_title')});
  if (formData.get('department')) fields.push({name: 'department', value: formData.get('department')});
  
  // Handle resume file
  const resumeFileElement = form.querySelector('#resume');
  if (!resumeFileElement || !resumeFileElement.files || resumeFileElement.files.length === 0) {
    // Show error message for missing resume
    feedbackEl.innerHTML = `
      <div class="p-4 bg-alert-red/10 border border-alert-red rounded-md text-alert-red">
        <p>Please upload your resume to complete your application.</p>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    
    // Reset submit button
    if (submitTextEl && submitLoaderEl) {
      submitTextEl.classList.remove('hidden');
      submitLoaderEl.classList.add('hidden');
    } else {
      submitButton.innerText = submitButton.value = originalText;
    }
    submitButton.disabled = false;
    return;
  }
  
  const resumeFile = resumeFileElement.files[0];
  const resumeReader = new FileReader();
  
  resumeReader.onload = function() {
    // Remove the data URI prefix (e.g., "data:application/pdf;base64,")
    const resumeBase64 = resumeReader.result.split(',')[1];
    
    // Add resume to fields
    fields.push({
      name: 'resume',
      value: {
        data: resumeBase64,
        fileName: resumeFile.name,
        contentType: resumeFile.type
      }
    });
    
    // Handle optional cover letter
    const coverLetterElement = form.querySelector('#coverLetter');
    const processCoverLetter = () => {
      if (coverLetterElement && coverLetterElement.files && coverLetterElement.files.length > 0) {
        const coverLetterFile = coverLetterElement.files[0];
        const coverLetterReader = new FileReader();
        
        coverLetterReader.onload = function() {
          const coverLetterBase64 = coverLetterReader.result.split(',')[1];
          
          // Add cover letter to fields
          fields.push({
            name: 'cover_letter',
            value: {
              data: coverLetterBase64,
              fileName: coverLetterFile.name,
              contentType: coverLetterFile.type
            }
          });
          
          // Now submit with both files
          submitJobData(fields);
        };
        
        coverLetterReader.onerror = function() {
          // Submit without cover letter if there's an error
          console.error('Error reading cover letter:', coverLetterReader.error);
          submitJobData(fields);
        };
        
        coverLetterReader.readAsDataURL(coverLetterFile);
      } else {
        // No cover letter, submit with just resume
        submitJobData(fields);
      }
    };
    
    // Function to submit job application data to HubSpot
    function submitJobData(fields) {
      // Create data object for HubSpot
      const data = {
        submittedAt: Date.now(),
        fields: fields,
        context: {
          pageUri: window.location.href,
          pageName: document.title
        }
      };
      
      // Determine which form to use
      const formType = jobTitle ? 'job_application' : 'open_application';
      const formId = HUBSPOT_FORMS[formType];
      
      // Log URL for debugging
      console.log(`Submitting job application to: https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}`);
      
      // Submit to HubSpot
      fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Error response:', text);
            throw new Error('Network response was not ok: ' + response.status);
          });
        }
        return response.json();
      })
      .then(result => {
        console.log('Success:', result);
        // Track form submission in Google Analytics if available
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({
            'event': 'formSubmission',
            'formType': formType
          });
        }
        // Redirect to thank you page
        window.location.href = '/thank-you';
      })
      .catch(error => {
        console.error('Error:', error);
        
        // Show error message
        feedbackEl.innerHTML = `
          <div class="p-4 bg-alert-red/10 border border-alert-red rounded-md text-alert-red">
            <p>There was a problem submitting your application. Please try again or contact us directly.</p>
          </div>
        `;
        feedbackEl.classList.remove('hidden');
        
        // Reset submit button
        if (submitTextEl && submitLoaderEl) {
          submitTextEl.classList.remove('hidden');
          submitLoaderEl.classList.add('hidden');
        } else {
          submitButton.innerText = submitButton.value = originalText;
        }
        submitButton.disabled = false;
      });
    }
    
    // Start process to handle cover letter
    processCoverLetter();
  };
  
  resumeReader.onerror = function() {
    console.error('Error reading resume:', resumeReader.error);
    
    // Show error message
    feedbackEl.innerHTML = `
      <div class="p-4 bg-alert-red/10 border border-alert-red rounded-md text-alert-red">
        <p>Error reading resume file. Please try again with a different file format or contact us directly.</p>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    
    // Reset submit button
    if (submitTextEl && submitLoaderEl) {
      submitTextEl.classList.remove('hidden');
      submitLoaderEl.classList.add('hidden');
    } else {
      submitButton.innerText = submitButton.value = originalText;
    }
    submitButton.disabled = false;
  };
  
  // Start reading the resume file
  resumeReader.readAsDataURL(resumeFile);
}