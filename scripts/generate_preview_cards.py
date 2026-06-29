from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import textwrap
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "previews"
VERSION = datetime.now().strftime("%Y%m%d")
W, H = 1200, 630
ICON_SIZE = 214
ICON_BG = "#f3ece2"

FONT_DIR = Path("C:/Windows/Fonts")
BOLD = ImageFont.truetype(str(FONT_DIR / "arialbd.ttf"), 72)
BOLD_SMALL = ImageFont.truetype(str(FONT_DIR / "arialbd.ttf"), 28)
BODY = ImageFont.truetype(str(FONT_DIR / "arial.ttf"), 34)
BODY_SMALL = ImageFont.truetype(str(FONT_DIR / "arial.ttf"), 26)
URL_FONT = ImageFont.truetype(str(FONT_DIR / "arialbd.ttf"), 24)


APPS = [
    {
        "slug": "aolabs",
        "title": "Alan Pham / aolabs.io",
        "description": "Research, tools, papers, robotics work, and live systems.",
        "url": "aolabs.io",
        "accent": "#dc9d91",
    },
    {
        "slug": "imagineer",
        "title": "imagineer",
        "description": "One current step for Alan's WDI R&D path.",
        "url": "imagineer.aolabs.io",
        "accent": "#66799f",
    },
    {
        "slug": "cv",
        "title": "cv",
        "description": "Mechanical R&D CV for soft robotics and AI-assisted prototyping.",
        "url": "cv.aolabs.io",
        "accent": "#68758f",
    },
    {
        "slug": "brain",
        "title": "brain",
        "description": "PDF bank for autism, ADHD, and relationship-context notes.",
        "url": "aolabs.io/brain",
        "accent": "#4f817c",
    },
    {
        "slug": "blood",
        "title": "blood",
        "description": "CONTOUR NEXT ONE readings from the always-on Blood bridge.",
        "url": "aolabs.io/blood",
        "accent": "#9f3041",
    },
    {
        "slug": "paper",
        "title": "paper",
        "description": "Manuscript word movement and paper-change queue.",
        "url": "paper.aolabs.io",
        "accent": "#725e70",
    },
    {
        "slug": "slayy",
        "title": "slayy",
        "description": "Paper-progress hype emails, scores, citations, and archive.",
        "url": "slayy.aolabs.io",
        "accent": "#c34a78",
    },
    {
        "slug": "sleep",
        "title": "sleep",
        "description": "Daily sleep-hours log from Samsung Health through Health Connect.",
        "url": "sleep.aolabs.io",
        "accent": "#6f837d",
    },
    {
        "slug": "sarrus",
        "title": "sarrus",
        "description": "Soft robotic surfaces, motion records, measurements, and paper.",
        "url": "sarrus.aolabs.io",
        "accent": "#81977f",
    },
    {
        "slug": "wavevis",
        "title": "wavevis",
        "description": "Overhang-wave target and constrained-cell mechanism simulator.",
        "url": "aolabs.io/wavevis",
        "accent": "#6d8390",
    },
    {
        "slug": "phd",
        "title": "phd",
        "description": "A PhD capture inbox for thoughts, files, links, screenshots, and fragments.",
        "url": "phd.aolabs.io",
        "accent": "#6f4b57",
    },
    {
        "slug": "sandia",
        "title": "sandia",
        "description": "NOMAD research record, coauthored paper, FEA results, and presentations.",
        "url": "aolabs.io/sandia",
        "accent": "#2f7f80",
    },
    {
        "slug": "ocean",
        "title": "ocean",
        "description": "WDI-style robotics, animatronics, haptics, and physical-interface inspiration.",
        "url": "ocean.aolabs.io",
        "accent": "#527d83",
    },
    {
        "slug": "progress",
        "title": "progress",
        "description": "AO Labs source monitor, scan log, and work-memory ledger.",
        "url": "progress.aolabs.io",
        "accent": "#5d72ad",
    },
    {
        "slug": "spec",
        "title": "spec",
        "description": "Alan's AI operating instruction record.",
        "url": "spec.aolabs.io",
        "accent": "#76678d",
    },
    {
        "slug": "talk",
        "title": "talk",
        "description": "A direct AI mirror shaped by Alan's current voice and context.",
        "url": "talk.aolabs.io",
        "accent": "#8c704d",
    },
    {
        "slug": "curtis",
        "title": "curtis",
        "description": "Evidence-backed violin practice clips, timing, and repertoire records.",
        "url": "curtis.aolabs.io",
        "accent": "#8f625d",
    },
    {
        "slug": "relay",
        "title": "relay",
        "description": "Sales-call notes become one clean follow-up email with live evidence.",
        "url": "relay.aolabs.io",
        "accent": "#b87966",
    },
    {
        "slug": "nerve",
        "title": "nerve",
        "description": "Pressure-practice for sharper answers and calm under stress.",
        "url": "nerve.aolabs.io",
        "accent": "#b98259",
    },
    {
        "slug": "violin",
        "title": "violin",
        "description": "A dense source-linked wall of fine violin backs.",
        "url": "violin.aolabs.io",
        "accent": "#a8783c",
    },
    {
        "slug": "virtualviolin",
        "title": "virtual violin",
        "description": "Bridge-angle bowing and chromatic fingering in the browser.",
        "url": "aolabs.io/virtualviolin",
        "accent": "#b96f36",
    },
    {
        "slug": "bus",
        "title": "bus",
        "description": "Minimal WRTA live tracker for routes 2, 4, 3, 30, and 31.",
        "url": "bus.aolabs.io",
        "accent": "#bf6e49",
    },
    {
        "slug": "league",
        "title": "league",
        "description": "Recording review room for Samira, Caitlyn, and Fizz practice.",
        "url": "league.aolabs.io",
        "accent": "#8a738d",
    },
    {
        "slug": "spotify",
        "title": "spotify",
        "description": "Alan's driving-playlist version record.",
        "url": "spotify.aolabs.io",
        "accent": "#5f7668",
    },
    {
        "slug": "a3",
        "title": "a3",
        "description": "Audi A3 cockpit telemetry and purchase-state evidence.",
        "url": "a3.aolabs.io",
        "accent": "#7b8aa6",
    },
    {
        "slug": "idleshroom",
        "title": "idle shroom",
        "description": "A cozy-dark mushroom tap RPG with growth, rewards, and bosses.",
        "url": "aolabs.io/idleshroom",
        "accent": "#c17660",
    },
    {
        "slug": "meowtronome",
        "title": "meowtronome",
        "description": "A quiet browser metronome using a cat-yap sound.",
        "url": "meowtronome.aolabs.io",
        "accent": "#b87966",
    },
    {
        "slug": "dbalarm",
        "title": "dbalarm",
        "description": "Browser microphone alarm for high relative dB levels.",
        "url": "aolabs.io/dbalarm",
        "accent": "#c96155",
    },
    {
        "slug": "lily",
        "title": "lily",
        "description": "A private memory bank for notes, screenshots, photos, dates, and context.",
        "url": "lily.aolabs.io",
        "accent": "#c28b98",
    },
    {
        "slug": "yum",
        "title": "yum",
        "description": "A correction-conditioned media wall and paper for personal taste.",
        "url": "yum.aolabs.io",
        "accent": "#bb8854",
    },
    {
        "slug": "cooking",
        "title": "cooking",
        "description": "Recipe table with ratings, photos, recipes, and practical estimates.",
        "url": "cooking.aolabs.io",
        "accent": "#987856",
    },
    {
        "slug": "wallguard",
        "title": "wallguard",
        "description": "Private Messenger group-state guard dashboard and restore log.",
        "url": "wallguard.aolabs.io",
        "accent": "#6f837d",
    },
    {
        "slug": "duet",
        "title": "duet",
        "description": "A small interaction study for playful human compatibility reads.",
        "url": "duet.aolabs.io/hello",
        "accent": "#c28b98",
    },
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    return right - left, bottom - top


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int) -> ImageFont.FreeTypeFont:
    size = start_size
    while size >= min_size:
        font = ImageFont.truetype(str(FONT_DIR / "arialbd.ttf"), size)
        if text_size(draw, text, font)[0] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(FONT_DIR / "arialbd.ttf"), min_size)


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if text_size(draw, test, font)[0] <= width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:3]


def mark(draw: ImageDraw.ImageDraw, accent: str) -> None:
    accent_rgb = hex_to_rgb(accent)
    x, y = 848, 174
    colors = [
        tuple(round((c * 0.72) + (238 * 0.28)) for c in accent_rgb),
        (204, 167, 99),
        tuple(round((c * 0.92) + (120 * 0.08)) for c in accent_rgb),
    ]
    offsets = [(0, 0), (70, 0), (140, 0)]
    for idx, (dx, dy) in enumerate(offsets):
        draw.rounded_rectangle(
            (x + dx, y + dy, x + dx + 96, y + dy + 142),
            radius=35,
            outline=colors[idx],
            width=17,
        )
    draw.ellipse((x + 92, y + 38, x + 156, y + 102), fill=(247, 242, 231), outline=(188, 154, 96), width=7)
    draw.polygon([(x + 122, y + 49), (x + 148, y + 88), (x + 96, y + 88)], fill=(212, 149, 85))


def edge_path() -> str:
    candidates = [
        shutil.which("msedge"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    raise RuntimeError("Microsoft Edge is required to render SVG app icons into preview cards.")


def icon_path(app: dict[str, str]) -> Path | None:
    slug = app["slug"]
    png = ROOT / "icons" / f"{slug}.png"
    svg = ROOT / "icons" / f"{slug}.svg"
    if png.exists():
        return png
    if svg.exists():
        return svg
    return None


def render_icon(path: Path, cache_dir: Path, browser: str) -> Image.Image:
    out = cache_dir / f"{path.stem}.png"
    html = cache_dir / f"{path.stem}.html"
    html.write_text(
        f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {{
      width: {ICON_SIZE}px;
      height: {ICON_SIZE}px;
      margin: 0;
      overflow: hidden;
      background: {ICON_BG};
    }}
    body {{
      display: grid;
      place-items: center;
    }}
    img {{
      display: block;
      width: {ICON_SIZE - 14}px;
      height: {ICON_SIZE - 14}px;
      object-fit: contain;
    }}
  </style>
</head>
<body><img src="{path.as_uri()}" alt=""></body>
</html>
""",
        encoding="utf-8",
    )
    subprocess.run(
        [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--screenshot={out}",
            f"--window-size={ICON_SIZE},{ICON_SIZE}",
            html.as_uri(),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return Image.open(out).convert("RGBA")


def card(app: dict[str, str], cache_dir: Path, browser: str) -> None:
    im = Image.new("RGB", (W, H), "#efe8de")
    draw = ImageDraw.Draw(im)

    accent = app["accent"]
    accent_rgb = hex_to_rgb(accent)
    draw.rectangle((0, 0, W, 8), fill=accent_rgb)
    draw.rectangle((0, H - 8, W, H), fill=(56, 42, 48))
    draw.rounded_rectangle((54, 54, W - 54, H - 54), radius=28, fill="#f3ece2")

    draw.text((128, 134), "AO LABS", fill="#625950", font=BOLD_SMALL)
    title_font = fit_font(draw, app["title"], 650, 82, 48)
    draw.text((128, 187), app["title"], fill="#25211e", font=title_font)

    body_lines = wrap(draw, app["description"], BODY, 650)
    y = 294
    for line in body_lines:
        draw.text((128, y), line, fill="#635b52", font=BODY)
        y += 43

    draw.text((128, 474), app["url"], fill="#6d6258", font=URL_FONT)
    draw.text((1040, 474), "2026", fill="#6d6258", font=URL_FONT)
    icon = icon_path(app)
    if icon:
        app_icon = render_icon(icon, cache_dir, browser)
        im.paste(app_icon.convert("RGB"), (830, 146))
    else:
        mark(draw, accent)

    im.save(OUT / f"{app['slug']}-{VERSION}.png", optimize=True)


def contact_sheet() -> None:
    thumbs = []
    for app in APPS:
        path = OUT / f"{app['slug']}-{VERSION}.png"
        im = Image.open(path)
        im.thumbnail((240, 126))
        thumbs.append((app["slug"], im.copy()))
    sheet = Image.new("RGB", (240 * 3, 166 * ((len(thumbs) + 2) // 3)), "#efe8de")
    draw = ImageDraw.Draw(sheet)
    for idx, (slug, im) in enumerate(thumbs):
        x = (idx % 3) * 240
        y = (idx // 3) * 166
        sheet.paste(im, (x, y))
        draw.text((x + 8, y + 132), slug, fill="#2d2426", font=BODY_SMALL)
    sheet.save(ROOT / f"_preview-contact-sheet-{VERSION}.png", optimize=True)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    browser = edge_path()
    with tempfile.TemporaryDirectory(prefix="aolabs-preview-icons-") as tmp:
        cache_dir = Path(tmp)
        for app in APPS:
            card(app, cache_dir, browser)
    contact_sheet()
    (OUT / "manifest.json").write_text(
        json.dumps(
            [
                {
                    **app,
                    "image": f"https://aolabs.io/previews/{app['slug']}-{VERSION}.png",
                    "version": VERSION,
                }
                for app in APPS
            ],
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
