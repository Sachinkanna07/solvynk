/* ==========================================================================
   SOLVYNK EXPLORE SCRIPT (explore.js)
   ========================================================================== */

(function () {
  const searchInput = document.querySelector('#explore-search');
  const emptyState = document.querySelector('#explore-empty');
  const cards = [...document.querySelectorAll('[data-searchable]')];
  const filterBtns = [...document.querySelectorAll('.filter-btn')];
  const tabBtns = [...document.querySelectorAll('[data-content-tab]')];
  const clearBtn = document.querySelector('#clear-filters-btn');
  const resultStatus = document.querySelector('#explore-result-status');

  let activeCategory = 'all';
  let activeTab = 'all';

  function setTab(value) {
    activeTab = ['all', 'problems', 'projects'].includes(value) ? value : 'all';
    tabBtns.forEach(tab => {
      const selected = tab.dataset.contentTab === activeTab;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-pressed', String(selected));
    });
    applyFilters();
  }

  function syncHash() {
    setTab(window.location.hash === '#problems' ? 'problems' : window.location.hash === '#projects' ? 'projects' : 'all');
  }

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let matchCount = 0;

    cards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
      const chips = card.querySelector('.stack-chips')?.textContent.toLowerCase() || '';
      const text = `${title} ${desc} ${chips}`;
      const category = card.dataset.category || '';
      const type = card.dataset.type || '';

      const queryMatches = !query || text.includes(query);
      const categoryMatches = activeCategory === 'all' || category.toLowerCase() === activeCategory.toLowerCase();
      const tabMatches = activeTab === 'all' || (activeTab === 'problems' && type === 'problem') || (activeTab === 'projects' && type === 'project');

      const isVisible = queryMatches && categoryMatches && tabMatches;
      card.hidden = !isVisible;
      if (isVisible) matchCount++;
    });

    // Toggle Section visibility based on tab
    const problemsSec = document.querySelector('#problems-section');
    const projectsSec = document.querySelector('#projects-section');
    if (problemsSec) problemsSec.hidden = activeTab === 'projects';
    if (projectsSec) projectsSec.hidden = activeTab === 'problems';

    if (emptyState) {
      emptyState.hidden = matchCount > 0;
    }
    if (resultStatus) resultStatus.textContent = `${matchCount} results shown`;
  }

  // Category Filter clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeCategory = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  // Tab switcher clicks
  tabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      const next = tab.dataset.contentTab || 'all';
      if (next === 'all') {
        history.pushState(null, '', window.location.pathname + window.location.search);
        setTab('all');
      } else {
        window.location.hash = next;
        syncHash();
      }
    });
  });

  // Search input typing
  searchInput?.addEventListener('input', applyFilters);

  // Clear filters
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeCategory = 'all';
    history.pushState(null, '', window.location.pathname + window.location.search);
    filterBtns.forEach(b => {
      const selected = b.dataset.filter === 'all';
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    setTab('all');
  });

  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);
  syncHash();
})();
