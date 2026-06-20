// ===== LP Crew — TIDAL · interactions =====
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dive intro / загрузка (как в depth) ---------- */
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

  /* ---------- Заплывы — кликабельная лента (раздел «Вода») ---------- */
  const strip = document.getElementById("swimStrip");
  if (strip && window.LP_SWIMS) {
    strip.innerHTML = window.LP_SWIMS.map(s => `
      <a class="swim" href="swim.html?id=${encodeURIComponent(s.id)}">
        <figure>
          <img class="tone" src="${s.cover}" alt="${s.title}" loading="lazy">
          <figcaption>
            <span class="sw-place">${s.place}</span>
            <span class="sw-title">${s.title} <i>↗</i></span>
            <span class="sw-dist">${s.distance}</span>
          </figcaption>
        </figure>
      </a>`).join("");
  }

  /* ---------- Отзывы — лента с прокруткой ---------- */
  const rev = document.getElementById("revStrip");
  if (rev && window.LP_REVIEWS) {
    rev.innerHTML = window.LP_REVIEWS.map(r => `
      <figure class="rev">
        <div class="qm" aria-hidden="true">“</div>
        <blockquote>${r.text}</blockquote>
        <figcaption class="who">
          <span class="av">${r.initial}</span>
          <span><b>${r.name}</b><span class="who-role">${r.role}</span></span>
        </figcaption>
      </figure>`).join("");
  }

  /* ---------- Цифры крутятся при прокрутке (как в aqua) ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduce) {
      el.textContent = decimals ? target.toFixed(decimals).replace(".", ",") : target;
      return;
    }
    const dur = 1400; // та же скорость, что в aqua
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
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

  /* ---------- FAQ-аккордеон (как во flow) ---------- */
  document.querySelectorAll(".faq-item").forEach(item => {
    const btn = item.querySelector(".faq-q");
    const panel = item.querySelector(".faq-a");
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- Фото: ч/б по умолчанию, цвет по клику (тач) ---------- */
  // hover обрабатывает CSS; клик фиксирует цвет для тач-устройств
  document.querySelectorAll("img.tone").forEach(img => {
    if (img.closest("a")) return; // ссылки (заплывы) не трогаем — там переход
    img.addEventListener("click", () => img.classList.toggle("lit"));
  });

  /* ---------- Reveal on scroll ---------- */
  document.querySelectorAll(".ed,.quote,.field-head,.field-lead,.stats,.reviews,.marquee,.swim,.rev,.season-card,.coach,.price,.faq-item")
    .forEach(el => el.classList.add("rv"));
  const ioRv = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); ioRv.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach(el => ioRv.observe(el));

  /* ---------- Demo form ---------- */
  const form = document.querySelector(".form");
  if (form) form.addEventListener("submit", () => {
    const n = form.querySelector(".note");
    n.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM.";
    n.style.color = "var(--accent)";
    form.querySelectorAll("input").forEach(i => i.value = "");
  });
})();
