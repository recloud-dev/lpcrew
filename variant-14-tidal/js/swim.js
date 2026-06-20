// TIDAL — страница заплыва по ?id= + карусель (как у новостей)
(function () {
  const root = document.getElementById("swim");
  if (!root || !window.LP_SWIMS) return;

  const id = new URLSearchParams(location.search).get("id");
  const sw = window.LP_SWIMS.find(s => s.id === id) || window.LP_SWIMS[0];
  document.title = sw.title + " — заплыв LP Crew";
  const others = window.LP_SWIMS.filter(s => s.id !== sw.id).slice(0, 3);

  const slides = sw.gallery.map((g, i) => `
    <figure class="slide" aria-roledescription="слайд" aria-label="${i + 1} из ${sw.gallery.length}">
      <img src="${g.src}" alt="${g.caption || sw.title}" ${i ? 'loading="lazy"' : ""}>
      ${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}
    </figure>`).join("");
  const dots = sw.gallery.map((_, i) =>
    `<button class="dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Фото ${i + 1}"></button>`).join("");
  const body = sw.body.map(p => `<p>${p}</p>`).join("");
  const related = others.map(s => `
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

  root.innerHTML = `
    <article class="art">
      <div class="art-cover">
        <img src="${sw.cover}" alt="${sw.title}">
        <div class="art-cover-shade"></div>
        <div class="art-head">
          <p class="tag">${sw.place} · ${sw.distance}</p>
          <h1>${sw.title}</h1>
        </div>
      </div>

      <div class="art-body">
        <p class="lead big">${sw.lead}</p>

        <div class="carousel" aria-roledescription="карусель" aria-label="Фотографии заплыва">
          <div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>
          <button class="carousel-btn prev" aria-label="Назад">‹</button>
          <button class="carousel-btn next" aria-label="Вперёд">›</button>
          <div class="carousel-counter"><span class="cur">1</span> / ${sw.gallery.length}</div>
          <div class="carousel-dots">${dots}</div>
        </div>

        ${body}

        <div class="art-cta">
          <a href="index.html#join" class="link-arrow">Присоединиться к заплыву →</a>
          <a href="index.html#field" class="link-arrow ghost">← Все заплывы</a>
        </div>
      </div>
    </article>

    <section class="field related">
      <div class="ed-num light">＋</div>
      <h2 class="field-head">Другие заплывы</h2>
      <div class="strip">${related}</div>
    </section>
  `;

  initCarousel(root.querySelector(".carousel"), sw.gallery.length);
})();

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
