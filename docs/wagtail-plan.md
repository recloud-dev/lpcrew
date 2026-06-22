# LP Crew — план реализации сайта на Wagtail

Превращение прототипа **`variant-13-cupertino`** в полноценный сайт с админкой.
Стек: **Wagtail (Django) + PostgreSQL + Docker**, монолит на server-rendered Django-шаблонах.

---

## 1. Цель

- Прототип-13 → рабочий сайт без потери дизайна (CSS и vanilla-JS переносятся 1:1).
- Контент-менеджер правит **каждый блок лендинга**, добавляет/убирает новости, тренеров, отзывы, плитки, цифры — без разработчика.
- Заявки с формы сохраняются и доступны в админке.

## 2. Почему Wagtail

«Править каждый блок» = модель «страница как упорядоченный список типизированных блоков». В Python это нативно умеет только Wagtail **StreamField**: типы блоков, drag-reorder, вкл/выкл, вложенность. Новости = тип страницы с деревом, черновиками, превью и расписанием публикации. Встроенный image manager (рендиции, focal point). ORM + Postgres + Docker — целевой стек.

---

## 3. Архитектура

```
Браузер
  │  HTML (Django templates) + css/style.css + js (vanilla, как в прототипе)
  ▼
Nginx ──► Gunicorn ──► Wagtail/Django ──► PostgreSQL
                                     └──► media/ (загруженные картинки)
```

- Один процесс рендерит и публичный сайт, и `/admin` (Wagtail admin).
- Статика (`collectstatic`) и media отдаёт Nginx.
- Без отдельного фронта/SPA, без второго деплоя.

### Структура проекта

```
lpcrew/
├─ manage.py
├─ pyproject.toml            # poetry: wagtail, psycopg, gunicorn, whitenoise, pillow
├─ lpcrew/                   # настройки проекта
│  ├─ settings/{base,dev,prod}.py
│  ├─ urls.py
│  └─ wsgi.py
├─ home/                     # лендинг
│  ├─ models.py              # HomePage (StreamField)
│  ├─ blocks.py              # все блоки секций
│  └─ templates/home/…       # шаблоны блоков
├─ news/                     # журнал
│  ├─ models.py              # NewsIndexPage, NewsPage
│  └─ templates/news/…
├─ leads/                    # заявки с формы
│  └─ models.py              # Lead (+ регистрация в admin)
├─ core/                     # сквозное
│  ├─ models.py              # NavSettings, FooterSettings, SiteSettings (snippets/settings)
│  └─ templates/core/…       # base.html, nav, footer
├─ templates/base.html
├─ static/
│  ├─ css/style.css          # из прототипа, без изменений
│  └─ js/*.js                # main.js и пр., без изменений
├─ media/                    # gitignore
├─ Dockerfile
├─ docker-compose.yml        # web + db (+ nginx в prod)
└─ .env
```

---

## 4. Контент-модель

### 4.1 HomePage — лендинг (StreamField `body`)

Каждая секция прототипа → блок StreamField. Менеджер собирает страницу как конструктор, меняет порядок, скрывает блоки.

| Блок | Поля | Источник в прототипе |
|---|---|---|
| `HeroBlock` | eyebrow, heading, subhead, links[] (label+anchor), image | `<section class="hero">` |
| `FeatureBlock` | theme(dark/light/alt), eyebrow, heading (RTE/2 строки), subhead, copy, image | секции `#open`, `#pool` |
| `BentoBlock` | headline, tiles[] — StreamBlock из под-блоков: `TextTile`(tag,title,text,link?), `CtaTile`(tag,title,link), `ImageTile`(image,tag,title), модификаторы span2/row2 | `#features` bento |
| `StatsBlock` | headline, stats[] (target, decimals, unit, label) | `.stats` |
| `ReviewsBlock` | eyebrow, headline, reviews[] (stars, text, author) | `#reviews` |
| `CoachesBlock` | eyebrow, headline, coaches[] (photo **или** буква-аватар, name, role) | `#team` |
| `NewsTeaserBlock` | eyebrow, headline, count (сколько последних тянуть) | `#news` — автоподтяжка свежих `NewsPage` |
| `JoinBlock` | headline, subhead, messengers[] (label+value), note | `#join` форма |
| `RichTextBlock` / `ImageBlock` | универсальные, на будущее | — |

Заголовки секций с `<br>` — `RichTextField` с ограниченным набором (только перенос/strong) либо отдельные поля line1/line2.

### 4.2 News — журнал

- **`NewsIndexPage`** (одна) — страница списка `/news/`, поля: eyebrow, заголовок. Рендерит детей с пагинацией.
- **`NewsPage`** (много, дети index) — поля:
  - `title`, `slug` (Wagtail из коробки), `date` (publish date), `category` (выбор/snippet),
  - `cover` (image), `lead` (text),
  - `body` — StreamField: `paragraph`(RTE), `image`(+caption), `quote`, `embed`,
  - `gallery` — InlinePanel: image + caption.
- Черновики, превью, расписание публикации — встроены.
- URL `/news/<slug>/` (замена `article.html?id=`).

### 4.3 Сквозное (Settings / Snippets)

- **`NavSettings`** (`@register_setting`) — пункты меню (label+link, повторяемые), CTA-кнопка.
- **`FooterSettings`** — заметка, колонки[] (заголовок + ссылки[]), нижняя строка, copyright, юр-ссылки.
- **`SiteSettings`** — title, meta-description, контакты (email, адрес, соцсети), бренд-марка `≈`.
- **`Category`** snippet — категории новостей.

### 4.4 Leads — заявки

- Модель `Lead`: name, phone, messenger, created_at, обработана(bool).
- POST формы `#join` → Django view → сохранение + (опц.) уведомление в Telegram-бот/email.
- Просмотр/экспорт в Wagtail admin (через `ModelAdmin`/`wagtail-modeladmin` или Snippets).
- Защита: CSRF, honeypot/anti-spam, rate-limit.

---

## 5. Перенос дизайна

1. `css/style.css` → `static/css/style.css` **без изменений**.
2. `js/*.js` → `static/js/`. `news-data.js` удаляется (данные из БД). `article.js`/`news-list.js` больше не нужны — рендер на сервере; `main.js` (reveal, count-up, frosted-nav, бургер, форма) остаётся.
3. HTML прототипа разбивается на Django-шаблоны: `base.html` (nav+footer из settings) + по шаблону на каждый StreamBlock (`home/blocks/hero.html` и т.д.).
4. Атрибуты-хуки JS сохраняются в шаблонах: `class="reveal"`, `data-stagger`, `data-scale`, `data-target`/`data-decimals`. Анимации работают как есть.
5. Картинки прототипа (`img/*.jpg`) — первичная загрузка в Wagtail images как стартовый контент (data migration/фикстура).

---

## 6. Docker

- **`web`** — Python + Wagtail, Gunicorn. Dev: `runserver` + volume на код.
- **`db`** — `postgres:16`, volume на данные, healthcheck.
- **`nginx`** (prod) — статика, media, реверс-прокси на Gunicorn, TLS (Let's Encrypt/Caddy как альтернатива).
- `.env`: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `DJANGO_SETTINGS_MODULE`.
- Команды старта: `migrate` → `collectstatic` → `gunicorn`. Бэкап: `pg_dump` + архив `media/` по cron.

---

## 7. Этапы (роадмап)

| Этап | Содержание | Итог |
|---|---|---|
| **0. Каркас** | poetry-проект, Wagtail bootstrap, Postgres, docker-compose dev, base.html | Пустой сайт поднимается в Docker |
| **1. Дизайн-перенос** | CSS/JS в static, base.html с nav/footer (пока хардкод), один статичный HomePage-шаблон | Лендинг визуально 1:1 с прототипом |
| **2. StreamField лендинга** | `blocks.py` + шаблоны блоков, HomePage.body, наполнение контентом прототипа | Каждый блок правится в админке |
| **3. Новости** | NewsIndexPage/NewsPage, шаблоны списка+статьи, галерея, перенос 4 новостей | Журнал + CRUD новостей |
| **4. Settings/Snippets** | NavSettings, FooterSettings, SiteSettings, Category; nav/footer из БД | Полностью редактируемые шапка/подвал |
| **5. Форма заявок** | Lead-модель, view, валидация, anti-spam, просмотр в admin, уведомления | Рабочая запись на тренировку |
| **6. Прод-готовность** | nginx, TLS, prod-settings, collectstatic/whitenoise, SEO (meta, OG, sitemap, robots), бэкапы, роли пользователей | Деплой на VPS |
| **7. Полировка** | 404/500, favicon, кэш-рендиции картинок, Lighthouse, доступность, reduced-motion проверка | Релиз |

Этапы 2 и 3 — основная ценность («гибкость»), приоритет.

---

## 8. SEO и прод-детали

- Wagtail из коробки: per-page SEO title/description, slug, превью.
- Добавить: `wagtail.contrib.sitemaps`, `robots.txt`, OpenGraph/Twitter-теги в `base.html`, канонические URL.
- Рендиции картинок (`{% image cover fill-1200x800 %}`) + WebP, lazy-load (как в прототипе).
- Редирект старых URL прототипа (`article.html?id=…` → `/news/<slug>/`) через `wagtail.contrib.redirects` при необходимости.

## 9. Зависимости (ядро)

`wagtail`, `django`, `psycopg[binary]`, `gunicorn`, `whitenoise`, `Pillow`, `dj-database-url`, `python-dotenv`. Опц.: `wagtail-modeladmin` (leads), `django-ratelimit` (анти-спам формы).

## 10. Риски и решения

| Риск | Решение |
|---|---|
| Заголовки с `<br>` в RTE ломают вёрстку | Ограниченный RTE feature-set или раздельные поля строк |
| Менеджер «сломает» лейаут блоками | Фиксированные типы блоков + min/max в StreamField, превью перед публикацией |
| Bento span2/row2 модификаторы | Выбор размера полем в под-блоке плитки → CSS-класс в шаблоне |
| Спам в форме | honeypot + rate-limit + (опц.) капча |
| Потеря медиа при редеплое | `media/` на volume + регулярный бэкап |

---

## 11. Что НЕ делаем сейчас

- Headless/SPA-фронт (монолит на шаблонах достаточно под трафик/контент).
- Мультиязычность, поиск, личные кабинеты — вне scope прототипа.
- CI/CD — отдельной задачей после первого деплоя.
