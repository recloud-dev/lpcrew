// PULSE — news list
(function () {
  const wrap = document.getElementById("newsList");
  if (!wrap || !window.LP_NEWS) return;
  wrap.innerHTML = window.LP_NEWS.map(n => `
    <a class="post" href="article.html?id=${encodeURIComponent(n.id)}">
      <img src="${n.cover}" alt="${n.title}" loading="lazy">
      <div class="post-b">
        <time>${n.category} · ${window.LP_FMT_DATE(n.date)}</time>
        <h3>${n.title}</h3>
        <p>${n.lead}</p>
        <span class="more">Читать →</span>
      </div>
    </a>`).join("");
})();
