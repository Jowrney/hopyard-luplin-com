#!/usr/bin/env python3
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'
RAW_VIDEO = ARTIFACT_ROOT / 'work' / 'screen-raw-v2.mp4'
FINAL_DIR = ARTIFACT_ROOT / 'final'
FRAME = ARTIFACT_ROOT / 'work' / 'thumbnail-frame.png'
OUTPUT = FINAL_DIR / 'Hopyard-Designer-WebMCP-Challenge-Thumbnail.png'
FONT_REGULAR = '/opt/X11/share/system_fonts/Supplemental/Arial.ttf'
FONT_BOLD = '/opt/X11/share/system_fonts/Supplemental/Arial Bold.ttf'


def main() -> None:
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-ss', '53', '-i', str(RAW_VIDEO),
        '-frames:v', '1', '-update', '1', str(FRAME),
    ], check=True)
    source = Image.open(FRAME).convert('RGB')
    canvas = source.resize((1280, 720), Image.Resampling.LANCZOS).convert('RGBA')
    shade = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    shade_draw = ImageDraw.Draw(shade)
    for x in range(1280):
        opacity = int(max(0, min(225, (x - 470) / 650 * 225)))
        shade_draw.line((x, 0, x, 720), fill=(9, 25, 18, opacity))
    shade_draw.rounded_rectangle((688, 92, 1208, 628), radius=30, fill=(13, 36, 24, 226), outline=(134, 239, 172, 180), width=3)
    canvas = Image.alpha_composite(canvas, shade)
    draw = ImageDraw.Draw(canvas)
    small = ImageFont.truetype(FONT_BOLD, 24)
    title = ImageFont.truetype(FONT_BOLD, 54)
    subtitle = ImageFont.truetype(FONT_BOLD, 31)
    body = ImageFont.truetype(FONT_REGULAR, 25)
    url_font = ImageFont.truetype(FONT_BOLD, 21)
    draw.text((740, 135), 'OPENAI WEBMCP CHALLENGE', font=small, fill=(134, 239, 172))
    draw.text((740, 202), 'Hopyard', font=title, fill='white')
    draw.text((740, 263), 'Designer', font=title, fill='white')
    draw.text((740, 335), 'BY HOPEDEN', font=small, fill=(134, 239, 172))
    draw.text((740, 392), 'Human + Agent', font=subtitle, fill=(187, 247, 208))
    draw.text((740, 431), 'Hopyard Design', font=subtitle, fill=(187, 247, 208))
    draw.text((740, 502), '5 tools  →  7 tools  →  human approval', font=body, fill=(226, 232, 240))
    draw.text((740, 570), 'hopyard.luplin.com/design/demo', font=url_font, fill=(134, 239, 172))
    canvas.convert('RGB').save(OUTPUT, quality=95)
    print(OUTPUT)


if __name__ == '__main__':
    main()
