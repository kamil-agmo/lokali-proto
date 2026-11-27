#!/usr/bin/env python3
"""Make the full set of web-app icons from one source image.

Two ways in:

  --mark FILE   a logo mark with a TRANSPARENT background (PNG, or SVG). The script draws it on a background you choose, at the right size for
                each icon, and keeps it inside the "safe zone" of the maskable icon. This gives the best result, and it is the only way to get a
                correct maskable icon when the background is a gradient.
  --icon FILE   a finished square icon (PNG, or SVG, at least 512 px). It is resized as it is. The maskable icon is made by shrinking it onto a
                background that continues the icon's own corner colours (or --bg), so a gradient background stays smooth.

  python3 make_icons.py --out assets/icons --mark logo.png --bg "#ffffff" --bg2 "#e9ebff"
  python3 make_icons.py --out assets/icons --icon app-icon-1024.png

Writes: icon-192.png, icon-512.png, icon-maskable-512.png, icon-1024.png (when the source is big enough), apple-touch-icon.png (180, opaque: iOS
fills transparency with black), favicon-16.png, favicon-32.png, favicon-48.png.

Needs Pillow (pip install pillow). An SVG source is rasterised with the first tool found: cairosvg, rsvg-convert, inkscape, or macOS qlmanage.
qlmanage paints on white, so in --mark mode the white is turned back into transparency (colour-to-alpha). If no tool exists, export the SVG as
a 1024 px PNG first.
"""
import argparse, math, os, shutil, subprocess, sys, tempfile

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow is required: pip install pillow')


def parse_color(s):
    s = s.strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    if len(s) != 6:
        raise SystemExit('A colour must look like #rgb or #rrggbb, not %r' % s)
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def rasterise_svg(path, size=1024):
    """Return (image, painted_on_white)."""
    try:
        import cairosvg  # type: ignore
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, 'x.png')
            cairosvg.svg2png(url=path, write_to=out, output_width=size, output_height=size)
            return Image.open(out).convert('RGBA'), False
    except ImportError:
        pass
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, 'x.png')
        if shutil.which('rsvg-convert'):
            subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size), '--keep-aspect-ratio', path, '-o', out], check=True)
            return Image.open(out).convert('RGBA'), False
        if shutil.which('inkscape'):
            subprocess.run(['inkscape', path, '--export-type=png', '--export-filename=' + out, '-w', str(size)], check=True, capture_output=True)
            return Image.open(out).convert('RGBA'), False
        if shutil.which('qlmanage'):
            subprocess.run(['qlmanage', '-t', '-s', str(size), '-o', d, path], check=True, capture_output=True)
            produced = os.path.join(d, os.path.basename(path) + '.png')
            if os.path.exists(produced):
                return Image.open(produced).convert('RGBA'), True
    raise SystemExit('Cannot rasterise the SVG here (no cairosvg, rsvg-convert, inkscape or qlmanage). Export it as a 1024 px PNG and pass that.')


def color_to_alpha_white(img):
    """Turn an image painted on white back into colour + transparency (the smallest alpha that keeps every colour valid)."""
    out = []
    for r, g, b in img.convert('RGB').getdata():
        a = max(255 - r, 255 - g, 255 - b) / 255.0
        if a <= 0.004:
            out.append((0, 0, 0, 0))
        else:
            k = 255 * (1 - a)
            out.append((min(255, max(0, round((r - k) / a))), min(255, max(0, round((g - k) / a))), min(255, max(0, round((b - k) / a))), round(a * 255)))
    res = Image.new('RGBA', img.size)
    res.putdata(out)
    return res


def load(path, want_transparent):
    if path.lower().endswith('.svg'):
        im, on_white = rasterise_svg(path)
        if on_white and want_transparent:
            print('note: the SVG was painted on white by the rasteriser, so white is converted back to transparency')
            im = color_to_alpha_white(im)
        return im
    return Image.open(path).convert('RGBA')


def background(size, c1, c2):
    """A flat colour, or a diagonal gradient from the top-left (c1) to the bottom-right (c2)."""
    if not c2:
        return Image.new('RGBA', (size, size), c1)
    n = max(1, 2 * (size - 1))
    row_t = [[(x + y) / n for x in range(size)] for y in range(size)]
    data = [tuple(round(c1[i] + (c2[i] - c1[i]) * t) for i in range(4)) for row in row_t for t in row]
    img = Image.new('RGBA', (size, size))
    img.putdata(data)
    return img


def corner_background(icon, size=1024):
    """A background that continues the icon's own corner colours (bilinear), so a shrunken copy of the icon blends in even over a gradient."""
    w, h = icon.size
    pts = [(3, 3), (w - 4, 3), (3, h - 4), (w - 4, h - 4)]
    tiny = Image.new('RGBA', (2, 2))
    for i, (x, y) in enumerate(pts):
        r, g, b, _ = icon.getpixel((x, y))
        tiny.putpixel((i % 2, i // 2), (r, g, b, 255))
    return tiny.resize((size, size), Image.BILINEAR)


def place_mark(bg, mark, fit_side=None, diag=None):
    """Draw the mark centred on a copy of bg. fit_side: longest side as a fraction of the icon. diag: bounding-box diagonal as a fraction."""
    img = bg.copy()
    size = img.size[0]
    w, h = mark.size
    k = (diag * size / math.hypot(w, h)) if diag is not None else (fit_side * size / max(w, h))
    nw, nh = max(1, round(w * k)), max(1, round(h * k))
    img.alpha_composite(mark.resize((nw, nh), Image.LANCZOS), ((size - nw) // 2, (size - nh) // 2))
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', required=True, help='folder for the icons (created if missing)')
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument('--mark', help='logo mark with a transparent background')
    src.add_argument('--icon', help='finished square icon')
    ap.add_argument('--bg', help='background colour. --mark: default white. --icon: default continues the icon\'s own corner colours')
    ap.add_argument('--bg2', help='second colour for a diagonal gradient (--mark only)')
    ap.add_argument('--mark-scale', type=float, default=0.62, help='--mark: longest side of the mark as a fraction of the icon (default 0.62)')
    ap.add_argument('--maskable-diag', type=float, default=0.66, help='--mark: diagonal of the mark in the maskable icon as a fraction (default 0.66; the safe circle is 0.8)')
    ap.add_argument('--maskable-scale', type=float, default=0.8, help='--icon: size of the artwork inside the maskable icon (default 0.8)')
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    written = []

    def save(img, name, size=None):
        if size and img.size != (size, size):
            img = img.resize((size, size), Image.LANCZOS)
        img.save(os.path.join(a.out, name), optimize=True)
        written.append('%s (%dx%d)' % (name, img.size[0], img.size[1]))

    if a.mark:
        c1 = parse_color(a.bg or '#ffffff')
        c2 = parse_color(a.bg2) if a.bg2 else None
        mark = load(a.mark, True)
        bbox = mark.getchannel('A').getbbox()
        if not bbox:
            raise SystemExit('The mark is fully transparent. Pass a mark that has visible pixels.')
        mark = mark.crop(bbox)
        bg = background(1024, c1, c2)
        big = place_mark(bg, mark, fit_side=a.mark_scale)
        small = place_mark(background(256, c1, c2), mark, fit_side=min(0.8, a.mark_scale + 0.16))   # a bit larger so favicons stay legible
        save(big, 'icon-192.png', 192)
        save(big, 'icon-512.png', 512)
        save(big, 'icon-1024.png', 1024)
        save(big, 'apple-touch-icon.png', 180)
        for s in (16, 32, 48):
            save(small, 'favicon-%d.png' % s, s)
        save(place_mark(bg, mark, diag=a.maskable_diag), 'icon-maskable-512.png', 512)
    else:
        icon = load(a.icon, False)
        if icon.size[0] != icon.size[1]:
            raise SystemExit('The icon must be square (it is %dx%d).' % icon.size)
        if icon.size[0] < 512:
            raise SystemExit('The icon is %d px wide; use at least 512 px (1024 is best).' % icon.size[0])
        base_bg = background(1024, parse_color(a.bg), None) if a.bg else corner_background(icon)
        for s, name in ((192, 'icon-192.png'), (512, 'icon-512.png'), (16, 'favicon-16.png'), (32, 'favicon-32.png'), (48, 'favicon-48.png')):
            save(icon, name, s)
        if icon.size[0] >= 1024:
            save(icon, 'icon-1024.png', 1024)
        full = icon.resize((1024, 1024), Image.LANCZOS) if icon.size[0] != 1024 else icon
        opaque = base_bg.copy()                                # iOS paints transparency black, so the touch icon is flattened
        opaque.alpha_composite(full)
        save(opaque, 'apple-touch-icon.png', 180)
        canvas = base_bg.copy()                                # maskable: the artwork shrunk onto the same background so the OS can crop the edges
        k = round(1024 * a.maskable_scale)
        canvas.alpha_composite(full.resize((k, k), Image.LANCZOS), ((1024 - k) // 2, (1024 - k) // 2))
        save(canvas, 'icon-maskable-512.png', 512)

    print('Wrote %d icons to %s' % (len(written), a.out))
    for w in written:
        print('  +', w)


if __name__ == '__main__':
    main()
