// Header shading, mobile menu, scroll reveals, garage filter and arrows, screenshot lightbox. No libraries.
(() => {
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector('.menu-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    const set = open => { toggle.setAttribute('aria-expanded', String(open)); links.classList.toggle('open', open); };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  const garage = document.querySelector('.garage');
  document.querySelectorAll('.tiers button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.tiers button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const tier = button.dataset.filter;
    garage.querySelectorAll('.car').forEach(car => { car.hidden = tier !== 'all' && car.dataset.tier !== tier; });
    garage.scrollTo({ left: 0, behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    garage.scrollBy({ left: Number(button.dataset.scroll) * garage.clientWidth * 0.8, behavior: 'smooth' });
  }));

  const box = document.querySelector('.lightbox');
  if (box && box.showModal) {
    const img = box.querySelector('img');
    document.querySelectorAll('.gallery button').forEach(button => button.addEventListener('click', () => {
      const thumb = button.querySelector('img');
      img.src = button.dataset.full;
      img.alt = thumb.alt;
      box.showModal();
    }));
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
  }
})();
