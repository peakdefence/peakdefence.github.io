// consent.js - Custom Consent Management for Google Consent Mode
// Stores consent in localStorage and controls Google tags

const CONSENT_CATEGORIES = ['necessary', 'analytics', 'ads'];
const CONSENT_STORAGE_KEY = 'cookie_consent_v1';

function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function setConsent(consent) {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  if (window.logConsentToServer) {
    window.logConsentToServer(consent);
  } else if (window.__logConsentToServer) {
    window.__logConsentToServer(consent);
  }
}

function hasConsent() {
  const consent = getConsent();
  return CONSENT_CATEGORIES.every(cat => typeof consent[cat] !== 'undefined');
}

function applyConsentToGoogle(consent) {
  if (window.gtag) {
    window.gtag('consent', 'update', {
      'ad_storage': consent.ads ? 'granted' : 'denied',
      'analytics_storage': consent.analytics ? 'granted' : 'denied',
      'ad_user_data': consent.ads ? 'granted' : 'denied',
      'ad_personalization': consent.ads ? 'granted' : 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted',
    });
  }
}

function showConsentBanner() {
  if (document.getElementById('cookie-consent-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div style="position:fixed;bottom:0;left:0;width:100%;background:#222;color:#fff;z-index:9999;padding:1.5rem 1rem;box-shadow:0 -2px 8px rgba(0,0,0,0.2);display:flex;flex-direction:column;align-items:center;gap:1rem;">
      <div style="max-width:800px;text-align:center;">
        <strong>We use cookies</strong> to enhance your experience, analyze site usage, and deliver personalized ads. <a href="/privacy-policy" style="color:#80bfff;text-decoration:underline;">Learn more</a>.
      </div>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">
        <button id="consent-accept-all" style="background:#3498db;color:#fff;padding:0.5rem 1.5rem;border:none;border-radius:4px;cursor:pointer;">Accept All</button>
        <button id="consent-reject-nonessential" style="background:#555;color:#fff;padding:0.5rem 1.5rem;border:none;border-radius:4px;cursor:pointer;">Reject Non-Essential</button>
        <button id="consent-customize" style="background:#fff;color:#222;padding:0.5rem 1.5rem;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Customize</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('consent-accept-all').onclick = () => {
    const consent = { necessary: true, analytics: true, ads: true };
    setConsent(consent); applyConsentToGoogle(consent); removeConsentBanner();
  };
  document.getElementById('consent-reject-nonessential').onclick = () => {
    const consent = { necessary: true, analytics: false, ads: false };
    setConsent(consent); applyConsentToGoogle(consent); removeConsentBanner();
  };
  document.getElementById('consent-customize').onclick = showCustomizeModal;
}

function showCustomizeModal() {
  if (document.getElementById('cookie-consent-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'cookie-consent-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;color:#222;padding:2rem 2rem 1.5rem 2rem;border-radius:8px;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.18);">
        <h3 style="margin-top:0;">Cookie Preferences</h3>
        <form id="consent-custom-form">
          <label style="display:block;margin-bottom:0.5rem;">
            <input type="checkbox" checked disabled> Strictly Necessary (always on)
          </label>
          <label style="display:block;margin-bottom:0.5rem;">
            <input type="checkbox" id="consent-analytics"> Analytics Cookies
          </label>
          <label style="display:block;margin-bottom:1rem;">
            <input type="checkbox" id="consent-ads"> Marketing/Ads Cookies
          </label>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button type="button" id="consent-save" style="background:#3498db;color:#fff;padding:0.4rem 1.2rem;border:none;border-radius:4px;cursor:pointer;">Save</button>
            <button type="button" id="consent-cancel" style="background:#eee;color:#222;padding:0.4rem 1.2rem;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('consent-cancel').onclick = removeCustomizeModal;
  document.getElementById('consent-save').onclick = () => {
    const consent = {
      necessary: true,
      analytics: document.getElementById('consent-analytics').checked,
      ads: document.getElementById('consent-ads').checked
    };
    setConsent(consent); applyConsentToGoogle(consent); removeCustomizeModal(); removeConsentBanner();
  };
};

function removeConsentBanner() {
  const el = document.getElementById('cookie-consent-banner');
  if (el) el.remove();
}
function removeCustomizeModal() {
  const el = document.getElementById('cookie-consent-modal');
  if (el) el.remove();
}

// Provide a button for users to change consent later
document.addEventListener('DOMContentLoaded', () => {
  // Show consent banner if not set
  if (!hasConsent()) {
    showConsentBanner();
  } else {
    applyConsentToGoogle(getConsent());
  }
  // Add manage consent button to footer
  if (!document.getElementById('manage-consent-btn')) {
    const btn = document.createElement('button');
    btn.id = 'manage-consent-btn';
    btn.textContent = 'Cookie Preferences';
    btn.style = 'position:fixed;right:16px;bottom:16px;background:#fff;color:#222;border:1px solid #ccc;padding:0.5rem 1.2rem;border-radius:4px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.13);cursor:pointer;font-size:1rem;';
    btn.onclick = showCustomizeModal;
    document.body.appendChild(btn);
  }
});

// Expose for debugging
window.__cookieConsent = { getConsent, setConsent, showConsentBanner, showCustomizeModal };
