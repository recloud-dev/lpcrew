from .base import *  # noqa: F401,F403

DEBUG = True
SECRET_KEY = "django-insecure-dev-only-change-me"
ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [
    "https://*.ngrok-free.app",
    "https://*.ngrok.io",
    "https://*.ngrok.app",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

try:
    from .local import *  # noqa: F401,F403
except ImportError:
    pass
