"""Мелкие переиспользуемые блоки (ссылки меню, колонки футера)."""
from wagtail import blocks


class LinkBlock(blocks.StructBlock):
    label = blocks.CharBlock(label="Текст")
    url = blocks.CharBlock(
        label="Ссылка",
        help_text="Якорь (#pool), относительный (/news/) или полный URL",
    )

    class Meta:
        icon = "link"
        label = "Ссылка"


class FooterColumnBlock(blocks.StructBlock):
    heading = blocks.CharBlock(label="Заголовок колонки")
    links = blocks.ListBlock(LinkBlock(), label="Ссылки")

    class Meta:
        icon = "list-ul"
        label = "Колонка футера"
