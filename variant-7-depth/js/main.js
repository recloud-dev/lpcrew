// DEPTH — page-load dive intro, count-up, reveals, demo form.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dive intro ---------- */
  const intro = document.getElementById("diveIntro");
  const skip = document.getElementById("diveSkip");
  if (intro) {
    const dismiss = () => {
      intro.classList.add("hide");
      setTimeout(() => intro.remove(), 1000);
    };
    if (reduce) {
      intro.remove();
    } else {
      setTimeout(dismiss, 1200);
      skip && skip.addEventListener("click", dismiss);
    }
  }

  /* ---------- Count-up ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduce) {
      el.textContent = render(target, decimals);
      return;
    }
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = render(target * eased, decimals);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = render(target, decimals);
    }
    requestAnimationFrame(tick);
  }
  function render(v, decimals) {
    if (decimals > 0) return v.toFixed(decimals).replace(".", ",");
    return Math.round(v).toString();
  }

  const counters = Array.from(document.querySelectorAll(".num[data-target]"));
  const seen = new WeakSet();
  if (counters.length) {
    const statSection = document.getElementById("stats");
    const ioCount = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !seen.has(e.target)) {
          seen.add(e.target);
          countUp(e.target);
        }
      });
    }, { root: document.querySelector(".dive") && !window.matchMedia("(max-width:860px)").matches ? document.getElementById("dive") : null, threshold: 0.4 });
    counters.forEach(c => ioCount.observe(c));
  }

  /* ---------- Reveal fallback ----------
     depth.js toggles .active on sections; CSS reveals follow.
     This is a safety net for any .reveal outside a .snap. */
  const looseReveals = Array.from(document.querySelectorAll(".reveal")).filter(el => !el.closest(".snap"));
  if (looseReveals.length) {
    const ioR = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "none"; e.target.style.filter = "none"; ioR.unobserve(e.target); } });
    }, { threshold: 0.2 });
    looseReveals.forEach(el => ioR.observe(el));
  }

  /* ---------- Demo form ---------- */
  const form = document.getElementById("joinForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (note) {
        note.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM.";
        note.classList.add("ok");
      }
      form.querySelectorAll("input").forEach(i => (i.value = ""));
      const sel = form.querySelector("select");
      if (sel) sel.selectedIndex = 0;
    });
  }
})();
