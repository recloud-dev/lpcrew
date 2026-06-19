// SPLASH — article render by ?id= + carousel
(function () {
  const root = document.getElementById("article");
  if (!root || !window.LP_NEWS) return;
  const E = { "Соревнования": "🏅", "Тренировки": "🏊", "Путешествия": "🏝️" };

  const id = new URLSearchParams(location.search).get("id");
  const post = window.LP_NEWS.find(n => n.id === id) || window.LP_NEWS[0];
  document.title = post.title + " 🌊 LP Crew";
  const others = window.LP_NEWS.filter(n => n.id !== post.id).slice(0, 2);
  const tones = ["t-blue", "t-yellow", "t-pink", "t-lime"];

  const slides = post.gallery.map((g, i) => `
    <figure class="slide" aria-label="${i + 1} из ${post.gallery.length}">
      <img src="${g.src}" alt="${g.caption || post.title}" ${i ? 'loading="lazy"' : ""}>
      ${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}
    </figure>`).join("");
  const dots = post.gallery.map((_, i) =>
    `<button class="dot${i === 0 ? " active" : ""}" data-i="${i}" aria-label="Фото ${i + 1}"></button>`).join("");
  const body = post.body.map(p => `<p>${p}</p>`).join("");
  const related = others.map((n, i) => `
    <a class="ncard ${tones[i % tones.length]}" href="article.html?id=${encodeURIComponent(n.id)}">
      <div class="ncard-img"><img src="${n.cover}" alt="${n.title}" loading="lazy">
        <span class="ncard-tag">${E[n.category] || "🌊"} ${n.category}</span></div>
      <div class="ncard-body"><time>${window.LP_FMT_DATE(n.date)}</time><h3>${n.title}</h3><span class="ncard-more">Читать →</span></div>
    </a>`).join("");

  root.innerHTML = `
    <article class="art">
      <a class="back-pill" href="news.html">← Все новости</a>
      <div class="art-top">
        <span class="art-cat">${E[post.category] || "🌊"} ${post.category}</span>
        <h1>${post.title}</h1>
        <p class="art-date">📅 ${window.LP_FMT_DATE(post.date)} · LP&nbsp;Crew</p>
      </div>

      <div class="art-cover-wrap">
        <img class="art-cover" src="${post.cover}" alt="${post.title}">
        <span class="sticker s-rot2">${E[post.category] || "🌊"}</span>
      </div>

      <div class="art-content">
        <p class="art-lead">${post.lead}</p>

        <div class="carousel" aria-label="Фотогалерея">
          <span class="carousel-label">📸 Фото с заплыва</span>
          <div class="carousel-frame">
            <div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>
            <button class="carousel-btn prev" aria-label="Назад">‹</button>
            <button class="carousel-btn next" aria-label="Вперёд">›</button>
            <div class="carousel-counter"><span class="cur">1</span>/${post.gallery.length}</div>
          </div>
          <div class="carousel-dots">${dots}</div>
        </div>

        ${body}

        <div class="art-cta">
          <a href="index.html#join" class="btn btn-pink big">Записаться на тренировку 🚀</a>
        </div>
      </div>
    </article>

    <section class="more-news">
      <h2 class="center">Ещё новости <span class="wiggle">📰</span></h2>
      <div class="news-grid">${related}</div>
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
