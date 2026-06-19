/* ============================================================
   FLOW / Маршрут — interactive features
   Quiz (View Transitions + fallback), schedule filter,
   timeline reveal, FAQ accordion.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Animated swap helper: View Transitions API + fallback ---- */
  function swap(update) {
    if (reduce || !document.startViewTransition) {
      update();
      // fallback class-based entrance
      var step = document.querySelector("#quiz-mount > *");
      if (step && !reduce) {
        step.classList.add("q-anim-in");
        step.addEventListener("animationend", function () {
          step.classList.remove("q-anim-in");
        }, { once: true });
      }
      return;
    }
    document.startViewTransition(update);
  }

  /* =====================  QUIZ  ===================== */
  var quiz = {
    step: 0,
    answers: [],
    questions: [
      {
        q: "Ваш уровень?",
        num: "Шаг 1 из 3",
        opts: [
          { em: "🐣", t: "Новичок", s: "Хочу научиться плавать", v: "beginner" },
          { em: "🏊", t: "Уже плаваю", s: "Хочу улучшить технику", v: "intermediate" },
          { em: "🏆", t: "Готовлюсь к соревнованиям", s: "Нужен серьёзный объём", v: "athlete" }
        ]
      },
      {
        q: "Где удобнее заниматься?",
        num: "Шаг 2 из 3",
        opts: [
          { em: "🏟️", t: "Бассейн", s: "Утром или вечером", v: "pool" },
          { em: "🌊", t: "Открытая вода", s: "Заплывы и дистанции", v: "open" },
          { em: "💻", t: "Онлайн", s: "Из любого города", v: "online" }
        ]
      },
      {
        q: "Какая у вас цель?",
        num: "Шаг 3 из 3",
        opts: [
          { em: "🛟", t: "Научиться плавать", s: "Уверенно держаться на воде", v: "learn" },
          { em: "🎯", t: "Техника", s: "Чистый и сильный гребок", v: "technique" },
          { em: "🥇", t: "Соревнования", s: "Готовлюсь к старту", v: "compete" }
        ]
      }
    ],
    results: {
      beginner: {
        ic: "🛟", kick: "Рекомендуем", title: "Группа для новичков",
        text: "Начнём с нуля: дыхание, держание на воде и базовый гребок. Спокойный темп и поддержка тренера.",
        tags: ["Бассейн", "С нуля", "Бесплатная пробная"]
      },
      technique: {
        ic: "🎯", kick: "Рекомендуем", title: "Техника и видеоразбор",
        text: "Поставим технику и разберём гребок по подводной съёмке. Идеально, если ты уже плаваешь и хочешь расти.",
        tags: ["Видеоразбор", "Подводная съёмка", "Бассейн + вода"]
      },
      open: {
        ic: "🌊", kick: "Рекомендуем", title: "Open-water сборы",
        text: "Заплывы на открытой воде, работа с дистанцией и подготовка к стартам в команде.",
        tags: ["Открытая вода", "Дистанции", "Лето"]
      },
      online: {
        ic: "💻", kick: "Рекомендуем", title: "Online-план",
        text: "Персональная программа, сопровождение тренера в чате и видеоразбор — тренируйся из любого города.",
        tags: ["Онлайн", "План + сопровождение", "Видеоразбор"]
      }
    },
    pick: function (qi) {
      // map three answers -> one result
      var lvl = this.answers[0], place = this.answers[1], goal = this.answers[2];
      if (place === "online") return "online";
      if (place === "open" || goal === "compete" || lvl === "athlete") return "open";
      if (goal === "technique" || lvl === "intermediate") return "technique";
      return "beginner";
    }
  };

  var mount = document.getElementById("quiz-mount");
  var bars = document.querySelectorAll(".quiz-progress i");
  if (!mount) return;

  function setProgress(n) {
    bars.forEach(function (b, i) { b.classList.toggle("done", i <= n); });
  }

  function renderQuestion() {
    var qi = quiz.step;
    var data = quiz.questions[qi];
    var opts = data.opts.map(function (o) {
      return '<button class="q-opt" data-v="' + o.v + '" type="button">' +
        '<span class="em" aria-hidden="true">' + o.em + '</span>' +
        '<span><span class="ot">' + o.t + '</span><small>' + o.s + '</small></span></button>';
    }).join("");
    mount.innerHTML =
      '<div class="quiz-step" role="group" aria-label="' + data.q + '">' +
        '<div class="qstep-head"><span class="num">' + data.num + '</span></div>' +
        '<h3>' + data.q + '</h3>' +
        '<div class="q-options">' + opts + '</div>' +
        '<div class="quiz-nav">' +
          '<button class="quiz-back" type="button"' + (qi === 0 ? " hidden" : "") + '>← Назад</button>' +
          '<span></span>' +
        '</div>' +
      '</div>';
    setProgress(qi);
    bindQuestion();
  }

  function bindQuestion() {
    mount.querySelectorAll(".q-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        quiz.answers[quiz.step] = btn.dataset.v;
        if (quiz.step < quiz.questions.length - 1) {
          quiz.step++;
          swap(renderQuestion);
        } else {
          swap(renderResult);
        }
      });
    });
    var back = mount.querySelector(".quiz-back");
    if (back) back.addEventListener("click", function () {
      if (quiz.step > 0) { quiz.step--; swap(renderQuestion); }
    });
  }

  function renderResult() {
    var key = quiz.pick();
    var r = quiz.results[key];
    setProgress(2);
    mount.innerHTML =
      '<div class="q-result" role="group" aria-label="Результат подбора">' +
        '<div class="rim" aria-hidden="true">' + r.ic + '</div>' +
        '<p class="rkick">' + r.kick + '</p>' +
        '<h3>' + r.title + '</h3>' +
        '<p>' + r.text + '</p>' +
        '<div class="rtags">' + r.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") + '</div>' +
        '<div class="q-result-actions">' +
          '<a href="#join" class="btn btn-accent" data-scroll>Записаться</a>' +
          '<button class="btn btn-line" type="button" id="quiz-restart">Пройти заново</button>' +
        '</div>' +
      '</div>';
    var rs = document.getElementById("quiz-restart");
    if (rs) rs.addEventListener("click", function () {
      quiz.step = 0; quiz.answers = [];
      swap(renderQuestion);
    });
  }

  renderQuestion();

  /* =====================  SCHEDULE  ===================== */
  var sched = {
    "Пн": [{ t: "07:00", n: "Бассейн · утро", c: "pool" }, { t: "19:30", n: "Бассейн · вечер", c: "pool" }],
    "Вт": [{ t: "19:00", n: "Техника · бассейн", c: "pool" }, { t: "20:00", n: "Online-план", c: "online" }],
    "Ср": [{ t: "07:00", n: "Бассейн · утро", c: "pool" }, { t: "19:30", n: "Бассейн · вечер", c: "pool" }],
    "Чт": [{ t: "19:00", n: "Открытая вода (лето)", c: "open" }, { t: "20:00", n: "Online-план", c: "online" }],
    "Пт": [{ t: "07:00", n: "Бассейн · утро", c: "pool" }, { t: "19:30", n: "Бассейн · вечер", c: "pool" }],
    "Сб": [{ t: "10:00", n: "Открытая вода (лето)", c: "open" }, { t: "11:30", n: "Бассейн · группа", c: "pool" }],
    "Вс": [{ t: "11:00", n: "Online-разбор", c: "online" }]
  };
  var grid = document.getElementById("sched-grid");
  if (grid) {
    grid.innerHTML = Object.keys(sched).map(function (day) {
      var sessions = sched[day].map(function (s) {
        return '<div class="sess ' + s.c + '" data-c="' + s.c + '"><time>' + s.t + '</time>' + s.n + '</div>';
      }).join("");
      return '<div class="day"><h4>' + day + '</h4>' + sessions + '</div>';
    }).join("");

    var chips = document.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        grid.querySelectorAll(".sess").forEach(function (s) {
          s.classList.toggle("hide", !(f === "all" || s.dataset.c === f));
        });
      });
    });
  }

  /* =====================  FAQ accordion  ===================== */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    btn.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    });
  });

  /* =====================  Timeline reveal  ===================== */
  var steps = document.querySelectorAll(".tl-step");
  if (steps.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      steps.forEach(function (s) { s.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            var el = e.target;
            setTimeout(function () { el.classList.add("in"); }, 120 * (+el.dataset.i || 0));
            io.unobserve(el);
          }
        });
      }, { threshold: 0.3 });
      steps.forEach(function (s, i) { s.dataset.i = i; io.observe(s); });
    }
  }
})();
