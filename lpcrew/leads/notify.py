"""Уведомление о новой заявке в Telegram (best-effort, без внешних зависимостей)."""
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


def notify_telegram(lead):
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        return
    text = (
        "🏊 Новая заявка LP Crew\n"
        f"Имя: {lead.name}\n"
        f"Телефон: {lead.phone}\n"
        f"Мессенджер: {lead.get_messenger_display()}"
    )
    if lead.meters:
        text += f"\nИгра «Заплыв»: {lead.meters} м"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text}).encode()
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except (urllib.error.URLError, OSError) as exc:
        logger.warning("Telegram notify failed: %s", exc)
