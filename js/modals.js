// Modal management and event handling

function openModal(id) {
  const m = document.getElementById(id);
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal.open')) {
    document.body.style.overflow = '';
  }
}

// Close button event listeners
document.querySelectorAll('[data-close]').forEach(b => 
  b.addEventListener('click', () => closeModal(b.dataset.close))
);

// Close modal on background click
document.querySelectorAll('.modal').forEach(m => 
  m.addEventListener('click', e => {
    if (e.target === m) closeModal(m.id);
  })
);
