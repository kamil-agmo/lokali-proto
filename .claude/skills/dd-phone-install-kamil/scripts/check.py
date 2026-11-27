#!/usr/bin/env python3
"""Static checks for phone-fit and install readiness (no browser needed).

  python3 check.py --project ./my-prototype

ERRORS are things that stop installing or break the phone layout. WARNINGS are likely mistakes. REVIEW lines are places in your CSS that probably need a
human decision (hard-coded status-bar gaps, 100vh, small input text).
Checks: manifest (fields, icons exist and are the size they claim, start_url exists); service worker at the site root; every page's head (manifest link,
viewport-fit=cover, theme colour, touch icon, phone.css loaded last); the install banner on exactly one entry page and install.js wherever an install row
is; the shell redirect; then the CSS review lists.
"""
import argparse, json, os, re, struct, sys

SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '__pycache__'}
errors, warnings, review = [], [], []


def read(p):
    try:
        return open(p, encoding='utf-8').read()
    except UnicodeDecodeError:
        return open(p, encoding='latin-1').read()


def walk(root, ext):
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in files:
            if f.endswith(ext):
                yield os.path.join(d, f)


def png_size(path):
    with open(path, 'rb') as f:
        h = f.read(24)
    if h[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    return struct.unpack('>II', h[16:24])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', default='.')
    root = os.path.abspath(ap.parse_args().project)

    # ---- manifest ----
    mpath = os.path.join(root, 'manifest.webmanifest')
    scope_dir = root
    if not os.path.exists(mpath):
        errors.append('manifest.webmanifest is missing (run install.py)')
        m = None
    else:
        try:
            m = json.loads(read(mpath))
        except ValueError as e:
            errors.append('manifest.webmanifest is not valid JSON: %s' % e)
            m = None
    if m:
        for k in ('name', 'short_name', 'start_url', 'display', 'icons'):
            if not m.get(k):
                errors.append('manifest: "%s" is missing' % k)
        if m.get('display') not in (None, 'standalone', 'fullscreen', 'minimal-ui'):
            errors.append('manifest: display "%s" will not open as an app; use "standalone"' % m.get('display'))
        sw = re.search(r"sideways\s*:\s*(\{[^}]*\}|'[a-z]+'|\"[a-z]+\")", read(os.path.join(root, 'shell.config.js')) if os.path.exists(os.path.join(root, 'shell.config.js')) else '')
        wide = bool(sw) and (re.search(r"iphone\s*:\s*['\"]layout", sw.group(1)) is not None if sw.group(1).startswith('{') else sw.group(1).strip('\'"') == 'layout')
        if wide and m.get('orientation') == 'portrait':
            warnings.append('manifest: orientation is "portrait" but the prototype shows a wide layout when the iPhone is turned (SHELL.duo.sideways); use "any"')
        if sw and not wide and m.get('orientation') not in (None, 'portrait', 'portrait-primary'):
            warnings.append('manifest: the prototype is portrait-only (it asks to turn the phone upright); set orientation to "portrait"')
        for k in ('theme_color', 'background_color'):
            if not m.get(k):
                warnings.append('manifest: "%s" is missing (the splash screen and status bar fall back to white)' % k)
        if m.get('short_name') and len(m['short_name']) > 12:
            warnings.append('manifest: short_name "%s" is longer than 12 characters and will be cut on a home screen' % m['short_name'])
        start = (m.get('start_url') or '').split('?')[0].split('#')[0]
        if start and not os.path.exists(os.path.join(root, start)):
            errors.append('manifest: start_url "%s" does not exist' % m.get('start_url'))
        have = {'any': set(), 'maskable': set()}
        for ic in m.get('icons', []):
            src = ic.get('src', '')
            f = os.path.join(root, src)
            if not os.path.exists(f):
                errors.append('manifest: icon %s does not exist' % src)
                continue
            for size in (ic.get('sizes') or '').split():
                if 'x' in size and src.endswith('.png'):
                    want = tuple(int(x) for x in size.split('x'))
                    got = png_size(f)
                    if got != want:
                        errors.append('manifest: icon %s says %s but is %s' % (src, size, 'x'.join(map(str, got)) if got else 'not a PNG'))
                    for p in (ic.get('purpose') or 'any').split():
                        have.setdefault(p, set()).add(want[0])
        for need in (192, 512):
            if need not in have['any']:
                errors.append('manifest: no %dx%d PNG icon with purpose "any" (Chrome needs 192 and 512 to offer install)' % (need, need))
        if 512 not in have['maskable']:
            warnings.append('manifest: no maskable 512 icon (Android will put the normal icon on a white circle or square)')
        if not os.path.exists(os.path.join(root, 'sw.js')):
            errors.append('sw.js is missing at the site root (browsers want a service worker before they treat the site as installable)')
        elif 'fetch' not in read(os.path.join(root, 'sw.js')):
            warnings.append('sw.js has no fetch handler (some browsers require one)')

    # ---- pages ----
    pages = list(walk(root, '.html'))
    banners, rows_without_js = [], []
    for p in pages:
        t = read(p)
        rel = os.path.relpath(p, root)
        if '<head' not in t:
            continue
        head = t.split('</head>')[0]
        if not re.search(r'<link[^>]+rel=["\']manifest["\']', head):
            errors.append('%s: no <link rel="manifest"> in <head>' % rel)
        v = re.search(r'<meta[^>]+name=["\']viewport["\'][^>]*>', head)
        if not v:
            errors.append('%s: no viewport meta' % rel)
        elif 'viewport-fit=cover' not in v.group(0):
            errors.append('%s: viewport lacks viewport-fit=cover, so env(safe-area-inset-*) is always 0' % rel)
        if not re.search(r'<meta[^>]+name=["\']theme-color["\']', head):
            warnings.append('%s: no theme-color meta' % rel)
        a = re.search(r'<link[^>]+rel=["\']apple-touch-icon["\'][^>]*>', head)
        if not a:
            warnings.append('%s: no apple-touch-icon (iPhone will use a screenshot as the home-screen icon)' % rel)
        links = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>', head)
        if links and 'phone.css' not in ' '.join(links):
            warnings.append('%s: phone.css is not linked, so --sb and --safe-b are undefined here' % rel)
        elif links and 'phone.css' not in links[-1]:
            warnings.append('%s: phone.css is not the last stylesheet; a later file may override --sb' % rel)
        if 'data-install-banner' in t:
            banners.append(rel)
        if 'data-install-row' in t and 'install.js' not in t:
            rows_without_js.append(rel)
        if 'data-install-banner' in t and 'install.js' not in t:
            errors.append('%s: has data-install-banner but does not load js/shared/install.js' % rel)
    if len(banners) == 0:
        warnings.append('no page has data-install-banner, so nothing offers the install automatically')
    elif len(banners) > 1:
        warnings.append('install banner is on %d pages (%s); usually one entry page is enough' % (len(banners), ', '.join(banners)))
    for r in rows_without_js:
        errors.append('%s: has an [data-install-row] but does not load js/shared/install.js' % r)
    # touch icon: opaque and 180
    ti = os.path.join(root, 'assets', 'icons', 'apple-touch-icon.png')
    if os.path.exists(ti):
        sz = png_size(ti)
        if sz != (180, 180):
            warnings.append('apple-touch-icon.png is %s, expected 180x180' % ('x'.join(map(str, sz)) if sz else 'not a PNG'))
        try:
            from PIL import Image
            im = Image.open(ti).convert('RGBA')
            if im.getchannel('A').getextrema()[0] < 255:
                warnings.append('apple-touch-icon.png has transparency; iOS paints it black. Flatten it onto a background colour')
        except ImportError:
            pass

    # ---- shell redirect ----
    idx = os.path.join(root, 'index.html')
    if os.path.exists(idx) and 'shell.config.js' in read(idx) and 'phone-install: on a phone-sized window' not in read(idx):
        warnings.append('index.html is a presenter shell without the phone redirect: a phone will see the frame instead of the screen full screen')

    # ---- CSS review ----
    gap = re.compile(r'(padding-top|top|height|min-height|margin-top)\s*:\s*(?:calc\(\s*)?(44|47|50|54|59|62|64|100|103|106|110|112|114|118|120|124|126|130|134|140)px')
    ctx = re.compile(r'bar|header|nav|top|app|page|canvas|main|screen|content|hero', re.I)
    n_vh = 0
    # the presenter shell's own CSS (css/shell/) lays out the desktop frame, not a phone screen: leave it out
    sources = [p for p in list(walk(root, '.css')) + list(pages)
               if os.sep + 'shell' + os.sep not in os.path.relpath(p, root) and not os.path.relpath(p, root).startswith('shell' + os.sep)
               and os.path.basename(p) != 'phone.css']          # phone.css is this skill's own file (its comments mention 100vh)
    for p in sources:
        rel = os.path.relpath(p, root)
        lines = read(p).splitlines()
        selector = ''
        for i, line in enumerate(lines, 1):
            if '{' in line:
                selector = line.split('{')[0].strip()
            if 'var(--sb' in line or 'safe-area' in line:
                continue
            m = gap.search(line)
            if m and (ctx.search(selector) or ctx.search(line.split(':')[0])):
                review.append('%s:%d  %s    (a fixed %spx; if this is room for the status bar, use var(--sb))' % (rel, i, line.strip()[:110], m.group(2)))
            if re.search(r'\b100vh\b', line) and 'dvh' not in line:   # a line that also declares 100dvh is the fallback pattern
                n_vh += 1
    rule = re.compile(r'([^{}]*\b(?:input|textarea|select)\b[^{}]*)\{([^}]*)\}', re.I | re.S)
    for p in walk(root, '.css'):
        for mm in rule.finditer(read(p)):
            fs = re.search(r'font-size\s*:\s*(\d+(?:\.\d+)?)px', mm.group(2))
            if fs and float(fs.group(1)) < 16 and 'phone.css' not in p:
                review.append('%s: %s  has font-size %spx; iOS zooms into a field under 16px' % (os.path.relpath(p, root), mm.group(1).strip().splitlines()[-1][:60], fs.group(1)))
    if n_vh:
        review.append('%d use(s) of 100vh in CSS or pages; on phones 100dvh follows the browser toolbar, 100vh does not' % n_vh)

    for w in warnings:
        print('warning:', w)
    for r in review[:30]:
        print('review: ', r)
    if len(review) > 30:
        print('review:  ... and %d more' % (len(review) - 30))
    for e in errors:
        print('ERROR:  ', e)
    if not errors:
        print('No errors (%d warning%s, %d review item%s).' % (len(warnings), '' if len(warnings) == 1 else 's', len(review), '' if len(review) == 1 else 's'))
    else:
        print('%d error%s, %d warning%s, %d review item%s.' % (len(errors), '' if len(errors) == 1 else 's', len(warnings), '' if len(warnings) == 1 else 's', len(review), '' if len(review) == 1 else 's'))
    print('Reminder: browsers offer install only over https (localhost counts). A real device is the only way to check safe-area insets.')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
