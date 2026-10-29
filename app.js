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

  // Legacy form compatibility: this static prototype never collects signups.
  window.joinWaitlist = function (event) {
    if (event) event.preventDefault();
    const email = document.querySelector('#email');
    const message = document.querySelector('#form-message');
    if (!email || !message) return false;

    message.textContent = 'Prototype only. No signup was saved, sent, or added to a waitlist.';
    message.className = 'form-message success';
    email.value = '';
    return false;
  };

  // Give visitors a truthful, consistent explanation of the local demo.
  const header = document.querySelector('.site-header');
  if (header) {
    const ribbon = document.createElement('div');
    ribbon.className = 'prototype-ribbon';
    ribbon.setAttribute('role', 'note');
    const label = document.createElement('strong');
    label.textContent = 'INTERACTIVE PROTOTYPE';
    const detail = document.createElement('span');
    detail.textContent = 'Sample content and local-only interactions. No live accounts, invitations, or verified submissions.';
    ribbon.append(label, detail);
    header.insertAdjacentElement('afterend', ribbon);
  }

  function savedState(key) {
    try {
      return localStorage.getItem(key) === 'true';
    } catch (_) {
      return false;
    }
  }

  function renderSavedButton(button, saved) {
    button.setAttribute('aria-pressed', String(saved));
    if (!button.dataset.unsavedLabel) button.dataset.unsavedLabel = button.textContent.trim();
    button.textContent = saved ? 'Saved locally ✓' : button.dataset.unsavedLabel;
    button.classList.toggle('button-secondary', saved);
  }

  function syncSavedButtons() {
    document.querySelectorAll('[data-save]').forEach(function (button) {
      renderSavedButton(button, savedState('solvynk-saved-' + button.dataset.save));
    });
  }
  syncSavedButtons();
  // Detail views render their fixture-driven buttons after this shared script.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncSavedButtons, { once: true });
  }

  let modalInvoker = null;
  function closeSafetyModal() {
    const modal = document.querySelector('#safety-modal');
    if (modal) modal.classList.remove('open');
    if (modalInvoker && modalInvoker.isConnected) modalInvoker.focus();
    modalInvoker = null;
  }

  // Global save interaction (Local state only)
  document.addEventListener('click', function (event) {
    const saveBtn = event.target.closest('[data-save]');
    if (saveBtn) {
      const slug = saveBtn.dataset.save;
      const key = `solvynk-saved-${slug}`;
      const isSaved = savedState(key);
      const newState = !isSaved;

      try {
        localStorage.setItem(key, String(newState));
      } catch (error) {
        saveBtn.setAttribute('aria-pressed', 'false');
        saveBtn.textContent = 'Save unavailable';
        return;
      }
      renderSavedButton(saveBtn, newState);
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
          msg.textContent = 'Project preview link copied. A social share image is not generated in this prototype.';
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
        let parsed;
        try {
          parsed = new URL(url);
          if (parsed.protocol !== 'https:') throw new Error('Unsupported outbound protocol');
        } catch (_) {
          domainSpan.textContent = 'Unsupported or invalid external URL';
          continueLink.removeAttribute('href');
          continueLink.setAttribute('aria-disabled', 'true');
          modalInvoker = demoTrigger;
          modal.classList.add('open');
          modal.querySelector('[data-close-modal]')?.focus();
          return;
        }
        domainSpan.textContent = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
        continueLink.href = parsed.href;
        continueLink.removeAttribute('aria-disabled');
        modalInvoker = demoTrigger;
        modal.classList.add('open');
        modal.querySelector('[data-close-modal]')?.focus();
      }
    }

    // Close modal trigger
    const modalClose = event.target.closest('[data-close-modal]');
    if (modalClose || event.target.id === 'safety-modal') {
      closeSafetyModal();
    }

    const mobileLink = event.target.closest('.mobile-nav-panel a');
    if (mobileLink) mobileLink.closest('details')?.removeAttribute('open');
  });

  // Close modal on Escape
  document.addEventListener('keydown', function (e) {
    const modal = document.querySelector('#safety-modal');
    if (!modal || !modal.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSafetyModal();
    } else if (e.key === 'Tab') {
      const controls = Array.from(modal.querySelectorAll('[data-close-modal], #modal-continue-btn[href]'));
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
