// ===== LP Crew — мини-игра «Заплыв» (endless swimmer) =====
(function () {
  const canvas = document.getElementById("swimGame");
  if (!canvas) return;

  const stage = canvas.closest(".game-stage");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const metersEl = document.getElementById("gameMeters");
  const startPanel = document.getElementById("gameStart");
  const startBtn = document.getElementById("gameStartBtn");
  const overPanel = document.getElementById("gameOver");
  const finalEl = document.getElementById("gameFinal");
  const metersField = document.getElementById("gameMetersField");
  const replayBtn = document.getElementById("gameReplayBtn");
  const leadersEl = document.getElementById("gameLeaders");
  const form = document.getElementById("gameForm");
  const note = document.getElementById("gameNote");

  const PX_PER_M = 8;
  const PLAYER_X = 130, PLAYER_R = 18;

  let running = false, raf = null, last = 0;
  let dist, speed, spawnAt, obstacles, playerY, targetY, swimT;

  function reset() {
    dist = 0;
    speed = 230;
    spawnAt = 420;
    obstacles = [];
    playerY = targetY = H / 2;
    swimT = 0;
  }

  /* ---------- ввод: указатель ведёт пловца по вертикали ---------- */
  function pointerY(e) {
    const rect = canvas.getBoundingClientRect();
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    targetY = Math.max(PLAYER_R, Math.min(H - PLAYER_R, cy * (H / rect.height)));
  }
  canvas.addEventListener("pointermove", e => { if (running) pointerY(e); });
  canvas.addEventListener("touchmove", e => { if (running) { e.preventDefault(); pointerY(e); } }, { passive: false });
  document.addEventListener("keydown", e => {
    if (!running) return;
    if (e.key === "ArrowUp") targetY = Math.max(PLAYER_R, targetY - 34);
    if (e.key === "ArrowDown") targetY = Math.min(H - PLAYER_R, targetY + 34);
  });

  /* ---------- препятствия ---------- */
  const TYPES = ["buoy", "boat", "jelly"];
  function spawn() {
    const type = TYPES[Math.floor(swimT * 7 + obstacles.length) % TYPES.length];
    const r = type === "boat" ? 34 : 22;
    obstacles.push({ type, x: W + r, y: r + Math.random() * (H - 2 * r), r });
  }

  function step(dt) {
    dist += speed * dt;
    speed = Math.min(640, 230 + dist / 45);
    swimT += dt;
    playerY += (targetY - playerY) * Math.min(1, dt * 9);

    spawnAt -= speed * dt;
    if (spawnAt <= 0) {
      spawn();
      spawnAt = Math.max(210, 440 - dist / 90);
    }
    for (const o of obstacles) o.x -= speed * dt;
    obstacles = obstacles.filter(o => o.x > -o.r);

    for (const o of obstacles) {
      const dx = o.x - PLAYER_X, dy = o.y - playerY;
      if (Math.hypot(dx, dy) < o.r + PLAYER_R) return gameOver();
    }
    if (metersEl) metersEl.textContent = Math.floor(dist / PX_PER_M);
  }

  /* ---------- отрисовка (тема NOIR: тёмный фон, акцент cyan) ---------- */
  function draw() {
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(143,214,224,.07)";
    ctx.lineWidth = 1;
    const off = dist % 60;
    for (let x = -off; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 40, H); ctx.stroke();
    }
    for (const o of obstacles) drawObstacle(o);
    drawPlayer();
  }

  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.type === "buoy") {
      ctx.fillStyle = "#e0683f";
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(-o.r, -4, o.r * 2, 8);
    } else if (o.type === "boat") {
      ctx.fillStyle = "#6a6a72";
      ctx.beginPath();
      ctx.moveTo(-o.r, -o.r * 0.5); ctx.lineTo(o.r, -o.r * 0.5);
      ctx.lineTo(o.r * 0.6, o.r * 0.6); ctx.lineTo(-o.r * 0.6, o.r * 0.6);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(190,150,220,.85)";
      ctx.beginPath(); ctx.arc(0, 0, o.r, Math.PI, 0); ctx.fill();
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * 7, 0);
        ctx.quadraticCurveTo(i * 7 + 4, o.r, i * 7, o.r * 1.4); ctx.strokeStyle = "rgba(190,150,220,.55)"; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // двухсегментная конечность: бедро/плечо → колено/локоть → стопа/кисть
  function limb(x, y, a, l1, l2, bend) {
    const jx = x + Math.cos(a) * l1, jy = y + Math.sin(a) * l1;
    const ex = jx + Math.cos(a + bend) * l2, ey = jy + Math.sin(a + bend) * l2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(jx, jy); ctx.lineTo(ex, ey);
    ctx.stroke();
    return ey;
  }

  // пловец сбоку: кроль — руки по кругу (одна над водой, другая гребёт), ноги треплют
  function drawPlayer() {
    ctx.save();
    ctx.translate(PLAYER_X, playerY + Math.sin(swimT * 6) * 2);
    ctx.rotate(-0.12);
    ctx.strokeStyle = "#8fd6e0";
    ctx.fillStyle = "#8fd6e0";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const hip = -20, shoulder = 10;

    // ноги — флаттер-кик
    const kick = Math.sin(swimT * 16);
    ctx.lineWidth = 5;
    limb(hip, 2, Math.PI - kick * 0.35, 13, 11, kick * 0.3);
    limb(hip, 2, Math.PI + kick * 0.35, 13, 11, -kick * 0.3);

    // торс
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(hip, 0); ctx.lineTo(shoulder, -2); ctx.stroke();

    // голова
    ctx.beginPath(); ctx.arc(22, -5, 8, 0, Math.PI * 2); ctx.fill();

    // руки — гребок по кругу, противофаза
    const p = swimT * 9;
    ctx.lineWidth = 5;
    for (const ang of [p, p + Math.PI]) {
      const hy = limb(shoulder, -2, ang, 14, 13, 0.3);
      if (hy > 8) {
        const hx = shoulder + Math.cos(ang) * 14 + Math.cos(ang + 0.3) * 13;
        ctx.fillStyle = "rgba(143,214,224,.4)";
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#8fd6e0";
      }
    }
    ctx.restore();
  }

  /* ---------- цикл ---------- */
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    step(dt);
    if (running) { draw(); raf = requestAnimationFrame(loop); }
  }

  function play() {
    reset();
    startPanel && (startPanel.hidden = true);
    overPanel.hidden = true;
    running = true;
    last = 0;
    raf = requestAnimationFrame(ts => { last = ts; loop(ts); });
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    const m = Math.floor(dist / PX_PER_M);
    finalEl.textContent = m;
    metersField.value = m;
    if (note) { note.textContent = ""; note.style.color = ""; }
    form && form.querySelectorAll("input,button").forEach(el => { el.disabled = false; });
    overPanel.hidden = false;
  }

  startBtn && startBtn.addEventListener("click", play);
  replayBtn && replayBtn.addEventListener("click", play);

  /* ---------- отправка рекорда (через тот же /leads/submit/) ---------- */
  function loadLeaders() {
    if (!leadersEl || !stage) return;
    fetch(stage.dataset.leaderboard)
      .then(r => r.json())
      .then(d => {
        if (!d.top || !d.top.length) return;
        leadersEl.innerHTML = "";
        for (const row of d.top) {
          const li = document.createElement("li");
          const name = document.createElement("span");
          name.className = "gl-name";
          name.textContent = row.name;
          const m = document.createElement("span");
          m.className = "gl-m";
          m.textContent = row.meters + " м";
          li.append(name, m);
          leadersEl.appendChild(li);
        }
      })
      .catch(() => {});
  }

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      fetch(form.action, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: new FormData(form),
      })
        .then(r => r.json().catch(() => ({ ok: r.ok })))
        .then(data => {
          if (note) {
            note.textContent = data.ok
              ? "Готово! Ты в таблице — мы свяжемся и позовём на старт."
              : (data.error || "Не удалось отправить. Попробуйте позже.");
            note.style.color = data.ok ? "var(--accent)" : "";
          }
          if (data.ok) {
            form.querySelectorAll("input").forEach(i => { if (i.type !== "hidden") i.value = ""; });
            if (btn) btn.disabled = true;
            loadLeaders();
          } else if (btn) btn.disabled = false;
        })
        .catch(() => { if (note) note.textContent = "Сеть недоступна. Попробуйте позже."; if (btn) btn.disabled = false; });
    });
  }

  /* ---------- игра разворачивается внутри блока «Войти в воду» ---------- */
  const section = document.getElementById("game");
  const join = document.getElementById("join");
  const opener = document.querySelector("[data-game-open]");
  if (section && join && opener) {
    join.appendChild(section);          // переносим игру внутрь блока 09
    section.classList.add("game-inline");
    opener.classList.add("is-gamelink");
    const open = () => {
      if (!section.hidden) return;
      section.hidden = false;
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
      draw();
    };
    opener.addEventListener("click", open);
    opener.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  reset();
  draw();
})();
