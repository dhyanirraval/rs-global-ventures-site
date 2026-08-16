// Main app initialization and event handlers

function initSite() {
  const header = document.getElementById('header');
  const navLinks = document.getElementById('navLinks');
  const menuBtn = document.getElementById('menuBtn');

  // Header scroll effect
  if (header) {
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
  }

  // Mobile menu toggle
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    // Close menu when clicking nav links
    navLinks.querySelectorAll('a').forEach(a => 
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // Navigation active state tracking
  const sections = [...document.querySelectorAll('main section[id]')];
  const navAnchors = navLinks ? [...navLinks.querySelectorAll('a')] : [];

  if (navAnchors.length && sections.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(a => 
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
          );
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    sections.forEach(s => io.observe(s));
  }

  // Reveal animation on scroll
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: .12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Quote form handling
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', e => {
      e.preventDefault();
      const status = document.getElementById('formStatus');
      if (status) {
        status.style.display = 'block';
        status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Set current year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // WhatsApp integration
  const WHATSAPP_NUMBER = '';

  function openWhatsAppInquiry() {
    const message = 'Hello RS Global Ventures, I would like to make an export inquiry. Please share product details, MOQ, pricing, and shipping options.';
    if (!WHATSAPP_NUMBER) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      alert('Please add your WhatsApp number in the WHATSAPP_NUMBER setting in js/main.js before launch.');
      return;
    }
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
  }

  document.getElementById('whatsappFloat')?.addEventListener('click', openWhatsAppInquiry);
  document.getElementById('heroWhatsAppBtn')?.addEventListener('click', openWhatsAppInquiry);
}

window.addEventListener('sections:loaded', initSite);
if (document.readyState !== 'loading') {
  initSite();
}
