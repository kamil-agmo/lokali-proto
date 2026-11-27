#!/usr/bin/env python3
"""Add the map (dd-map-kamil) to a static prototype, or check it.

  map.py install --project <dir> [--pages explore.html,branches.html] [--markers pin,label] [--style positron/dark]
  map.py check   --project <dir>

install: copies js/shared/map.js and css/shared/map.css; links them in the pages given (with the map's icons added to
         each page's Material Symbols icon_names); with dev mode, adds js/shell/map-dev.js (the Map card) to index.html;
         with dd-phone-install's sw.js, caches the map tiles the user has seen; writes "## Map" in DESIGN.md.
         Safe to run again: nothing is added twice.
check:   every page that uses DDMap loads map.js and map.css, has the map's icons in icon_names, and no page
         carries a map API key.
"""
import argparse, glob, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets', 'map')
CONTROL_ICONS = ['add', 'remove', 'explore', 'fit_screen', 'fullscreen', 'fullscreen_exit', 'my_location', 'location_on']
SW_MARK = '/* dd-map-kamil: map tiles */'
SW_BLOCK = SW_MARK + '''
/* Map tiles and the map engine are kept after they are seen, so the installed app shows the same map areas offline.
   Only these two hosts are cached; up to 400 files, oldest out first. */
var DD_MAP_CACHE = 'dd-map-v1';
self.addEventListener('fetch', function (e) {
  var u = e.request.url;
  if (e.request.method !== 'GET' || !/^https:\\/\\/(tiles\\.openfreemap\\.org|unpkg\\.com\\/maplibre-gl@)/.test(u)) return;
  e.stopImmediatePropagation();
  e.respondWith(caches.open(DD_MAP_CACHE).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (r) {
        if (r.ok) { c.put(e.request, r.clone()); c.keys().then(function (k) { if (k.length > 400) c.delete(k[0]); }); }
        return r;
      });
      return hit || net;
    });
  }));
});
'''


def read(p):
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


def add_icons(html, names):
    """Add names to the page's Material Symbols icon_names (sorted, no repeats)."""
    m = re.search(r'icon_names=([a-z0-9_,]+)', html)
    if not m:
        return html, False
    have = m.group(1).split(',')
    want = sorted(set(have) | set(names))
    if want == sorted(have) and have == sorted(have):
        return html, False
    return html.replace(m.group(0), 'icon_names=' + ','.join(want)), True


def page_prefix(page, root):
    rel = os.path.relpath(root, os.path.dirname(page))
    return '' if rel == '.' else rel.replace(os.sep, '/') + '/'


def install(a):
    root = os.path.abspath(a.project)
    if not os.path.isdir(root):
        sys.exit('No folder ' + root)
    done = []
    for src, dst in (('map.js', 'js/shared/map.js'), ('map.css', 'css/shared/map.css')):
        d = os.path.join(root, dst); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copyfile(os.path.join(ASSETS, src), d)
        done.append(dst)
    icons = CONTROL_ICONS + [x for x in (a.icons or '').split(',') if x]
    for name in [p.strip() for p in (a.pages or '').split(',') if p.strip()]:
        page = name if os.path.isabs(name) else os.path.join(root, name if os.path.exists(os.path.join(root, name)) else os.path.join('pages', name))
        if not os.path.exists(page):
            print('  no page ' + name); continue
        s, pre = read(page), page_prefix(page, root)
        if 'map.css' not in s:
            s = s.replace('</head>', '  <link rel="stylesheet" href="%scss/shared/map.css">\n</head>' % pre, 1)
        if 'shared/map.js' not in s:
            s = s.replace('</body>', '  <script src="%sjs/shared/map.js"></script>\n</body>' % pre, 1)
        s, _ = add_icons(s, icons)
        write(page, s); done.append(os.path.relpath(page, root))
    idx = os.path.join(root, 'index.html')
    if os.path.exists(os.path.join(root, 'js', 'shell', 'devmode.js')) and os.path.exists(idx):
        shutil.copyfile(os.path.join(ASSETS, 'map-dev.js'), os.path.join(root, 'js', 'shell', 'map-dev.js'))
        s = read(idx)
        if 'map-dev.js' not in s:
            last = list(re.finditer(r'\s*<script src="js/shell/dev[a-z0-9]*\.js[^"]*"></script>', s))
            tag = '\n  <script src="js/shell/map-dev.js"></script>'
            s = s[:last[-1].end()] + tag + s[last[-1].end():] if last else s.replace('</body>', tag.strip() + '\n</body>', 1)
        s, _ = add_icons(s, ['map', 'content_copy'])
        write(idx, s); done.append('js/shell/map-dev.js (dev mode Map card)')
    sw = os.path.join(root, 'sw.js')
    if os.path.exists(sw) and SW_MARK not in read(sw):
        s = read(sw)
        write(sw, SW_BLOCK + '\n' + s)   # first, so its fetch listener runs before the pass-through one
        done.append('sw.js (map tiles kept for offline)')
    dm = os.path.join(root, 'DESIGN.md')
    if not re.search(r'(?m)^## Map', read(dm)):
        light, _, dark = (a.style or 'positron/dark').partition('/')
        sec = ('\n## Map\n\n- Engine: MapLibre GL JS 4.7.1 (free, open source), loaded only on pages with a map.\n'
               '- Map tiles: OpenFreeMap, no key or account. Light pages: %s · dark pages: %s; swaps with the theme.\n'
               '- Markers: %s. Look from the --map-* tokens in css/shared/map.css (accent = the brand colour).\n'
               '- Credit "OpenFreeMap · © OpenStreetMap" stays visible on every map.\n'
               '- Points come from content.py gen places (dd-localized-content-kamil) or the brief; never invented addresses abroad.\n'
               '- Figma (Designer mode): full SVG layers; a detailed map asks Full SVG, Simple SVG or Image.\n') % (light, dark or 'dark', a.markers or 'pin')
        write(dm, read(dm).rstrip('\n') + '\n' + sec); done.append('DESIGN.md (## Map)')
    print('Map installed: ' + ', '.join(done))


def check(a):
    root = os.path.abspath(a.project); bad = []
    for p in glob.glob(os.path.join(root, '**', '*.html'), recursive=True):
        if '/node_modules/' in p or '/dist/' in p:
            continue
        s = read(p); rel = os.path.relpath(p, root)
        if re.search(r'(api[_-]?key|access_token|key)=[A-Za-z0-9_\-]{16,}', s) and re.search(r'maptiler|mapbox|google\.com/maps', s, re.I):
            bad.append(rel + ': a paid map key; use OpenFreeMap (no key)')
        if 'DDMap' not in s and 'class="dd-map' not in s:
            continue
        if 'shared/map.js' not in s: bad.append(rel + ': uses the map but does not load js/shared/map.js')
        if 'map.css' not in s: bad.append(rel + ': uses the map but does not load css/shared/map.css')
        m = re.search(r'icon_names=([a-z0-9_,]+)', s)
        if m:
            miss = [i for i in ['add', 'remove', 'explore', 'fit_screen'] if i not in m.group(1).split(',')]
            used = set(re.findall(r"icon:\s*'([a-z0-9_]+)'", s))
            miss += sorted(i for i in used if i not in m.group(1).split(','))
            if miss: bad.append(rel + ': icon_names lacks ' + ', '.join(miss) + ' (they would show as words)')
    for b in bad:
        print('  ' + b)
    print('Map check: ' + ('clean' if not bad else '%d to fix' % len(bad)))
    sys.exit(1 if bad else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    i = sub.add_parser('install'); i.add_argument('--project', required=True); i.add_argument('--pages'); i.add_argument('--markers'); i.add_argument('--style'); i.add_argument('--icons', help='extra Material Symbols used by pins, comma separated')
    c = sub.add_parser('check'); c.add_argument('--project', required=True)
    a = ap.parse_args()
    install(a) if a.cmd == 'install' else check(a)


if __name__ == '__main__':
    main()
