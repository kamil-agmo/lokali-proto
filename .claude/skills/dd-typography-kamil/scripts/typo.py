#!/usr/bin/env python3
"""Typography helper for static prototypes.

  typo.py tokens --font "Inter" --base 16 --scale hig|material|1.2|1.25|1.333 --weights 400,600 [--heading-font "Fraunces"] [--line 1.5]
        print the Google Fonts <link> (only the weights asked for), the :root type tokens, and the download size (latin)
  typo.py measure --font "Inter" --weights 400,600     just the download size
  typo.py check --project DIR [--dir pages --dir css]  list font-size / font-weight / font-family values that bypass the tokens

--font system  uses the device's own font (SF Pro on Apple, Roboto on Android, Segoe UI on Windows): 0 KB, nothing to load.
"""
import argparse, os, re, sys, urllib.request

UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36'
SYSTEM = 'system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

# Fixed scales, as px at a 16 px base (they are scaled to the chosen base). Role -> (size, line height, weight role)
HIG = [('caption', 12, 16, 'regular'), ('footnote', 13, 18, 'regular'), ('subhead', 15, 20, 'regular'), ('body', 17, 22, 'regular'),
       ('headline', 17, 22, 'bold'), ('title3', 20, 25, 'regular'), ('title2', 22, 28, 'bold'), ('title1', 28, 34, 'bold'), ('large-title', 34, 41, 'bold')]
MATERIAL = [('label-small', 11, 16, 'medium'), ('label', 14, 20, 'medium'), ('body-small', 12, 16, 'regular'), ('body', 16, 24, 'regular'),
            ('title-small', 14, 20, 'medium'), ('title', 16, 24, 'medium'), ('title-large', 22, 28, 'regular'), ('headline-small', 24, 32, 'regular'),
            ('headline', 28, 36, 'regular'), ('headline-large', 32, 40, 'regular'), ('display', 45, 52, 'regular')]
RATIO_ROLES = [('caption', -2), ('small', -1), ('body', 0), ('h4', 1), ('h3', 2), ('h2', 3), ('h1', 4), ('display', 5)]


def gf_url(font, weights):
    w = ';'.join(str(x) for x in sorted(set(weights)))
    return 'https://fonts.googleapis.com/css2?family=%s:wght@%s&display=swap' % (font.replace(' ', '+'), w)


def measure(font, weights):
    """Latin woff2 bytes the browser downloads for these weights (one file per distinct URL)."""
    css = urllib.request.urlopen(urllib.request.Request(gf_url(font, weights), headers={'User-Agent': UA}), timeout=15).read().decode()
    urls = set()
    for block in css.split('/* ')[1:]:
        if block.startswith('latin */'):
            m = re.search(r'url\((https://[^)]+\.woff2)\)', block)
            if m: urls.add(m.group(1))
    total = sum(len(urllib.request.urlopen(u, timeout=15).read()) for u in urls)
    return total, len(urls)


def scale(a):
    base = a.base
    if a.scale == 'hig':
        k = base / 17.0      # HIG body is 17 pt: keep its proportions around the chosen base
        rows = [(r, round(s * k), round(l * k), w) for r, s, l, w in HIG]
    elif a.scale == 'material':
        k = base / 16.0
        rows = [(r, round(s * k), round(l * k), w) for r, s, l, w in MATERIAL]
    else:
        q = float(a.scale)
        rows = []
        for r, step in RATIO_ROLES:
            s = round(base * q ** step)
            lh = a.line if step <= 0 else max(1.15, a.line - 0.1 * step)
            rows.append((r, s, round(s * lh / 2) * 2, 'bold' if step > 0 else 'regular'))
    out = []
    for r, s, l, w in rows:
        s = max(11, s)                                   # nothing under 11 px: unreadable on phones
        if s <= base + 1:                                # text roles follow the chosen line height; headings keep the scale's own leading
            l = round(s * a.line)
        out.append((r, s, max(l, s), w))
    return out


def tokens(a):
    ws = sorted({int(x) for x in a.weights.split(',')})
    reg, bold = ws[0], ws[-1]
    med = next((w for w in ws if 500 <= w < bold), bold)
    wmap = {'regular': reg, 'medium': med, 'bold': bold}
    fam = SYSTEM if a.font == 'system' else '"%s", %s' % (a.font, SYSTEM)
    head = fam if not a.heading_font else '"%s", %s' % (a.heading_font, SYSTEM)
    print('<!-- head, before the screen stylesheet -->')
    for f, w in ((a.font, ws), (a.heading_font, [bold])) if a.heading_font else ((a.font, ws),):
        if f != 'system':
            print('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
            print('<link rel="stylesheet" href="%s">' % gf_url(f, w))
    if a.font == 'system':
        print('<!-- system font: nothing to load -->')
    print('\n/* :root type tokens */\n:root {')
    print('  --font-body: %s;' % fam)
    print('  --font-heading: %s;' % head)
    for k, v in wmap.items():
        print('  --fw-%s: %d;' % (k, v))
    for r, s, l, w in scale(a):
        print('  --fs-%s: %dpx; --lh-%s: %dpx;   /* %s */' % (r, s, r, l, w))
    print('}')
    print('body { font: var(--fw-regular) var(--fs-body)/var(--lh-body) var(--font-body); }')
    print('h1, h2, h3 { font-family: var(--font-heading); font-weight: var(--fw-bold); }')
    print('input, select, textarea { font-size: max(16px, 1em); }   /* iOS zooms into fields under 16 px */')
    total = 0
    try:
        for f, w in ((a.font, ws), (a.heading_font, [bold])):
            if f and f != 'system':
                b, n = measure(f, w); total += b
                print('\n/* %s %s: %.1f KB (%d file%s, latin) */' % (f, ','.join(map(str, w)), b / 1024, n, '' if n == 1 else 's'), end='')
        print('\n/* total font download: %.1f KB */' % (total / 1024))
    except Exception as e:
        print('\n/* could not measure (%s): check the font name on fonts.google.com */' % e, file=sys.stderr)


def check(a):
    pat = re.compile(r'\b(font-size|font-weight|font-family)\s*:\s*([^;}{]+)')
    hits = 0
    for root in [os.path.join(a.project, d) for d in (a.dir or ['.'])]:
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if not d.startswith('.') and d not in ('node_modules', 'shell')]
            for f in fn:
                if not f.endswith(('.css', '.html')) or f.startswith(('dev', 'prototype', 'lock', 'phone')):
                    continue
                p = os.path.join(dp, f)
                for i, line in enumerate(open(p, encoding='utf-8', errors='ignore'), 1):
                    for prop, val in pat.findall(line):
                        v = val.strip()
                        if 'var(--' in v or v in ('inherit', 'normal', 'inherit !important') or 'Material Symbols' in v or v.startswith('max(16px'):
                            continue
                        hits += 1
                        print('%s:%d  %s: %s' % (os.path.relpath(p, a.project), i, prop, v[:60]))
    print('\n%d value(s) bypass the type tokens. Swap each for the nearest var(--fs-*), var(--fw-*) or var(--font-*); icon fonts and 16 px field rules are skipped.' % hits)


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest='cmd', required=True)
t = sub.add_parser('tokens')
t.add_argument('--font', required=True); t.add_argument('--heading-font'); t.add_argument('--base', type=float, default=16)
t.add_argument('--scale', default='1.25', help='hig, material, or a ratio like 1.2 / 1.25 / 1.333')
t.add_argument('--weights', default='400,600'); t.add_argument('--line', type=float, default=1.5)
m = sub.add_parser('measure'); m.add_argument('--font', required=True); m.add_argument('--weights', default='400,600')
c = sub.add_parser('check'); c.add_argument('--project', required=True); c.add_argument('--dir', action='append')
a = ap.parse_args()
if a.cmd == 'measure':
    b, n = measure(a.font, [int(x) for x in a.weights.split(',')]); print('%s %s: %.1f KB (%d file%s)' % (a.font, a.weights, b / 1024, n, '' if n == 1 else 's'))
else:
    {'tokens': tokens, 'check': check}[a.cmd](a)
