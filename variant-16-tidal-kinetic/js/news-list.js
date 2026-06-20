// NOIR — editorial numbered list of news
(function () {
  const wrap = document.getElementById("newsList");
  if (!wrap || !window.LP_NEWS) return;
  wrap.innerHTML = window.LP_NEWS.map((n, i) => `
    <a class="n-row" href="article.html?id=${encodeURIComponent(n.id)}">
      <span class="n-i">${String(i + 1).padStart(2, "0")}</span>
      <img class="n-thumb" src="${n.cover}" alt="${n.title}" loading="lazy">
      <div class="n-meta">
        <span class="n-cat">${n.category} · ${window.LP_FMT_DATE(n.date)}</span>
        <h2>${n.title}</h2>
        <p>${n.lead}</p>
      </div>
      <span class="n-arrow">↗</span>
    </a>`).join("");
})();
