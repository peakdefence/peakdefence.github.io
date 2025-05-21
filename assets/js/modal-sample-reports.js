// Modular modal logic for sample reports (SOC2, ISO 27001)
// Uses iframes to load report HTML files safely

function openReportModal(type) {
  // Modal IDs and report URLs
  const config = {
    soc2: {
      title: 'SOC 2 Gap Analysis Sample Report',
      url: '/reports/soc2-gap-audit-sample.html',
    },
    iso27001: {
      title: 'ISO 27001 Gap Analysis Sample Report',
      url: '/reports/iso27001-gap-audit-sample.html',
    },
  };

  if (!config[type]) {
    alert('Invalid report type.');
    return;
  }

  // Remove existing modal if present
  const existing = document.getElementById('sample-report-modal');
  if (existing) existing.remove();

  // Modal overlay
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4';
  modal.id = 'sample-report-modal';

  // Modal content wrapper with iframe
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full h-[80vh] flex flex-col relative">
      <div class="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 class="text-lg font-bold text-intelligence-blue">${config[type].title}</h3>
        <button id="close-modal" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-grow overflow-hidden">
        <iframe 
          id="report-iframe" 
          src="${config[type].url}" 
          class="w-full h-full border-none"
          title="${config[type].title}"
        ></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal logic
  document.getElementById('close-modal').onclick = () => modal.remove();
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });
}

// Expose globally for inline button usage
document.addEventListener('DOMContentLoaded', function() {
  window.openReportModal = openReportModal;
  // Attach modal openers if present
  var soc2Btn = document.getElementById('view-soc2-sample');
  if (soc2Btn) soc2Btn.onclick = function() { openReportModal('soc2'); };
  var isoBtn = document.getElementById('view-iso27001-sample');
  if (isoBtn) isoBtn.onclick = function() { openReportModal('iso27001'); };
});
