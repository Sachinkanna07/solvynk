/* ==========================================================================
   SOLVYNK PROTOTYPE LOGIC (prototype.js)
   ========================================================================== */

(function () {
  // Tab Switching
  const tabs = [...document.querySelectorAll('.prototype-tab')];
  const panels = [...document.querySelectorAll('.prototype-panel')];

  function activateTab(tab, moveFocus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.id !== tab.getAttribute('aria-controls');
    });
    if (moveFocus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      const nextIndex = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      }[event.key];
      if (nextIndex === undefined) return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });

  // Check URL hash on load
  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'owner') document.querySelector('#owner-tab')?.click();
    if (hash === 'linker' || hash === 'link-flow') document.querySelector('#linker-tab')?.click();
    if (hash === 'admin') document.querySelector('#admin-tab')?.click();
  }

  // 4-Step Project Wizard Controller
  window.currentWizardStep = 1;
  window.nextWizardStep = function (step) {
    // Hide all steps
    [1, 2, 3, 4].forEach(s => {
      const el = document.querySelector(`#builder-step-${s}`);
      const ind = document.querySelector(`#step-ind-${s}`);
      if (el) el.hidden = s !== step;
      if (ind) {
        if (s === step) ind.classList.add('active');
        else if (s < step) ind.classList.add('completed');
        else ind.classList.remove('active', 'completed');
      }
    });
    window.currentWizardStep = step;

    // Run secret scan if moving to Step 4
    if (step === 4) {
      runSecretScan();
    }
  };

  window.selectSource = function (type) {
    const ghCard = document.querySelector('#source-opt-gh');
    const manualCard = document.querySelector('#source-opt-manual');
    const repoField = document.querySelector('#gh-repo-field');

    if (type === 'gh') {
      ghCard?.classList.add('selected');
      manualCard?.classList.remove('selected');
      ghCard?.setAttribute('aria-pressed', 'true');
      manualCard?.setAttribute('aria-pressed', 'false');
      if (repoField) repoField.hidden = false;
    } else {
      manualCard?.classList.add('selected');
      ghCard?.classList.remove('selected');
      manualCard?.setAttribute('aria-pressed', 'true');
      ghCard?.setAttribute('aria-pressed', 'false');
      if (repoField) repoField.hidden = true;
    }
  };

  // Secret Scanner Simulation (Invariant SI-17)
  const SECRET_PATTERNS = [
    { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Generic API Key (sk-...)', regex: /sk-[A-Za-z0-9]{32,}/ }
  ];

  function runSecretScan() {
    const works = document.querySelector('#project-works')?.value || '';
    const limits = document.querySelector('#project-limitations')?.value || '';
    const title = document.querySelector('#project-title')?.value || '';
    const fullText = `${title} ${works} ${limits}`;

    const alertBox = document.querySelector('#secret-scan-alert');
    const alertText = document.querySelector('#secret-scan-text');
    const publishBtn = document.querySelector('#publish-final-btn');

    let detected = null;
    for (const pat of SECRET_PATTERNS) {
      if (pat.regex.test(fullText)) {
        detected = pat.name;
        break;
      }
    }

    if (detected) {
      if (alertBox && alertText) {
        alertText.textContent = `A sensitive credential matching pattern [${detected}] was detected. Publication is blocked until removed.`;
        alertBox.classList.add('visible');
      }
      if (publishBtn) {
        publishBtn.disabled = true;
        publishBtn.style.opacity = '0.5';
      }
    } else {
      if (alertBox) alertBox.classList.remove('visible');
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.style.opacity = '1';
      }
    }
  }

  window.injectSecret = function (token) {
    const works = document.querySelector('#project-works');
    if (works) {
      works.value += `\nTesting token: ${token}`;
      window.nextWizardStep(4);
    }
  };

  window.clearSecret = function () {
    const works = document.querySelector('#project-works');
    if (works) {
      works.value = `Transcribes conversational Tamil at 85ms median latency on ARM64.\nGenerates clean UTF-8 Tamil unicode strings.\nRuns 100% offline with zero cloud telemetry.`;
      runSecretScan();
    }
  };

  // Project Form Submit
  document.querySelector('#project-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    localStorage.setItem('solvynk_project_draft', new Date().toISOString());
    const fb = document.querySelector('#project-feedback');
    if (fb) {
      fb.innerHTML = '<span>● Project draft saved locally in browser storage.</span>';
      fb.style.borderColor = 'var(--status-success)';
    }
  });

  document.querySelector('#publish-final-btn')?.addEventListener('click', function () {
    const fb = document.querySelector('#project-feedback');
    if (fb) {
      fb.innerHTML = '<span style="color:var(--status-success);">● Submitted to beta review queue. Pre-moderation active.</span>';
      fb.style.borderColor = 'var(--status-success)';
    }
  });

  // Dynamic Requirements for Problem Creator
  let reqCount = 3;
  document.querySelector('#add-req-btn')?.addEventListener('click', function () {
    if (reqCount >= 8) {
      alert('Maximum of 8 numbered requirements allowed per problem in V1.');
      return;
    }
    reqCount++;
    const list = document.querySelector('#requirements-list');
    const row = document.createElement('div');
    row.className = 'req-input-row';
    row.innerHTML = `
      <span class="mono" style="color:var(--accent-primary); font-weight:700;">R${reqCount}:</span>
      <input required aria-label="Requirement R${reqCount}" placeholder="Describe requirement ${reqCount}..." />
      <button class="icon-button" type="button" aria-label="Remove requirement">✕</button>
    `;
    row.querySelector('button').addEventListener('click', () => {
      row.remove();
      reqCount--;
    });
    list.appendChild(row);
  });

  // Problem Form Submit
  document.querySelector('#problem-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    localStorage.setItem('solvynk_problem_draft', new Date().toISOString());
    const fb = document.querySelector('#problem-feedback');
    if (fb) {
      fb.innerHTML = '<span style="color:var(--status-success);">● Problem challenge draft saved with numbered requirements.</span>';
      fb.style.borderColor = 'var(--status-success)';
    }
  });

  // Linker Form Submit
  document.querySelector('#linker-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const fb = document.querySelector('#linker-feedback');
    if (fb) {
      fb.innerHTML = '<span style="color:var(--status-success);">● Solution linked! Claimed coverage recorded for owner review.</span>';
      fb.style.borderColor = 'var(--status-success)';
    }
  });

  // Owner Review Desk Submit
  document.querySelector('#save-review-btn')?.addEventListener('click', function () {
    const fb = document.querySelector('#review-feedback');
    if (fb) {
      fb.innerHTML = '<span style="color:var(--status-success);">● Owner evaluation published: Requirements R1 & R2 confirmed. Featured badge active.</span>';
      fb.style.borderColor = 'var(--status-success)';
    }
  });

  // Admin Emergency Switches
  window.toggleSwitch = function (name, val) {
    const fb = document.querySelector('#admin-feedback');
    if (fb) {
      fb.innerHTML = `<span style="color:var(--status-warning);">● Emergency switch [${name}] set to [${val ? 'ENABLED' : 'DISABLED'}]. Core service enforcement updated.</span>`;
    }
  };
})();
