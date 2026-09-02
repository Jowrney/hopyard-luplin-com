#!/usr/bin/env python3
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'
WORK_DIR = ARTIFACT_ROOT / 'work'
FINAL_DIR = ARTIFACT_ROOT / 'final'
TIMINGS = WORK_DIR / 'timings.json'
RAW_VIDEO = WORK_DIR / 'screen-raw-v2.mp4'
NARRATION = WORK_DIR / 'narration.wav'
OUTPUT = FINAL_DIR / 'Hopyard-Designer-WebMCP-Challenge-Demo.mp4'
EN_FONT = Path('/opt/X11/share/system_fonts/Supplemental/Arial.ttf')
WIDTH = 1920
HEIGHT = 1080


def wrap_by_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines = []
    current = ''
    for word in words:
        candidate = f'{current} {word}'.strip()
        if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def render_caption(index: int, en: str) -> Path:
    en_font = ImageFont.truetype(str(EN_FONT), 36)
    probe = Image.new('RGBA', (1, 1))
    draw = ImageDraw.Draw(probe)
    max_text_width = 1600
    en_lines = wrap_by_width(draw, en, en_font, max_text_width)
    line_height_en = 46
    box_height = 24 + len(en_lines) * line_height_en + 24
    image = Image.new('RGBA', (1720, box_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, 1719, box_height - 1), radius=18, fill=(8, 18, 28, 218), outline=(134, 239, 172, 130), width=2)
    y = 20
    for line in en_lines:
        bbox = draw.textbbox((0, 0), line, font=en_font)
        draw.text(((1720 - (bbox[2] - bbox[0])) / 2, y), line, font=en_font, fill=(255, 255, 255, 255))
        y += line_height_en

    output = WORK_DIR / f'caption-{index:02}.png'
    image.save(output)
    return output


def main() -> None:
    if not RAW_VIDEO.exists():
        raise FileNotFoundError(RAW_VIDEO)
    timings = json.loads(TIMINGS.read_text())
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    captions = [render_caption(item['index'], item['en']) for item in timings]

    command = ['ffmpeg', '-y', '-loglevel', 'warning', '-i', str(RAW_VIDEO), '-i', str(NARRATION)]
    for caption in captions:
        command.extend(['-loop', '1', '-framerate', '1', '-i', str(caption)])

    filters = [
        '[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,'
        'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0f172a,tpad=stop_mode=clone:stop_duration=3[v0]'
    ]
    previous = 'v0'
    for offset, item in enumerate(timings, start=2):
        current = f'v{offset - 1}'
        start = item['start']
        end = item['end']
        y_position = '78' if item['scene'] in {'compare', 'human-choice', 'preview', 'approval', 'integrity', 'impact'} else 'H-h-34'
        filters.append(
            f'[{previous}][{offset}:v]overlay=(W-w)/2:{y_position}:eof_action=pass:'
            f"enable='between(t,{start},{end})'[{current}]"
        )
        previous = current
    filters.append(f'[{previous}]scale=in_range=full:out_range=tv,format=yuv420p[vout]')
    filters.append('[1:a]loudnorm=I=-16:LRA=11:TP=-1.5[aout]')

    command.extend([
        '-filter_complex', ';'.join(filters),
        '-map', '[vout]', '-map', '[aout]',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-shortest', '-movflags', '+faststart', str(OUTPUT),
    ])
    subprocess.run(command, check=True)
    shutil.copy2(WORK_DIR / 'english.srt', FINAL_DIR / 'Hopyard-Designer-WebMCP-Challenge-English.srt')
    print(OUTPUT)


if __name__ == '__main__':
    main()
