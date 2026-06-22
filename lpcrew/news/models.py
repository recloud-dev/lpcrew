from django.core.paginator import Paginator
from django.db import models
from modelcluster.fields import ParentalKey
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.fields import StreamField
from wagtail.models import Orderable, Page
from wagtail.snippets.models import register_snippet
from wagtail import blocks
from wagtail.embeds.blocks import EmbedBlock
from wagtail.images.blocks import ImageChooserBlock


@register_snippet
class Category(models.Model):
    name = models.CharField("Название", max_length=80, unique=True)
    slug = models.SlugField("Слаг", max_length=80, unique=True)

    panels = [FieldPanel("name"), FieldPanel("slug")]

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Категория новостей"
        verbose_name_plural = "Категории новостей"


class CaptionedImageBlock(blocks.StructBlock):
    image = ImageChooserBlock(label="Изображение")
    caption = blocks.CharBlock(label="Подпись", required=False)

    class Meta:
        icon = "image"
        label = "Картинка"
        template = "news/blocks/image.html"


class NewsBodyBlock(blocks.StreamBlock):
    paragraph = blocks.RichTextBlock(label="Текст", icon="pilcrow")
    image = CaptionedImageBlock()
    quote = blocks.BlockQuoteBlock(label="Цитата")
    embed = EmbedBlock(label="Видео/встраивание", icon="media")


class NewsIndexPage(Page):
    eyebrow = models.CharField("Надзаголовок", max_length=80, blank=True, default="Журнал")
    intro = models.CharField("Заголовок раздела", max_length=120, blank=True,
                             default="Жизнь команды.")

    content_panels = Page.content_panels + [
        FieldPanel("eyebrow"),
        FieldPanel("intro"),
    ]

    subpage_types = ["news.NewsPage"]
    max_count = 1

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)
        posts = NewsPage.objects.child_of(self).live().order_by("-date")
        paginator = Paginator(posts, 9)
        context["posts"] = paginator.get_page(request.GET.get("page"))
        context["nav_extra_class"] = "scrolled"
        return context

    class Meta:
        verbose_name = "Журнал (список)"


class NewsPage(Page):
    date = models.DateField("Дата публикации")
    category = models.ForeignKey(
        "news.Category", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="+", verbose_name="Категория",
    )
    cover = models.ForeignKey(
        "wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="+", verbose_name="Обложка",
    )
    lead = models.TextField("Лид", blank=True)
    body = StreamField(NewsBodyBlock(), blank=True, use_json_field=True,
                       verbose_name="Текст материала")

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [FieldPanel("date"), FieldPanel("category"), FieldPanel("cover")],
            heading="Мета",
        ),
        FieldPanel("lead"),
        FieldPanel("body"),
        InlinePanel("gallery", label="Галерея"),
    ]

    parent_page_types = ["news.NewsIndexPage"]

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)
        context["related"] = (
            NewsPage.objects.live().sibling_of(self).exclude(id=self.id)
            .order_by("-date")[:2]
        )
        context["nav_extra_class"] = "scrolled"
        return context

    class Meta:
        verbose_name = "Новость"


class NewsGalleryImage(Orderable):
    page = ParentalKey(NewsPage, on_delete=models.CASCADE, related_name="gallery")
    image = models.ForeignKey(
        "wagtailimages.Image", on_delete=models.CASCADE, related_name="+"
    )
    caption = models.CharField("Подпись", max_length=255, blank=True)

    panels = [FieldPanel("image"), FieldPanel("caption")]
