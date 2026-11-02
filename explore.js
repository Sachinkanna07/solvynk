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

  let activeCategory = 'all';
  let activeTab = 'all';

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
  }

  // Category Filter clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  // Tab switcher clicks
  tabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      tabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.contentTab || 'all';
      applyFilters();
    });
  });

  // Search input typing
  searchInput?.addEventListener('input', applyFilters);

  // Clear filters
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeCategory = 'all';
    activeTab = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    tabBtns.forEach(t => t.classList.toggle('active', t.dataset.contentTab === 'all'));
    applyFilters();
  });

  applyFilters();
})();
