"""Turn full-size app captures into the site's responsive WebP screens and crops.

    python scripts/screens.py                  # everything in scripts/screens.json
    python scripts/screens.py --only everyday  # names containing "everyday"
    python scripts/screens.py --captures D:/kobra-captures

For every source name (for example "watch-dark") the script uses
<captures>/<name>.png when it exists: the 2880x1800 captures listed in
public/assets/screens/MANIFEST.md. Otherwise it falls back to the interim
1920x1200 capture named in screens.json, upscales it and says so.

Outputs, in public/assets/screens/:
  <screen>-1440.webp and <screen>-2880.webp   full 16:10 windows
  <crop>-<theme>-<w>.webp and -<2w>.webp      tight crops, 1x and 2x

Requires Pillow (pip install pillow). Run from the showcase folder.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SCREEN_WIDTHS = (1440, 2880)


def load_source(name, config, captures):
    """Return (image, label) for a source name, preferring a new 2x capture."""
    fresh = captures / f'{name}.png'
    if fresh.exists():
        return Image.open(fresh).convert('RGB'), fresh.name
    interim = config['sources'].get(name)
    if not interim:
        return None, None
    path = (ROOT / config['interim'] / interim).resolve()
    if not path.exists():
        return None, None
    return Image.open(path).convert('RGB'), f'{interim} (interim)'


def fit_box(box, size):
    """Grow or shrink the box height around its centre so it matches the output aspect."""
    x, y, w, h = box
    target = w * size[1] / size[0]
    return x, y + (h - target) / 2, w, target


def render(image, box, size):
    """Crop and resample in one step; lightly sharpen anything that had to be enlarged."""
    x, y, w, h = box
    out = image.resize(size, Image.LANCZOS, box=(x, y, x + w, y + h))
    scale = size[0] / w
    if scale > 1.02:
        out = out.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))
    return out, scale


def save(image, path, quality):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'WEBP', quality=quality, method=6)
    return path.stat().st_size


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--config', default=str(ROOT / 'scripts' / 'screens.json'))
    parser.add_argument('--captures', default=str(ROOT / 'captures'), help='folder of new <name>.png captures')
    parser.add_argument('--out', default=str(ROOT / 'public' / 'assets' / 'screens'))
    parser.add_argument('--only', default='', help='only names containing this text')
    parser.add_argument('--quality', type=int, default=86)
    args = parser.parse_args()

    config = json.loads(Path(args.config).read_text(encoding='utf-8'))
    captures, out = Path(args.captures), Path(args.out)
    ref_w = config['reference'][0]
    cache = {}
    rows, missing = [], []

    def source(name):
        if name not in cache:
            cache[name] = load_source(name, config, captures)
        return cache[name]

    for name in config['screens']:
        if args.only not in name:
            continue
        image, label = source(name)
        if image is None:
            missing.append(name)
            continue
        # Centre-crop to 16:10 if a capture arrives at another aspect.
        w, h = image.size
        box = fit_box((0, 0, w, h), (16, 10)) if abs(w / h - 1.6) > .01 else (0, 0, w, h)
        for width in SCREEN_WIDTHS:
            result, scale = render(image, box, (width, width * 10 // 16))
            target = out / f'{name}-{width}.webp'
            rows.append((target.name, scale, save(result, target, args.quality), label))

    for crop, spec in config['crops'].items():
        for theme in config['themes']:
            name = f'{crop}-{theme}'
            if args.only not in name:
                continue
            image, label = source(f"{spec['from']}-{theme}")
            if image is None:
                missing.append(name)
                continue
            factor = image.size[0] / ref_w
            box = fit_box([v * factor for v in spec['box']], spec['size'])
            for multiplier in (1, 2):
                size = (spec['size'][0] * multiplier, spec['size'][1] * multiplier)
                result, scale = render(image, box, size)
                target = out / f'{name}-{size[0]}.webp'
                rows.append((target.name, scale, save(result, target, args.quality), label))

    for filename, scale, size, label in rows:
        note = f'  upscaled {scale:.2f}x' if scale > 1.02 else ''
        print(f'{filename:<40} {size / 1024:7.0f} KB  from {label}{note}')
    if missing:
        print('\nMissing sources (nothing written):', ', '.join(missing))
    upscaled = sum(1 for row in rows if row[1] > 1.02)
    print(f'\n{len(rows)} files written to {out}. {upscaled} were enlarged from smaller captures.')


if __name__ == '__main__':
    main()
