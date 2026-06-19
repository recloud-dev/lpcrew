// ===== KINETIC — interactions =====
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;

  document.documentElement.classList.add("js");
  window.addEventListener("load", function () { document.body.classList.add("loaded"); });

  /* ---------- Custom cursor (ring + dot, lerp follow) ---------- */
  if (!reduced && !coarse) {
    var ring = document.createElement("div"); ring.className = "cursor";
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add("has-cursor");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a,button,[data-cursor]").forEach(function (el) {
      var label = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", function () {
        ring.classList.add("hot");
        if (label) ring.setAttribute("data-label", label);
      });
      el.addEventListener("mouseleave", function () { ring.classList.remove("hot"); ring.removeAttribute("data-label"); });
    });
  }

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

  /* ---------- Reveal + stagger + count triggers ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target.hasAttribute("data-stagger")) {
        [].slice.call(en.target.children).forEach(function (c, i) {
          c.style.transitionDelay = (reduced ? 0 : i * 0.08) + "s";
        });
      }
      en.target.querySelectorAll && en.target.querySelectorAll("[data-target]").forEach(function (n) { runCount(n); });
      if (en.target.hasAttribute("data-target")) runCount(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.16 });
  document.querySelectorAll(".reveal,[data-stagger],[data-target],.stat").forEach(function (el) { io.observe(el); });

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.pageYOffset > 40); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Parallax (hero bg + [data-parallax]) ---------- */
  if (!reduced) {
    var pxEls = [].slice.call(document.querySelectorAll("[data-parallax]"));
    var hero = document.querySelector(".hero-bg img");
    var ticking = false;
    function px() {
      var y = window.pageYOffset;
      if (hero) hero.style.transform = "translateY(" + (y * 0.18).toFixed(1) + "px)";
      pxEls.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax) || 0.12;
        var r = el.getBoundingClientRect();
        var off = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = "translateY(" + off.toFixed(1) + "px)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(px); ticking = true; }
    }, { passive: true });
    px();
  }

  /* ---------- Magnetic buttons ---------- */
  if (!reduced && !coarse) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (ev) {
        var r = el.getBoundingClientRect();
        var x = ev.clientX - r.left - r.width / 2;
        var y = ev.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + (x * 0.3).toFixed(1) + "px," + (y * 0.4).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Horizontal drag-scroll gallery ---------- */
  var scroller = document.querySelector(".scroller");
  if (scroller) {
    var down = false, sx = 0, sl = 0, moved = false;
    scroller.addEventListener("mousedown", function (e) { down = true; moved = false; sx = e.pageX; sl = scroller.scrollLeft; scroller.classList.add("dragging"); });
    window.addEventListener("mouseup", function () { down = false; scroller.classList.remove("dragging"); });
    window.addEventListener("mousemove", function (e) {
      if (!down) return;
      var dx = e.pageX - sx;
      if (Math.abs(dx) > 4) moved = true;
      scroller.scrollLeft = sl - dx;
    });
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
      var top = t.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
