"""Перенос старого MarqueeBlock (phrase/sign) -> MarqueeBlock.items[]."""
import json

from django.db import migrations


def _forward(raw):
    changed = False
    for block in raw:
        if block.get("type") != "marquee":
            continue
        value = block.get("value") or {}
        if "items" in value:
            continue
        block["value"] = {
            "items": [{
                "phrase": value.get("phrase", ""),
                "sign": value.get("sign", ""),
            }]
        }
        changed = True
    return changed


def _backward(raw):
    changed = False
    for block in raw:
        if block.get("type") != "marquee":
            continue
        value = block.get("value") or {}
        items = value.get("items") or []
        first = items[0].get("value", items[0]) if items else {}
        block["value"] = {
            "phrase": first.get("phrase", ""),
            "sign": first.get("sign", ""),
        }
        changed = True
    return changed


def _migrate(apps, convert):
    HomePage = apps.get_model("home", "HomePage")
    Revision = apps.get_model("wagtailcore", "Revision")
    ContentType = apps.get_model("contenttypes", "ContentType")

    for page in HomePage.objects.all():
        raw = list(page.body.raw_data)
        if convert(raw):
            page.body = json.dumps(raw)
            page.save(update_fields=["body"])

    try:
        ct = ContentType.objects.get(app_label="home", model="homepage")
    except ContentType.DoesNotExist:
        return
    for rev in Revision.objects.filter(content_type=ct):
        content = rev.content
        body = content.get("body")
        if not body:
            continue
        raw = json.loads(body) if isinstance(body, str) else body
        if convert(raw):
            content["body"] = json.dumps(raw)
            rev.content = content
            rev.save(update_fields=["content"])


def forwards(apps, schema_editor):
    _migrate(apps, _forward)


def backwards(apps, schema_editor):
    _migrate(apps, _backward)


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0003_alter_homepage_body"),
        ("wagtailcore", "0094_alter_page_locale"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
