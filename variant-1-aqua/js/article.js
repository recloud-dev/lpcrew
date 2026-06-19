// ===== Страница новости: рендер по ?id= + карусель фото =====
(function () {
  const root = document.getElementById("article");
  if (!root || !window.LP_NEWS) return;

  const id = new URLSearchParams(location.search).get("id");
  const post = window.LP_NEWS.find(n => n.id === id) || window.LP_NEWS[0];
  document.title = post.title + " — LP Crew";

  // «Другие новости» — все, кроме текущей
  const others = window.LP_NEWS.filter(n => n.id !== post.id).slice(0, 2);

  const slides = post.gallery.map((g, i) => `
    <figure class="slide" role="group" aria-roledescription="слайд" aria-label="${i + 1} из ${post.gallery.length}">
      <img src="${g.src}" alt="${g.caption || post.title}" ${i ? 'loading="lazy"' : ""}>
      ${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}
    </figure>`).join("");

  const dots = post.gallery.map((_, i) =>
    `<button class="dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Фото ${i + 1}"></button>`).join("");

  const bodyHtml = post.body.map(p => `<p>${p}</p>`).join("");

  const related = others.map(n => `
    <a class="post" href="article.html?id=${encodeURIComponent(n.id)}">
      <img class="post-img" src="${n.cover}" alt="${n.title}" loading="lazy">
      <div class="post-body">
        <time>${n.category} · ${window.LP_FMT_DATE(n.date)}</time>
        <h3>${n.title}</h3>
      </div>
    </a>`).join("");

  root.innerHTML = `
    <article class="article">
      <div class="article-cover" style="background-image:url('${post.cover}')">
        <div class="article-cover-shade"></div>
        <div class="container article-head">
          <nav class="crumbs light"><a href="index.html">Главная</a> <span>/</span> <a href="news.html">Новости</a> <span>/</span> ${post.category}</nav>
          <span class="badge">${post.category}</span>
          <h1>${post.title}</h1>
          <p class="article-meta"><time datetime="${post.date}">${window.LP_FMT_DATE(post.date)}</time> · LP&nbsp;Crew</p>
        </div>
      </div>

      <div class="container article-body">
        <p class="article-lead">${post.lead}</p>

        <div class="carousel" aria-roledescription="карусель" aria-label="Фотографии новости">
          <div class="carousel-viewport">
            <div class="carousel-track">${slides}</div>
          </div>
          <button class="carousel-btn prev" aria-label="Предыдущее фото">‹</button>
          <button class="carousel-btn next" aria-label="Следующее фото">›</button>
          <div class="carousel-dots">${dots}</div>
          <div class="carousel-counter"><span class="cur">1</span> / ${post.gallery.length}</div>
        </div>

        ${bodyHtml}

        <div class="article-cta">
          <a href="index.html#join" class="btn btn-accent">Записаться на тренировку</a>
          <a href="news.html" class="btn btn-ghost btn-dark">← Все новости</a>
        </div>
      </div>
    </article>

    <section class="section alt related">
      <div class="container">
        <h2 class="center">Другие новости</h2>
        <div class="news-grid">${related}</div>
      </div>
    </section>
  `;

  initCarousel(root.querySelector(".carousel"), post.gallery.length);
})();

function initCarousel(el, count) {
  if (!el || count <= 1) {
    // одно фото — прячем стрелки/точки
    if (el) el.querySelectorAll(".carousel-btn,.carousel-dots,.carousel-counter").forEach(n => n.style.display = "none");
    return;
  }
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

  // клавиатура
  el.tabIndex = 0;
  el.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") go(i + 1);
    if (e.key === "ArrowLeft") go(i - 1);
  });

  // свайп
  let x0 = null;
  const vp = el.querySelector(".carousel-viewport");
  vp.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
  vp.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });

  go(0);
}
