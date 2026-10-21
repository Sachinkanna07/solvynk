/* ==========================================================================
   SOLVYNK CORE APPLICATION SCRIPTS (app.js)
   ========================================================================== */

(function () {
  const catalog = window.SolvynkFixtureCatalog || {};
  window.SolvynkFixtures = {
    problems: catalog.problems || [],
    projects: catalog.projects || [],
    solutionLinks: catalog.solutionLinks || []
  };

  // Waitlist simulation
  window.joinWaitlist = function (event) {
    if (event) event.preventDefault();
    const email = document.querySelector('#email');
    const message = document.querySelector('#form-message');
    if (!email || !message) return false;

    const val = email.value.trim();
    if (!val || !val.includes('@')) {
      message.textContent = 'Please enter a valid developer email.';
      message.className = 'form-message error';
      return false;
    }

    message.textContent = `Thanks — ${val} is recorded locally for this prototype. No email was sent.`;
    message.className = 'form-message success';
    email.value = '';
    return false;
  };

  // Global save interaction (Local state only)
  document.addEventListener('click', function (event) {
    const saveBtn = event.target.closest('[data-save]');
    if (saveBtn) {
      const slug = saveBtn.dataset.save;
      const key = `solvynk-saved-${slug}`;
      const isSaved = localStorage.getItem(key) === 'true';
      const newState = !isSaved;

      try {
        localStorage.setItem(key, String(newState));
      } catch (error) {
        saveBtn.setAttribute('aria-pressed', 'false');
        saveBtn.textContent = 'Save unavailable';
        return;
      }
      saveBtn.setAttribute('aria-pressed', String(newState));
      saveBtn.textContent = newState ? 'Saved locally ✓' : 'Save project';
      if (newState) {
        saveBtn.classList.add('button-secondary');
      } else {
        saveBtn.classList.remove('button-secondary');
      }
    }

    // Share button copy link interaction
    const shareBtn = event.target.closest('#share-btn');
    if (shareBtn) {
      const msg = document.querySelector('#share-message');
      const copy = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(window.location.href)
        : Promise.reject(new Error('Clipboard unavailable'));
      copy.then(function () {
        if (msg) {
          msg.textContent = 'Project page link copied to clipboard (1200x630 OG preview ready).';
          msg.className = 'form-message success';
        }
      }).catch(function () {
        if (msg) {
          msg.textContent = 'Copy unavailable; share using URL in address bar.';
          msg.className = 'form-message';
        }
      });
    }

    // Outbound link modal trigger
    const demoTrigger = event.target.closest('[data-outbound-url]');
    if (demoTrigger) {
      event.preventDefault();
      const url = demoTrigger.dataset.outboundUrl;
      const modal = document.querySelector('#safety-modal');
      const domainSpan = document.querySelector('#modal-domain');
      const continueLink = document.querySelector('#modal-continue-btn');

      if (modal && domainSpan && continueLink) {
        try {
          const parsed = new URL(url);
          domainSpan.textContent = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
        } catch (e) {
          domainSpan.textContent = url;
        }
        continueLink.href = url;
        modal.classList.add('open');
      }
    }

    // Close modal trigger
    const modalClose = event.target.closest('[data-close-modal]');
    if (modalClose) {
      const modal = document.querySelector('#safety-modal');
      if (modal) modal.classList.remove('open');
    }
  });

  // Close modal on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.querySelector('#safety-modal');
      if (modal && modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
    }
  });
})();
