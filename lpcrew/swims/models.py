from django.db import models
from modelcluster.fields import ParentalKey
from wagtail import blocks
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.fields import StreamField
from wagtail.models import Orderable, Page

from news.models import CaptionedImageBlock


class SwimBodyBlock(blocks.StreamBlock):
    paragraph = blocks.RichTextBlock(label="Текст", icon="pilcrow")
    image = CaptionedImageBlock()
    quote = blocks.BlockQuoteBlock(label="Цитата")


class SwimIndexPage(Page):
    intro = models.CharField("Подзаголовок", max_length=200, blank=True)

    content_panels = Page.content_panels + [FieldPanel("intro")]
    subpage_types = ["swims.SwimPage"]
    max_count = 1

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)
        context["swims"] = SwimPage.objects.child_of(self).live().order_by("path")
        return context

    class Meta:
        verbose_name = "Заплывы (раздел)"


class SwimPage(Page):
    place = models.CharField("Место", max_length=120, blank=True)
    distance = models.CharField("Дистанция", max_length=120, blank=True)
    cover = models.ForeignKey(
        "wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="+", verbose_name="Обложка",
    )
    lead = models.TextField("Лид", blank=True)
    body = StreamField(SwimBodyBlock(), blank=True, use_json_field=True,
                       verbose_name="Текст")

    content_panels = Page.content_panels + [
        MultiFieldPanel([FieldPanel("place"), FieldPanel("distance"),
                         FieldPanel("cover")], heading="Мета"),
        FieldPanel("lead"),
        FieldPanel("body"),
        InlinePanel("gallery", label="Галерея"),
    ]
    parent_page_types = ["swims.SwimIndexPage"]

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)
        context["related"] = (
            SwimPage.objects.live().sibling_of(self).exclude(id=self.id)
            .order_by("path")[:3]
        )
        return context

    class Meta:
        verbose_name = "Заплыв"


class SwimGalleryImage(Orderable):
    page = ParentalKey(SwimPage, on_delete=models.CASCADE, related_name="gallery")
    image = models.ForeignKey(
        "wagtailimages.Image", on_delete=models.CASCADE, related_name="+"
    )
    caption = models.CharField("Подпись", max_length=255, blank=True)

    panels = [FieldPanel("image"), FieldPanel("caption")]
