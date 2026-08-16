// Catalog management and rendering

let catalog = [];
let currentCategoryId = null;
let currentLevel = 'category';
let currentNodeId = null;
const DEFAULT_IMAGE = '/default-product.svg';

function children(parentId, type) {
  return catalog.filter(x => x.parentId === parentId && (!type || x.type === type));
}

function byId(id) {
  return catalog.find(x => x.id === id);
}

function topCategories() {
  return catalog.filter(x => x.type === 'category');
}

function ensureCatalogSelection() {
  if (!catalog.length) return;
  const defaultCategory = topCategories()[0] || catalog.find(x => x.type === 'category') || catalog[0];
  if (!defaultCategory) return;
  if (!currentCategoryId || !byId(currentCategoryId) || byId(currentCategoryId).type !== 'category') {
    currentCategoryId = defaultCategory.id;
  }
  if (!currentNodeId || !byId(currentNodeId)) {
    currentNodeId = currentCategoryId;
  }
  const currentNode = byId(currentNodeId);
  if (currentNode && currentNode.type !== 'category' && currentNode.type !== 'subcategory' && currentNode.type !== 'product') {
    currentNodeId = currentCategoryId;
  }
  currentLevel = byId(currentNodeId)?.type === 'subcategory' ? 'subcategory' : 'category';
}

function openCatalog(id) {
  const target = byId(id) || topCategories()[0] || catalog[0];
  if (!target) return;
  currentCategoryId = target.type === 'category' ? target.id : (byId(target.parentId)?.id || topCategories()[0]?.id || target.id);
  currentNodeId = currentCategoryId;
  currentLevel = 'category';
  const catalogShell = document.getElementById('catalogShell');
  if (catalogShell) catalogShell.classList.add('open');
  renderCatalog();
}

function typeLabel(type) {
  return ({
    category: 'Category',
    subcategory: 'Subcategory',
    product: 'Product',
    variant: 'Variant'
  })[type] || type;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function renderCategoryCards() {
  const categoryCards = document.getElementById('categoryCards');
  if (!categoryCards) return;

  categoryCards.innerHTML = topCategories()
    .map(c => `<article class="product-card" data-category="${c.id}"><div class="product-bg" style="background-image:url('${String(c.image || DEFAULT_IMAGE).replace(/'/g, "%27")}')"></div><div class="product-content"><div class="product-icon">✦</div><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><span class="product-tag">${esc(c.tag || 'Export category')}</span></div></article>`)
    .join('');

  categoryCards.querySelectorAll('[data-category]').forEach(el => {
    el.addEventListener('click', () => openCatalog(el.dataset.category));
  });
}

function renderCatalog() {
  const categoryCards = document.getElementById('categoryCards');
  if (!categoryCards) return;

  ensureCatalogSelection();
  const cat = byId(currentCategoryId);
  if (!cat) return;

  const side = document.getElementById('catalogCategoryList');
  if (!side) return;

  side.innerHTML = topCategories()
    .map(c => `<button class="catalog-side-btn ${c.id === currentCategoryId ? 'active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`)
    .join('');

  side.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
    currentCategoryId = b.dataset.cat;
    currentLevel = 'category';
    currentNodeId = currentCategoryId;
    renderCatalog();
  });

  const node = byId(currentNodeId) || cat;
  document.getElementById('catalogTitle').textContent = node.name;
  document.getElementById('catalogDescription').textContent = node.description || '';

  renderBreadcrumbs();

  const subRow = document.getElementById('subcategoryRow');
  let relatedProducts = [];

  if (currentLevel === 'category') {
    const subs = children(node.id, 'subcategory');
    subRow.innerHTML = subs.length
      ? subs.map(x => `<button class="subcat-pill" data-sub="${x.id}">${esc(x.name)}</button>`).join('')
      : '<span style="font-size:.74rem;color:var(--muted)">No subcategories yet.</span>';
    subRow.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
      currentNodeId = b.dataset.sub;
      currentLevel = 'subcategory';
      renderCatalog();
    });
    relatedProducts = children(node.id, 'product');
  } else if (node.type === 'subcategory') {
    subRow.innerHTML = children(currentCategoryId, 'subcategory')
      .map(x => `<button class="subcat-pill ${x.id === node.id ? 'active' : ''}" data-sub="${x.id}">${esc(x.name)}</button>`)
      .join('');
    subRow.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
      currentNodeId = b.dataset.sub;
      currentLevel = 'subcategory';
      renderCatalog();
    });
    relatedProducts = children(node.id, 'product');
  }

  const items = document.getElementById('productItems');
  items.innerHTML = relatedProducts.length
    ? relatedProducts.map(p => `<article class="item-card" data-product="${p.id}"><div class="item-image" style="background-image:url('${String(p.image || DEFAULT_IMAGE).replace(/'/g, "%27")}')"></div><div class="item-body"><h4>${esc(p.name)}</h4><p>${esc(p.description)}</p><div class="item-meta">${esc(p.tag || 'Product')} · ${children(p.id, 'variant').length} variants</div></div></article>`).join('')
    : '<div class="empty-state" style="grid-column:1/-1">No products added here yet.</div>';
  items.querySelectorAll('[data-product]').forEach(el => el.onclick = () => openProduct(el.dataset.product));
}

function renderBreadcrumbs() {
  const el = document.getElementById('catalogBreadcrumbs');
  const chain = [];
  let n = byId(currentNodeId);
  while (n) {
    chain.unshift(n);
    n = byId(n.parentId);
  }
  el.innerHTML = chain.map((n, i) => i === chain.length - 1
    ? `<span>${esc(n.name)}</span>`
    : `<button data-id="${n.id}">${esc(n.name)}</button><span>›</span>`).join('');
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    const n = byId(b.dataset.id);
    currentNodeId = n.id;
    currentLevel = n.type;
    if (n.type === 'category') currentCategoryId = n.id;
    renderCatalog();
  });
}

function openProduct(id) {
  const product = byId(id);
  if (!product) return;
  const variants = children(id, 'variant');
  document.getElementById('detailTitle').textContent = product.name;
  document.getElementById('detailKicker').textContent = (byId(product.parentId)?.name || 'Product') + ' · ' + typeLabel(product.type);
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailDescription').textContent = product.description;
  document.getElementById('detailImage').style.backgroundImage = `url('${String(product.image || DEFAULT_IMAGE).replace(/'/g, "%27")}')`;
  document.getElementById('detailVariants').innerHTML = variants.length
    ? variants.map(v => `<div class="variant-card"><strong>${esc(v.name)}</strong><span>${esc(v.description || v.tag || 'Export-ready variant')}</span></div>`).join('')
    : '<div class="variant-card"><strong>Multiple types available on request</strong><span>Contact RS Global Ventures for grades, sizes, cleaning levels, cuts and packaging options.</span></div>';
  openModal('productModal');
}

async function loadCatalog() {
  try {
    const res = await fetch('/api/catalog', { cache: 'no-store' });
    if (!res.ok) throw new Error('Catalog request failed');
    catalog = await res.json();
    currentCategoryId = topCategories()[0]?.id || null;
    currentNodeId = currentCategoryId;
    renderCategoryCards();
    renderCatalog();
  } catch (err) {
    console.error(err);
    const categoryCards = document.getElementById('categoryCards');
    if (categoryCards) {
      categoryCards.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Catalog is temporarily unavailable. Please try again shortly.</div>';
    }
  }
}

function initCatalog() {
  const openCatalogBtn = document.getElementById('openCatalogBtn');
  const closeCatalogBtn = document.getElementById('closeCatalogBtn');
  if (!openCatalogBtn || !closeCatalogBtn) return;

  openCatalogBtn.onclick = () => {
    if (!catalog.length) return loadCatalog();
    openCatalog(currentCategoryId);
  };

  closeCatalogBtn.onclick = () => {
    const shell = document.getElementById('catalogShell');
    if (shell) shell.classList.remove('open');
  };

  loadCatalog();
}

window.addEventListener('sections:loaded', initCatalog);
if (document.readyState !== 'loading') {
  initCatalog();
}
