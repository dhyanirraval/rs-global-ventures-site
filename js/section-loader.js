const SECTION_FILES = [
  'sections/hero.html',
  'sections/compliance.html',
  'sections/about.html',
  'sections/products.html',
  'sections/why.html',
  'sections/process.html',
  'sections/global.html',
  'sections/cta.html',
  'sections/contact.html'
];

async function loadSections() {
  const root = document.getElementById('page-sections');
  if (!root) return;

  root.innerHTML = '';

  for (const file of SECTION_FILES) {
    try {
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      const html = await res.text();
      root.insertAdjacentHTML('beforeend', html);
    } catch (error) {
      console.error(error);
      root.insertAdjacentHTML('beforeend', `<section class="section"><div class="container"><p class="empty-state">Section unavailable: ${file}</p></div></section>`);
    }
  }

  window.dispatchEvent(new CustomEvent('sections:loaded'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSections);
} else {
  loadSections();
}
