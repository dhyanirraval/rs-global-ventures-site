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

  // Contact form handling
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.currentTarget;
      const status = document.getElementById('formStatus');
      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach(field => {
        if (!field.value.trim()) valid = false;
      });

      if (!valid) {
        if (status) {
          status.textContent = 'Please complete all required fields before submitting.';
          status.style.display = 'block';
          status.style.color = '#b42318';
        }
        return;
      }

      const body = Object.fromEntries(new FormData(form).entries());
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      try {
        const subject = encodeURIComponent('New Business Inquiry – RS Global Ventures');
        const lines = [
          `Name: ${body.name}`,
          `Company: ${body.company}`,
          `Customer Email: ${body.email}`,
          `Phone / WhatsApp: ${body.phone}`,
          `Country: ${body.country}`,
          `Product / Category: ${body.category}`,
          `Quantity / Requirement: ${body.quantity}`,
          `Message: ${body.message}`
        ];
        const mailto = `mailto:info@rsglobalventures.in?subject=${subject}&body=${encodeURIComponent(lines.join('\n\n'))}`;
        window.location.href = mailto;
        form.reset();
        if (status) {
          status.textContent = 'Your email application will open with the inquiry addressed to info@rsglobalventures.in. Please send the email to complete your enquiry.';
          status.style.display = 'block';
          status.style.color = '#0f766e';
        }
      } catch (error) {
        if (status) {
          status.textContent = 'There was a problem preparing your inquiry. Please email info@rsglobalventures.in directly or contact us by WhatsApp.';
          status.style.display = 'block';
          status.style.color = '#b42318';
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  // Set current year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // WhatsApp integration
  const WHATSAPP_NUMBER = '919979267148';
  const WHATSAPP_URL = 'https://wa.me/919979267148?text=Hello%20RS%20Global%20Ventures%2C%20I%20am%20interested%20in%20your%20products%20and%20would%20like%20to%20know%20more.';

  function openWhatsAppInquiry() {
    const w = window.open(WHATSAPP_URL, '_blank');
    if (w) w.opener = null;
  }

  function updateWhatsAppPosition() {
    const float = document.getElementById('whatsappFloat');
    const footer = document.querySelector('footer');
    if (!float || !footer) return;
    const fRect = float.getBoundingClientRect();
    const footRect = footer.getBoundingClientRect();
    if (fRect.bottom > footRect.top) {
      float.classList.add('lift-up');
    } else {
      float.classList.remove('lift-up');
    }
  }

  document.getElementById('whatsappFloat')?.addEventListener('click', openWhatsAppInquiry);
  document.getElementById('heroWhatsAppBtn')?.addEventListener('click', openWhatsAppInquiry);
  window.addEventListener('scroll', updateWhatsAppPosition, { passive: true });
  window.addEventListener('resize', updateWhatsAppPosition);
  setTimeout(updateWhatsAppPosition, 600);
}

window.addEventListener('sections:loaded', initSite);
if (document.readyState !== 'loading') {
  initSite();
}
