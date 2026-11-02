/* ==========================================================================
   SOLVYNK CORE APPLICATION SCRIPTS (app.js)
   ========================================================================== */

(function () {
  const header = document.querySelector('.site-header');
  const desktopNav = header?.querySelector('.nav-links');
  if (header && desktopNav) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-controls', 'mobile-nav');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    const mobileNav = document.createElement('nav');
    mobileNav.id = 'mobile-nav';
    mobileNav.className = 'mobile-nav';
    mobileNav.setAttribute('aria-label', 'Mobile navigation');
    mobileNav.hidden = true;
    desktopNav.querySelectorAll('a').forEach(link => mobileNav.appendChild(link.cloneNode(true)));
    const invite = header.querySelector('.header-actions a:last-of-type');
    if (invite) mobileNav.appendChild(invite.cloneNode(true));
    header.insertBefore(toggle, header.querySelector('.header-actions'));
    header.appendChild(mobileNav);

    const closeMenu = (restoreFocus = false) => {
      if (mobileNav.hidden) return;
      const focusWasInside = mobileNav.contains(document.activeElement);
      mobileNav.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
      if (restoreFocus || focusWasInside) {
        const focusTarget = window.innerWidth > 900 ? desktopNav.querySelector('a') : toggle;
        focusTarget?.focus();
      }
    };
    toggle.addEventListener('click', () => {
      const opening = mobileNav.hidden;
      mobileNav.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
      toggle.textContent = opening ? 'Close menu' : 'Menu';
      if (opening) mobileNav.querySelector('a')?.focus();
    });
    mobileNav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

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

    message.textContent = `Demo only: ${val} was not sent or stored. Beta invitations are not connected in this prototype.`;
    message.className = 'form-message success';
    email.value = '';
    return false;
  };

  // Global save interaction (Local state only)
  window.initializeSaveButtons = function () {
    document.querySelectorAll('[data-save]').forEach(button => {
      const type = button.dataset.saveLabel === 'problem' ? 'problem' : 'project';
      const saved = window.SolvynkDemoState?.isSaved(type, button.dataset.save) ?? localStorage.getItem(`solvynk-saved-${button.dataset.save}`) === 'true';
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? 'Saved locally ✓' : `Save ${button.dataset.saveLabel || 'item'}`;
      button.classList.toggle('button-secondary', saved);
    });
  };
  window.initializeSaveButtons();
  window.addEventListener('solvynk:demo-state', window.initializeSaveButtons);
  document.addEventListener('click', function (event) {
    const badgeBtn = event.target.closest('#copy-badge-btn');
    if (badgeBtn) {
      const feedback = document.querySelector('#badge-feedback');
      const markdown = `[Sample Solvynk project](${window.location.href})`;
      navigator.clipboard.writeText(markdown).then(() => {
        if (feedback) feedback.textContent = 'Sample Markdown link copied. No production badge endpoint exists.';
      }).catch(() => {
        if (feedback) feedback.textContent = 'Clipboard unavailable. Copy this page URL from the address bar.';
      });
    }
    const saveBtn = event.target.closest('[data-save]');
    if (saveBtn) {
      const slug = saveBtn.dataset.save;
      const type = saveBtn.dataset.saveLabel === 'problem' ? 'problem' : 'project';
      const key = `solvynk-saved-${slug}`;
      const isSaved = window.SolvynkDemoState?.isSaved(type, slug) ?? localStorage.getItem(key) === 'true';
      const newState = !isSaved;

      if (window.SolvynkDemoState) window.SolvynkDemoState.setSaved(type, slug, newState);
      else localStorage.setItem(key, String(newState));
      saveBtn.setAttribute('aria-pressed', String(newState));
      saveBtn.textContent = newState ? 'Saved locally ✓' : `Save ${saveBtn.dataset.saveLabel || 'item'}`;
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
      navigator.clipboard.writeText(window.location.href).then(function () {
        if (msg) {
          msg.textContent = 'Sample project page link copied to clipboard.';
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
          if (parsed.protocol !== 'https:') return;
          domainSpan.textContent = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
        } catch (e) {
          return;
        }
        if (document.querySelector('dialog[open]')) return;
        continueLink.href = url;
        modal._returnFocusTo = demoTrigger;
        modal.showModal();
        modal.querySelector('[data-close-modal]')?.focus();
      }
    }

    // Close modal trigger
    const modalClose = event.target.closest('[data-close-modal]');
    if (modalClose) {
      const modal = document.querySelector('#safety-modal');
      if (modal?.open) modal.close();
    }
  });

  const safetyModal = document.querySelector('#safety-modal');
  document.addEventListener('keydown', event => {
    if (!safetyModal || event.key !== 'Tab' || !safetyModal.open) return;
    const controls = [...safetyModal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(control => control.getClientRects().length > 0 && !control.closest('[inert]'));
    if (!controls.length) {
      event.preventDefault();
      safetyModal.focus();
      return;
    }
    const currentIndex = controls.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = currentIndex < 0
      ? (event.shiftKey ? controls.length - 1 : 0)
      : (currentIndex + direction + controls.length) % controls.length;
    event.preventDefault();
    controls[nextIndex].focus();
  }, true);
  safetyModal?.addEventListener('close', () => {
    const trigger = safetyModal._returnFocusTo;
    safetyModal._returnFocusTo = null;
    if (document.querySelector('dialog[open]')) return;
    const visibleAndEnabled = element => element?.isConnected && element.getClientRects().length > 0 && !element.matches(':disabled, [aria-disabled="true"]');
    const focusTarget = visibleAndEnabled(trigger) ? trigger : header?.querySelector('a[href]');
    focusTarget?.focus();
  });
  safetyModal?.addEventListener('click', event => {
    if (event.target === safetyModal) safetyModal.close();
  });
  safetyModal?.querySelector('#modal-continue-btn')?.addEventListener('click', () => safetyModal.close());
})();
