// SPLASH — chunky news cards
(function () {
  const wrap = document.getElementById("newsList");
  if (!wrap || !window.LP_NEWS) return;
  const E = { "Соревнования": "🏅", "Тренировки": "🏊", "Путешествия": "🏝️" };
  const tones = ["t-blue", "t-yellow", "t-pink", "t-lime"];
  wrap.innerHTML = window.LP_NEWS.map((n, i) => `
    <a class="ncard ${tones[i % tones.length]}" href="article.html?id=${encodeURIComponent(n.id)}">
      <div class="ncard-img"><img src="${n.cover}" alt="${n.title}" loading="lazy">
        <span class="ncard-tag">${E[n.category] || "🌊"} ${n.category}</span>
      </div>
      <div class="ncard-body">
        <time>${window.LP_FMT_DATE(n.date)}</time>
        <h3>${n.title}</h3>
        <p>${n.lead}</p>
        <span class="ncard-more">Читать →</span>
      </div>
    </a>`).join("");
})();
