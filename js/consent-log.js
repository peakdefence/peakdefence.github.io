// consent-log.js
// Sends consent log to backend endpoint (optional, for audit)

function logConsentToServer(consent) {
  fetch('/api/consent-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }).catch(() => {});
}

window.__logConsentToServer = logConsentToServer;
