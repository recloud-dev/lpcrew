#!/usr/bin/env python3
"""Adapt source LP Crew logo raster to Tidal (14) palette variants."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "photo_2025-01-09_17-11-47.jpg"
OUT = ROOT / "variant-14-tidal" / "img" / "logos"


def _load_rgba() -> Image.Image:
    img = Image.open(SRC).convert("RGBA")
    # Trim near-white margins
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img


def _recolor_blue_channel(img: Image.Image, low: tuple[int, int, int], high: tuple[int, int, int]) -> Image.Image:
  """Map original blue gradient pixels toward tidal cyan."""
  px = img.load()
  w, h = img.size
  for y in range(h):
    for x in range(w):
      r, g, b, a = px[x, y]
      if a < 8:
        continue
      if b > r + 18 and b > g + 8:
        t = min(1.0, max(0.0, (b - 90) / 140))
        nr = int(low[0] + (high[0] - low[0]) * t)
        ng = int(low[1] + (high[1] - low[1]) * t)
        nb = int(low[2] + (high[2] - low[2]) * t)
        px[x, y] = (nr, ng, nb, a)
  return img


def variant_tidal_cream(img: Image.Image) -> Image.Image:
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if r < 70 and g < 70 and b < 70:
                px[x, y] = (244, 241, 234, a)
    return _recolor_blue_channel(out, (90, 180, 192), (200, 240, 245))


def variant_tidal_mono_cyan(img: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(img.convert("RGB"))
    out = Image.merge("RGBA", (gray, gray, gray, img.split()[3]))
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            t = r / 255
            nr = int(70 + t * 110)
            ng = int(150 + t * 90)
            nb = int(170 + t * 70)
            px[x, y] = (nr, ng, nb, a)
    return out


def variant_tidal_dark_glow(img: Image.Image) -> Image.Image:
    out = variant_tidal_cream(img)
    # Slight outer glow feel via contrast on alpha edges
    return ImageEnhance.Contrast(out).enhance(1.08)


def variant_tidal_inverted_mark(img: Image.Image) -> Image.Image:
    """Mark only feel: black -> cream, blues -> accent."""
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if r < 70 and g < 70 and b < 70:
                px[x, y] = (12, 12, 14, a)
            elif b > r + 18:
                px[x, y] = (143, 214, 224, a)
            else:
                px[x, y] = (244, 241, 234, a)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = _load_rgba()
    sizes = {
        "logo-tidal-photo-full.png": 440,
        "logo-tidal-photo-mark.png": 160,
    }
    variants = {
        "logo-tidal-photo-cream": variant_tidal_cream,
        "logo-tidal-photo-cyan": variant_tidal_mono_cyan,
        "logo-tidal-photo-glow": variant_tidal_dark_glow,
        "logo-tidal-photo-print": variant_tidal_inverted_mark,
    }
    for name, fn in variants.items():
        processed = fn(base)
        processed.save(OUT / f"{name}.png", optimize=True)
        mark = processed.copy()
        mark.thumbnail((160, 160), Image.Resampling.LANCZOS)
        mark.save(OUT / f"{name}-mark.png", optimize=True)

    cream = variant_tidal_cream(base)
    for out_name, width in sizes.items():
        im = cream.copy()
        im.thumbnail((width, width * 3), Image.Resampling.LANCZOS)
        im.save(OUT / out_name, optimize=True)

    print(f"Wrote raster logo variants to {OUT}")


if __name__ == "__main__":
    main()
