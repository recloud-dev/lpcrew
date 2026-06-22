# Конструктор блоков (аналог Tilda) — проект архитектуры

> Цель: в админке собирать страницы из любых блоков и настраивать их
> (контент + внешний вид) без правок кода и редеплоя — как в Tilda.

---

## 1. Анализ текущей реализации

Стек: **Wagtail 6.3 / Django 5.1**. Страницы уже строятся на `StreamField` —
это, по сути, уже «блочный конструктор», но с жёсткими ограничениями.

### Что есть

| Слой | Где | Состояние |
|------|-----|-----------|
| Поток блоков | `home/blocks.py` → `HomeStreamBlock` | 15 секций-`StructBlock` + `rich_text` |
| Рендер блока | `home/templates/home/blocks/*.html` | 1 блок = 1 фиксированный шаблон |
| Стили | `static/css/style.css` (373 строки) | Семантические классы `.hero`, `.stats`… тема NOIR зашита |
| Глобальные настройки | `core/models.py` (`NavSettings`, `FooterSettings`, `SiteSettings`) | меню/футер/контакты редактируемы |
| Динамика | `get_context` в `FieldBlock`, `GameBlock` | блок тянет заплывы/лидерборд из БД |

### Где «хардкод» (узкие места)

1. **Фиксированный вид.** Блок жёстко привязан к одному шаблону и одному набору
   CSS-классов. Нельзя поменять фон, отступы, выравнивание, ширину, вариант
   темы из админки. `HeroBlock` всегда выглядит как один конкретный hero.
2. **Тема зашита в CSS.** Цвета/шрифты/сетка — в `:root` и в классах
   `style.css`. Сменить палитру = править код.
3. **Новый блок = код + миграция + редеплой.** Чтобы добавить тип секции,
   нужен новый `StructBlock`, шаблон, CSS и деплой. Контент-менеджер так не умеет.
4. **Нет композиции.** Нельзя собрать произвольную секцию из атомов
   (заголовок + текст + кнопка + картинка) в N колонок — только готовые секции.
5. **Мёртвые шаблоны.** `bento.html`, `feature.html`, `news_teaser.html` есть в
   templates, но не подключены к `HomeStreamBlock` — рассинхрон.

### Вывод

Фундамент (`StreamField`) **правильный** — Tilda тоже = библиотека блоков + панель
настроек у каждого. Переписывать на свой движок не нужно. Нужно закрыть 5 разрывов
выше четырьмя надстройками: **настройки внешнего вида у блока**, **дизайн-токены**,
**базовый класс/реестр блоков**, **блоки-композиты (колонки + атомы)**.

---

## 2. Что такое «аналог Tilda» — разбор

Tilda даёт три уровня, копируем по приоритету:

| Уровень Tilda | Суть | Наш аналог | Приоритет |
|---------------|------|-----------|-----------|
| **Library blocks** | ~450 готовых блоков, у каждого панель настроек (контент + вид) | Курируемая библиотека `StructBlock` + общий mixin настроек вида | **MVP** |
| **Settings / Themes** | глобальная палитра, шрифты, ширина контента | Дизайн-токены через Wagtail Settings → CSS-переменные | **MVP** |
| **Zero Block** | свободный холст, абсолютное позиционирование | Блок-композит: контейнер «колонки» + атомы (заголовок/текст/кнопка/картинка/спейсер) | **v2** |

Полный «Zero Block» (drag по пикселям) — отдельный большой движок, в MVP **не делаем**.
Блок-композит из колонок+атомов закрывает ~90% потребности «собрать любую секцию».

---

## 3. Целевая архитектура

```
┌──────────────────────────────────────────────────────────────┐
│ Wagtail Admin                                                  │
│                                                                │
│  Page.body : StreamField                                       │
│   ├─ [chooser с группами: Промо / Контент / Композиты / …]     │
│   ├─ блок Hero      → панель: Контент | ▸ Внешний вид          │
│   ├─ блок Stats     → панель: Контент | ▸ Внешний вид          │
│   └─ блок Columns   → [ Column → [Heading, Text, Button, …] ]  │
│                                                                │
│  Settings → Тема: палитра, шрифты, радиусы, ширина             │
└──────────────────────────────────────────────────────────────┘
                          │ render
                          ▼
   <section style="--bg:…;--pad:…" class="block block--hero variant--dark">
   токены темы (CSS vars в <head>) + per-block vars (inline style)
```

Три кита:

1. **`AppearanceMixin`** — общий блок настроек вида, подмешивается в каждую секцию.
2. **`SectionBlock`** (базовый `StructBlock`) — единый рендер-контракт: обёртка
   `<section>` с классами-вариантами и inline CSS-переменными.
3. **Дизайн-токены** — глобальная тема в Settings, прокидывается как CSS-переменные.

---

## 4. Компонент 1 — настройки внешнего вида (`AppearanceMixin`)

Каждая секция получает вкладку «Внешний вид». Это и есть главное отличие от
текущего хардкода.

```python
# core/blocks/appearance.py
from wagtail import blocks

THEME_CHOICES = [("inherit", "Как у темы"), ("dark", "Тёмная"),
                 ("light", "Светлая"), ("accent", "Акцентная")]
WIDTH_CHOICES = [("wide", "Широкая"), ("normal", "Обычная"), ("narrow", "Узкая"),
                 ("full", "На всю ширину")]
SPACE_CHOICES = [("none", "0"), ("s", "S"), ("m", "M"), ("l", "L"), ("xl", "XL")]
ALIGN_CHOICES = [("left", "Слева"), ("center", "По центру"), ("right", "Справа")]


class AppearanceBlock(blocks.StructBlock):
    """Внешний вид секции — общий для всех блоков (как «Settings» у блока Tilda)."""
    theme = blocks.ChoiceBlock(THEME_CHOICES, default="inherit", label="Тема")
    bg_image = ImageChooserBlock(required=False, label="Фон-картинка")
    bg_overlay = blocks.BooleanBlock(required=False, label="Затемнение фона")
    width = blocks.ChoiceBlock(WIDTH_CHOICES, default="normal", label="Ширина контента")
    align = blocks.ChoiceBlock(ALIGN_CHOICES, default="left", label="Выравнивание")
    pad_top = blocks.ChoiceBlock(SPACE_CHOICES, default="l", label="Отступ сверху")
    pad_bottom = blocks.ChoiceBlock(SPACE_CHOICES, default="l", label="Отступ снизу")
    anchor = blocks.CharBlock(required=False, label="Якорь (id)",
                              help_text="Для меню: #pool")

    class Meta:
        label = "Внешний вид"
        form_template = "core/admin/appearance_block.html"  # сворачиваемая панель
```

Рендер превращает выбор в CSS-переменные/классы — стили **не** хардкодятся в шаблон
секции, а приходят из настроек:

```django
{# core/templates/core/includes/section_open.html #}
<section
  class="block block--{{ block_name }} t-{{ ap.theme }} w-{{ ap.width }} a-{{ ap.align }}
         pt-{{ ap.pad_top }} pb-{{ ap.pad_bottom }}{% if ap.bg_image %} has-bg{% endif %}"
  {% if ap.anchor %}id="{{ ap.anchor }}"{% endif %}
  {% if ap.bg_image %}style="--bg-img:url('{% image ap.bg_image fill-1920x1080 as b %}{{ b.url }}')"{% endif %}>
  {% if ap.bg_overlay %}<div class="block-overlay"></div>{% endif %}
  <div class="block-inner">
```

В `style.css` — один раз утилиты, дальше переиспользуются всеми блоками:

```css
.block{position:relative}
.pt-s{padding-top:32px}.pt-m{padding-top:64px}.pt-l{padding-top:120px}.pt-xl{padding-top:200px}
/* pb-* аналогично */
.w-narrow .block-inner{max-width:720px;margin:0 auto}
.w-normal .block-inner{max-width:var(--maxw);margin:0 auto;padding:0 32px}
.w-full   .block-inner{max-width:none}
.a-center{text-align:center}.a-right{text-align:right}
.t-dark{--bg:#0c0c0e;--fg:#f4f1ea}.t-light{--bg:#f4f1ea;--fg:#141417}
.t-accent{--bg:var(--accent);--fg:#0c0c0e}
.t-dark,.t-light,.t-accent{background:var(--bg);color:var(--fg)}
.has-bg{background:var(--bg-img) center/cover}
.block-overlay{position:absolute;inset:0;background:rgba(12,12,14,.6)}
```

**Результат:** один блок Hero даёт десятки вариантов вида (тёмный/светлый, узкий/широкий,
с фото-фоном, разные отступы) — без правок кода.

---

## 5. Компонент 2 — базовый `SectionBlock` + реестр

Чтобы добавить блок было дёшево и единообразно, вводим базовый класс и
автоматическую обёртку `<section>`.

```python
# core/blocks/base.py
class SectionBlock(blocks.StructBlock):
    """База для всех секций лендинга. Контент — в наследниках, вид — общий."""
    appearance = AppearanceBlock()

    class Meta:
        group = "Секции"          # группировка в чузере (Wagtail 6)

    def get_context(self, value, parent_context=None):
        ctx = super().get_context(value, parent_context)
        ctx["ap"] = value["appearance"]
        ctx["block_name"] = self.name
        return ctx
```

Наследник описывает только контент + свой inner-шаблон:

```python
class HeroBlock(SectionBlock):
    tag = blocks.CharBlock(required=False, label="Метка")
    heading = blocks.CharBlock(label="Заголовок")
    lead = blocks.TextBlock(required=False, label="Лид")
    cta = LinkItemBlock(required=False, label="Кнопка")
    images = blocks.ListBlock(ImageChooserBlock(), label="Слайды")

    class Meta:
        icon = "image"; label = "Hero"; group = "Промо"
        template = "home/blocks/hero.html"
```

Inner-шаблон больше **не** держит стили секции — только контент, обёрнут в общий
`section_open/close`:

```django
{% include "core/includes/section_open.html" %}
  {% if self.tag %}<p class="eyebrow">{{ self.tag }}</p>{% endif %}
  <h1>{{ self.heading }}</h1>
  {% if self.lead %}<p class="lead">{{ self.lead }}</p>{% endif %}
{% include "core/includes/section_close.html" %}
```

**Группировка в чузере** (`group=`) даёт Tilda-подобный каталог: «Промо», «Контент»,
«Социальное», «Композиты». Wagtail 6 уже даёт поиск/категории в выборе блока.

---

## 6. Компонент 3 — дизайн-токены (глобальная тема)

Палитра/шрифты/сетка — в редактируемые настройки, а не в CSS. Аналог «Settings → Colors/Fonts» Tilda.

```python
# core/models.py
@register_setting(icon="palette")
class ThemeSettings(BaseGenericSetting):
    color_bg = models.CharField("Фон", max_length=9, default="#0c0c0e")
    color_fg = models.CharField("Текст", max_length=9, default="#f4f1ea")
    color_accent = models.CharField("Акцент", max_length=9, default="#8fd6e0")
    color_muted = models.CharField("Приглушённый", max_length=9, default="#8a8780")
    font_head = models.CharField("Шрифт заголовков", max_length=80,
                                 default="Cormorant Garamond")
    font_body = models.CharField("Шрифт текста", max_length=80, default="Space Mono")
    radius = models.IntegerField("Скругление, px", default=0)
    max_width = models.IntegerField("Ширина контента, px", default=1280)
    panels = [...]  # с виджетами цвета
```

Прокидываем в `<head>` как CSS-переменные — весь сайт перекрашивается из админки:

```django
{# base.html #}
{% with t=settings.core.ThemeSettings %}
<style>:root{
  --bg:{{ t.color_bg }};--fg:{{ t.color_fg }};--accent:{{ t.color_accent }};
  --mut:{{ t.color_muted }};--maxw:{{ t.max_width }}px;--radius:{{ t.radius }}px;
  --font-head:'{{ t.font_head }}',serif;--font-body:'{{ t.font_body }}',monospace;
}</style>
{% endwith %}
```

`style.css` уже завязан на эти переменные (`var(--bg)`, `var(--accent)` и т.д.) —
рефакторинг минимальный: вынести оставшиеся хардкод-цвета в переменные.

> Опционально: подгрузка Google Fonts по имени из `font_head/font_body` динамически.

---

## 7. Компонент 4 — блоки-композиты (свобода сборки, v2)

Чтобы «накидать любой блок» без готового шаблона — контейнер из колонок и атомов.
Это закрывает кейсы, которых нет в библиотеке.

```python
# Атомы — кирпичики
class HeadingAtom(blocks.StructBlock):
    text = blocks.CharBlock(); level = blocks.ChoiceBlock(
        [("h1","H1"),("h2","H2"),("h3","H3")], default="h2")
    class Meta: icon="title"; template="home/blocks/atoms/heading.html"

class TextAtom(blocks.RichTextBlock):  ...
class ButtonAtom(blocks.StructBlock):  # label, url, style=primary/ghost
class ImageAtom(blocks.StructBlock):   # image, ratio, rounded
class SpacerAtom(blocks.StructBlock):  # height S/M/L
class EmbedAtom(EmbedBlock): ...       # видео/iframe

class AtomStream(blocks.StreamBlock):
    heading = HeadingAtom(); text = TextAtom(); button = ButtonAtom()
    image = ImageAtom(); spacer = SpacerAtom(); embed = EmbedAtom()

class ColumnBlock(blocks.StructBlock):
    span = blocks.ChoiceBlock([("1","1/4"),("2","1/2"),("3","3/4"),("4","full")],
                              default="2", label="Ширина колонки")
    content = AtomStream()

class ColumnsBlock(SectionBlock):       # секция-композит
    gap = blocks.ChoiceBlock(SPACE_CHOICES, default="m")
    columns = blocks.ListBlock(ColumnBlock(), label="Колонки")
    class Meta: icon="grid"; label="Колонки (свободная сборка)"; group="Композиты"
            template="home/blocks/columns.html"
```

Рендер — CSS Grid по `span`. Так редактор собирает произвольную секцию (2 колонки:
слева заголовок+текст+кнопка, справа картинка) мышью, как в Tilda Zero «по сетке».

---

## 8. Динамические блоки (заплывы, лидерборд, новости)

Сохраняем текущий подход `get_context` — это сильная сторона, которой у Tilda нет.
Блок остаётся «умным»: тянет данные из БД, но настройки вида получает от mixin.

```python
class SwimsFeedBlock(SectionBlock):
    headline = blocks.CharBlock(label="Заголовок")
    count = blocks.IntegerBlock(default=6, min_value=1, max_value=20)
    def get_context(self, value, parent_context=None):
        ctx = super().get_context(value, parent_context)
        ctx["swims"] = SwimPage.objects.live().order_by("path")[:value["count"]]
        return ctx
    class Meta: group="Динамические"; template="home/blocks/field.html"
```

Так же `GameBlock`, лента новостей, отзывы из сниппетов и т.п.

---

## 9. Превью

Wagtail из коробки даёт превью страницы (кнопка в редакторе) — это и есть
live-preview Tilda. Дополнительно:
- включить **`preview` для блоков** (Wagtail 6 умеет превью отдельного блока в чузере) —
  редактор видит, как выглядит блок до вставки;
- кнопка «Open Preview» в split-view для правки и просмотра рядом.

Отдельный визуальный drag-drop-редактор поверх фронта (как редактор Tilda на самой
странице) — **не делаем**: дорого, а Wagtail StreamField + Preview закрывают задачу.

---

## 10. Миграция существующих блоков

`StreamField` хранит JSON → структура меняется аккуратно через `data migration`.

1. Ввести `AppearanceBlock`/`SectionBlock` рядом, **не ломая** старые блоки.
2. Переписать шаблоны секций на `section_open/close` (стили → утилиты/токены).
3. Data-migration: в каждый существующий блок добавить ключ `appearance` со
   значениями по умолчанию, повторяющими текущий вид (тёмная тема, обычная ширина).
4. Вынести цвета из `style.css` в `ThemeSettings` (значения = текущая палитра NOIR).
5. Удалить мёртвые шаблоны (`bento`, `feature`, `news_teaser`) или подключить как блоки.

Дефолты подобраны так, что после миграции сайт выглядит **идентично** — меняется
только то, что редактор сам потом настроит.

---

## 11. План внедрения

| Этап | Объём | Результат |
|------|-------|-----------|
| **0. Токены** | `ThemeSettings` + CSS-переменные в `base.html`, рефактор `style.css` | палитра/шрифты из админки |
| **1. Appearance** | `AppearanceBlock` + `SectionBlock` + `section_open/close` + утилиты CSS | у каждой секции вкладка «Внешний вид» |
| **2. Рефактор библиотеки** | перевести 15 блоков на `SectionBlock`, группы в чузере, data-migration | существующие блоки настраиваемы, идентичный вид |
| **3. Композиты** | атомы + `ColumnsBlock` (CSS Grid) | свободная сборка секций мышью |
| **4. Превью блоков** | `preview` value для ключевых блоков | каталог с превью как в Tilda |

Этапы 0–2 = MVP (полноценный «настраиваемый» лендинг). 3–4 = «свобода как в Tilda».

---

## 12. Решения и обоснования

- **Остаёмся на Wagtail StreamField.** Это и есть блочный конструктор; свой движок —
  лишняя сложность. Tilda-фишки добавляются надстройками, а не заменой.
- **Вид через CSS-переменные + классы-утилиты, не inline-простыни.** Тонкие настройки
  (фон, отступы) — переменные; дискретные (тема, выравнивание) — классы. Кэшируемо,
  предсказуемо, без раздувания CSS.
- **Курируемая библиотека, а не голый холст.** Дизайн остаётся консистентным (бренд
  NOIR не разваливается), но редактор свободен. Полный Zero Block — over-engineering.
- **Динамику оставляем в `get_context`.** Преимущество перед Tilda — блоки тянут живые
  данные (заплывы, лидерборд). Не теряем.

---

## 13. Открытый вопрос к заказчику

Нужен ли **истинный свободный холст** (drag по пикселям, как Tilda Zero Block), или
достаточно **библиотека + настройки вида + колоночные композиты** (этот проект)?
Первое — кратно дороже (свой JS-редактор поверх фронта) и расшатывает дизайн-систему.
Рекомендация: начать со второго (этапы 0–3), к холсту вернуться только при реальной потребности.
