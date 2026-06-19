// ===== LP Crew redesign — interactions =====

// Mobile menu
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
if (burger) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  }));
}

// Animated stat counters
function animateCount(el) {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const dur = 1400;
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = (target * eased).toFixed(decimals);
    el.textContent = decimals ? val.replace('.', ',') : Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = decimals ? target.toFixed(decimals).replace('.', ',') : target;
  }
  requestAnimationFrame(step);
}

// Reveal-on-scroll + trigger counters
const revealEls = document.querySelectorAll('.section, .stats, .hero-inner');
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll?.('.stat-num[data-target]').forEach(n => {
      if (!n.dataset.done) { n.dataset.done = '1'; animateCount(n); }
    });
    io.unobserve(e.target);
  });
}, { threshold: 0.18 });

revealEls.forEach(el => io.observe(el));

// Demo form feedback
const form = document.querySelector('.join-form');
if (form) {
  form.addEventListener('submit', () => {
    const note = form.querySelector('.form-note');
    note.textContent = 'Спасибо! Это демо-прототип — на боевом сайте заявка уйдёт в Telegram/CRM.';
    note.style.color = 'var(--teal)';
    form.reset();
  });
}
