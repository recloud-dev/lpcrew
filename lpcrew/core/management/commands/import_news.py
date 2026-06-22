"""Импорт новостей из CSV-выгрузки Tilda в раздел «Журнал».

Полноценно переносит контент: текст (HTML → RichText), изображения (скачивает
с tildacdn в галерею + обложку) и видео (embed-блок YouTube/VK).

Идемпотентно: повторный запуск не плодит дубли — пост ищется по slug (Post ID
из выгрузки). С флагом --update перезаписывает тело/мету у существующих.

Примеры:
    python manage.py import_news --csv ../feed-7100648-760865162681-202606201800.csv
    python manage.py import_news --csv feed.csv --update
    python manage.py import_news --csv feed.csv --limit 5   # обкатать на пяти
"""
import csv
import datetime
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.files.images import ImageFile
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from PIL import Image as PILImage
from wagtail.images import get_image_model
from wagtail.models import Page

from home.models import HomePage
from news.models import NewsGalleryImage, NewsIndexPage, NewsPage

Image = get_image_model()

# Inline-теги, которые осмысленно сохранить в RichText. Остальное (span со
# стилями Tilda и т.п.) выкидываем — текст внутри остаётся.
_KEEP_TAGS = {"b", "strong", "i", "em", "u", "a"}
_BR_RE = re.compile(r"<br\s*/?>", re.I)
_TAG_RE = re.compile(r"<(/?)([a-zA-Z0-9]+)([^>]*)>")
_WS_RE = re.compile(r"[ \t]+")


class Command(BaseCommand):
    help = "Импортирует новости из CSV-выгрузки Tilda (текст, картинки, видео)."

    def add_arguments(self, parser):
        parser.add_argument("--csv", required=True, help="Путь к CSV-файлу выгрузки.")
        parser.add_argument("--update", action="store_true",
                            help="Перезаписывать уже импортированные посты.")
        parser.add_argument("--limit", type=int, default=0,
                            help="Импортировать не более N постов (0 = все).")
        parser.add_argument("--no-images", action="store_true",
                            help="Не скачивать изображения (только текст).")

    # ------------------------------------------------------------------ run
    def handle(self, *args, **opts):
        path = Path(opts["csv"])
        if not path.is_absolute():
            for base in (Path.cwd(), settings.BASE_DIR, settings.BASE_DIR.parent):
                if (base / path).exists():
                    path = base / path
                    break
        if not path.exists():
            raise CommandError(f"CSV не найден: {opts['csv']}")

        self.update = opts["update"]
        self.fetch_images = not opts["no_images"]
        self._img_cache = {}  # url -> Image (за один прогон не качаем дважды)
        index = self._get_index()

        created = updated = skipped = 0
        with path.open(encoding="utf-8-sig", newline="") as fh:
            rows = list(csv.DictReader(fh, delimiter=";"))

        limit = opts["limit"]
        for i, row in enumerate(rows):
            if limit and created + updated >= limit:
                break
            title = (row.get("Title") or "").strip()
            if not title:
                continue
            if (row.get("Visibility") or "").strip().lower() not in ("", "published"):
                skipped += 1
                continue

            slug = self._slug(row, title)
            existing = NewsPage.objects.filter(slug=slug).first()
            if existing and not self.update:
                skipped += 1
                continue

            try:
                if existing:
                    self._apply(existing, row, title)
                    existing.save_revision().publish()
                    updated += 1
                    self.stdout.write(f"  ~ обновлён: {title[:60]}")
                else:
                    page = NewsPage(slug=slug)
                    self._apply(page, row, title)
                    index.add_child(instance=page)
                    page.save_revision().publish()
                    created += 1
                    self.stdout.write(f"  + создан:  {title[:60]}")
            except Exception as exc:  # один битый пост не валит весь импорт
                skipped += 1
                self.stdout.write(self.style.WARNING(f"  ! пропуск «{title[:40]}»: {exc}"))

        self.stdout.write(self.style.SUCCESS(
            f"Готово. Создано: {created}, обновлено: {updated}, пропущено: {skipped}."))

    # -------------------------------------------------------------- helpers
    def _get_index(self):
        index = NewsIndexPage.objects.first()
        if index:
            return index
        home = HomePage.objects.first()
        if not home:
            raise CommandError("Нет HomePage — сначала запустите `manage.py seed`.")
        index = NewsIndexPage(title="Журнал", slug="news",
                              eyebrow="№", intro="Журнал команды")
        home.add_child(instance=index)
        return index

    def _slug(self, row, title):
        raw = (row.get("Alias") or "").strip() or (row.get("Post ID") or "").strip()
        slug = slugify(raw) or slugify(title)
        return (slug or "post")[:255]

    def _apply(self, page, row, title):
        """Заполняет поля страницы из строки CSV (для create и update)."""
        page.title = title[:255]
        page.date = self._date(row.get("Date"))
        page.lead = self._clean_lead(row.get("Description"))

        media_type = (row.get("Media Type") or "").strip().lower()
        urls = [u.strip() for u in (row.get("Media") or "").split(";") if u.strip()]

        images, videos = [], []
        for u in urls:
            (videos if self._is_video(u) else images).append(u)

        body = self._body_blocks(row.get("Text"), videos)
        page.body = body

        # обложка: первая картинка, для видео — превью (Thumb Image)
        cover = None
        gallery_imgs = []
        if self.fetch_images:
            for j, u in enumerate(images):
                img = self._download(u, f"{title} — фото {j + 1}")
                if img:
                    gallery_imgs.append(img)
            if gallery_imgs:
                cover = gallery_imgs[0]
            if cover is None:
                thumb = (row.get("Thumb Image") or "").strip()
                if thumb:
                    cover = self._download(thumb, f"{title} — обложка")
        page.cover = cover

        # пересобираем галерею через modelcluster — сохранится вместе со
        # страницей в ревизии (важно для идемпотентного --update)
        page.gallery.clear()
        for k, img in enumerate(gallery_imgs):
            page.gallery.add(NewsGalleryImage(image=img, sort_order=k))

    # -------------------------------------------------------------- parsing
    def _date(self, value):
        value = (value or "").strip()
        if not value:
            return datetime.date.today()
        try:
            return datetime.datetime.fromisoformat(value).date()
        except ValueError:
            try:
                return datetime.date.fromisoformat(value[:10])
            except ValueError:
                return datetime.date.today()

    def _is_video(self, url):
        host = urlparse(url).netloc.lower()
        return any(h in host for h in ("youtu.be", "youtube.com", "vk.com", "vimeo.com"))

    def _clean_lead(self, text):
        text = self._strip_tags(text or "").strip()
        return text[:500]

    def _body_blocks(self, text, videos):
        blocks = []
        for para in self._paragraphs(text or ""):
            blocks.append(("paragraph", para))
        for v in videos:
            blocks.append(("embed", v))
        return blocks

    def _paragraphs(self, html):
        """Tilda HTML → список абзацев (<p>…</p> с переносами <br/>)."""
        # двойной <br> = граница абзаца, одиночный = перенос строки
        html = _BR_RE.sub("\n", html)
        html = self._strip_tags(html)
        chunks = re.split(r"\n\s*\n+", html)
        out = []
        for chunk in chunks:
            chunk = chunk.strip()
            if not chunk:
                continue
            chunk = "<br/>".join(
                _WS_RE.sub(" ", line).strip()
                for line in chunk.split("\n") if line.strip())
            out.append(f"<p>{chunk}</p>")
        return out

    def _strip_tags(self, html):
        """Снимает мусорные теги/атрибуты, оставляя текст и пару inline-тегов."""
        def repl(m):
            closing, tag = m.group(1), m.group(2).lower()
            if tag in _KEEP_TAGS:
                if tag == "a" and not closing:
                    href = re.search(r'href="([^"]*)"', m.group(3) or "")
                    return f'<a href="{href.group(1)}">' if href else "<a>"
                return f"<{closing}{tag}>"
            return ""
        html = _TAG_RE.sub(repl, html)
        html = (html.replace("&nbsp;", " ").replace("&laquo;", "«")
                .replace("&raquo;", "»").replace("&mdash;", "—")
                .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))
        return html

    # -------------------------------------------------------------- images
    def _download(self, url, title):
        if url in self._img_cache:
            return self._img_cache[url]
        existing = Image.objects.filter(title=title).first()
        if existing:
            self._img_cache[url] = existing
            return existing
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0 (lpcrew-import)"})
            with urlopen(req, timeout=30) as resp:
                data = resp.read()
            with PILImage.open(BytesIO(data)) as im:
                im.verify()
            with PILImage.open(BytesIO(data)) as im:
                w, h = im.size
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"    нет картинки {url}: {exc}"))
            return None
        name = Path(urlparse(url).path).name or "image.jpg"
        image = Image(title=title[:255], width=w, height=h)
        image.file.save(name, ImageFile(BytesIO(data), name=name), save=False)
        image.save()
        self._img_cache[url] = image
        return image
