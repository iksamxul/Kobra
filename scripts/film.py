"""Still frames from the bundled sample films for the illustrated feature panels.

    python scripts/film.py [--media ../public]

Reads the desktop app's sample media (Blender Foundation trailers, CC BY 3.0;
MDN flower clip, CC0) and writes small WebP stills to public/assets/film/.
Needs ffmpeg on PATH and Pillow. The trailers are 854x480, so stills are only
ever shown at or below half their pixel width (sharp on 2x displays).
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# name: (file, seconds, crop box in source pixels or None, output size)
# Sintel is letterboxed to 2.39:1 inside 854x480; its 16:9 crops skip the bars.
FRAMES = {
    'scene-1': ('sintel-trailer.webm', 6.0, (104, 58, 750, 422), (320, 180)),
    'scene-2': ('sintel-trailer.webm', 15.0, (104, 58, 750, 422), (320, 180)),
    'scene-3': ('sintel-trailer.webm', 21.0, (104, 58, 750, 422), (320, 180)),
    'scene-4': ('sintel-trailer.webm', 24.0, (104, 58, 750, 422), (320, 180)),
    'scene-5': ('sintel-trailer.webm', 30.0, (104, 58, 750, 422), (320, 180)),
    'scene-6': ('sintel-trailer.webm', 39.0, (104, 58, 750, 422), (320, 180)),
    'bunny-meadow': ('bunny-trailer.webm', 25.5, None, (854, 480)),
    'sintel-dragon': ('sintel-trailer.webm', 30.0, (0, 58, 854, 422), (854, 364)),
    'sintel-city': ('sintel-trailer.webm', 24.0, (104, 58, 750, 422), (640, 360)),
}
POSTERS = {'sintel': 'sintel-poster.jpg', 'bunny': 'bunny-poster.jpg', 'flower': 'flower-poster.jpg'}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--media', default=str(ROOT.parent / 'public'), help="the desktop app's public folder")
    args = parser.parse_args()
    media, out = Path(args.media), ROOT / 'public' / 'assets' / 'film'
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        for name, (source, seconds, box, size) in FRAMES.items():
            frame = Path(temp) / f'{name}.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(seconds), '-i', str(media / source),
                            '-frames:v', '1', str(frame)], check=True)
            image = Image.open(frame).convert('RGB')
            image = image.resize(size, Image.LANCZOS, box=box) if box else image.resize(size, Image.LANCZOS)
            image.save(out / f'{name}.webp', 'WEBP', quality=84, method=6)
            print(f'{name}.webp  {size[0]}x{size[1]}  from {source} at {seconds}s')
    for name, source in POSTERS.items():
        image = Image.open(media / source).convert('RGB')
        image.save(out / f'{name}.webp', 'WEBP', quality=84, method=6)
        print(f'{name}.webp  {image.size[0]}x{image.size[1]}  from {source}')


if __name__ == '__main__':
    main()
