#!/usr/bin/env python3
"""Add the desktop device (dd-desktop-kamil, formerly dd-admin-kamil) to a dd-presenter-david project: desktop pages fill the window.

  install_admin.py --project <dir> [--content-max 1440|1280|none] [--dock|--no-dock] [--force]
  install_admin.py --project <dir> --check          static checks only

Copies css/shell/admin-shell.css and js/shell/admin-shell.js, patches index.html (stylesheet, edge tabs, drawer backdrop,
side card ids, script after the shell script) and sets `desktop: { contentMax, dock }` in shell.config.js.
Safe to run again: nothing is added twice; a changed admin-shell file is kept unless --force.
Needs the shell's add-on hooks (window.Shell and the "<prefix>:show" event): dd-presenter-david.
"""
import argparse, os, re, shutil, sys, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')


def read(p):
    return open(p, encoding='utf-8').read()


def check(root):
    errs, warns = [], []
    idx, js, cfg = (os.path.join(root, p) for p in ('index.html', 'js/shell/prototype.js', 'shell.config.js'))
    for p in (idx, js, cfg):
        if not os.path.exists(p):
            errs.append('missing %s: set up the presenter shell first' % os.path.relpath(p, root))
    if errs:
        return errs, warns
    if 'window.Shell' not in read(js) or ":show'" not in read(js):
        errs.append('js/shell/prototype.js has no add-on hooks (window.Shell, "<prefix>:show"): update the shell to the current dd-presenter-david')
    h = read(idx)
    for need, what in (('admin-shell.css', 'the admin stylesheet link'), ('admin-shell.js', 'the admin script'), ('id="tabNav"', 'the Navigation edge tab'),
                       ('id="tabSum"', 'the Summary edge tab'), ('id="drawerBg"', 'the drawer backdrop'), ('id="sideLeft"', 'id="sideLeft" on the left card'), ('id="sideRight"', 'id="sideRight" on the right card')):
        if need not in h:
            errs.append('index.html: missing %s (run install_admin.py)' % what)
    if 'admin-shell.js' in h and h.index('admin-shell.js') < h.index('js/shell/prototype.js'):
        errs.append('index.html: admin-shell.js must load after js/shell/prototype.js')
    if 'admin-shell.js' in h and ('drawers.js' not in h or h.index('admin-shell.js') < h.index('drawers.js')):
        errs.append('index.html: admin-shell.js must load after js/shell/drawers.js (the presenter\'s drawers)')
    c = read(cfg)
    for v in re.findall(r"device\s*:\s*['\"]([^'\"]*)['\"]", c):
        if v not in ('phone', 'desktop'):
            errs.append('shell.config.js: device must be "phone" or "desktop", got "%s"' % v)
    if "device: 'desktop'" not in c and 'device: "desktop"' not in c:
        warns.append('no page or tree group has device: \'desktop\' yet: mark the admin pages')
    # desktop pages that do not use --content-max
    for src in re.findall(r"src\s*:\s*['\"]([^'\"]+\.html)['\"]", c):
        p = os.path.join(root, src)
        if os.path.exists(p) and 'admin' in os.path.basename(p).lower():
            t = read(p)
            css = ''.join(read(os.path.join(os.path.dirname(p), l)) for l in re.findall(r'href="([^"]+\.css)"', t) if os.path.exists(os.path.join(os.path.dirname(p), l)))
            if '--content-max' not in t + css:
                warns.append('%s: main content does not use var(--content-max), so it spans the whole width on ultrawide screens' % src)
    return errs, warns


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--content-max', default=None, help='1440 (default), 1280, any px number, or none for full width')
    ap.add_argument('--dock', dest='dock', action='store_true', default=None, help='ultrawide windows keep the panels docked (default)')
    ap.add_argument('--no-dock', dest='dock', action='store_false', help='always use drawers, even on ultrawide windows')
    ap.add_argument('--check', action='store_true'); ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    if a.check:
        errs, warns = check(root)
        for w in warns: print('warning:', w)
        for e in errs: print('ERROR:', e)
        print('\n%s (%d warning%s).' % ('No errors' if not errs else '%d error(s)' % len(errs), len(warns), '' if len(warns) == 1 else 's'))
        return 1 if errs else 0
    js = os.path.join(root, 'js/shell/prototype.js')
    if not os.path.exists(js) or 'window.Shell' not in read(js):
        sys.exit('This project\'s shell has no add-on hooks. Set it up (or update it) with dd-presenter-david first.')
    # files
    for src, dst in (('admin-shell.css', 'css/shell/admin-shell.css'), ('admin-shell.js', 'js/shell/admin-shell.js')):
        s, d = os.path.join(ASSETS, src), os.path.join(root, dst)
        if os.path.exists(d) and read(d) != read(s) and not a.force:
            print('kept your changed %s (--force replaces it)' % dst)
        else:
            os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(s, d); print('copied', dst)
    # the presenter's side-card drawers (edge tabs, backdrop, drawers.js), shared with dd-iphone-duo-kamil
    drawers = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dd-presenter-david', 'scripts', 'install_drawers.py')
    if not os.path.exists(drawers):
        sys.exit('dd-presenter-david is not installed next to this skill: it provides the side-card drawers.')
    subprocess.run([sys.executable, drawers, '--project', root], check=True)
    # index.html
    idx = os.path.join(root, 'index.html'); h = read(idx)
    if 'admin-shell.css' not in h:
        h = re.sub(r'(<link rel="stylesheet" href="css/shell/prototype.css">)', r'\1\n  <link rel="stylesheet" href="css/shell/admin-shell.css">', h, 1)
    if 'id="sideLeft"' not in h:
        h = h.replace('<aside class="side side--left"', '<aside class="side side--left" id="sideLeft"', 1)
    if 'id="sideRight"' not in h:
        h = h.replace('<aside class="side side--right"', '<aside class="side side--right" id="sideRight"', 1)
    if 'admin-shell.js' not in h:
        h = h.replace('<script src="js/shell/drawers.js"></script>', '<script src="js/shell/drawers.js"></script>\n  <script src="js/shell/admin-shell.js"></script>', 1)
    open(idx, 'w', encoding='utf-8').write(h); print('patched index.html')
    # shell.config.js: desktop settings
    cfg = os.path.join(root, 'shell.config.js'); c = read(cfg)
    cm = a.content_max
    cm_js = None if cm is None else ('null' if cm.lower() in ('none', 'null', 'full', '0') else str(int(float(cm))))
    if re.search(r'\n\s*desktop\s*:\s*\{', c):
        if cm_js is not None:
            c = re.sub(r'contentMax\s*:\s*[^,}\s]+', 'contentMax: ' + cm_js, c, 1) if 'contentMax' in c else re.sub(r'(\n\s*desktop\s*:\s*\{)', r'\1 contentMax: ' + cm_js + ',', c, 1)
        if a.dock is not None:
            c = re.sub(r'dock\s*:\s*(true|false)', 'dock: ' + ('true' if a.dock else 'false'), c, 1) if re.search(r'dock\s*:', c) else re.sub(r'(\n\s*desktop\s*:\s*\{)', r'\1 dock: ' + ('true' if a.dock else 'false') + ',', c, 1)
    else:
        line = "  desktop: { contentMax: %s, dock: %s },   // dd-desktop-kamil: desktop pages. contentMax = max content width in px (null = full width); dock = keep the panels docked on ultrawide windows\n" % (cm_js or '1440', 'false' if a.dock is False else 'true')
        c = re.sub(r'(\n\s*pages\s*:\s*\{)', '\n' + line.rstrip('\n') + r'\1', c, 1)
    open(cfg, 'w', encoding='utf-8').write(c); print('set desktop settings in shell.config.js')
    errs, warns = check(root)
    for w in warns: print('warning:', w)
    for e in errs: print('ERROR:', e)
    cr = next((x for x in (os.path.join(HERE, '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py'), os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'credits.py')) if os.path.exists(x)), '')
    if cr:
        subprocess.run([sys.executable, cr, '--project', root])
    print('\nNext: add device: \'desktop\' to the desktop pages (or their tree group) in shell.config.js, and give each page\'s main content max-width: var(--content-max, none); margin-inline: auto. Admin screens: dd-admin-panel-kamil.')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
