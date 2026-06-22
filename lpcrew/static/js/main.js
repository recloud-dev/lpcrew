// ===== LP Crew — TIDAL · interactions (Wagtail) =====
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dive intro / загрузка ---------- */
  const intro = document.getElementById("diveIntro");
  const skip = document.getElementById("diveSkip");
  if (intro) {
    const dismiss = () => {
      intro.classList.add("hide");
      setTimeout(() => intro.remove(), 1000);
    };
    if (reduce) intro.remove();
    else {
      setTimeout(dismiss, 1300);
      skip && skip.addEventListener("click", dismiss);
    }
  }

  /* ---------- Hero — смена изображений по таймеру ---------- */
  const heroSlides = Array.from(document.querySelectorAll(".hero-img"));
  if (heroSlides.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      heroSlides[i].classList.remove("is-active");
      i = (i + 1) % heroSlides.length;
      heroSlides[i].classList.add("is-active");
    }, 4500);
  }

  /* ---------- Цифры крутятся при прокрутке ---------- */
  function animateCount(el) {
    const target = parseFloat(String(el.dataset.target).replace(",", "."));
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduce) {
      el.textContent = decimals ? target.toFixed(decimals).replace(".", ",") : target;
      return;
    }
    const dur = 1400;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = decimals ? (target * eased).toFixed(decimals).replace(".", ",") : Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = decimals ? target.toFixed(decimals).replace(".", ",") : target;
    }
    requestAnimationFrame(step);
  }
  const counters = Array.from(document.querySelectorAll(".stat-num[data-target]"));
  if (counters.length) {
    const ioC = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.done) {
          e.target.dataset.done = "1";
          animateCount(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => ioC.observe(c));
  }

  /* ---------- FAQ-аккордеон ---------- */
  document.querySelectorAll(".faq-item").forEach(item => {
    const btn = item.querySelector(".faq-q");
    const panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- Фото: ч/б по умолчанию, цвет по клику (тач) ---------- */
  document.querySelectorAll("img.tone").forEach(img => {
    if (img.closest("a")) return;
    img.addEventListener("click", () => img.classList.toggle("lit"));
  });

  /* ---------- Reveal on scroll ---------- */
  document.querySelectorAll(".ed,.quote,.field-head,.field-lead,.stats,.reviews,.marquee,.swim,.rev,.season-card,.coach,.price,.faq-item")
    .forEach(el => el.classList.add("rv"));
  const ioRv = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); ioRv.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach(el => ioRv.observe(el));

  /* ---------- Join form (реальная отправка заявки) ---------- */
  const form = document.getElementById("joinForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const note = form.querySelector(".note");
      const btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      fetch(form.action, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: new FormData(form),
      })
        .then(r => r.json().catch(() => ({ ok: r.ok })))
        .then(data => {
          if (note) {
            note.textContent = data.ok
              ? "Заявка принята! Мы свяжемся с вами."
              : (data.error || "Не удалось отправить. Попробуйте позже.");
            note.style.color = data.ok ? "var(--accent)" : "";
          }
          if (data.ok) form.querySelectorAll("input").forEach(i => { if (i.type !== "hidden") i.value = ""; });
        })
        .catch(() => { if (note) note.textContent = "Сеть недоступна. Попробуйте позже."; })
        .finally(() => { if (btn) btn.disabled = false; });
    });
  }

  /* ---------- Карусель (страницы заплыва и новости, server-rendered) ---------- */
  document.querySelectorAll(".carousel").forEach(el => {
    initCarousel(el, el.querySelectorAll(".slide").length);
  });
  function initCarousel(el, count) {
    if (!el) return;
    if (count <= 1) { el.querySelectorAll(".carousel-btn,.carousel-dots,.carousel-counter").forEach(n => n.style.display = "none"); return; }
    const track = el.querySelector(".carousel-track");
    const dots = [...el.querySelectorAll(".dot")];
    const cur = el.querySelector(".cur");
    let i = 0;
    function go(n) {
      i = (n + count) % count;
      track.style.transform = `translateX(${-i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      if (cur) cur.textContent = i + 1;
    }
    el.querySelector(".next").addEventListener("click", () => go(i + 1));
    el.querySelector(".prev").addEventListener("click", () => go(i - 1));
    dots.forEach(d => d.addEventListener("click", () => go(+d.dataset.i)));
    el.tabIndex = 0;
    el.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
    let x0 = null; const vp = el.querySelector(".carousel-viewport");
    vp.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
    vp.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1); x0 = null; });
    go(0);
  }
})();
