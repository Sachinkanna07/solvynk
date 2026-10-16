const search=document.querySelector('#explore-search');
const empty=document.querySelector('#explore-empty');
const cards=[...document.querySelectorAll('[data-searchable]')];
function updateExplore(){const query=(search?.value||'').trim().toLowerCase();let visible=0;cards.forEach((card)=>{const category=card.dataset.category||card.dataset.projectCategory;const list=card.closest('[data-list]');const active=list?.querySelector('.filter.active')?.dataset.filter||list?.querySelector('.project-filter.active')?.dataset.projectFilter||'all';const matches=(!query||card.textContent.toLowerCase().includes(query))&&(active==='all'||category===active);card.hidden=!matches;if(matches)visible+=1;});if(empty)empty.hidden=visible>0;}
document.querySelectorAll('.filter,.project-filter').forEach((button)=>button.addEventListener('click',()=>{button.parentElement.querySelectorAll('button').forEach((item)=>item.classList.remove('active'));button.classList.add('active');updateExplore();}));
search?.addEventListener('input',updateExplore);updateExplore();
