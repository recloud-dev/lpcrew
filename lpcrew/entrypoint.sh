#!/usr/bin/env bash
set -e

echo "→ Применяю миграции"
python manage.py migrate --no-input

echo "→ Стартовый контент"
python manage.py seed || echo "seed: пропущено"

if [ "${DJANGO_SETTINGS_MODULE}" = "lpcrew.settings.prod" ]; then
  echo "→ collectstatic"
  python manage.py collectstatic --no-input
fi

if [ -n "${DJANGO_SUPERUSER_USERNAME}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD}" ]; then
  echo "→ Суперпользователь ${DJANGO_SUPERUSER_USERNAME}"
  python manage.py createsuperuser --no-input \
    --username "${DJANGO_SUPERUSER_USERNAME}" \
    --email "${DJANGO_SUPERUSER_EMAIL:-admin@example.com}" 2>/dev/null \
    || echo "суперпользователь уже есть"
fi

exec "$@"
