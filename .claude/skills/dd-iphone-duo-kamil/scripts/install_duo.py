#!/usr/bin/env python3
"""Add the iPhone Duo preview to a dd-presenter-david project.

  install_duo.py --project <dir> [--half-open] [--sideways notice|layout|iphone=notice,closed=layout] [--pages all|home.html,profile.html] [--force]
  install_duo.py --project <dir> --check          static checks only
  install_duo.py --project <dir> --remove         take the Duo preview out again (the iPhone frame stays when 'iphone' is in SHELL.devices)

Devices: SHELL.devices gets 'duo'. With 'iphone' too (dd-iphone-david) the iPhone | iPhone Duo tabs show; without it the
prototype is iPhone Duo only. The iPhone frame parts (css/shell/phone-frame.css, js/shell/phone-frame.js) are bundled here.

Copies css/shell/duo.css + js/shell/duo.js (the frames, the pose bar above the phone, the open/close animation) and, for the
screens, css/shared/duo.css + js/shared/duo.js (the side rail) + js/shared/duo-auto.js (recognises each screen and applies its
tablet layout automatically) + css/shared/duo-tablet.css (the project's own tweaks), and links them in index.html and each chosen page. Uses the presenter's side-card drawers (#tabNav, #tabSum, #drawerBg, js/shell/drawers.js): if an older shell lacks them,
it adds them with dd-presenter-david's install_drawers.py first. dd-desktop-kamil is not needed.
Safe to run again: nothing is added twice; a changed duo file is kept unless --force (duo-tablet.css is never overwritten:
it holds the project's own tweaks).
"""
import argparse, glob, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
DRAWERS = os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'install_drawers.py')   # the presenter's side-card drawers
FILES = [('duo-shell.css', 'css/shell/duo.css'), ('duo-shell.js', 'js/shell/duo.js'),
         ('duo-screen.css', 'css/shared/duo.css'), ('duo-screen.js', 'js/shared/duo.js'),
         ('duo-auto.js', 'js/shared/duo-auto.js'), ('duo-tablet.css', 'css/shared/duo-tablet.css')]
# the iPhone frame parts (status bar, Dynamic Island, home indicator, status bar colour): the same two files dd-iphone-david installs,
# bundled here so an iPhone Duo only prototype needs no iPhone skill. Linked right after the presenter's own files, before duo.css / duo.js.
FRAME = [('phone-frame.css', 'css/shell/phone-frame.css'), ('phone-frame.js', 'js/shell/phone-frame.js')]
FRAME_CSS = '<link rel="stylesheet" href="css/shell/phone-frame.css">'
FRAME_JS = '<script src="js/shell/phone-frame.js"></script>'


def devices(cfg):
    m = re.search(r'^\s*devices:\s*\[([^\]]*)\]', read(cfg), re.M)
    return None if not m else re.findall(r"['\"]([\w-]+)['\"]", m.group(1))


def set_devices(cfg, devs):
    c = read(cfg)
    line = "  devices: [%s],   // device skills shown, in this order: 'iphone' (dd-iphone-david), 'duo' (dd-iphone-duo-kamil); tabs appear when there is more than one" % ', '.join("'%s'" % d for d in devs)
    if re.search(r'^\s*devices:\s*\[[^\]]*\][^\n]*$', c, re.M):
        c = re.sub(r'^\s*devices:\s*\[[^\]]*\][^\n]*$', line, c, count=1, flags=re.M)
    else:
        c = re.sub(r'(window\.SHELL\s*=\s*\{\n)', lambda m: m.group(1) + line + '\n', c, count=1)
    write(cfg, c)


def frame(root, force):
    for src, dst in FRAME:
        s, d = os.path.join(ASSETS, src), os.path.join(root, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        if os.path.exists(d) and read(d) != read(s) and not force:
            print('- kept %s (it differs from the skill\'s; --force replaces it)' % dst); continue
        shutil.copy(s, d)
    idx = os.path.join(root, 'index.html'); h = read(idx)
    if FRAME_CSS not in h:
        m = re.search(r'[ \t]*<link rel="stylesheet" href="css/shell/prototype\.css[^"]*">\n', h)
        h = h[:m.end()] + '  ' + FRAME_CSS + '\n' + h[m.end():] if m else h.replace('</head>', '  ' + FRAME_CSS + '\n</head>', 1)
    if FRAME_JS not in h:
        m = re.search(r'[ \t]*<script src="js/shell/prototype\.js[^"]*"></script>\n', h)
        if not m:
            sys.exit('index.html has no <script src="js/shell/prototype.js">: set up dd-presenter-david first')
        h = h[:m.end()] + '  ' + FRAME_JS + '\n' + h[m.end():]
    write(idx, h)
    print('- iPhone frame parts linked (css/shell/phone-frame.css, js/shell/phone-frame.js)')


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


def pages(root, which):
    all_ = sorted(p for p in glob.glob(os.path.join(root, 'pages', '*.html')) if not p.endswith('lock.html'))
    if which == 'all':
        # phone pages only: admin (desktop) pages never show in a Duo frame
        return [p for p in all_ if 'admin' not in os.path.basename(p).lower()]
    names = [n.strip() for n in which.split(',') if n.strip()]
    return [os.path.join(root, 'pages', n) for n in names if os.path.exists(os.path.join(root, 'pages', n))]


def check(root):
    errs, warns = [], []
    idx = os.path.join(root, 'index.html')
    if not os.path.exists(idx):
        return ['no index.html: set up the presenter shell first'], warns
    h = read(idx)
    for need in ('css/shell/duo.css', 'js/shell/duo.js', 'id="tabNav"', 'id="drawerBg"', 'js/shell/drawers.js', 'css/shell/phone-frame.css', 'js/shell/phone-frame.js'):
        if need not in h:
            errs.append('index.html: missing %s' % need)
    if 'js/shell/duo.js' in h and 'admin-shell.js' in h and h.index('js/shell/duo.js') < h.index('admin-shell.js'):
        errs.append('index.html: duo.js must load after admin-shell.js')
    if 'js/shell/duo.js' in h and 'js/shell/phone-frame.js' in h and h.index('js/shell/duo.js') < h.index('js/shell/phone-frame.js'):
        errs.append('index.html: duo.js must load after js/shell/phone-frame.js')
    d = devices(os.path.join(root, 'shell.config.js'))
    if d is not None and 'duo' not in d:
        errs.append("shell.config.js: devices does not list 'duo'")
    if 'js/shell/duo.js' in h and 'js/shell/drawers.js' in h and h.index('js/shell/duo.js') < h.index('js/shell/drawers.js'):
        errs.append('index.html: duo.js must load after js/shell/drawers.js')
    linked = [p for p in glob.glob(os.path.join(root, 'pages', '*.html')) if 'shared/duo.js' in read(p)]
    if not linked:
        warns.append('no screen links css/shared/duo.css + js/shared/duo.js: the frames show, but no screen adapts')
    for p in linked:
        t = read(p)
        for need in ('shared/duo.css', 'shared/duo-auto.js', 'shared/duo-tablet.css'):
            if need not in t:
                errs.append('%s: has duo.js but not %s' % (os.path.basename(p), need))
    return errs, warns


def link(path, tag, before):
    s = read(path)
    src = re.search(r'(?:href|src)="([^"]+)"', tag).group(1)
    if tag in s or re.search(r'(?:href|src)="%s(\?[^"]*)?"' % re.escape(src), s):   # also a versioned link (duo.js?v=2)
        return False
    i = s.rfind(before)
    if i < 0:
        return False
    write(path, s[:i] + tag + '\n  ' + s[i:])
    return True


def install(root, half, which, force, sideways='notice'):
    idx = os.path.join(root, 'index.html')
    if not os.path.exists(idx) or not os.path.exists(os.path.join(root, 'shell.config.js')):
        sys.exit('no presenter shell here (index.html + shell.config.js): run dd-presenter-david first')
    if 'js/shell/drawers.js' not in read(idx):
        if not os.path.exists(DRAWERS):
            sys.exit('the Duo needs the presenter\'s side-card drawers, and dd-presenter-david is not installed next to this skill')
        print('- adding the presenter\'s side-card drawers first (they hold the side cards when the open Duo is too wide)')
        subprocess.run([sys.executable, DRAWERS, '--project', root], check=True)
    frame(root, force)
    cfgp = os.path.join(root, 'shell.config.js'); devs = devices(cfgp)
    if devs is None:
        devs = ['iphone', 'duo']   # an older project: it had the iPhone built into the presenter
    elif 'duo' not in devs:
        devs = devs + ['duo']
    set_devices(cfgp, devs)
    print('- devices: %s%s' % (', '.join(devs), '' if 'iphone' in devs else ' (iPhone Duo only: no device tabs)'))
    for src, dst in FILES:
        d = os.path.join(root, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        if os.path.exists(d) and (dst == 'css/shared/duo-tablet.css' or not force):
            print('- kept %s (already there%s)' % (dst, '' if dst == 'css/shared/duo-tablet.css' else '; --force replaces it'))
            continue
        shutil.copy(os.path.join(ASSETS, src), d)
        print('- copied %s' % dst)
    js = os.path.join(root, 'js/shell/duo.js')
    s = read(js)
    s2 = re.sub(r'var HALF_OPEN = (true|false);', 'var HALF_OPEN = %s;' % ('true' if half else 'false'), s)
    if s2 != s:
        write(js, s2)
    print('- half-open pose %s' % ('on' if half else 'off (set HALF_OPEN = true in js/shell/duo.js to bring it back)'))
    # what a phone turned sideways shows: a "turn it upright" screen (notice) or the app's wide layout (layout)
    cfg = os.path.join(root, 'shell.config.js'); c = read(cfg)
    if '=' in sideways:   # per device: iphone=notice,closed=layout
        parts = dict(x.split('=') for x in sideways.split(','))
        val = "{ iphone: '%s', closed: '%s' }" % (parts.get('iphone', 'notice'), parts.get('closed', 'notice'))
    else:
        val = "'%s'" % sideways
    line = "  duo: { sideways: %s },   // dd-iphone-duo-kamil: a phone turned sideways shows 'notice' = a \"turn it upright\" screen, or 'layout' = the app's own wide layout (one value for both, or per device: iphone / closed)" % val
    if re.search(r'^\s*duo:\s*\{[^\n]*$', c, re.M):
        c = re.sub(r'^\s*duo:\s*\{[^\n]*$', line, c, count=1, flags=re.M)
    else:
        c = re.sub(r'(window\.SHELL\s*=\s*\{\n)', lambda m: m.group(1) + line + '\n', c, count=1)
    write(cfg, c); print('- sideways phones show: %s' % ({'notice': 'a "turn it upright" screen', 'layout': "the app's wide layout"}.get(sideways, sideways)))
    # the rotate button's icon comes from the shell's Material Symbols font
    idx = os.path.join(root, 'index.html'); h = read(idx)
    m = re.search(r'(family=Material\+Symbols\+\w+[^"]*icon_names=)([a-z0-9_,]+)', h)
    if m and 'screen_rotation' not in m.group(2).split(','):
        names = sorted(set(m.group(2).split(',') + ['screen_rotation']))
        write(idx, h[:m.start(2)] + ','.join(names) + h[m.end(2):]); print('- index.html: added screen_rotation to the Material Symbols icons')
    elif not m:
        print('- note: index.html has no Material Symbols link; the rotate button needs the screen_rotation icon')
    if link(idx, '<link rel="stylesheet" href="css/shell/duo.css">', '</head>'):
        print('- index.html: linked duo.css')
    if link(idx, '<script src="js/shell/duo.js"></script>', '</body>'):
        print('- index.html: linked duo.js (after the shell scripts)')
    for p in pages(root, which):
        a = link(p, '<link rel="stylesheet" href="../css/shared/duo.css">', '</head>')
        a = link(p, '<link rel="stylesheet" href="../css/shared/duo-tablet.css">', '</head>') or a
        b = link(p, '<script src="../js/shared/duo.js"></script>', '</body>')
        b = link(p, '<script src="../js/shared/duo-auto.js"></script>', '</body>') or b
        if a or b:
            print('- %s: linked the screen add-on' % os.path.relpath(p, root))


def remove(root):
    idx = os.path.join(root, 'index.html')
    for p in [idx] + glob.glob(os.path.join(root, 'pages', '*.html')):
        s = read(p)
        s2 = re.sub(r'[ \t]*<link rel="stylesheet" href="(\.\./)?css/(shell|shared)/duo(-tablet)?\.css[^"]*">\n?', '', s)
        s2 = re.sub(r'[ \t]*<script src="(\.\./)?js/(shell|shared)/duo(-auto)?\.js[^"]*"></script>\n?', '', s2)
        if s2 != s:
            write(p, s2)
            print('- unlinked %s' % os.path.relpath(p, root))
    cfgp = os.path.join(root, 'shell.config.js'); devs = devices(cfgp)
    if devs is not None:
        set_devices(cfgp, [d for d in devs if d != 'duo'])
    if devs is not None and 'iphone' not in devs:
        h = read(idx); h = h.replace('  ' + FRAME_CSS + '\n', '').replace('  ' + FRAME_JS + '\n', ''); write(idx, h)
        print('- no iPhone either: the frame is unlinked, pages show in the plain screen')
    print('- the duo files stay in css/ and js/ (delete them by hand if wanted); the drawers stay')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--half-open', action='store_true', help='show the Half-open (book) pose tick')
    ap.add_argument('--sideways', default='notice', help='what a phone turned sideways shows (default: a "turn it upright" screen)')
    ap.add_argument('--pages', default='all', help='all phone pages (default) or a comma list of file names in pages/')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--remove', action='store_true')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    if a.remove:
        remove(root); return
    if not a.check:
        install(root, a.half_open, a.pages, a.force, a.sideways)

        cr = next((c for c in (os.path.join(HERE, '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py'), os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'credits.py')) if os.path.exists(c)), '')
        if cr:
            import subprocess
            subprocess.run([sys.executable, cr, '--project', root])
    errs, warns = check(root)
    for e in errs:
        print('ERROR  ' + e)
    for w in warns:
        print('note   ' + w)
    print('OK' if not errs else '%d error(s)' % len(errs))
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
