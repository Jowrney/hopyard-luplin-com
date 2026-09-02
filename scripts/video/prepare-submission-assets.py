#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEGMENTS_PATH = ROOT / 'submission' / 'video-segments.json'
ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'
AUDIO_DIR = ARTIFACT_ROOT / 'audio'
WORK_DIR = ARTIFACT_ROOT / 'work'
GAP_SECONDS = 0.45


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def duration(path: Path) -> float:
    result = subprocess.run(
        [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}'


def main() -> None:
    segments = json.loads(SEGMENTS_PATH.read_text())
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    silence = WORK_DIR / 'silence.wav'
    run(
        'ffmpeg', '-y', '-f', 'lavfi', '-i',
        f'anullsrc=channel_layout=mono:sample_rate=48000',
        '-t', str(GAP_SECONDS), '-c:a', 'pcm_s16le', str(silence),
    )

    wav_paths: list[Path] = []
    timeline: list[dict] = []
    cursor = 0.0
    srt_blocks: list[str] = []

    for index, segment in enumerate(segments, start=1):
        mp3 = AUDIO_DIR / f'{index:02}-{segment["scene"]}.mp3'
        if not mp3.exists():
            raise FileNotFoundError(mp3)
        wav = WORK_DIR / f'{index:02}-{segment["scene"]}.wav'
        run('ffmpeg', '-y', '-i', str(mp3), '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(wav))
        clip_duration = duration(wav)
        start = cursor + GAP_SECONDS
        end = start + clip_duration
        timeline.append({
            **segment,
            'index': index,
            'audio': str(mp3),
            'start': round(start, 3),
            'end': round(end, 3),
            'duration': round(clip_duration, 3),
            'sceneDuration': round(GAP_SECONDS + clip_duration, 3),
        })
        srt_blocks.append(
            f'{index}\n{srt_time(start)} --> {srt_time(end)}\n{segment["en"]}\n{segment["ko"]}\n'
        )
        wav_paths.extend([silence, wav])
        cursor = end

    concat_list = WORK_DIR / 'audio-concat.txt'
    concat_list.write_text(''.join(f"file '{path}'\n" for path in wav_paths))
    narration = WORK_DIR / 'narration.wav'
    run(
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(concat_list),
        '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(narration),
    )

    (WORK_DIR / 'timings.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n')
    (WORK_DIR / 'bilingual.srt').write_text('\n'.join(srt_blocks), encoding='utf-8')
    print(json.dumps({
        'segments': len(timeline),
        'duration': round(duration(narration), 3),
        'narration': str(narration),
        'subtitles': str(WORK_DIR / 'bilingual.srt'),
        'timings': str(WORK_DIR / 'timings.json'),
    }, indent=2))


if __name__ == '__main__':
    main()
