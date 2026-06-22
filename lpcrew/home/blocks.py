"""Блоки секций лендинга — соответствуют секциям прототипа-14 (tidal/noir).

Все поля необязательны: пустые значения просто не выводятся в шаблонах.
"""
from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock


class LinkItemBlock(blocks.StructBlock):
    label = blocks.CharBlock(label="Текст", required=False)
    url = blocks.CharBlock(label="Ссылка", required=False,
                           help_text="#anchor, /news/ или полный URL")

    class Meta:
        icon = "link"


# --- DIVE INTRO (загрузка) ---
class DiveIntroBlock(blocks.StructBlock):
    mark = blocks.CharBlock(label="Лого-текст", default="LP CREW", required=False)
    sub = blocks.CharBlock(label="Подпись", default="Погружение · Tidal", required=False)

    class Meta:
        icon = "view"
        label = "Загрузка (dive)"
        template = "home/blocks/dive_intro.html"


# --- HERO ---
class HeroBlock(blocks.StructBlock):
    tag = blocks.CharBlock(label="Метка сверху", required=False)
    heading = blocks.CharBlock(label="Заголовок", required=False)
    heading_em = blocks.CharBlock(label="Заголовок (акцент, 2 строка)", required=False)
    lead = blocks.TextBlock(label="Лид", required=False)
    link_label = blocks.CharBlock(label="Кнопка-ссылка", required=False)
    link_url = blocks.CharBlock(label="URL кнопки", required=False, default="#join")
    meta_note = blocks.CharBlock(label="Подпись справа внизу", required=False)
    images = blocks.ListBlock(ImageChooserBlock(), label="Слайды (фон)", required=False)

    class Meta:
        icon = "image"
        label = "Hero"
        template = "home/blocks/hero.html"


# --- MARQUEE (бегущая строка) ---
class MarqueeItemBlock(blocks.StructBlock):
    phrase = blocks.CharBlock(label="Фраза", default="от бассейна до океана",
                              required=False)
    sign = blocks.CharBlock(label="Подпись (рукописный)", default="плыви с нами",
                            required=False)

    class Meta:
        icon = "redirect"


class MarqueeBlock(blocks.StructBlock):
    items = blocks.ListBlock(MarqueeItemBlock(), label="Элементы", required=False)

    class Meta:
        icon = "redirect"
        label = "Бегущая строка"
        template = "home/blocks/marquee.html"


# --- STATS ---
class StatItemBlock(blocks.StructBlock):
    target = blocks.CharBlock(label="Число", required=False, help_text="317 или 380,4")
    decimals = blocks.IntegerBlock(label="Знаков после запятой", default=0, min_value=0,
                                   required=False)
    suffix = blocks.CharBlock(label="Суффикс", required=False, help_text="чел., км")
    label = blocks.CharBlock(label="Подпись", required=False)

    class Meta:
        icon = "form"


class StatsBlock(blocks.StructBlock):
    stats = blocks.ListBlock(StatItemBlock(), label="Цифры", required=False)

    class Meta:
        icon = "table"
        label = "Цифры"
        template = "home/blocks/stats.html"


# --- ABOUT (editorial split) ---
class AboutBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="01", required=False)
    heading = blocks.CharBlock(label="Заголовок, строка 1", required=False)
    heading2 = blocks.CharBlock(label="Заголовок, строка 2", required=False)
    big = blocks.TextBlock(label="Крупный текст", required=False)
    body = blocks.RichTextBlock(label="Текст", required=False,
                                features=["bold", "italic", "link"])
    aim = blocks.ListBlock(blocks.CharBlock(), label="Список целей", required=False)
    image = ImageChooserBlock(label="Фото", required=False)
    caption = blocks.CharBlock(label="Подпись к фото", required=False)

    class Meta:
        icon = "doc-full"
        label = "О команде (split)"
        template = "home/blocks/about.html"


# --- SEASON ---
class SeasonCardBlock(blocks.StructBlock):
    tag = blocks.CharBlock(label="Метка", required=False)
    title = blocks.CharBlock(label="Заголовок", required=False)
    text = blocks.TextBlock(label="Текст", required=False)

    class Meta:
        icon = "date"


class SeasonBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="02", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Круглый год в воде",
                                required=False)
    cards = blocks.ListBlock(SeasonCardBlock(), label="Карточки", required=False)

    class Meta:
        icon = "date"
        label = "Сезоны"
        template = "home/blocks/season.html"


# --- DISCIPLINES ---
class DisciplineBlock(blocks.StructBlock):
    title = blocks.CharBlock(label="Заголовок", required=False)
    text = blocks.TextBlock(label="Текст", required=False)

    class Meta:
        icon = "list-ol"


class DisciplinesBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="03", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Дисциплины", required=False)
    items = blocks.ListBlock(DisciplineBlock(), label="Пункты", required=False)

    class Meta:
        icon = "list-ol"
        label = "Дисциплины"
        template = "home/blocks/disciplines.html"


# --- COACHES ---
class CoachBlock(blocks.StructBlock):
    photo = ImageChooserBlock(label="Фото", required=False)
    name = blocks.CharBlock(label="Имя", required=False)
    role = blocks.CharBlock(label="Роль", required=False)
    text = blocks.TextBlock(label="Описание", required=False)

    class Meta:
        icon = "user"


class CoachesBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="04", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Кто ведёт к воде",
                                required=False)
    coaches = blocks.ListBlock(CoachBlock(), label="Тренеры", required=False)

    class Meta:
        icon = "group"
        label = "Тренеры"
        template = "home/blocks/coaches.html"


# --- FIELD (раздел Вода, лента заплывов) ---
class FieldBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="05", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="22 водоёма.", required=False)
    headline_em = blocks.CharBlock(label="Заголовок (акцент)", required=False,
                                   default="От Оби до океана.")
    lead = blocks.TextBlock(label="Лид", required=False)
    count = blocks.IntegerBlock(label="Сколько заплывов показать", default=6,
                                min_value=1, max_value=20, required=False)

    def get_context(self, value, parent_context=None):
        context = super().get_context(value, parent_context)
        from swims.models import SwimPage

        context["swims"] = SwimPage.objects.live().order_by("path")[: value["count"] or 6]
        return context

    class Meta:
        icon = "image"
        label = "Вода (заплывы)"
        template = "home/blocks/field.html"


# --- PRICING ---
class PriceBlock(blocks.StructBlock):
    name = blocks.CharBlock(label="Название", required=False)
    desc = blocks.CharBlock(label="Подзаголовок", required=False)
    amount = blocks.CharBlock(label="Цена", required=False, help_text="от 700")
    currency = blocks.CharBlock(label="Валюта", default="₽", required=False)
    per = blocks.CharBlock(label="За что", required=False)
    features = blocks.ListBlock(blocks.CharBlock(), label="Что входит", required=False)
    popular = blocks.BooleanBlock(label="Популярный", required=False)
    tag = blocks.CharBlock(label="Бейдж", required=False, default="Популярный")
    link_label = blocks.CharBlock(label="Кнопка", default="Записаться", required=False)
    link_url = blocks.CharBlock(label="URL кнопки", default="#join", required=False)

    class Meta:
        icon = "tag"


class PricingBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="06", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Абонементы", required=False)
    big = blocks.TextBlock(label="Подзаголовок", required=False)
    plans = blocks.ListBlock(PriceBlock(), label="Тарифы", required=False)
    note = blocks.CharBlock(label="Примечание", required=False)

    class Meta:
        icon = "tag"
        label = "Абонементы"
        template = "home/blocks/pricing.html"


# --- REVIEWS ---
class ReviewBlock(blocks.StructBlock):
    initial = blocks.CharBlock(label="Инициал", max_length=2, required=False)
    name = blocks.CharBlock(label="Имя", required=False)
    role = blocks.CharBlock(label="Роль", required=False)
    text = blocks.TextBlock(label="Отзыв", required=False)

    class Meta:
        icon = "openquote"


class ReviewsBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="07", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Что говорят пловцы",
                                required=False)
    reviews = blocks.ListBlock(ReviewBlock(), label="Отзывы", required=False)

    class Meta:
        icon = "openquote"
        label = "Отзывы"
        template = "home/blocks/reviews.html"


# --- QUOTE ---
class QuoteBlock(blocks.StructBlock):
    text = blocks.TextBlock(label="Цитата", required=False)
    cite = blocks.CharBlock(label="Автор", required=False)

    class Meta:
        icon = "openquote"
        label = "Цитата"
        template = "home/blocks/quote.html"


# --- FAQ ---
class FaqItemBlock(blocks.StructBlock):
    question = blocks.CharBlock(label="Вопрос", required=False)
    answer = blocks.TextBlock(label="Ответ", required=False)

    class Meta:
        icon = "help"


class FaqBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="08", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Частые вопросы",
                                required=False)
    items = blocks.ListBlock(FaqItemBlock(), label="Вопросы", required=False)

    class Meta:
        icon = "help"
        label = "FAQ"
        template = "home/blocks/faq.html"


# --- JOIN ---
class JoinBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="09", required=False)
    heading = blocks.CharBlock(label="Заголовок, строка 1", default="Войти",
                               required=False)
    heading2 = blocks.CharBlock(label="Заголовок, строка 2", required=False, default="в воду")
    big = blocks.TextBlock(label="Текст", required=False)
    links = blocks.ListBlock(LinkItemBlock(), label="Ссылки-контакты", required=False)
    note = blocks.CharBlock(label="Примечание под формой", required=False)

    class Meta:
        icon = "mail"
        label = "Форма записи"
        template = "home/blocks/join.html"


# --- GAME (мини-игра «Заплыв» + таблица лидеров) ---
class GameBlock(blocks.StructBlock):
    num = blocks.CharBlock(label="Номер", default="10", required=False)
    headline = blocks.CharBlock(label="Заголовок", default="Заплыв", required=False)
    lead = blocks.TextBlock(
        label="Лид", required=False,
        default="Плыви, уворачивайся от буйков и лодок. Сколько метров пройдёшь?",
    )
    cta = blocks.CharBlock(
        label="Призыв под результатом", required=False,
        default="Хочешь проплыть это в реальной воде? Войди в топ — оставь контакт.",
    )

    def get_context(self, value, parent_context=None):
        context = super().get_context(value, parent_context)
        from leads.models import Lead

        context["top"] = (
            Lead.objects.filter(meters__isnull=False)
            .order_by("-meters", "created_at")
            .values_list("name", "meters")[:10]
        )
        return context

    class Meta:
        icon = "media"
        label = "Игра «Заплыв»"
        template = "home/blocks/game.html"


class HomeStreamBlock(blocks.StreamBlock):
    dive_intro = DiveIntroBlock()
    hero = HeroBlock()
    marquee = MarqueeBlock()
    stats = StatsBlock()
    about = AboutBlock()
    season = SeasonBlock()
    disciplines = DisciplinesBlock()
    coaches = CoachesBlock()
    field = FieldBlock()
    pricing = PricingBlock()
    reviews = ReviewsBlock()
    quote = QuoteBlock()
    faq = FaqBlock()
    game = GameBlock()
    join = JoinBlock()
    rich_text = blocks.RichTextBlock(label="Текст (универсальный)", icon="pilcrow")
