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

    message.textContent = `Beta invitation requested for ${val}. Invite window opens every Tuesday (Simulated locally).`;
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

      localStorage.setItem(key, String(newState));
      saveBtn.setAttribute('aria-pressed', String(newState));
      saveBtn.innerHTML = newState ? 'Saved locally ✓' : 'Save project';
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
  safetyModal?.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !safetyModal.open) return;
    const controls = [...safetyModal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(control => control.getClientRects().length > 0 && !control.closest('[inert]'));
    if (!controls.length) {
      event.preventDefault();
      safetyModal.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === safetyModal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === safetyModal)) {
      event.preventDefault();
      first.focus();
    }
  });
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
