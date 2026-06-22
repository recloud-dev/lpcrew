from wagtail.admin.panels import FieldPanel
from wagtail.fields import StreamField
from wagtail.models import Page

from home.blocks import HomeStreamBlock


class HomePage(Page):
    body = StreamField(
        HomeStreamBlock(),
        blank=True,
        use_json_field=True,
        verbose_name="Секции лендинга",
    )

    content_panels = Page.content_panels + [
        FieldPanel("body"),
    ]

    # Лендинг + разделы: журнал и заплывы
    subpage_types = ["news.NewsIndexPage", "swims.SwimIndexPage"]

    class Meta:
        verbose_name = "Лендинг"
