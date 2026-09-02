#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEGMENTS = ROOT / 'submission' / 'video-segments.json'
ARTIFACT_ROOT = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge'


def main() -> None:
    locale = sys.argv[1] if len(sys.argv) > 1 else 'en'
    if locale not in {'en', 'ko'}:
        raise ValueError('Locale must be en or ko.')
    voice = 'en-US-AndrewMultilingualNeural' if locale == 'en' else 'ko-KR-HyunsuMultilingualNeural'
    audio_dir = ARTIFACT_ROOT / ('audio' if locale == 'en' else 'audio-ko')
    edge_tts = shutil.which('edge-tts') or str(Path.home() / '.hermes/hermes-agent/venv/bin/edge-tts')
    segments = json.loads(SEGMENTS.read_text())
    audio_dir.mkdir(parents=True, exist_ok=True)
    for index, segment in enumerate(segments, start=1):
        output = audio_dir / f'{index:02}-{segment["scene"]}.mp3'
        subprocess.run([
            edge_tts,
            '--voice', voice,
            '--rate=-2%',
            '--pitch=-2Hz',
            '--text', segment.get('spoken', segment['en']) if locale == 'en' else segment.get('koSpoken', segment['ko']),
            '--write-media', str(output),
        ], check=True)
        print(f'{index:02}/{len(segments)} {output.name}')


if __name__ == '__main__':
    main()
