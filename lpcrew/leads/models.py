from django.db import models


class Lead(models.Model):
    MESSENGERS = [
        ("telegram", "Telegram"),
        ("whatsapp", "WhatsApp"),
        ("vk", "ВКонтакте"),
    ]

    name = models.CharField("Имя", max_length=120)
    phone = models.CharField("Телефон", max_length=40)
    messenger = models.CharField(
        "Мессенджер", max_length=20, choices=MESSENGERS, default="telegram"
    )
    meters = models.PositiveIntegerField(
        "Результат игры, м", null=True, blank=True,
        help_text="Дистанция из мини-игры «Заплыв», если заявка пришла из неё",
    )
    created_at = models.DateTimeField("Создана", auto_now_add=True)
    handled = models.BooleanField("Обработана", default=False)

    def __str__(self):
        return f"{self.name} ({self.phone})"

    class Meta:
        verbose_name = "Заявка"
        verbose_name_plural = "Заявки"
        ordering = ["-created_at"]
