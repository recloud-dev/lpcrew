// DEPTH — scroll orchestration, depth gauge, parallax, dot-nav.
(function () {
  const dive = document.getElementById("dive");
  const sections = Array.from(document.querySelectorAll(".snap"));
  if (!dive || !sections.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;
  // On mobile the page scrolls on window, not the .dive container.
  const scroller = () => (isMobile() ? document.scrollingElement : dive);

  /* ---- Bubbles (bioluminescent particles) ---- */
  if (!reduce) {
    sections.forEach(sec => {
      const host = sec.querySelector(".bubbles");
      if (!host) return;
      const n = +host.dataset.bubbles || 8;
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i");
        const size = 3 + Math.random() * 7;
        b.style.left = Math.random() * 100 + "%";
        b.style.width = b.style.height = size + "px";
        b.style.animationDuration = 7 + Math.random() * 9 + "s";
        b.style.animationDelay = -Math.random() * 12 + "s";
        host.appendChild(b);
      }
    });
  }

  /* ---- Dot nav ---- */
  const dotNav = document.getElementById("dotNav");
  const dots = sections.map((sec, i) => {
    const btn = document.createElement("button");
    btn.setAttribute("aria-label", "Раздел: " + (sec.dataset.name || sec.id));
    btn.innerHTML = `<span class="tip">${sec.dataset.name || sec.id}</span>`;
    btn.addEventListener("click", () => {
      sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    dotNav.appendChild(btn);
    return btn;
  });

  /* ---- Depth gauge ---- */
  const gFill = document.getElementById("gFill");
  const gRead = document.getElementById("gRead");
  const maxDepth = +(sections[sections.length - 1].dataset.depth) || 380;
  const depths = sections.map(s => +s.dataset.depth || 0);
  const fmtDepth = m => (Number.isInteger(m) ? m : m.toFixed(1).replace(".", ",")) + "м";

  /* ---- Header shadow ---- */
  const hd = document.getElementById("top");

  /* ---- Parallax targets ---- */
  const parallax = Array.from(document.querySelectorAll("[data-parallax]"));

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sc = scroller();
      const top = sc.scrollTop;
      const max = sc.scrollHeight - sc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;

      // Gauge fill + meter reading (interpolate across section depths)
      gFill.style.height = (progress * 100).toFixed(2) + "%";
      const meters = progress * maxDepth;
      gRead.textContent = fmtDepth(Math.round(meters * 10) / 10);

      // Header style
      hd.classList.toggle("scrolled", top > 40);

      // Parallax (hero bg drifts slower)
      if (!reduce) {
        parallax.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.3;
          const rect = el.parentElement.getBoundingClientRect();
          el.style.transform = `translate3d(0, ${(-rect.top * speed).toFixed(1)}px, 0) scale(1.12)`;
        });
      }
      ticking = false;
    });
  }

  (isMobile() ? window : dive).addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---- Active section via IntersectionObserver ---- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        const i = sections.indexOf(e.target);
        sections.forEach(s => s.classList.remove("active"));
        e.target.classList.add("active");
        dots.forEach((d, k) => d.classList.toggle("active", k === i));
      }
    });
  }, { root: isMobile() ? null : dive, threshold: [0.5, 0.6] });
  sections.forEach(s => io.observe(s));

  // Activate first section immediately so hero reveals fire.
  sections[0].classList.add("active");
  if (dots[0]) dots[0].classList.add("active");

  // Expose for main.js (count-up triggers on stats activation)
  window.LP_DEPTH = { sections };
})();
