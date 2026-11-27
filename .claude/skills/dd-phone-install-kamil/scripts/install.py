#!/usr/bin/env python3
"""Make a static prototype work on a real phone and installable as a home-screen app.

  python3 install.py --project ./my-prototype --name "Acme App" --theme-color "#2563eb" --mark logo.png

What it does (safe to run twice; --force redoes everything, including files you changed):
  * copies js/shared/install.js, sw.js (at the site root) and css/shared/phone.css (the --sb / --safe-b variables); a copy you changed is kept
  * writes manifest.webmanifest, and makes the icons when you give --mark or --icon (see make_icons.py)
  * patches every HTML page's <head>: manifest link, theme colour, touch icon, favicons, iOS web-app tags, the phone.css link,
    and viewport-fit=cover on the viewport meta (needed for safe-area insets)
  * on the entry page (default: the lock screen, else index.html): adds the install banner (data-install-banner) and install.js
  * on any page that has an [data-install-row] element: adds install.js
  * if the project has a presenter shell: makes index.html open the start screen full screen on a phone-sized window (?shell shows the frame)
It never edits your CSS. Screens that hard-code the status-bar gap need a manual change: run check.py to list them.
"""
import argparse, glob, json, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '__pycache__'}


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, t):
    os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
    open(p, 'w', encoding='utf-8').write(t)


def html_files(root, extra_skip):
    out = []
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and x not in extra_skip]
        for f in files:
            if f.endswith('.html'):
                out.append(os.path.join(d, f))
    return sorted(out)


def root_prefix(page, root):
    rel = os.path.relpath(root, os.path.dirname(page))
    return '' if rel == '.' else rel.replace(os.sep, '/') + '/'


def wants_portrait(root):
    """Lock the installed app to portrait unless the prototype was designed for sideways use: the iPhone Duo skill's
    SHELL.duo.sideways setting ('layout', or { iphone: 'layout' }) means the iPhone shows a wide layout when turned."""
    c = read(os.path.join(root, 'shell.config.js')) if os.path.exists(os.path.join(root, 'shell.config.js')) else ''
    m = re.search(r"sideways\s*:\s*(\{[^}]*\}|'[a-z]+'|\"[a-z]+\")", c)
    if not m:
        return True
    v = m.group(1)
    if v.startswith('{'):
        ip = re.search(r"iphone\s*:\s*['\"]([a-z]+)", v)
        return not (ip and ip.group(1) == 'layout')
    return v.strip('\'"') != 'layout'


def head_lines(prefix, theme, short, status_bar=None):
    t = read(os.path.join(ASSETS, 'snippets', 'head-tags.html'))
    t = t.replace('{{ROOT}}', prefix).replace('{{THEME}}', theme).replace('{{SHORT}}', short.replace('"', '&quot;'))
    lines = [l for l in t.splitlines() if l.strip()]
    if status_bar:   # sits just before the phone.css link, which must stay the last stylesheet
        meta = '<meta name="apple-mobile-web-app-status-bar-style" content="%s">' % status_bar
        at = next((i for i, l in enumerate(lines) if 'phone.css' in l), len(lines) - 1)
        lines.insert(at, meta)
    return lines


def already(page_html, line):
    # skip a tag the page already has (so nothing is declared twice)
    checks = [
        (r'rel="manifest"', r'<link[^>]+rel=["\']manifest["\']'),
        (r'name="theme-color"', r'<meta[^>]+name=["\']theme-color["\']'),
        (r'rel="apple-touch-icon"', r'<link[^>]+rel=["\']apple-touch-icon["\']'),
        (r'sizes="32x32"', r'<link[^>]+sizes=["\']32x32["\']'),
        (r'sizes="16x16"', r'<link[^>]+sizes=["\']16x16["\']'),
        (r'name="mobile-web-app-capable"', r'<meta[^>]+name=["\']mobile-web-app-capable["\']'),
        (r'name="apple-mobile-web-app-capable"', r'<meta[^>]+name=["\']apple-mobile-web-app-capable["\']'),
        (r'name="apple-mobile-web-app-title"', r'<meta[^>]+name=["\']apple-mobile-web-app-title["\']'),
        (r'name="apple-mobile-web-app-status-bar-style"', r'<meta[^>]+name=["\']apple-mobile-web-app-status-bar-style["\']'),
        (r'phone.css', r'<link[^>]+phone\.css'),
    ]
    for needle, pattern in checks:
        if needle in line and re.search(pattern, page_html):
            return True
    return False


def patch_page(path, root, args, entry, with_install_js):
    t = read(path)
    changed = []
    if args.force:
        t2 = re.sub(r'[ \t]*<!-- phone-install:begin -->.*?<!-- phone-install:end -->\n?', '', t, flags=re.S)
        if t2 != t:
            t = t2
    if '<!-- phone-install:begin -->' not in t and '</head>' in t:
        prefix = root_prefix(path, root)
        lines = [l for l in head_lines(prefix, args.theme_color, args.short_name, args.status_bar) if l.startswith('<!--') or not already(t, l)]
        # viewport-fit=cover on the existing viewport meta, or add a viewport meta
        m = re.search(r'<meta[^>]+name=["\']viewport["\'][^>]*>', t)
        if m:
            tag = m.group(0)
            if 'viewport-fit' not in tag:
                new = re.sub(r'content=(["\'])(.*?)\1', lambda mm: 'content=%s%s, viewport-fit=cover%s' % (mm.group(1), mm.group(2), mm.group(1)), tag, count=1)
                t = t.replace(tag, new, 1)
                changed.append('viewport-fit=cover')
        else:
            lines.insert(1, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">')
            changed.append('added a viewport meta')
        indent = '  '
        block = ''.join(indent + l + '\n' for l in lines)
        t = t.replace('</head>', block + '</head>', 1)
        changed.append('head tags')
    # install.js and the banner
    if with_install_js and 'js/shared/install.js' not in t and '</body>' in t:
        prefix = root_prefix(path, root)
        t = t.replace('</body>', '  <script src="%sjs/shared/install.js"></script>\n</body>' % prefix, 1)
        changed.append('install.js')
    if entry and 'data-install-banner' not in t:
        t2 = re.sub(r'<body(\s[^>]*)?>', lambda m: '<body%s data-install-banner>' % (m.group(1) or ''), t, count=1)
        if t2 != t:
            t = t2
            changed.append('install banner')
    if changed:
        write(path, t)
    return changed


def patch_shell_redirect(root):
    p = os.path.join(root, 'index.html')
    if not os.path.exists(p):
        return None
    t = read(p)
    if 'phone-install: on a phone-sized window' in t:
        return 'already there'
    m = re.search(r'([ \t]*<script src="shell\.config\.js"></script>\n)', t)
    if not m:
        return None
    snippet = read(os.path.join(ASSETS, 'snippets', 'shell-redirect.html'))
    write(p, t.replace(m.group(1), m.group(1) + snippet, 1))
    return 'added'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--name', required=True, help='app name (home-screen title and install text)')
    ap.add_argument('--short-name', help='label under the home-screen icon (default: the name, cut to 12 characters)')
    ap.add_argument('--description', default='', help='manifest description')
    ap.add_argument('--theme-color', default='#ffffff', help='browser/status-bar colour (default white)')
    ap.add_argument('--background-color', default='#ffffff', help='splash screen colour while the app opens (default white)')
    ap.add_argument('--start-url', help='what the installed app opens, relative to the project (default: pages/lock.html if it exists, else index.html)')
    ap.add_argument('--icon', help='finished square icon (PNG or SVG), see make_icons.py')
    ap.add_argument('--mark', help='logo mark with transparent background (PNG or SVG), see make_icons.py')
    ap.add_argument('--icon-bg', help='icon background colour (with --mark: default white)')
    ap.add_argument('--icon-bg2', help='second icon background colour for a gradient (--mark only)')
    ap.add_argument('--status-bar', choices=['default', 'black', 'black-translucent'],
                    help='iPhone status bar style of the installed app. Leave it out for the iOS default (an opaque light strip). black-translucent lets the page draw under the bar with white text: use it for dark or full-bleed designs')
    ap.add_argument('--entry', help='page that shows the install banner (default: pages/lock.html if it exists, else index.html)')
    ap.add_argument('--no-redirect', action='store_true', help='do not make the shell index.html open full screen on a phone-sized window')
    ap.add_argument('--skip-dir', action='append', default=[], help='folder name to leave alone (repeatable)')
    ap.add_argument('--force', action='store_true', help='redo everything: rewrite the manifest and the head tags, and replace install.js, sw.js and phone.css even if you changed them')
    a = ap.parse_args()

    root = os.path.abspath(a.project)
    if not os.path.isdir(root):
        sys.exit('No such folder: %s' % root)
    a.short_name = a.short_name or a.name[:12]
    exists = lambda rel: os.path.exists(os.path.join(root, rel))
    start_url = a.start_url or ('pages/lock.html' if exists('pages/lock.html') else 'index.html')
    entry = a.entry or ('pages/lock.html' if exists('pages/lock.html') else 'index.html')
    for label, rel in (('start page', start_url), ('entry page', entry)):
        if not exists(rel):
            sys.exit('The %s %s does not exist in %s.' % (label, rel, root))

    # 1. files (a copy that already exists and differs is the project's own work, for example a service worker that caches for offline use: keep it)
    copied, same, kept = [], [], []
    for src, rel in (('js/install.js', 'js/shared/install.js'), ('sw.js', 'sw.js'), ('snippets/phone.css', 'css/shared/phone.css')):
        dst = os.path.join(root, rel)
        if os.path.exists(dst) and not a.force:
            (same if open(dst, 'rb').read() == open(os.path.join(ASSETS, src), 'rb').read() else kept).append(rel)
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ASSETS, src), dst)
        copied.append(rel)
    if copied:
        print('Copied %s' % ', '.join(copied))
    if same:
        print('Already up to date: %s' % ', '.join(same))
    if kept:
        print('Kept your own copy of %s (it differs from the skill\'s; --force replaces it)' % ', '.join(kept))

    # 2. icons
    if a.icon or a.mark:
        cmd = [sys.executable, os.path.join(HERE, 'make_icons.py'), '--out', os.path.join(root, 'assets', 'icons')]
        cmd += ['--mark', a.mark] if a.mark else ['--icon', a.icon]
        if a.icon_bg:
            cmd += ['--bg', a.icon_bg]
        if a.icon_bg2:
            cmd += ['--bg2', a.icon_bg2]
        r = subprocess.run(cmd)
        if r.returncode != 0:
            sys.exit('Icon generation failed (see above). Fix it or pass no --icon/--mark and add the icons yourself.')
    else:
        missing = [f for f in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png') if not exists('assets/icons/' + f)]
        if missing:
            print('Note: no icons made. Missing in assets/icons: %s. Run make_icons.py (or pass --mark / --icon).' % ', '.join(missing))

    # 3. manifest
    mpath = os.path.join(root, 'manifest.webmanifest')
    if os.path.exists(mpath) and not a.force:
        print('manifest.webmanifest already exists: kept (use --force to rewrite it)')
    else:
        m = json.loads(read(os.path.join(ASSETS, 'manifest.template.webmanifest')))
        m.update({'name': a.name, 'short_name': a.short_name, 'description': a.description or a.name, 'start_url': start_url,
                  'background_color': a.background_color, 'theme_color': a.theme_color})
        m['orientation'] = 'portrait' if wants_portrait(root) else 'any'   # matches what the prototype shows when the phone is turned
        write(mpath, json.dumps(m, indent=2, ensure_ascii=False) + '\n')
        print('Wrote manifest.webmanifest (start_url %s)' % start_url)

    # 4. pages
    pages = html_files(root, set(a.skip_dir))
    entry_abs = os.path.normpath(os.path.join(root, entry))
    n_changed = 0
    for p in pages:
        t = read(p)
        wants_js = os.path.normpath(p) == entry_abs or 'data-install-row' in t
        ch = patch_page(p, root, a, os.path.normpath(p) == entry_abs, wants_js)
        if ch:
            n_changed += 1
            print('  patched %s: %s' % (os.path.relpath(p, root), ', '.join(ch)))
    print('Patched %d of %d HTML files.' % (n_changed, len(pages)))

    # 5. shell redirect
    if not a.no_redirect:
        r = patch_shell_redirect(root)
        if r == 'added':
            print('index.html: opens the start screen full screen on a phone-sized window (add ?shell to see the frame).')
        elif r == 'already there':
            print('index.html: redirect already present.')
        else:
            print('No presenter shell found (no shell.config.js script in index.html): no redirect added.')

    print('\nNext:')
    print('  1. python3 %s --project %s     (static checks, and a list of screens that hard-code the status-bar gap)' % (os.path.join(HERE, 'check.py'), root))
    print('  2. Change those screens to use var(--sb) / var(--safe-b) (see references/real-phone-fit.md).')
    print('  3. Optionally add an "Install as app" row to a settings screen (assets/snippets/install-row.html).')
    print('  4. Test: serve over http, emulate a phone, open the entry page (add ?install to force it on a desktop browser). Real devices need https or localhost.')


if __name__ == '__main__':
    main()
