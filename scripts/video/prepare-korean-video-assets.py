#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEGMENTS_PATH = ROOT / 'submission' / 'video-segments.json'
ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'
AUDIO_DIR = ARTIFACT_ROOT / 'audio-ko'
WORK_DIR = ARTIFACT_ROOT / 'work-ko'
BASE_TIMINGS = ARTIFACT_ROOT / 'work' / 'timings.json'
GAP_SECONDS = 0.45


def duration(path: Path) -> float:
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(path),
    ], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}'


def main() -> None:
    segments = json.loads(SEGMENTS_PATH.read_text())
    base = json.loads(BASE_TIMINGS.read_text())
    if len(segments) != len(base):
        raise ValueError('Korean segments and base timings must have equal lengths.')
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    chunks: list[Path] = []
    srt_blocks: list[str] = []
    report: list[dict] = []

    for index, (segment, timing) in enumerate(zip(segments, base), start=1):
        source = AUDIO_DIR / f'{index:02}-{segment["scene"]}.mp3'
        raw_duration = duration(source)
        voice_slot = timing['end'] - timing['start']
        speed = max(1.0, raw_duration / voice_slot)
        filters = []
        if speed > 1.001:
            filters.append(f'atempo={speed:.6f}')
        filters.extend([f'adelay={round(GAP_SECONDS * 1000)}', 'apad'])
        chunk = WORK_DIR / f'{index:02}-{segment["scene"]}.wav'
        subprocess.run([
            'ffmpeg', '-y', '-loglevel', 'error', '-i', str(source),
            '-af', ','.join(filters), '-t', str(timing['sceneDuration']),
            '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(chunk),
        ], check=True)
        chunks.append(chunk)
        srt_blocks.append(
            f'{index}\n{srt_time(timing["start"])} --> {srt_time(timing["end"])}\n{segment["ko"]}\n'
        )
        report.append({
            'scene': segment['scene'],
            'rawDuration': round(raw_duration, 3),
            'slotDuration': round(voice_slot, 3),
            'speed': round(speed, 3),
        })

    concat = WORK_DIR / 'audio-concat.txt'
    concat.write_text(''.join(f"file '{chunk}'\n" for chunk in chunks))
    narration = WORK_DIR / 'narration-ko.wav'
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat),
        '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(narration),
    ], check=True)
    subtitles = WORK_DIR / 'korean.srt'
    subtitles.write_text('\n'.join(srt_blocks), encoding='utf-8')
    (WORK_DIR / 'timing-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({
        'segments': len(segments),
        'duration': round(duration(narration), 3),
        'maxSpeed': max(item['speed'] for item in report),
        'narration': str(narration),
        'subtitles': str(subtitles),
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
