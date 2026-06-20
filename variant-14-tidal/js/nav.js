// Мобильное меню: строит бургер + выезжающий drawer из ссылок шапки.
// Подключается на все страницы варианта (index / news / article).
(function () {
  const header = document.querySelector(".hd, .bar, .site-header");
  if (!header) return;
  const src = header.querySelector(".nav, nav");
  if (!src || header.querySelector(".m-burger")) return;

  const burger = document.createElement("button");
  burger.className = "m-burger";
  burger.setAttribute("aria-label", "Меню");
  burger.setAttribute("aria-expanded", "false");
  burger.innerHTML = "<span></span><span></span><span></span>";

  const drawer = document.createElement("nav");
  drawer.className = "m-drawer";
  drawer.setAttribute("aria-label", "Мобильное меню");
  drawer.innerHTML = src.innerHTML;

  header.appendChild(burger);
  document.body.appendChild(drawer);

  function setOpen(open) {
    burger.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    document.body.classList.toggle("m-lock", open);
    burger.setAttribute("aria-expanded", String(open));
  }
  burger.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
})();
