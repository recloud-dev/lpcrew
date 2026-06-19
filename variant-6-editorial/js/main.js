// PULSE — counters + reveal + demo form
function countUp(el) {
  const t = parseFloat(el.dataset.target), dec = parseInt(el.dataset.decimals || "0", 10), dur = 1400;
  let s = null;
  function f(ts) {
    if (!s) s = ts;
    const p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = dec ? (t * e).toFixed(dec).replace(".", ",") : Math.round(t * e);
    if (p < 1) requestAnimationFrame(f); else el.textContent = dec ? t.toFixed(dec).replace(".", ",") : t;
  }
  requestAnimationFrame(f);
}
document.querySelectorAll(".sec, .stats, .hero-inner").forEach(el => el.classList.add("rv"));
const io = new IntersectionObserver((es) => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll?.(".num[data-target]").forEach(n => { if (!n.dataset.done) { n.dataset.done = 1; countUp(n); } });
    io.unobserve(e.target);
  });
}, { threshold: .15 });
document.querySelectorAll(".rv").forEach(el => io.observe(el));

const form = document.querySelector(".form");
if (form) form.addEventListener("submit", () => {
  const n = form.querySelector(".note");
  n.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM.";
  n.style.color = "var(--acc)";
  form.querySelectorAll("input").forEach(i => i.value = "");
});
