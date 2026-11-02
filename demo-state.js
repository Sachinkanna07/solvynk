/* Fixture-only, versioned browser state. No account, server or publication exists. */
(function () {
  const catalog = window.SolvynkFixtureCatalog;
  const storageKey = 'solvynk-demo-state-v1';
  const eventName = 'solvynk:demo-state';
  const problems = catalog.problems.map(problem => ({ ...problem, requirements: problem.requirements.map(requirement => ({ ...requirement })) }));
  const projects = catalog.projects.map(project => ({ ...project }));
  const baseLinks = catalog.solutionLinks.map(link => ({ ...link, coverage: structuredClone(link.coverage) }));
  const pairId = (project, problem) => `${project.id}:${problem.id}`;
  const findProject = slug => projects.find(project => project.slug === slug);
  const findProblem = slug => problems.find(problem => problem.slug === slug);
  const knownRids = problem => problem.requirements.map(requirement => requirement.code);
  const isSafeText = value => typeof value === 'string' && !/DEMO_(?:TOKEN|AWS_KEY)_PLACEHOLDER|gh[pousr]_[A-Za-z0-9_]{36,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}/.test(value);
  const empty = () => ({ version: 1, links: [], reviews: [], savedProjects: [], savedProblems: [], admin: { switches: { signups: true, publishing: true, outbound: true }, queue: {} } });

  function validLink(link) {
    const project = findProject(link?.projectSlug);
    const problem = findProblem(link?.problemSlug);
    return project && problem && link.id === pairId(project, problem) && link.revision === 1 &&
      Array.isArray(link.claimedRids) && link.claimedRids.length >= 1 && link.claimedRids.length <= 8 &&
      new Set(link.claimedRids).size === link.claimedRids.length && link.claimedRids.every(rid => knownRids(problem).includes(rid)) &&
      isSafeText(link.relevance) && link.relevance.trim().length >= 80 && link.relevance.length <= 600 &&
      !baseLinks.some(base => base.projectSlug === link.projectSlug && base.problemSlug === link.problemSlug);
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!parsed || parsed.version !== 1) return empty();
      const state = empty();
      if (Array.isArray(parsed.links)) {
        const seen = new Set();
        state.links = parsed.links.filter(link => {
          if (!validLink(link) || seen.has(link.id)) return false;
          seen.add(link.id);
          return true;
        }).slice(0, 30).map(link => ({ id: link.id, projectSlug: link.projectSlug, problemSlug: link.problemSlug, revision: 1, claimedRids: [...link.claimedRids], relevance: link.relevance }));
      }
      if (Array.isArray(parsed.reviews)) {
        const seen = new Set();
        state.reviews = parsed.reviews.filter(review => {
          const link = getLinksFrom(state).find(item => item.id === review?.id);
          if (!link || seen.has(review.id) || !Array.isArray(review.confirmedRids) || new Set(review.confirmedRids).size !== review.confirmedRids.length ||
            !review.confirmedRids.every(rid => link.claimedRids.includes(rid)) || !isSafeText(review.text) || review.text.length > 280 || typeof review.featured !== 'boolean') return false;
          seen.add(review.id);
          return true;
        }).slice(0, 30).map(review => ({ id: review.id, confirmedRids: [...review.confirmedRids], text: review.text, featured: review.featured }));
      }
      for (const [field, lookup] of [['savedProjects', findProject], ['savedProblems', findProblem]]) {
        if (Array.isArray(parsed[field])) state[field] = [...new Set(parsed[field].filter(slug => typeof slug === 'string' && lookup(slug)))].slice(0, 30);
      }
      const switches = parsed.admin?.switches;
      if (switches && typeof switches === 'object') {
        for (const key of Object.keys(state.admin.switches)) if (typeof switches[key] === 'boolean') state.admin.switches[key] = switches[key];
      }
      const queue = parsed.admin?.queue;
      if (queue && typeof queue === 'object') {
        for (const key of ['tamspeech-lite', 'offline-student-mentor-map', 'sample-report', 'sample-link']) {
          if (['pending', 'reviewed', 'held'].includes(queue[key])) state.admin.queue[key] = queue[key];
        }
      }
      return state;
    } catch {
      return empty();
    }
  }

  function save(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new Event(eventName));
  }

  function getLinksFrom(state) {
    const baseline = baseLinks.map(link => {
      const project = findProject(link.projectSlug);
      const problem = findProblem(link.problemSlug);
      return {
        id: pairId(project, problem), projectSlug: link.projectSlug, problemSlug: link.problemSlug, revision: 1,
        claimedRids: Object.keys(link.coverage).filter(rid => link.coverage[rid].state !== 'unaddressed'),
        confirmedRids: Object.keys(link.coverage).filter(rid => link.coverage[rid].state === 'confirmed'),
        relevance: 'Sample relationship from the immutable fixture catalog.', featured: link.featured,
        ownerReview: link.ownerReview || '', officialStatus: link.officialStatus || 'none', baselineCoverage: link.coverage
      };
    });
    const added = state.links.map(link => ({ ...link, claimedRids: [...link.claimedRids], confirmedRids: [], featured: false, ownerReview: '', officialStatus: 'none', baselineCoverage: {} }));
    return [...baseline, ...added].map(link => {
      const review = state.reviews.find(item => item.id === link.id);
      if (review) {
        link.confirmedRids = [...review.confirmedRids];
        link.featured = review.featured;
        link.ownerReview = review.text;
      }
      const problem = findProblem(link.problemSlug);
      link.coverage = Object.fromEntries(knownRids(problem).map(rid => [rid, {
        state: link.confirmedRids.includes(rid) ? 'confirmed' : link.claimedRids.includes(rid) ? 'claimed' : 'unaddressed',
        note: link.baselineCoverage[rid]?.note || ''
      }]));
      delete link.baselineCoverage;
      return link;
    });
  }

  function getLinks(filter = {}) {
    return getLinksFrom(load()).filter(link => (!filter.projectSlug || link.projectSlug === filter.projectSlug) && (!filter.problemSlug || link.problemSlug === filter.problemSlug));
  }

  function addLink(input) {
    const project = findProject(input?.projectSlug);
    const problem = findProblem(input?.problemSlug);
    if (!project || !problem || problem.status !== 'Open for Solutions') return { ok: false, error: 'Choose an eligible sample project and open problem.' };
    const state = load();
    const id = pairId(project, problem);
    if (getLinksFrom(state).some(link => link.id === id)) return { ok: false, error: 'This sample project is already linked to that problem.' };
    const link = { id, projectSlug: project.slug, problemSlug: problem.slug, revision: 1, claimedRids: input.claimedRids, relevance: input.relevance?.trim() };
    if (!validLink(link)) return { ok: false, error: 'Select at least one valid requirement and write an 80–600 character relevance note without credentials.' };
    state.links.push(link);
    save(state);
    return { ok: true, link: getLinks({ projectSlug: project.slug, problemSlug: problem.slug })[0] };
  }

  function saveReview(input) {
    const state = load();
    const link = getLinksFrom(state).find(item => item.id === input?.id);
    if (!link || !Array.isArray(input.confirmedRids) || new Set(input.confirmedRids).size !== input.confirmedRids.length ||
      !input.confirmedRids.every(rid => link.claimedRids.includes(rid)) || !isSafeText(input.text) || input.text.length > 280 || typeof input.featured !== 'boolean') {
      return { ok: false, error: 'Review only claimed requirements; keep the note under 280 characters and remove credential-like text.' };
    }
    state.reviews = state.reviews.filter(review => review.id !== link.id);
    state.reviews.push({ id: link.id, confirmedRids: [...input.confirmedRids], text: input.text.trim(), featured: input.featured });
    save(state);
    return { ok: true, link: getLinks().find(item => item.id === link.id) };
  }

  function isSaved(type, slug) {
    const lookup = type === 'project' ? findProject : type === 'problem' ? findProblem : null;
    if (!lookup?.(slug)) return false;
    const field = type === 'project' ? 'savedProjects' : 'savedProblems';
    return load()[field].includes(slug) || localStorage.getItem(`solvynk-saved-${slug}`) === 'true';
  }
  function setSaved(type, slug, value) {
    const lookup = type === 'project' ? findProject : type === 'problem' ? findProblem : null;
    if (!lookup?.(slug)) return false;
    const field = type === 'project' ? 'savedProjects' : 'savedProblems';
    const state = load();
    state[field] = state[field].filter(item => item !== slug);
    if (value) state[field].push(slug);
    localStorage.removeItem(`solvynk-saved-${slug}`);
    save(state);
    return true;
  }
  function savedSlugs(type) {
    const entries = type === 'project' ? projects : problems;
    return entries.filter(entry => isSaved(type, entry.slug)).map(entry => entry.slug);
  }

  function setSwitch(name, value) {
    const state = load();
    if (!Object.hasOwn(state.admin.switches, name) || typeof value !== 'boolean') return false;
    state.admin.switches[name] = value;
    save(state);
    return true;
  }
  function setQueue(key, status) {
    const state = load();
    if (!['tamspeech-lite', 'offline-student-mentor-map', 'sample-report', 'sample-link'].includes(key) || !['pending', 'reviewed', 'held'].includes(status)) return false;
    state.admin.queue[key] = status;
    save(state);
    return true;
  }
  function reset() {
    localStorage.removeItem(storageKey);
    localStorage.removeItem('solvynk-project-draft-v1');
    localStorage.removeItem('solvynk-problem-draft-v1');
    localStorage.removeItem('solvynk_project_draft');
    localStorage.removeItem('solvynk_problem_draft');
    [...projects, ...problems].forEach(entry => localStorage.removeItem(`solvynk-saved-${entry.slug}`));
    window.dispatchEvent(new Event(eventName));
  }

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key?.startsWith('solvynk-saved-')) window.dispatchEvent(new Event(eventName));
  });
  window.SolvynkDemoState = Object.freeze({ getLinks, addLink, saveReview, isSaved, setSaved, savedSlugs, setSwitch, setQueue, snapshot: load, reset, project: findProject, problem: findProblem, key: storageKey });
})();
