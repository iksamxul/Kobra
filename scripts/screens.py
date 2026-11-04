"""Turn full-size app captures into the site's responsive WebP screens and crops.

    python scripts/screens.py                  # everything in scripts/screens.json
    python scripts/screens.py --only everyday  # names containing "everyday"
    python scripts/screens.py --captures D:/kobra-captures

Sources are <captures>/<name>.png, written by the desktop app's site capture
(`KOBRA_REVIEW_SCALE=3 electron . --review-site`, 4320x2700 per 1440x900 window).

Rules, so no image on the site is ever stretched, squashed, sliced or enlarged:
  - Boxes are [x, y, width, height] in the 1440x900 window (CSS pixels) and are
    scaled to the capture separately on each axis.
  - A crop is exactly its box: no forced aspect ratio, nothing grown or trimmed
    to fit. Output height follows the box's own proportions.
  - Every output is a downscale. If a box has fewer source pixels than an output
    width asks for, the script stops with an error instead of upscaling.
  - A missing capture is an error, not a silent skip.

Outputs, in public/assets/screens/:
  <screen>-<w>.webp           full windows, one per width in "screen_widths"
  <crop>-<theme>-<w>.webp     crops, one per width in the crop's "widths"

Requires Pillow (pip install pillow). Run from the showcase folder.
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def fail(message):
    print(f'error: {message}', file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--config', default=str(ROOT / 'scripts' / 'screens.json'))
    parser.add_argument('--captures', default=str(ROOT / 'captures'), help='folder of <name>.png captures')
    parser.add_argument('--out', default=str(ROOT / 'public' / 'assets' / 'screens'))
    parser.add_argument('--only', default='', help='only names containing this text')
    parser.add_argument('--quality', type=int, default=92)
    args = parser.parse_args()

    config = json.loads(Path(args.config).read_text(encoding='utf-8'))
    captures, out = Path(args.captures), Path(args.out)
    ref_w, ref_h = config['reference']
    out.mkdir(parents=True, exist_ok=True)

    # Every job: (output name stem, source name, box in reference px or None for the whole window, widths)
    jobs = [(name, name, None, config['screen_widths']) for name in config['screens']]
    for crop, spec in config['crops'].items():
        for theme in config['themes']:
            jobs.append((f'{crop}-{theme}', f"{spec['from']}-{theme}", spec['box'], spec['widths']))
    jobs = [job for job in jobs if args.only in job[0]]

    missing = sorted({source for _, source, _, _ in jobs if not (captures / f'{source}.png').exists()})
    if missing:
        fail(f'missing captures in {captures}: {", ".join(missing)}')

    cache, rows = {}, []
    for stem, source, box, widths in jobs:
        if source not in cache:
            cache[source] = Image.open(captures / f'{source}.png').convert('RGB')
        image = cache[source]
        sx, sy = image.width / ref_w, image.height / ref_h
        x, y, w, h = box or (0, 0, ref_w, ref_h)
        if x < 0 or y < 0 or x + w > ref_w or y + h > ref_h:
            fail(f'{stem}: box {box} is outside the {ref_w}x{ref_h} window')
        region = (round(x * sx), round(y * sy), round((x + w) * sx), round((y + h) * sy))
        region_w, region_h = region[2] - region[0], region[3] - region[1]
        for width in widths:
            if width > region_w:
                fail(f'{stem}: {width}px wide would upscale a {region_w}px region of {source}.png; '
                     'recapture at a higher scale or lower the width')
            height = round(width * region_h / region_w)
            result = image.resize((width, height), Image.LANCZOS, box=region)
            target = out / f'{stem}-{width}.webp'
            result.save(target, 'WEBP', quality=args.quality, method=6)
            rows.append((target.name, width, height, region_w / width, target.stat().st_size))

    for name, width, height, ratio, size in rows:
        print(f'{name:<44} {width:>5}x{height:<5} {size / 1024:7.0f} KB   {ratio:4.2f} source px per px')
    print(f'\n{len(rows)} files written to {out}. Every one is a downscale (ratio >= 1).')


if __name__ == '__main__':
    main()
