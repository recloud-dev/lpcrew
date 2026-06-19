// ===== CUPERTINO — interactions =====
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Count-up ---------- */
  function fmt(v, d) { return d > 0 ? v.toFixed(d).replace(".", ",") : Math.round(v).toString(); }
  function runCount(el) {
    var target = parseFloat(String(el.dataset.target).replace(",", "."));
    var dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduced) { el.textContent = fmt(target, dec); return; }
    var dur = 1700, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target, dec);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveals + stagger + counts ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target.hasAttribute("data-stagger")) {
        [].slice.call(en.target.children).forEach(function (c, i) { c.style.transitionDelay = (reduced ? 0 : i * 0.07) + "s"; });
      }
      if (en.target.querySelectorAll) en.target.querySelectorAll("[data-target]").forEach(function (n) { runCount(n); });
      if (en.target.hasAttribute("data-target")) runCount(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal,[data-stagger],[data-target]").forEach(function (el) { io.observe(el); });

  /* ---------- Nav scrolled state ---------- */
  var nav = document.querySelector(".nav");
  function navState() { if (nav) nav.classList.toggle("scrolled", window.pageYOffset > 12); }

  /* ---------- Scale-on-scroll media (Apple reveal) ---------- */
  var scalers = [].slice.call(document.querySelectorAll("[data-scale]"));
  var ticking = false;
  function scaleStep() {
    var vh = window.innerHeight;
    scalers.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      // progress: 0 when top enters bottom of viewport, 1 when element centered/above
      var prog = 1 - Math.max(0, Math.min(1, (r.top) / vh));
      var s = 0.92 + prog * 0.08; // 0.92 -> 1.0
      el.style.transform = "scale(" + Math.min(1, s).toFixed(3) + ")";
    });
    ticking = false;
  }
  function onScroll() {
    navState();
    if (!reduced && scalers.length && !ticking) { requestAnimationFrame(scaleStep); ticking = true; }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { if (!reduced) scaleStep(); }, { passive: true });
  navState(); if (!reduced) scaleStep();

  /* ---------- Mobile nav ---------- */
  (function () {
    var navin = document.querySelector(".nav-in");
    var src = navin && navin.querySelector(".nav-links");
    if (!navin || !src) return;
    var burger = navin.querySelector(".m-burger");
    if (!burger) {
      burger = document.createElement("button");
      burger.className = "m-burger"; burger.setAttribute("aria-label", "Меню");
      burger.innerHTML = "<span></span><span></span><span></span>";
      navin.appendChild(burger);
    }
    var drawer = document.createElement("nav");
    drawer.className = "m-drawer";
    drawer.innerHTML = src.innerHTML;
    document.body.appendChild(drawer);
    function setOpen(o) {
      burger.classList.toggle("open", o); drawer.classList.toggle("open", o);
      document.body.classList.toggle("m-lock", o);
    }
    burger.addEventListener("click", function () { setOpen(!drawer.classList.contains("open")); });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();

  /* ---------- Demo form ---------- */
  var form = document.getElementById("joinForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".note");
      if (note) { note.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM."; note.classList.add("ok"); }
      form.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    });
  }

  /* ---------- Smooth-scroll nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.pageYOffset - 60;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
