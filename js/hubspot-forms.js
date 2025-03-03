// HubSpot Form Handlers
const HUBSPOT_PORTAL_ID = '144004543';
const HUBSPOT_FORMS = {
  contact: '38a469e8-0b58-4f1c-a366-73c025967494',
  job_application: 'job-application-form',
  partnership: 'partnership-form',
  open_application: 'open-application-form'
};

// Regular form submission handler (contact, partnership)
function submitToHubSpot(event, formType) {
  event.preventDefault();
  
  // Get form data
  const form = event.target;
  const formData = new FormData(form);
  
  // Show loading state
  const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
  const originalText = submitButton.value || submitButton.innerText;
  submitButton.disabled = true;
  submitButton.value = submitButton.innerText = 'Submitting...';
  
  // Create feedback element if it doesn't exist
  let feedbackEl = form.querySelector('.form-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.className = 'form-feedback mt-4 p-4 rounded';
    form.appendChild(feedbackEl);
  }
  
  // Prepare data for HubSpot
  const fields = [];
  
  // Common fields
  if (formData.get('firstName')) fields.push({name: 'firstname', value: formData.get('firstName')});
  if (formData.get('lastName')) fields.push({name: 'lastname', value: formData.get('lastName')});
  if (formData.get('email')) fields.push({name: 'email', value: formData.get('email')});
  if (formData.get('phone')) fields.push({name: 'phone', value: formData.get('phone')});
  if (formData.get('company')) fields.push({name: 'company', value: formData.get('company')});
  if (formData.get('message')) fields.push({name: 'message', value: formData.get('message')});
  
  // Form-specific fields
  if (formType === 'contact' && formData.get('inquiry_type')) {
    fields.push({name: 'inquiry_type', value: formData.get('inquiry_type')});
  } else if (formType === 'partnership' && formData.get('partnership_type')) {
    fields.push({name: 'partnership_type', value: formData.get('partnership_type')});
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
  
  // Determine which HubSpot form to submit to
  const formId = HUBSPOT_FORMS[formType] || HUBSPOT_FORMS.contact;
  
  // Submit to HubSpot
  fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}?region=eu1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(result => {
    // Redirect to thank you page
    window.location.href = '/thank-you';
  })
  .catch(error => {
    console.error('Error:', error);
    
    // Show error message
    feedbackEl.innerHTML = 'There was a problem submitting your form. Please try again.';
    feedbackEl.classList.add('bg-alert-red/10', 'text-alert-red', 'border', 'border-alert-red');
    
    // Reset submit button
    submitButton.disabled = false;
    submitButton.value = submitButton.innerText = originalText;
  });
}

// Job application form handler (with file uploads)
function submitJobApplication(event, jobTitle) {
  event.preventDefault();
  
  // Get form data
  const form = event.target;
  const formData = new FormData(form);
  
  // Show loading state
  const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
  const originalText = submitButton.value || submitButton.innerText;
  submitButton.disabled = true;
  submitButton.value = submitButton.innerText = 'Submitting...';
  
  // Create feedback element if it doesn't exist
  let feedbackEl = form.querySelector('.form-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.className = 'form-feedback mt-4 p-4 rounded';
    form.appendChild(feedbackEl);
  }
  
  // Prepare fields array
  const fields = [];
  
  // Add common fields
  if (formData.get('firstName')) fields.push({name: 'firstname', value: formData.get('firstName')});
  if (formData.get('lastName')) fields.push({name: 'lastname', value: formData.get('lastName')});
  if (formData.get('email')) fields.push({name: 'email', value: formData.get('email')});
  if (formData.get('phone')) fields.push({name: 'phone', value: formData.get('phone')});
  if (formData.get('linkedin')) fields.push({name: 'linkedin', value: formData.get('linkedin')});
  if (formData.get('message')) fields.push({name: 'why_interested', value: formData.get('message')});
  
  // Add job-specific fields
  if (jobTitle) fields.push({name: 'job_title', value: jobTitle});
  if (formData.get('department')) fields.push({name: 'department', value: formData.get('department')});
  
  // Handle resume file
  const resumeFile = form.querySelector('#resume').files[0];
  if (!resumeFile) {
    // Show error if resume is required
    feedbackEl.innerHTML = 'Please upload your resume.';
    feedbackEl.classList.add('bg-alert-red/10', 'text-alert-red', 'border', 'border-alert-red');
    
    // Reset submit button
    submitButton.disabled = false;
    submitButton.value = submitButton.innerText = originalText;
    return;
  }
  
  // Convert resume to Base64
  const resumeReader = new FileReader();
  resumeReader.readAsDataURL(resumeFile);
  resumeReader.onload = function() {
    // Remove the data URI prefix (e.g., "data:application/pdf;base64,")
    const resumeBase64 = resumeReader.result.split(',')[1];
    
    // Handle optional cover letter file
    const coverLetterFile = form.querySelector('#coverLetter').files[0];
    
    // Function to proceed with form submission
    const proceedWithSubmission = (coverLetterBase64 = null) => {
      // Add resume to fields
      fields.push({
        name: 'resume',
        value: {
          data: resumeBase64,
          fileName: resumeFile.name,
          contentType: resumeFile.type
        }
      });
      
      // Add cover letter to fields if provided
      if (coverLetterBase64) {
        fields.push({
          name: 'cover_letter',
          value: {
            data: coverLetterBase64,
            fileName: coverLetterFile.name,
            contentType: coverLetterFile.type
          }
        });
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
      
      // Determine which form to use
      const formType = jobTitle ? 'job_application' : 'open_application';
      const formId = HUBSPOT_FORMS[formType];
      
      // Submit to HubSpot
      fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}?region=eu1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        // Redirect to thank you page
        window.location.href = '/thank-you';
      })
      .catch(error => {
        console.error('Error:', error);
        
        // Show error message
        feedbackEl.innerHTML = 'There was a problem submitting your application. Please try again.';
        feedbackEl.classList.add('bg-alert-red/10', 'text-alert-red', 'border', 'border-alert-red');
        
        // Reset submit button
        submitButton.disabled = false;
        submitButton.value = submitButton.innerText = originalText;
      });
    };
    
    // If cover letter is provided, process it before submission
    if (coverLetterFile) {
      const coverLetterReader = new FileReader();
      coverLetterReader.readAsDataURL(coverLetterFile);
      coverLetterReader.onload = function() {
        const coverLetterBase64 = coverLetterReader.result.split(',')[1];
        proceedWithSubmission(coverLetterBase64);
      };
      coverLetterReader.onerror = function() {
        // Proceed without cover letter if there's an error
        proceedWithSubmission();
      };
    } else {
      // Proceed without cover letter
      proceedWithSubmission();
    }
  };
  
  resumeReader.onerror = function() {
    feedbackEl.innerHTML = 'Error reading resume file. Please try again with a different file.';
    feedbackEl.classList.add('bg-alert-red/10', 'text-alert-red', 'border', 'border-alert-red');
    
    // Reset submit button
    submitButton.disabled = false;
    submitButton.value = submitButton.innerText = originalText;
  };
}