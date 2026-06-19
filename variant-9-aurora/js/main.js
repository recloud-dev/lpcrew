// ===== AURORA — interactions =====
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;

  /* ---------- Count-up ---------- */
  function formatNum(value, decimals) {
    if (decimals > 0) {
      return value.toFixed(decimals).replace(".", ",");
    }
    return Math.round(value).toString();
  }
  function countUp(el) {
    var target = parseFloat(String(el.dataset.target).replace(",", "."));
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduced) { el.textContent = formatNum(target, decimals); return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(target * eased, decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNum(target, decimals);
    }
    requestAnimationFrame(step);
  }

  /* ---------- IntersectionObserver: reveals + counts ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.hasAttribute("data-target")) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal, [data-target]").forEach(function (el) { io.observe(el); });

  /* ---------- Magnetic buttons & cards ---------- */
  if (!reduced && !coarse) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = el.classList.contains("btn") ? 0.35 : 0.14;
      el.addEventListener("mousemove", function (ev) {
        var r = el.getBoundingClientRect();
        var x = ev.clientX - r.left - r.width / 2;
        var y = ev.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + (x * strength).toFixed(1) + "px," + (y * strength).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Horizontal gallery drag-scroll ---------- */
  var scroller = document.querySelector(".scroller");
  if (scroller) {
    var down = false, startX = 0, startScroll = 0, moved = false;
    scroller.addEventListener("mousedown", function (e) {
      down = true; moved = false; startX = e.pageX; startScroll = scroller.scrollLeft;
      scroller.classList.add("dragging");
    });
    window.addEventListener("mouseup", function () {
      down = false; scroller.classList.remove("dragging");
    });
    window.addEventListener("mousemove", function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      scroller.scrollLeft = startScroll - dx;
    });
    // prevent click-through after a drag
    scroller.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); }
    }, true);
  }

  /* ---------- Demo form ---------- */
  var form = document.getElementById("joinForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".note");
      if (note) {
        note.textContent = "Заявка принята (демо). На бою уйдёт в Telegram/CRM.";
        note.classList.add("ok");
      }
      form.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    });
  }

  /* ---------- Smooth-scroll nav (with sticky offset) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
