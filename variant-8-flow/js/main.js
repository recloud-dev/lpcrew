/* ============================================================
   FLOW / Маршрут — site chrome
   Header scroll state, smooth-scroll, scroll reveals, demo form.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky header shadow on scroll ---- */
  var hd = document.querySelector(".hd");
  function onScroll() {
    if (hd) hd.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Smooth-scroll for in-page anchors (incl. dynamic [data-scroll]) ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id);
  });

  /* ---- Scroll reveal for sections ---- */
  var revealables = document.querySelectorAll(
    ".sec .kicker, .sec h2, .sec-lead, .price, .coach, .rev, .news-teaser .post, .faq-item, .hero-card, .hero-float"
  );
  revealables.forEach(function (el) { el.classList.add("reveal"); });

  if (reduce || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- Demo form handler ---- */
  var form = document.getElementById("join-form");
  if (form) {
    var note = form.querySelector(".note");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (note) note.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM.";
      form.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    });
  }
})();
