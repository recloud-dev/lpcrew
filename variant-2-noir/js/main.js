// NOIR — reveal on scroll
document.querySelectorAll('.ed, .quote, .field-head, .strip figure').forEach(el => el.classList.add('rv'));
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

const form = document.querySelector('.form');
if (form) form.addEventListener('submit', () => {
  const n = form.querySelector('.note');
  n.textContent = 'Заявка принята (демо). На бою уйдёт в Telegram/CRM.';
  n.style.color = 'var(--accent)';
  form.querySelectorAll('input').forEach(i => i.value = '');
});
