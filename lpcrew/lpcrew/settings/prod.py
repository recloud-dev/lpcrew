from .base import *  # noqa: F401,F403

DEBUG = False

# SECRET_KEY и ALLOWED_HOSTS обязательны из окружения в проде
SECRET_KEY = os.environ["SECRET_KEY"]  # noqa: F405
ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")  # noqa: F405

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Единый тумблер TLS. Для демо по http://IP (без домена/сертификата) ставь
# ENABLE_SSL=0 — иначе будет редирект на https и Secure-cookies не дадут войти
# в админку. Когда появится домен + TLS — ENABLE_SSL=1.
_SSL = os.environ.get("ENABLE_SSL", "1") == "1"  # noqa: F405
SECURE_SSL_REDIRECT = _SSL
SESSION_COOKIE_SECURE = _SSL
CSRF_COOKIE_SECURE = _SSL
SECURE_HSTS_SECONDS = 31536000 if _SSL else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = _SSL
SECURE_HSTS_PRELOAD = _SSL
SECURE_CONTENT_TYPE_NOSNIFF = True

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")  # noqa: F405
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))  # noqa: F405
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")  # noqa: F405
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")  # noqa: F405
EMAIL_USE_TLS = True
