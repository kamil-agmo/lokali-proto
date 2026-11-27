#!/usr/bin/env python3
"""Show a dd-presenter-david prototype in an iPhone frame.

  install_iphone.py --project <dir>            add the iPhone (safe to run again)
  install_iphone.py --project <dir> --check    static checks only
  install_iphone.py --project <dir> --remove   take the iPhone out of the device list (iPhone Duo only, or a plain screen)

Copies css/shell/phone-frame.css + js/shell/phone-frame.js (the frame, status bar, Dynamic Island, home indicator, and a status bar
that turns white on dark screens), links them in index.html right after the presenter's own files, and adds 'iphone' to
SHELL.devices in shell.config.js. dd-iphone-duo-kamil bundles the same two files: the one with the newer copy wins; they are identical.
With --remove the frame files stay when iPhone Duo still uses them.
"""
import argparse, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
FILES = [('phone-frame.css', 'css/shell/phone-frame.css'), ('phone-frame.js', 'js/shell/phone-frame.js')]
CSS_TAG = '<link rel="stylesheet" href="css/shell/phone-frame.css">'
JS_TAG = '<script src="js/shell/phone-frame.js"></script>'


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


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


def link_frame(idx):
    """Link the frame right after the presenter's stylesheet and script (before any device or add-on that builds on it)."""
    h = read(idx)
    if CSS_TAG not in h:
        m = re.search(r'[ \t]*<link rel="stylesheet" href="css/shell/prototype\.css[^"]*">\n', h)
        h = h[:m.end()] + '  ' + CSS_TAG + '\n' + h[m.end():] if m else h.replace('</head>', '  ' + CSS_TAG + '\n</head>', 1)
    if JS_TAG not in h:
        m = re.search(r'[ \t]*<script src="js/shell/prototype\.js[^"]*"></script>\n', h)
        if not m:
            sys.exit('index.html has no <script src="js/shell/prototype.js">: set up dd-presenter-david first')
        h = h[:m.end()] + '  ' + JS_TAG + '\n' + h[m.end():]
    write(idx, h)


def copy_frame(root, assets, force=False):
    for src, dst in FILES:
        s, d = os.path.join(assets, src), os.path.join(root, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        if os.path.exists(d) and read(d) != read(s) and not force:
            print('- kept %s (it differs from the skill\'s; --force replaces it)' % dst); continue
        shutil.copy(s, d)


def check(root):
    errs, warns = [], []
    idx, cfg = os.path.join(root, 'index.html'), os.path.join(root, 'shell.config.js')
    if not os.path.exists(idx) or not os.path.exists(cfg):
        return ['no presenter shell here (index.html + shell.config.js)'], warns
    h = read(idx)
    for _, dst in FILES:
        if not os.path.exists(os.path.join(root, dst)):
            errs.append('missing ' + dst)
    for tag in (CSS_TAG, JS_TAG):
        if tag not in h:
            errs.append('index.html does not load ' + re.search(r'(css|js)/shell/[\w.-]+', tag).group(0))
    if JS_TAG in h and 'js/shell/prototype.js' in h and h.index(JS_TAG) < h.index('js/shell/prototype.js'):
        errs.append('index.html: phone-frame.js must load after js/shell/prototype.js')
    if JS_TAG in h and 'js/shell/duo.js' in h and h.index(JS_TAG) > h.index('js/shell/duo.js'):
        errs.append('index.html: phone-frame.js must load before js/shell/duo.js')
    d = devices(cfg)
    if d is not None and 'iphone' not in d:
        warns.append("shell.config.js: devices has no 'iphone' (the iPhone tab is hidden; fine for an iPhone Duo only prototype)")
    return errs, warns


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--remove', action='store_true')
    ap.add_argument('--force', action='store_true', help='replace frame files that differ from the skill\'s')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    idx, cfg = os.path.join(root, 'index.html'), os.path.join(root, 'shell.config.js')
    if not os.path.exists(idx) or 'id="screen"' not in read(idx) or not os.path.exists(cfg):
        sys.exit('No presenter shell in %s (index.html with #screen, shell.config.js). Set it up first with dd-presenter-david.' % root)
    if a.remove:
        devs = [d for d in (devices(cfg) or ['iphone']) if d != 'iphone']
        set_devices(cfg, devs)
        if 'duo' not in devs:
            h = read(idx)
            h = h.replace('  ' + CSS_TAG + '\n', '').replace(CSS_TAG, '').replace('  ' + JS_TAG + '\n', '').replace(JS_TAG, '')
            write(idx, h)
            print('- iPhone removed: pages show in the presenter\'s plain screen (the frame files stay in css/ and js/)')
        else:
            print('- iPhone removed from the device list: iPhone Duo only (the frame files stay: the Duo uses them)')
        return 0
    if not a.check:
        copy_frame(root, ASSETS, a.force)
        link_frame(idx)
        devs = devices(cfg)
        if devs is None:
            devs = ['iphone'] + (['duo'] if 'js/shell/duo.js' in read(idx) else [])
        elif 'iphone' not in devs:
            devs = ['iphone'] + devs
        set_devices(cfg, devs)
        print('iPhone frame installed (devices: %s).' % ', '.join(devs))

        cr = next((c for c in (os.path.join(HERE, '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py'), os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'credits.py')) if os.path.exists(c)), '')
        if cr:
            import subprocess
            subprocess.run([sys.executable, cr, '--project', root])
    errs, warns = check(root)
    for w in warns:
        print('note   ' + w)
    for e in errs:
        print('ERROR  ' + e)
    if not errs and a.check:
        print('The iPhone frame is wired.')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
