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
  const projectForm = document.querySelector('#project-form');
  const projectFields = ['project-title', 'project-valueline', 'project-stage', 'project-category', 'project-stack', 'project-works', 'project-limitations', 'project-demo', 'cover-alt'];
  const draftKey = 'solvynk-project-draft-v1';
  const projectFeedback = document.querySelector('#project-feedback');
  const errorBox = document.querySelector('#project-errors');

  function projectValues() {
    return Object.fromEntries(projectFields.map(id => [id, document.getElementById(id)?.value ?? '']));
  }

  function projectError(message, field) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
    return false;
  }

  function validateProjectStep(step) {
    if (errorBox) errorBox.hidden = true;
    const required = step === 2 ? ['project-title', 'project-valueline', 'project-works', 'project-limitations'] : step === 3 ? ['cover-alt'] : [];
    for (const id of required) {
      const field = document.getElementById(id);
      field?.removeAttribute('aria-invalid');
      if (!field?.value.trim()) return projectError(`${field?.labels?.[0]?.textContent || 'This field'} is required.`, field);
    }
    if (step === 2) {
      const demo = document.querySelector('#project-demo');
      demo?.removeAttribute('aria-invalid');
      if (demo?.value.trim()) {
        try {
          if (new URL(demo.value).protocol !== 'https:') throw new Error('HTTPS required');
        } catch {
          return projectError('Demo URL must be a valid HTTPS URL.', demo);
        }
      }
    }
    return true;
  }

  window.currentWizardStep = 1;
  window.nextWizardStep = function (step) {
    if (![1, 2, 3, 4].includes(step)) return;
    if (step > window.currentWizardStep) {
      for (let current = window.currentWizardStep; current < step; current++) {
        if (!validateProjectStep(current)) return;
      }
    }
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
    { name: 'fictional demo token', regex: /DEMO_(?:TOKEN|AWS_KEY)_PLACEHOLDER/ },
    { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Generic API Key (sk-...)', regex: /sk-[A-Za-z0-9]{32,}/ }
  ];

  function runSecretScan() {
    const fullText = Object.values(projectValues()).join(' ');

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
        alertText.textContent = `${detected} pattern detected in this local demonstration. Simulated submission is unavailable until removed; do not enter real secrets.`;
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
    return Boolean(detected);
  }

  window.injectSecret = function (token) {
    const works = document.querySelector('#project-works');
    if (works) {
      works.value += `\nTesting token: ${token}`;
      window.nextWizardStep(4);
      runSecretScan();
    }
  };

  window.clearSecret = function () {
    const works = document.querySelector('#project-works');
    if (works) {
      works.value = works.value.replace(/\nTesting token: DEMO_(?:TOKEN|AWS_KEY)_PLACEHOLDER/g, '');
      runSecretScan();
    }
  };

  // Ephemeral local image previews; no upload or draft persistence.
  const imageInput = document.querySelector('#project-image-files');
  const imagePreviewList = document.querySelector('#project-image-previews');
  const previewUrls = new Set();
  document.querySelector('#select-project-images')?.addEventListener('click', () => imageInput?.click());
  imageInput?.addEventListener('change', async () => {
    for (const file of imageInput.files || []) {
      if (previewUrls.size >= 6) {
        if (projectFeedback) projectFeedback.textContent = 'Maximum six local image previews.';
        break;
      }
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const png = file.type === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
      const jpeg = file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
      if ((!png && !jpeg && !webp) || file.size > 8 * 1024 * 1024) {
        if (projectFeedback) projectFeedback.textContent = 'Choose a valid JPEG, PNG or WebP file under 8 MB.';
        continue;
      }
      const url = URL.createObjectURL(file);
      previewUrls.add(url);
      const card = document.createElement('div');
      card.className = 'local-image-preview';
      const image = document.createElement('img');
      image.src = url;
      image.alt = `Local preview: ${file.name}`;
      const name = document.createElement('span');
      name.textContent = file.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-small button-outline';
      remove.textContent = 'Remove preview';
      remove.setAttribute('aria-label', `Remove preview ${file.name}`);
      remove.addEventListener('click', () => {
        card.remove();
        URL.revokeObjectURL(url);
        previewUrls.delete(url);
        document.querySelector('#select-project-images')?.focus();
      });
      card.append(image, name, remove);
      imagePreviewList.appendChild(card);
    }
    imageInput.value = '';
  });

  // Project Form Submit
  function saveProjectDraft() {
    if (runSecretScan()) return projectError('Remove the demo secret marker before saving this local draft.', document.querySelector('#project-works'));
    localStorage.setItem(draftKey, JSON.stringify({ version: 1, source: document.querySelector('#source-opt-manual')?.getAttribute('aria-pressed') === 'true' ? 'manual' : 'gh', repository: document.querySelector('#gh-repo-select')?.value || '', values: projectValues() }));
    if (projectFeedback) {
      projectFeedback.textContent = 'Project draft saved locally on this device. No public submission occurred.';
      projectFeedback.style.borderColor = 'var(--status-success)';
    }
    return true;
  }

  projectForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    for (const step of [2, 3]) {
      if (!validateProjectStep(step)) {
        window.nextWizardStep(step);
        document.querySelector('#project-form [aria-invalid="true"]')?.focus();
        return;
      }
    }
    saveProjectDraft();
  });

  document.querySelector('#publish-final-btn')?.addEventListener('click', function () {
    for (const step of [2, 3]) {
      if (!validateProjectStep(step)) {
        window.nextWizardStep(step);
        document.querySelector('#project-form [aria-invalid="true"]')?.focus();
        return;
      }
    }
    if (runSecretScan()) return projectError('Remove the demo secret marker before simulated submission.', document.querySelector('#project-works'));
    const confirm = document.querySelector('#publish-confirm');
    if (!confirm?.checked) return projectError('Confirm that this demonstration contains no confidential information.', confirm);
    if (projectFeedback) {
      projectFeedback.textContent = 'Simulated beta review only. Nothing was published or sent to a server.';
      projectFeedback.style.borderColor = 'var(--status-success)';
    }
  });

  projectForm?.addEventListener('input', event => {
    event.target?.removeAttribute('aria-invalid');
    if (errorBox) errorBox.hidden = true;
    runSecretScan();
  });

  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (saved?.version === 1 && ['gh', 'manual'].includes(saved.source) && saved.values && typeof saved.values === 'object') {
      for (const id of projectFields) {
        const value = saved.values[id];
        if (typeof value === 'string' && value.length <= 5000) {
          const field = document.getElementById(id);
          if (field) field.value = value;
        }
      }
      window.selectSource(saved.source);
      const repository = document.querySelector('#gh-repo-select');
      if (repository && typeof saved.repository === 'string') repository.value = saved.repository;
      if (projectFeedback) projectFeedback.textContent = 'Project draft restored from this device. No cloud draft exists.';
    }
  } catch {
    localStorage.removeItem(draftKey);
  }
  document.querySelector('#reset-project-draft')?.addEventListener('click', () => {
    localStorage.removeItem(draftKey);
    projectForm?.reset();
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls.clear();
    imagePreviewList?.replaceChildren();
    window.selectSource('gh');
    window.nextWizardStep(1);
    runSecretScan();
    if (projectFeedback) projectFeedback.textContent = 'Local project draft cleared; sample form values restored.';
  });
  runSecretScan();

  // Dynamic Requirements for Problem Creator
  const requirementsList = document.querySelector('#requirements-list');
  let nextRequirementId = 1;
  const problemDraftKey = 'solvynk-problem-draft-v1';
  const problemFieldIds = ['prob-title', 'prob-summary', 'prob-context', 'prob-category', 'prob-window', 'prob-constraints', 'prob-success'];
  const problemFeedback = document.querySelector('#problem-feedback');

  function renumberRequirements() {
    requirementsList?.querySelectorAll('.req-input-row').forEach((row, index) => {
      row.querySelector('.mono').textContent = `R${index + 1}:`;
      row.querySelector('input').setAttribute('aria-label', `Requirement R${index + 1}`);
    });
  }

  function addRequirement(value = '', stableId = null) {
    if (!requirementsList || requirementsList.children.length >= 8) {
      if (problemFeedback) problemFeedback.textContent = 'Maximum eight numbered requirements in this prototype.';
      return;
    }
    const row = document.createElement('div');
    row.className = 'req-input-row';
    row.dataset.rowId = String(stableId ?? nextRequirementId++);
    if (stableId !== null) nextRequirementId = Math.max(nextRequirementId, stableId + 1);
    const label = document.createElement('span');
    label.className = 'mono';
    label.style.cssText = 'color:var(--accent-primary); font-weight:700;';
    const input = document.createElement('input');
    input.required = true;
    input.value = value;
    input.placeholder = 'Describe the next requirement...';
    const remove = document.createElement('button');
    remove.className = 'icon-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove requirement');
    remove.textContent = '×';
    row.append(label, input, remove);
    remove.addEventListener('click', () => {
      row.remove();
      renumberRequirements();
    });
    requirementsList.appendChild(row);
    renumberRequirements();
    return row;
  }

  requirementsList?.querySelectorAll('.req-input-row').forEach(row => { row.dataset.rowId = String(nextRequirementId++); });
  const defaultRequirements = [...(requirementsList?.querySelectorAll('.req-input-row input') || [])].map(input => input.value);
  document.querySelector('#add-req-btn')?.addEventListener('click', () => {
    const row = addRequirement();
    row?.querySelector('input')?.focus();
  });

  // Problem Form Submit
  function problemDraft() {
    return {
      version: 1,
      fields: Object.fromEntries(problemFieldIds.map(id => [id, document.getElementById(id)?.value || ''])),
      open: document.querySelector('#prob-open')?.checked === true,
      nextRequirementId,
      requirements: [...requirementsList.querySelectorAll('.req-input-row')].map(row => ({ id: Number(row.dataset.rowId), text: row.querySelector('input').value.trim() }))
    };
  }

  function problemError(message, field) {
    if (problemFeedback) {
      problemFeedback.textContent = message;
      problemFeedback.setAttribute('role', 'alert');
      problemFeedback.style.borderColor = 'var(--status-error)';
    }
    field?.setAttribute('aria-invalid', 'true');
    field?.focus();
    return false;
  }

  function validProblemDraft(draft) {
    const title = document.querySelector('#prob-title');
    const summary = document.querySelector('#prob-summary');
    const context = document.querySelector('#prob-context');
    if (title.value.trim().length < 10 || title.value.trim().length > 100) return problemError('Title must be 10–100 characters.', title);
    if (summary.value.trim().length < 20 || summary.value.trim().length > 200) return problemError('Summary must be 20–200 characters.', summary);
    if (!context.value.trim()) return problemError('Description is required.', context);
    if (draft.requirements.length < 1 || draft.requirements.length > 8) return problemError('Add one to eight numbered requirements.', document.querySelector('#add-req-btn'));
    for (const [index, requirement] of draft.requirements.entries()) {
      if (!requirement.text || requirement.text.length > 140) return problemError(`R${index + 1} must be 1–140 characters.`, requirementsList.querySelectorAll('input')[index]);
    }
    if ([...Object.values(draft.fields), ...draft.requirements.map(item => item.text)].some(value => SECRET_PATTERNS.some(pattern => pattern.regex.test(value)))) {
      return problemError('Remove credential-like text before saving or previewing this local brief.', title);
    }
    return true;
  }

  function renderProblemPreview(draft) {
    const preview = document.querySelector('#problem-preview');
    if (!preview) return;
    preview.replaceChildren();
    const add = (tag, value, className) => {
      const element = document.createElement(tag);
      element.textContent = value;
      if (className) element.className = className;
      preview.appendChild(element);
      return element;
    };
    add('span', 'Local draft preview · not published', 'preview-label');
    add('h3', draft.fields['prob-title']);
    add('p', `${draft.fields['prob-category']} · ${draft.open ? 'Open for sample solutions' : 'Closed for sample solutions'} · ${draft.fields['prob-window'] || 'No build window'}`);
    add('h4', 'Summary'); add('p', draft.fields['prob-summary']);
    add('h4', 'Description & user impact'); add('p', draft.fields['prob-context']);
    add('h4', 'Numbered requirements');
    const list = add('ul', '');
    draft.requirements.forEach((requirement, index) => {
      const item = document.createElement('li');
      item.textContent = `R${index + 1}: ${requirement.text}`;
      list.appendChild(item);
    });
    if (draft.fields['prob-constraints']) { add('h4', 'Constraints'); add('p', draft.fields['prob-constraints']); }
    if (draft.fields['prob-success']) { add('h4', 'Success criteria'); add('p', draft.fields['prob-success']); }
    preview.hidden = false;
    preview.scrollIntoView({ block: 'nearest' });
  }

  document.querySelector('#problem-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const draft = problemDraft();
    if (!validProblemDraft(draft)) return;
    localStorage.setItem(problemDraftKey, JSON.stringify(draft));
    if (problemFeedback) {
      problemFeedback.textContent = 'Problem draft saved locally on this device; no public brief was published.';
      problemFeedback.setAttribute('role', 'status');
      problemFeedback.style.borderColor = 'var(--status-success)';
    }
  });

  document.querySelector('#preview-problem-btn')?.addEventListener('click', () => {
    const draft = problemDraft();
    if (!validProblemDraft(draft)) return;
    renderProblemPreview(draft);
    if (problemFeedback) {
      problemFeedback.textContent = 'Showing your current entered values. Preview does not save or publish.';
      problemFeedback.setAttribute('role', 'status');
    }
  });

  try {
    const saved = JSON.parse(localStorage.getItem(problemDraftKey) || 'null');
    if (saved?.version === 1 && saved.fields && Array.isArray(saved.requirements) && saved.requirements.length >= 1 && saved.requirements.length <= 8) {
      for (const id of problemFieldIds) {
        const value = saved.fields[id];
        if (typeof value === 'string' && value.length <= 5000) document.getElementById(id).value = value;
      }
      if (typeof saved.open === 'boolean') document.querySelector('#prob-open').checked = saved.open;
      requirementsList.replaceChildren();
      saved.requirements.forEach(item => {
        if (typeof item === 'string' && item.length <= 140) addRequirement(item);
        else if (item && Number.isSafeInteger(item.id) && item.id > 0 && item.id < 10000 && typeof item.text === 'string' && item.text.length <= 140) addRequirement(item.text, item.id);
      });
      if (Number.isSafeInteger(saved.nextRequirementId) && saved.nextRequirementId >= nextRequirementId && saved.nextRequirementId < 10000) nextRequirementId = saved.nextRequirementId;
      if (problemFeedback) problemFeedback.textContent = 'Problem draft restored from this device.';
    }
  } catch {
    localStorage.removeItem(problemDraftKey);
  }
  document.querySelector('#reset-problem-draft')?.addEventListener('click', () => {
    localStorage.removeItem(problemDraftKey);
    document.querySelector('#problem-form')?.reset();
    requirementsList?.replaceChildren();
    nextRequirementId = 1;
    defaultRequirements.forEach(requirement => addRequirement(requirement));
    document.querySelectorAll('#problem-form [aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
    if (problemFeedback) {
      problemFeedback.textContent = 'Sample values are loaded; no problem draft has been saved.';
      problemFeedback.setAttribute('role', 'status');
      problemFeedback.style.borderColor = '';
    }
    const preview = document.querySelector('#problem-preview');
    if (preview) {
      preview.replaceChildren();
      preview.hidden = true;
    }
  });

  // Linker Form Submit
  const demo = window.SolvynkDemoState;
  const fixtureCatalog = window.SolvynkFixtureCatalog;
  const linkProjectSelect = document.querySelector('#link-project-select');
  const linkProblemSelect = document.querySelector('#link-problem-select');
  const linkRequirements = document.querySelector('#link-requirements');
  const linkerFeedback = document.querySelector('#linker-feedback');

  function fillSelect(select, entries, label) {
    const previous = select.value;
    select.replaceChildren();
    entries.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.slug;
      option.textContent = label(entry);
      select.appendChild(option);
    });
    if (entries.some(entry => entry.slug === previous)) select.value = previous;
  }
  fillSelect(linkProjectSelect, fixtureCatalog.projects, project => `${project.title} · @${project.creatorHandle}`);
  fillSelect(linkProblemSelect, fixtureCatalog.problems, problem => `${problem.id}: ${problem.title}`);

  function renderLinkRequirements() {
    const problem = demo.problem(linkProblemSelect.value);
    linkRequirements.replaceChildren();
    if (!problem) return;
    document.querySelector('#link-revision').textContent = `${problem.id} · sample revision v1 · ${problem.status}`;
    problem.requirements.forEach(requirement => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = requirement.code;
      input.setAttribute('aria-label', `Claim ${requirement.code}: ${requirement.text}`);
      const text = document.createElement('span');
      text.textContent = `${requirement.code}: ${requirement.text}`;
      label.append(input, text);
      linkRequirements.appendChild(label);
    });
  }
  linkProblemSelect.addEventListener('change', renderLinkRequirements);
  renderLinkRequirements();

  document.querySelector('#linker-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const claimedRids = [...linkRequirements.querySelectorAll('input:checked')].map(input => input.value);
    const result = demo.addLink({ projectSlug: linkProjectSelect.value, problemSlug: linkProblemSelect.value, claimedRids, relevance: document.querySelector('#link-relevance').value });
    if (!result.ok) {
      linkerFeedback.textContent = result.error;
      linkerFeedback.setAttribute('role', 'alert');
      linkerFeedback.style.borderColor = 'var(--status-error)';
      (claimedRids.length ? document.querySelector('#link-relevance') : linkRequirements.querySelector('input'))?.focus();
      return;
    }
    linkerFeedback.replaceChildren();
    linkerFeedback.append('Sample link saved on this device. Claimed coverage awaits simulated owner review. ');
    const problemLink = document.createElement('a');
    problemLink.href = `problem.html?slug=${result.link.problemSlug}`;
    problemLink.textContent = 'View BuildTree';
    problemLink.className = 'text-link';
    linkerFeedback.append(problemLink);
    linkerFeedback.setAttribute('role', 'status');
    linkerFeedback.style.borderColor = 'var(--status-success)';
  });

  // Owner Review Desk Submit
  const reviewProblemSelect = document.querySelector('#review-problem-select');
  const reviewLinkSelect = document.querySelector('#review-link-select');
  const reviewChoices = document.querySelector('#review-confirmations');
  const reviewFeedback = document.querySelector('#review-feedback');
  fillSelect(reviewProblemSelect, fixtureCatalog.problems.filter(problem => demo.getLinks({ problemSlug: problem.slug }).length), problem => `${problem.id}: ${problem.title}`);

  function renderReviewDetails() {
    const link = demo.getLinks().find(item => item.id === reviewLinkSelect.value);
    reviewChoices.replaceChildren();
    if (!link) {
      document.querySelector('#review-claimed').textContent = 'No sample relationship for this problem.';
      return;
    }
    const problem = demo.problem(link.problemSlug);
    document.querySelector('#review-claimed').textContent = `Creator claims ${link.claimedRids.join(', ')} against ${problem.id} revision v${link.revision}. Official status is unchanged by this desk.`;
    link.claimedRids.forEach(rid => {
      const requirement = problem.requirements.find(item => item.code === rid);
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = rid;
      input.checked = link.confirmedRids.includes(rid);
      input.setAttribute('aria-label', `Confirm ${rid}: ${requirement.text}`);
      const text = document.createElement('span');
      text.textContent = `${rid}: ${requirement.text}`;
      label.append(input, text);
      reviewChoices.appendChild(label);
    });
    document.querySelector('#owner-review-text').value = link.ownerReview;
    document.querySelector('#feature-toggle').checked = link.featured;
  }

  function renderReviewProjects() {
    const selected = reviewLinkSelect.value;
    const links = demo.getLinks({ problemSlug: reviewProblemSelect.value });
    reviewLinkSelect.replaceChildren();
    links.forEach(link => {
      const project = demo.project(link.projectSlug);
      const option = document.createElement('option');
      option.value = link.id;
      option.textContent = `${project.title} · @${project.creatorHandle}`;
      reviewLinkSelect.appendChild(option);
    });
    if (links.some(link => link.id === selected)) reviewLinkSelect.value = selected;
    renderReviewDetails();
  }
  reviewProblemSelect.addEventListener('change', renderReviewProjects);
  reviewLinkSelect.addEventListener('change', renderReviewDetails);
  window.addEventListener('solvynk:demo-state', () => {
    fillSelect(reviewProblemSelect, fixtureCatalog.problems.filter(problem => demo.getLinks({ problemSlug: problem.slug }).length), problem => `${problem.id}: ${problem.title}`);
    renderReviewProjects();
  });
  renderReviewProjects();

  document.querySelector('#save-review-btn')?.addEventListener('click', function () {
    const result = demo.saveReview({
      id: reviewLinkSelect.value,
      confirmedRids: [...reviewChoices.querySelectorAll('input:checked')].map(input => input.value),
      text: document.querySelector('#owner-review-text').value,
      featured: document.querySelector('#feature-toggle').checked
    });
    if (!result.ok) {
      reviewFeedback.textContent = result.error;
      reviewFeedback.setAttribute('role', 'alert');
      reviewFeedback.style.borderColor = 'var(--status-error)';
      return;
    }
    reviewFeedback.textContent = 'Sample owner review saved locally. Confirmed coverage and Featured status now appear on the linked problem and project pages; Official is unchanged.';
    reviewFeedback.setAttribute('role', 'status');
    reviewFeedback.style.borderColor = 'var(--status-success)';
  });

  // Member space reflects only the local fixture state; there is no demo identity or session.
  function renderSavedList(type, target) {
    const list = document.querySelector(target);
    list.replaceChildren();
    const slugs = demo.savedSlugs(type);
    if (!slugs.length) {
      const empty = document.createElement('p');
      empty.textContent = `No saved ${type}s on this device yet. Use Save on a ${type} page.`;
      list.appendChild(empty);
      return;
    }
    slugs.forEach(slug => {
      const item = type === 'project' ? demo.project(slug) : demo.problem(slug);
      const link = document.createElement('a');
      link.href = `${type}.html?slug=${encodeURIComponent(slug)}`;
      link.className = 'text-link';
      link.textContent = item.title;
      list.appendChild(link);
    });
  }
  function renderMember() {
    renderSavedList('project', '#saved-projects-list');
    renderSavedList('problem', '#saved-problems-list');
  }
  renderMember();
  window.addEventListener('solvynk:demo-state', renderMember);
  document.querySelector('#reset-demo-state')?.addEventListener('click', () => {
    if (!window.confirm('Clear all local demo links, reviews, saves, switches and Studio drafts on this device?')) return;
    demo.reset();
    document.querySelector('#member-feedback').textContent = 'Local demo data cleared. Sample fixtures remain available; reload Studio to clear the visible forms.';
  });

  // Staff controls are a local simulation, never authorization or production moderation.
  const queueItems = [
    { key: 'tamspeech-lite', title: 'TamSpeech-Lite Android', type: 'Sample project review' },
    { key: 'offline-student-mentor-map', title: 'Offline Student Mentor Map', type: 'Sample problem review' },
    { key: 'sample-report', title: 'Example content report', type: 'Sample reported content' },
    { key: 'sample-link', title: 'Example outbound link', type: 'Sample link moderation' }
  ];
  const adminFeedback = document.querySelector('#admin-feedback');
  function renderAdmin() {
    const state = demo.snapshot();
    document.querySelectorAll('[data-demo-switch]').forEach(input => {
      input.checked = state.admin.switches[input.dataset.demoSwitch];
    });
    const body = document.querySelector('#admin-queue');
    body.replaceChildren();
    queueItems.forEach(item => {
      const status = state.admin.queue[item.key] || 'pending';
      const row = document.createElement('tr');
      const title = document.createElement('td');
      title.textContent = item.title;
      const type = document.createElement('td');
      type.textContent = item.type;
      const statusCell = document.createElement('td');
      statusCell.textContent = status;
      const actions = document.createElement('td');
      for (const [value, label] of [['reviewed', 'Mark reviewed'], ['held', 'Hold'], ['pending', 'Reset']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button button-small button-outline';
        button.textContent = label;
        button.disabled = value === status;
        button.setAttribute('aria-label', `${label}: ${item.title}`);
        button.addEventListener('click', () => {
          demo.setQueue(item.key, value);
          adminFeedback.textContent = `${item.title}: sample queue state set to ${value} on this device. No real moderation action occurred.`;
        });
        actions.appendChild(button);
      }
      row.append(title, type, statusCell, actions);
      body.appendChild(row);
    });
    const audit = document.querySelector('#admin-audit');
    audit.replaceChildren();
    const entries = [
      ...Object.entries(state.admin.switches).map(([name, value]) => `Demo switch ${name}: ${value ? 'enabled' : 'disabled'}`),
      ...queueItems.filter(item => state.admin.queue[item.key]).map(item => `${item.title}: ${state.admin.queue[item.key]}`)
    ];
    entries.forEach(entry => {
      const line = document.createElement('p');
      line.textContent = entry;
      audit.appendChild(line);
    });
  }
  document.querySelectorAll('[data-demo-switch]').forEach(input => input.addEventListener('change', () => {
    demo.setSwitch(input.dataset.demoSwitch, input.checked);
    adminFeedback.textContent = `Prototype switch ${input.dataset.demoSwitch} ${input.checked ? 'enabled' : 'disabled'} locally. No production service is connected.`;
  }));
  window.addEventListener('solvynk:demo-state', renderAdmin);
  renderAdmin();
})();
