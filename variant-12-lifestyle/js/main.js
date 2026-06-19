// ===== LIFESTYLE — interactions =====
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Count-up ---------- */
  function fmt(v, d) { return d > 0 ? v.toFixed(d).replace(".", ",") : Math.round(v).toString(); }
  function runCount(el) {
    var target = parseFloat(String(el.dataset.target).replace(",", "."));
    var dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduced) { el.textContent = fmt(target, dec); return; }
    var dur = 1600, start = null;
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
        [].slice.call(en.target.children).forEach(function (c, i) { c.style.transitionDelay = (reduced ? 0 : i * 0.08) + "s"; });
      }
      if (en.target.querySelectorAll) en.target.querySelectorAll("[data-target]").forEach(function (n) { runCount(n); });
      if (en.target.hasAttribute("data-target")) runCount(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.16 });
  document.querySelectorAll(".reveal,[data-stagger],[data-target]").forEach(function (el) { io.observe(el); });

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.pageYOffset > 30); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Swiper-style carousels (arrows + drag) ---------- */
  document.querySelectorAll("[data-rail]").forEach(function (group) {
    var rail = group.querySelector(".rail");
    var prev = group.querySelector("[data-rail-prev]");
    var next = group.querySelector("[data-rail-next]");
    if (!rail) return;

    function step() {
      var card = rail.querySelector(".swipe-card");
      if (!card) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || "20") || 20;
      return card.getBoundingClientRect().width + gap;
    }
    function updateBtns() {
      if (!prev || !next) return;
      var max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
    }
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }); });
    rail.addEventListener("scroll", updateBtns, { passive: true });
    window.addEventListener("resize", updateBtns);
    updateBtns();

    // drag to scroll
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener("mousedown", function (e) { down = true; moved = false; sx = e.pageX; sl = rail.scrollLeft; rail.classList.add("dragging"); });
    window.addEventListener("mouseup", function () { down = false; rail.classList.remove("dragging"); });
    window.addEventListener("mousemove", function (e) { if (!down) return; var dx = e.pageX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    rail.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  });

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

  /* ---------- Mobile nav (burger + drawer) ---------- */
  (function () {
    var hd = document.querySelector(".hd-in");
    var src = hd && hd.querySelector(".nav");
    if (!hd || !src) return;
    var burger = hd.querySelector(".m-burger");
    if (!burger) {
      burger = document.createElement("button");
      burger.className = "m-burger"; burger.setAttribute("aria-label", "Меню");
      burger.innerHTML = "<span></span><span></span><span></span>";
      hd.appendChild(burger);
    }
    var drawer = document.createElement("nav");
    drawer.className = "m-drawer"; drawer.setAttribute("aria-label", "Мобильное меню");
    drawer.innerHTML = src.innerHTML;
    drawer.querySelectorAll(".lang,.caret").forEach(function (n) { n.remove(); });
    document.body.appendChild(drawer);
    function setOpen(o) {
      burger.classList.toggle("open", o); drawer.classList.toggle("open", o);
      document.body.classList.toggle("m-lock", o); burger.setAttribute("aria-expanded", String(o));
    }
    burger.addEventListener("click", function () { setOpen(!drawer.classList.contains("open")); });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();

  /* ---------- Smooth-scroll nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
