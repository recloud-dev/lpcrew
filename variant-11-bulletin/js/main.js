// ===== BULLETIN — interactions =====
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("load", function () { document.body.classList.add("loaded"); });

  /* ---------- Reading progress bar ---------- */
  var bar = document.querySelector(".progress");
  function progress() {
    if (!bar) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? (window.pageYOffset / h) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, p)) + "%";
  }

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  var hasHero = !!document.querySelector(".hero, .art-cover, #article");
  function headerState() {
    if (!header) return;
    if (!hasHero) { header.classList.add("scrolled"); return; }
    header.classList.toggle("scrolled", window.pageYOffset > window.innerHeight * 0.7 || window.pageYOffset > 600);
  }

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
        [].slice.call(en.target.children).forEach(function (c, i) { c.style.transitionDelay = (reduced ? 0 : i * 0.09) + "s"; });
      }
      if (en.target.querySelectorAll) en.target.querySelectorAll("[data-target]").forEach(function (n) { runCount(n); });
      if (en.target.hasAttribute("data-target")) runCount(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.16 });
  document.querySelectorAll(".reveal,[data-stagger],[data-target],.statstrip").forEach(function (el) { io.observe(el); });

  /* ---------- Parallax: hero bg + full-bleed images ---------- */
  var hero = document.querySelector(".hero-bg img");
  var bleeds = [].slice.call(document.querySelectorAll(".bleed-inner img"));
  var ticking = false;
  function parallax() {
    var vh = window.innerHeight;
    if (hero) {
      var hy = window.pageYOffset;
      hero.style.transform = "translateY(" + (hy * 0.22).toFixed(1) + "px)";
    }
    bleeds.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var prog = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5 range-ish
      img.style.transform = "translateY(" + (prog * -38).toFixed(1) + "px)";
    });
    ticking = false;
  }

  function onScroll() {
    progress(); headerState();
    if (!reduced && !ticking) { requestAnimationFrame(parallax); ticking = true; }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { progress(); if (!reduced) parallax(); }, { passive: true });
  onScroll(); if (!reduced) parallax();

  /* ---------- Horizontal drag-scroll gallery ---------- */
  var scroller = document.querySelector(".scroller");
  if (scroller) {
    var down = false, sx = 0, sl = 0, moved = false;
    scroller.addEventListener("mousedown", function (e) { down = true; moved = false; sx = e.pageX; sl = scroller.scrollLeft; scroller.classList.add("dragging"); });
    window.addEventListener("mouseup", function () { down = false; scroller.classList.remove("dragging"); });
    window.addEventListener("mousemove", function (e) { if (!down) return; var dx = e.pageX - sx; if (Math.abs(dx) > 4) moved = true; scroller.scrollLeft = sl - dx; });
    scroller.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  }

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
      var top = t.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
