#!/usr/bin/env python3
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'
WORK_DIR = ARTIFACT_ROOT / 'work-ko'
BASE_WORK_DIR = ARTIFACT_ROOT / 'work'
FINAL_DIR = ARTIFACT_ROOT / 'final'
TIMINGS = BASE_WORK_DIR / 'timings.json'
SEGMENTS = ROOT / 'submission' / 'video-segments.json'
RAW_VIDEO = BASE_WORK_DIR / 'screen-raw-v2.mp4'
NARRATION = WORK_DIR / 'narration-ko.wav'
OUTPUT = FINAL_DIR / 'Hopyard-Designer-WebMCP-Challenge-Demo-KO.mp4'
KO_FONT = Path('/opt/X11/share/system_fonts/AppleSDGothicNeo.ttc')


def wrap_korean(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ''
    for char in text:
        candidate = current + char
        if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
            lines.append(current.strip())
            current = char
        else:
            current = candidate
    if current.strip():
        lines.append(current.strip())
    return lines


def render_caption(index: int, text: str) -> Path:
    font = ImageFont.truetype(str(KO_FONT), 38)
    probe = Image.new('RGBA', (1, 1))
    probe_draw = ImageDraw.Draw(probe)
    lines = wrap_korean(probe_draw, text, font, 1580)
    line_height = 49
    box_height = 24 + len(lines) * line_height + 24
    image = Image.new('RGBA', (1720, box_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, 1719, box_height - 1), radius=18, fill=(8, 18, 28, 218), outline=(134, 239, 172, 130), width=2)
    y = 20
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        draw.text(((1720 - (bbox[2] - bbox[0])) / 2, y), line, font=font, fill=(255, 255, 255, 255))
        y += line_height
    output = WORK_DIR / f'caption-ko-{index:02}.png'
    image.save(output)
    return output


def main() -> None:
    timings = json.loads(TIMINGS.read_text())
    segments = json.loads(SEGMENTS.read_text())
    if len(timings) != len(segments):
        raise ValueError('Segments and timings must have equal lengths.')
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    captions = [render_caption(index, segment['ko']) for index, segment in enumerate(segments, start=1)]
    command = ['ffmpeg', '-y', '-loglevel', 'warning', '-i', str(RAW_VIDEO), '-i', str(NARRATION)]
    for caption in captions:
        command.extend(['-loop', '1', '-framerate', '1', '-i', str(caption)])
    filters = [
        '[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,'
        'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0f172a,tpad=stop_mode=clone:stop_duration=3[v0]'
    ]
    previous = 'v0'
    top_scenes = {'compare', 'human-choice', 'preview', 'approval', 'integrity'}
    for offset, timing in enumerate(timings, start=2):
        current = f'v{offset - 1}'
        y_position = '78' if timing['scene'] in top_scenes else 'H-h-34'
        filters.append(
            f'[{previous}][{offset}:v]overlay=(W-w)/2:{y_position}:eof_action=pass:'
            f"enable='between(t,{timing['start']},{timing['end']})'[{current}]"
        )
        previous = current
    filters.append(f'[{previous}]scale=in_range=full:out_range=tv,format=yuv420p[vout]')
    filters.append('[1:a]loudnorm=I=-16:LRA=11:TP=-1.5[aout]')
    command.extend([
        '-filter_complex', ';'.join(filters), '-map', '[vout]', '-map', '[aout]',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-shortest', '-movflags', '+faststart', str(OUTPUT),
    ])
    subprocess.run(command, check=True)
    shutil.copy2(WORK_DIR / 'korean.srt', FINAL_DIR / 'Hopyard-Designer-WebMCP-Challenge-Korean.srt')
    print(OUTPUT)


if __name__ == '__main__':
    main()
