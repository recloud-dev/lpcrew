# Деплой на сервере (демо по IP, без домена)

Стек: Gunicorn (Django/Wagtail) + Nginx (порт 80) + PostgreSQL.
Доступ заказчику: `http://IP_сервера`

## Первый запуск

```bash
# 1. Код на сервер
git clone <repo> && cd lpcrew

# 2. Конфиг
cp .env.prod.example .env
nano .env            # впиши IP сервера, SECRET_KEY, пароли

# 3. Открой 80 порт
sudo ufw allow 80

# 4. Старт
docker compose -f docker-compose.prod.yml up -d --build
```

Логи: `docker compose -f docker-compose.prod.yml logs -f`

При старте автоматом: миграции → seed → collectstatic → суперпользователь.

Заказчик заходит на `http://IP`, админка — `http://IP/admin`.

## Обновление кода

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Данные БД/медиа в volume — пересборка их НЕ трогает.

## БД переживает всё (важно)

Данные лежат в именованных volume, заданных явно:

| volume | что |
|---|---|
| `lpcrew_pgdata` | база PostgreSQL |
| `lpcrew_media` | загрузки (изображения, документы) |
| `lpcrew_staticfiles` | собранная статика |

- `down` / `up` / `--build` / рестарт сервера → данные на месте.
- Удаляются ТОЛЬКО командой `down -v`. Её НЕ запускай на проде.

## Бэкап БД

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U lpcrew lpcrew | gzip > backup_$(date +%F).sql.gz
```

Медиа:
```bash
docker run --rm -v lpcrew_media:/data -v "$PWD":/out alpine \
  tar czf /out/media_$(date +%F).tar.gz -C /data .
```

## Восстановление (тот же или новый сервер)

```bash
gunzip -c backup_2026-06-21.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U lpcrew -d lpcrew
```

Так prod-БД переносится на будущий сервер/домен без потерь.

## Когда появится домен + TLS

1. В `.env`: `ENABLE_SSL=1`, добавь домен в `ALLOWED_HOSTS`,
   `CSRF_TRUSTED_ORIGINS=https://домен`, `WAGTAILADMIN_BASE_URL=https://домен`.
2. Добавь TLS в Nginx (Let's Encrypt / certbot) на 443.
3. `docker compose -f docker-compose.prod.yml up -d`.

БД и медиа остаются те же — volume не меняются.
