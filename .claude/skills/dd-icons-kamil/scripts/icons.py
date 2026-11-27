#!/usr/bin/env python3
"""Material Symbols helper.

  icons.py scan --project DIR [--dir pages --dir js]   list icon candidates (svg, emoji, symbol characters)
  icons.py link --style rounded --opsz 24 --wght 400 --fill 0 --grade 0 [--fill-range] [--starter] NAME ...
                                                         print <link> tags, CSS, and the subset font size
  icons.py check --project DIR [--dir pages --dir js]  Material: every icon used is in icon_names (and none is unused)

Icons built in JS (e.g. a tab bar from an array) are found through a comment in that file:  /* icons: home explore person */
"""
import argparse, os, re, sys, urllib.request

SYMBOLS = re.compile('[←-⇿⌀-⏿─-➿⤀-⥿⬀-⯿\U0001F300-\U0001FAFF]')
SVG = re.compile(r'<svg\b|\.svg["\')]', re.I)
EXT = ('.html', '.htm', '.js', '.css')
STARTER = ['add', 'arrow_back', 'check', 'chevron_right', 'close', 'delete', 'edit', 'favorite', 'home', 'menu',
           'more_vert', 'notifications', 'person', 'search', 'settings']
USED = re.compile(r'class=["\'][^"\']*\b(?:ms|c-ico)\b[^"\']*["\'][^>]*>\s*([a-z0-9_]+)\s*<')   # .ms, and .c-ico from dd-components-kamil
DECL = re.compile(r'icons:\s*([a-z0-9_ ,]+?)\s*\*/')
NAMES = re.compile(r'icon_names=([a-z0-9_,]+)')
FAMILY = re.compile(r'family=(Material\+Symbols\+[A-Za-z]+)[^"\']*icon_names=')


def scan(a):
    roots = [os.path.join(a.project, d) for d in (a.dir or ['.'])]
    hits = 0
    for root in roots:
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if not d.startswith('.') and d not in ('node_modules', 'devmode')]
            for f in fn:
                if not f.endswith(EXT) or f.startswith('dev'):
                    continue
                p = os.path.join(dp, f)
                for i, line in enumerate(open(p, encoding='utf-8', errors='ignore'), 1):
                    kinds = []
                    if SYMBOLS.search(line):
                        kinds.append('symbol:' + ''.join(sorted(set(SYMBOLS.findall(line)))))
                    if SVG.search(line):
                        kinds.append('svg')
                    if kinds:
                        hits += 1
                        print(f'{os.path.relpath(p, a.project)}:{i}  [{", ".join(kinds)}]  {line.strip()[:110]}')
    print(f'\n{hits} line(s) with icon candidates. Logos and photos are not icons: leave them.')


def files(a):
    for root in [os.path.join(a.project, d) for d in (a.dir or ['.'])]:
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if not d.startswith('.') and d not in ('node_modules',)]
            for f in fn:
                if f.endswith(EXT) and not f.startswith('dev'):
                    yield os.path.join(dp, f)


def check(a):
    used, listed, where = {}, {}, []
    for p in files(a):
        t = open(p, encoding='utf-8', errors='ignore').read(); rel = os.path.relpath(p, a.project)
        for n in USED.findall(t):
            used.setdefault(n, set()).add(rel)
        for d in DECL.findall(t):
            for n in re.split(r'[\s,]+', d.strip()):
                if n: used.setdefault(n, set()).add(rel)
        m = NAMES.findall(t); fam = FAMILY.findall(t)
        if m and fam and p.endswith(('.html', '.htm')):
            listed[rel] = (fam[0].replace('+', ' '), set(m[0].split(',')))
    if not listed:
        print('ERROR: no page loads Material Symbols with icon_names=.'); sys.exit(1)
    fams = [f for f, _ in listed.values()]
    main = a.family or max(set(fams), key=fams.count)
    for k, (f, _) in sorted(listed.items()):
        if f != main: print(f'note:  {k} loads {f}, not {main}: skipped (e.g. the presenter shell\'s own icons)')
    listed = {k: v for k, (f, v) in listed.items() if f == main}
    print(f'Checking {len(listed)} page(s) that load {main}.')
    errors = 0
    sets = {frozenset(v) for v in listed.values()}
    if len(sets) > 1:
        errors += 1; print('ERROR: pages load different icon_names lists:')
        for k, v in sorted(listed.items()): print(f'  {k}: {len(v)} icons')
    allowed = set().union(*listed.values())
    for n in sorted(set(used) - allowed):
        errors += 1; print(f'ERROR: "{n}" is used but not in icon_names (it shows as a word)  ->  {", ".join(sorted(used[n]))}')
    for n in sorted(allowed - set(used)):
        print(f'note:  "{n}" is in icon_names but not used (remove it to save a few bytes, or keep it for later)')
    for k, v in sorted(listed.items()):
        if list(v) and ','.join(sorted(v)) != NAMES.findall(open(os.path.join(a.project, k)).read())[0]:
            errors += 1; print(f'ERROR: {k}: icon_names is not in alphabetical order (Google requires it)')
    print(f'\n{len(used)} icon(s) used, {len(allowed)} in icon_names, {errors} error(s).')
    print('Icons built in JS need a comment listing them, e.g.  /* icons: home explore person */')
    sys.exit(1 if errors else 0)


def link(a):
    style = a.style.capitalize()
    fam = f'Material Symbols {style}'
    names = sorted(set(n.strip() for n in list(a.names) + (STARTER if a.starter else []) if n.strip()))
    if not names:
        sys.exit('Give icon names, or --starter for the common set.')
    fill = '0..1' if a.fill_range else str(a.fill)
    url = (f'https://fonts.googleapis.com/css2?family={fam.replace(" ", "+")}:opsz,wght,FILL,GRAD@'
           f'{a.opsz},{a.wght},{fill},{a.grade}&icon_names={",".join(names)}&display=block')
    axes = lambda f: f'"FILL" {f}, "wght" {a.wght}, "GRAD" {a.grade}, "opsz" {a.opsz}'
    print('<!-- head, before the screen stylesheet -->')
    print('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
    print(f'<link rel="stylesheet" href="{url}">\n')
    print('/* CSS */')
    print(f'.ms {{ font-family: "{fam}"; font-weight: normal; font-style: normal; font-size: {a.opsz}px; line-height: 1; '
          'width: 1em; height: 1em; display: inline-block; overflow: hidden; letter-spacing: normal; text-transform: none; '
          'white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; font-feature-settings: "liga"; '
          f'font-variation-settings: {axes(a.fill)}; user-select: none; }}')
    if a.fill_range:
        print(f'.ms--fill {{ font-variation-settings: {axes(1)}; }}')
    try:
        css = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Chrome/120'}), timeout=10).read().decode()
        font = re.search(r'url\((https://[^)]+)\)', css).group(1)
        size = len(urllib.request.urlopen(font, timeout=10).read())
        print(f'\n/* {len(names)} icons, font {size / 1024:.1f} KB */')
    except Exception as e:  # offline or a bad name
        print(f'\n/* could not measure the font ({e}); check the icon names */', file=sys.stderr)


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest='cmd', required=True)
s = sub.add_parser('scan'); s.add_argument('--project', required=True); s.add_argument('--dir', action='append')
l = sub.add_parser('link')
l.add_argument('--style', choices=['outlined', 'rounded', 'sharp'], required=True)
l.add_argument('--opsz', type=int, default=24); l.add_argument('--wght', type=int, default=400)
l.add_argument('--fill', type=int, choices=[0, 1], default=0); l.add_argument('--grade', type=int, default=0)
l.add_argument('--fill-range', action='store_true'); l.add_argument('--starter', action='store_true', help='add the 15 common starter icons')
l.add_argument('names', nargs='*')
c = sub.add_parser('check'); c.add_argument('--project', required=True); c.add_argument('--dir', action='append'); c.add_argument('--family', help='e.g. "Material Symbols Rounded" (default: the one most pages load)')
a = ap.parse_args()
{'scan': scan, 'link': link, 'check': check}[a.cmd](a)
