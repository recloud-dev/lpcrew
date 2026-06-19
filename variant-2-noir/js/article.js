// NOIR — article render by ?id= + carousel
(function () {
  const root = document.getElementById("article");
  if (!root || !window.LP_NEWS) return;

  const id = new URLSearchParams(location.search).get("id");
  const post = window.LP_NEWS.find(n => n.id === id) || window.LP_NEWS[0];
  document.title = post.title + " — LP Crew";
  const others = window.LP_NEWS.filter(n => n.id !== post.id).slice(0, 2);

  const slides = post.gallery.map((g, i) => `
    <figure class="slide" aria-roledescription="слайд" aria-label="${i + 1} из ${post.gallery.length}">
      <img src="${g.src}" alt="${g.caption || post.title}" ${i ? 'loading="lazy"' : ""}>
      ${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}
    </figure>`).join("");
  const dots = post.gallery.map((_, i) =>
    `<button class="dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Фото ${i + 1}"></button>`).join("");
  const body = post.body.map(p => `<p>${p}</p>`).join("");
  const related = others.map((n, k) => `
    <a class="n-row" href="article.html?id=${encodeURIComponent(n.id)}">
      <span class="n-i">${String(k + 1).padStart(2, "0")}</span>
      <img class="n-thumb" src="${n.cover}" alt="${n.title}" loading="lazy">
      <div class="n-meta"><span class="n-cat">${n.category}</span><h2>${n.title}</h2></div>
      <span class="n-arrow">↗</span>
    </a>`).join("");

  root.innerHTML = `
    <article class="art">
      <div class="art-cover">
        <img src="${post.cover}" alt="${post.title}">
        <div class="art-cover-shade"></div>
        <div class="art-head">
          <p class="tag">${post.category} · ${window.LP_FMT_DATE(post.date)}</p>
          <h1>${post.title}</h1>
        </div>
      </div>

      <div class="art-body">
        <p class="lead big">${post.lead}</p>

        <div class="carousel" aria-roledescription="карусель" aria-label="Фотографии">
          <div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>
          <button class="carousel-btn prev" aria-label="Назад">‹</button>
          <button class="carousel-btn next" aria-label="Вперёд">›</button>
          <div class="carousel-counter"><span class="cur">1</span> / ${post.gallery.length}</div>
          <div class="carousel-dots">${dots}</div>
        </div>

        ${body}

        <div class="art-cta">
          <a href="index.html#join" class="link-arrow">Присоединиться к заплыву →</a>
          <a href="news.html" class="link-arrow ghost">← Все новости</a>
        </div>
      </div>
    </article>

    <section class="ed alt related">
      <div class="ed-num">＋</div>
      <h2 class="ed-head">Ещё новости</h2>
      <div class="n-list">${related}</div>
    </section>
  `;

  initCarousel(root.querySelector(".carousel"), post.gallery.length);
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
