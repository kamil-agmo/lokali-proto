#!/usr/bin/env python3
"""Check that a dd-presenter-david project is wired up correctly (static checks, no browser needed).

  python3 check.py --project ./my-prototype

Reports errors (the shell or the lock will not work) and warnings (works, but probably not what you meant). Exit code 1 if any error.
Checks: shell.config.js loads and is complete; every page file exists; the page list and the tree agree; the start and replay pages exist;
index.html has the lock iframe, phone iframe, summary and reset dialog; every screen loads shell.config.js and lock-guard.js in <head>
(a screen without the guard can be opened without the password) and embed.js before </body>, and reports the id the config expects.
Needs Node to read shell.config.js exactly; without Node it falls back to a rough text scan.
"""
import argparse, glob, json, os, re, shutil, subprocess, sys

errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def read(p):
    return open(p, encoding='utf-8').read()


def load_config(path):
    if shutil.which('node'):
        js = ("global.window={};const fs=require('fs');require('vm').runInThisContext(fs.readFileSync(process.argv[1],'utf8'));"
              "console.log(JSON.stringify(window.SHELL||null))")
        try:
            out = subprocess.run(['node', '-e', js, path], capture_output=True, text=True, timeout=20)
        except Exception as e:
            err('could not run node to read shell.config.js: %s' % e)
            return None
        if out.returncode != 0:
            err('shell.config.js has a JavaScript error: %s' % out.stderr.strip().splitlines()[-1] if out.stderr.strip() else 'shell.config.js could not be evaluated')
            return None
        return json.loads(out.stdout) if out.stdout.strip() != 'null' else None
    warn('Node is not installed: reading shell.config.js with a rough text scan (install Node for exact checks)')
    t = read(path)
    cfg = {'pages': {}, 'tree': []}
    for k in ('name', 'password', 'prefix', 'startPage'):
        m = re.search(r"\b%s\s*:\s*(['\"])(.*?)\1" % k, t)
        if m:
            cfg[k] = m.group(2)
    for m in re.finditer(r"['\"]([\w-]+)['\"]\s*:\s*\{\s*group\s*:.*?src\s*:\s*['\"]([^'\"]+)['\"]", t, re.S):
        cfg['pages'][m.group(1)] = {'src': m.group(2)}
    for m in re.finditer(r"children\s*:\s*\[([^\]]*)\]", t):
        cfg['tree'].append({'children': re.findall(r"['\"]([\w-]+)['\"]", m.group(1))})
    return cfg


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', default='.')
    root = ap.parse_args().project

    cfg_path = os.path.join(root, 'shell.config.js')
    if not os.path.exists(cfg_path):
        sys.exit('No shell.config.js in %s. Run scaffold.py first.' % root)
    cfg = load_config(cfg_path)
    if not cfg:
        err('shell.config.js did not define window.SHELL')
    else:
        for k in ('name', 'prefix', 'startPage', 'pages', 'tree'):
            if not cfg.get(k):
                err('shell.config.js: "%s" is missing or empty' % k)
        if not cfg.get('password'):
            print('warning: shell.config.js: no lock password yet (password: null), so there is no lock screen. Ask the user for it after the first successful deploy, then deploy again')
        pages, tree = cfg.get('pages') or {}, cfg.get('tree') or []
        if cfg.get('startPage') and cfg['startPage'] not in pages:
            err('startPage "%s" is not a key of pages' % cfg['startPage'])
        listed = set()
        for n in tree:
            for pid in n.get('children', []):
                listed.add(pid)
                if pid not in pages:
                    err('tree lists "%s" but pages has no such id' % pid)
        for pid in pages:
            if pid not in listed:
                warn('page "%s" is not in tree: it will not appear in the left list' % pid)
        rp = cfg.get('replay')
        if rp and rp.get('page') not in pages:
            err('replay.page "%s" is not a key of pages' % rp.get('page'))
        # intake answers: logo files, accent, lock text left as the template's placeholder
        for k in ('logo', 'logoLock'):
            v = cfg.get(k)
            if v and not re.match(r'^(https?:|/|data:)', v) and not os.path.exists(os.path.join(root, v)):
                err('shell.config.js: %s "%s" does not exist' % (k, v))
        th = cfg.get('theme') or {}
        if not th.get('accent'):
            warn('shell.config.js: theme.accent is empty: the shell and lock screen use the neutral blue instead of the prototype\'s brand colour')
        elif not re.match(r'^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab|color)\()', str(th['accent']).strip()):
            err('shell.config.js: theme.accent "%s" is not a CSS colour' % th['accent'])
        lock = cfg.get('lock') or {}
        tl = lock.get('taglines') or []
        if not tl:
            warn('shell.config.js: lock.taglines is empty (the lock screen shows no tagline)')
        elif str(tl[0]).startswith(('Your product,', 'Tap around.')):
            warn('shell.config.js: the lock screen text is still the template\'s placeholder: ask the user what it should say')
        st = lock.get('stats') or []
        if st and [x.get('label') for x in st] == ['screens', 'flows', 'clickable']:
            warn('shell.config.js: the lock screen counters are still the template\'s placeholder (12 screens, 3 flows, 100% clickable)')
        if cfg.get('replay') is None:
            pass   # no intro: the Replay button is hidden on purpose
        if cfg.get('prefix') and not re.fullmatch(r'[a-z0-9-]+', cfg['prefix']):
            warn('prefix "%s" should be lowercase letters, digits and dashes (it is used in storage keys and message names)' % cfg['prefix'])

        # page files and the wiring inside each screen
        src_by_file = {}
        for pid, p in pages.items():
            f = p.get('src', '')
            if not f or not os.path.exists(os.path.join(root, f)):
                err('page "%s": file "%s" does not exist' % (pid, f))
            else:
                src_by_file[os.path.normpath(os.path.join(root, f))] = pid
        screens = set(src_by_file)
        for f in glob.glob(os.path.join(root, 'pages', '**', '*.html'), recursive=True):
            if os.path.basename(f) not in ('lock.html', 'design-system.html', 'ui-standard.html'):   # the lock screen and the design system's panel pages are not app screens
                screens.add(os.path.normpath(f))
        for f in sorted(screens):
            rel = os.path.relpath(f, root)
            t = read(f)
            head = t.split('</head>')[0] if '</head>' in t else t
            if 'lock-guard.js' not in head:
                err('%s: no lock-guard.js in <head> (this screen can be opened without the password)' % rel)
            elif 'shell.config.js' not in head or head.index('shell.config.js') > head.index('lock-guard.js'):
                err('%s: shell.config.js must be loaded before lock-guard.js (the guard reads the prefix from it)' % rel)
            if 'embed.js' not in t:
                err('%s: no embed.js before </body> (the page cannot talk to the shell)' % rel)
            pid = src_by_file.get(f)
            if pid is None:
                warn('%s is not listed in shell.config.js pages' % rel)
            elif 'ProtoEmbed.report' not in t:
                warn('%s: never calls ProtoEmbed.report("%s", ...), so the right card will not follow this screen when it is opened from a link inside the phone' % (rel, pid))
            elif not re.search(r"report\(\s*['\"]%s['\"]" % re.escape(pid), t):
                warn('%s: ProtoEmbed.report is called with a different id than the config key "%s"' % (rel, pid))

    # the shell page and the lock page
    idx = os.path.join(root, 'index.html')
    if not os.path.exists(idx):
        err('index.html is missing')
    else:
        t = read(idx)
        for need in ('id="lockscreen"', 'id="screen"', 'id="summary"', 'id="pagenav"', 'id="reset"', 'js/shell/prototype.js', 'shell.config.js'):
            if need not in t:
                err('index.html: %s not found' % need)
        # devices: a device skill frames the screen; none at all is allowed (a plain screen) but usually a mistake
        frame_on = 'js/shell/phone-frame.js' in t or 'js/shell/duo.js' in t
        devs = (cfg or {}).get('devices') if cfg else None
        if not frame_on and 'admin-shell.js' not in t:
            warn('no device skill: pages show in a plain screen. For an iPhone frame run dd-iphone-david (iPhone Duo: dd-iphone-duo-kamil; desktop pages: dd-desktop-kamil)')
        if 'js/shell/duo.js' in t and 'js/shell/phone-frame.js' not in t:
            err('index.html loads js/shell/duo.js but not js/shell/phone-frame.js: run dd-iphone-duo-kamil\'s install_duo.py again')
        if devs is not None and 'iphone' in devs and 'js/shell/phone-frame.js' not in t:
            err("shell.config.js lists 'iphone' in devices but index.html does not load js/shell/phone-frame.js: run dd-iphone-david's install_iphone.py")
    for f in ('pages/lock.html', 'js/pages/lock.js', 'js/shell/prototype.js', 'js/shared/embed.js', 'js/shared/lock-guard.js', 'css/shell/prototype.css', 'css/pages/lock.css'):
        if not os.path.exists(os.path.join(root, f)):
            err('%s is missing' % f)

    for w in warnings:
        print('warning:', w)
    for e in errors:
        print('ERROR:  ', e)
    if not errors and not warnings:
        print('dd-presenter-david wiring looks right.')
    elif not errors:
        print('No errors (%d warning%s).' % (len(warnings), '' if len(warnings) == 1 else 's'))
    else:
        print('%d error%s, %d warning%s.' % (len(errors), '' if len(errors) == 1 else 's', len(warnings), '' if len(warnings) == 1 else 's'))
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
