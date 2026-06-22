"""Сквозные настройки сайта: шапка, подвал, мета/контакты."""
from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.contrib.settings.models import BaseGenericSetting, register_setting
from wagtail.fields import StreamField

from core.blocks import FooterColumnBlock, LinkBlock


@register_setting(icon="list-ul")
class NavSettings(BaseGenericSetting):
    """Пункты главного меню + CTA-кнопка."""

    items = StreamField(
        [("link", LinkBlock())],
        blank=True,
        use_json_field=True,
        verbose_name="Пункты меню",
    )
    cta_label = models.CharField("CTA — текст", max_length=60, default="Записаться")
    cta_url = models.CharField("CTA — ссылка", max_length=255, default="#join")

    panels = [
        FieldPanel("items"),
        FieldPanel("cta_label"),
        FieldPanel("cta_url"),
    ]

    class Meta:
        verbose_name = "Меню (шапка)"


@register_setting(icon="list-ul")
class FooterSettings(BaseGenericSetting):
    note = models.TextField("Заметка", blank=True)
    columns = StreamField(
        [("column", FooterColumnBlock())],
        blank=True,
        use_json_field=True,
        verbose_name="Колонки",
    )
    copyright = models.CharField(
        "Копирайт", max_length=255, default="© 2019–2026 LP Crew. Все права защищены."
    )
    legal_links = StreamField(
        [("link", LinkBlock())],
        blank=True,
        use_json_field=True,
        verbose_name="Юридические ссылки",
    )

    panels = [
        FieldPanel("note"),
        FieldPanel("columns"),
        FieldPanel("copyright"),
        FieldPanel("legal_links"),
    ]

    class Meta:
        verbose_name = "Подвал"


@register_setting(icon="cog")
class SiteSettings(BaseGenericSetting):
    brand_name = models.CharField("Название бренда", max_length=60, default="LP Crew")
    brand_mark = models.CharField("Знак бренда", max_length=8, default="≈")
    meta_description = models.TextField(
        "Meta description (по умолчанию)",
        blank=True,
        default="LP Crew. Команда пловцов-любителей из Ханты-Мансийска.",
    )
    contact_email = models.EmailField(
        "Email", blank=True, default="dolphin-90@yandex.ru"
    )
    address = models.CharField(
        "Адрес", max_length=255, blank=True, default="Ледовая ул. 1, Ханты-Мансийск"
    )
    hd_loc = models.CharField(
        "Координаты в шапке", max_length=80, blank=True,
        default="64°N · Ханты-Мансийск",
    )
    vk_url = models.CharField("ВКонтакте", max_length=255, blank=True)
    telegram_url = models.CharField("Telegram", max_length=255, blank=True)
    whatsapp_url = models.CharField("WhatsApp", max_length=255, blank=True)

    panels = [
        FieldPanel("brand_name"),
        FieldPanel("brand_mark"),
        FieldPanel("meta_description"),
        FieldPanel("contact_email"),
        FieldPanel("address"),
        FieldPanel("hd_loc"),
        FieldPanel("vk_url"),
        FieldPanel("telegram_url"),
        FieldPanel("whatsapp_url"),
    ]

    class Meta:
        verbose_name = "Сайт (контакты/мета)"
