#!/usr/bin/env python3
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEGMENTS = ROOT / 'submission' / 'video-segments.json'
AUDIO_DIR = Path.home() / 'Movies' / 'HOPEDEN-WebMCP-Challenge' / 'audio'
VOICE = 'en-US-AndrewMultilingualNeural'


def main() -> None:
    edge_tts = shutil.which('edge-tts') or str(Path.home() / '.hermes/hermes-agent/venv/bin/edge-tts')
    segments = json.loads(SEGMENTS.read_text())
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for index, segment in enumerate(segments, start=1):
        output = AUDIO_DIR / f'{index:02}-{segment["scene"]}.mp3'
        subprocess.run([
            edge_tts,
            '--voice', VOICE,
            '--rate=-2%',
            '--pitch=-2Hz',
            '--text', segment.get('spoken', segment['en']),
            '--write-media', str(output),
        ], check=True)
        print(f'{index:02}/{len(segments)} {output.name}')


if __name__ == '__main__':
    main()
