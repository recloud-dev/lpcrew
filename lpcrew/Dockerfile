FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=1.8.5

# Системные зависимости: libpq для psycopg, libjpeg/zlib для Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev libjpeg62-turbo-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app

COPY pyproject.toml ./
RUN poetry config virtualenvs.create false \
    && poetry lock \
    && poetry install --no-root --only main

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "lpcrew.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
