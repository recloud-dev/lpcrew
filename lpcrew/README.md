# LP Crew — сайт на Wagtail

Перенос прототипа `variant-13-cupertino` в редактируемый сайт.
Стек: **Wagtail (Django) + PostgreSQL + Docker**.

## Быстрый старт (dev)

```bash
docker compose up --build
```

- Сайт: http://localhost:8000/
- Журнал: http://localhost:8000/news/
- Админка: http://localhost:8000/admin/ (admin / admin12345)

Контейнер при старте применяет миграции и наполняет сайт стартовым контентом
прототипа (`manage.py seed`). Картинки берутся из `seed/img/`.

## Структура

- `home/` — лендинг: `HomePage` + StreamField-блоки секций (`blocks.py`).
- `news/` — журнал: `NewsIndexPage` / `NewsPage` (галерея, категории).
- `leads/` — заявки с формы: модель `Lead`, view, анти-спам, список в админке.
- `core/` — сквозные настройки (шапка/подвал/мета), `base.html`, команда `seed`.
- `static/` — CSS/JS из прототипа (`style.css` без изменений, `main.js` адаптирован).

## Что редактируется в админке

- **Страницы → LP Crew** — каждый блок лендинга (порядок, видимость, контент).
- **Страницы → Журнал** — новости (черновики, превью, расписание).
- **Настройки** — меню, подвал, контакты/мета.
- **Заявки** — заявки с формы, фильтры, экспорт CSV/XLSX.

## Прод

`cp .env.example .env`, заполнить, затем собрать с `DJANGO_SETTINGS_MODULE=lpcrew.settings.prod`.
Перед публикацией: nginx (статика/медиа/TLS), `collectstatic` (выполняется в entrypoint),
бэкап `pg_dump` + архив `media/`.
