#!/usr/bin/env python3
"""Check that dev mode is wired into a dd-presenter-david project (static checks, no browser needed).

  python3 check_devmode.py --project ./my-prototype

ERRORS are things that stop dev mode from working. WARNINGS are likely mistakes or reduced results (no token chips, Sections finds nothing).
Checks: the dev files exist; index.html has the elements, stylesheet, scripts (in the right order) and icons dev mode needs; devmode.config.js
loads, has a password, and uses the same prefix as shell.config.js; the prototype's :root custom
properties (and which families it covers); each screen has something the Sections selectors can find (a rough text match: a screen built by
JavaScript may still work); old copies from earlier versions of the skill.
Needs Node to read the config exactly; without it, a rough text scan is used. Exit code 1 if there is any error.
"""
import argparse, json, os, re, shutil, subprocess, sys

errors, warnings, notes = [], [], []
JS = ['devmode.js', 'devtools.js', 'devanim.js', 'devanim2.js']
ICONS = ['animation', 'code', 'content_copy', 'download', 'grid_view', 'image', 'keyboard_arrow_down', 'keyboard_arrow_up', 'lightbulb', 'push_pin', 'warning']
IDS = ['screen', 'summary', 'devmode', 'devmodeLabel', 'secbtn', 'inspector', 'devgate', 'dg-pass', 'dg-err', 'dg-cancel']
ORDER = ['shell.config.js', 'js/shell/prototype.js', 'devmode.config.js'] + ['js/shell/' + f for f in JS]
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '__pycache__'}


def read(p):
    try:
        return open(p, encoding='utf-8').read()
    except UnicodeDecodeError:
        return open(p, encoding='latin-1').read()


def load_global(path, name):
    """Evaluate a config file with Node and return window[name] as a dict (None if it cannot be read)."""
    if shutil.which('node'):
        js = ("global.window={};require('vm').runInThisContext(require('fs').readFileSync(process.argv[1],'utf8'));"
              "console.log(JSON.stringify(window[process.argv[2]]||null))")
        try:
            out = subprocess.run(['node', '-e', js, path, name], capture_output=True, text=True, timeout=20)
        except Exception as e:
            errors.append('could not run node to read %s: %s' % (os.path.basename(path), e))
            return None
        if out.returncode != 0:
            last = out.stderr.strip().splitlines()[-1] if out.stderr.strip() else 'it could not be evaluated'
            errors.append('%s has a JavaScript error: %s' % (os.path.basename(path), last))
            return None
        return json.loads(out.stdout) if out.stdout.strip() != 'null' else None
    warnings.append('Node is not installed: reading %s with a rough text scan' % os.path.basename(path))
    t = read(path)
    cfg = {}
    for k in ('password', 'prefix'):
        m = re.search(r"\b%s\s*:\s*(['\"])(.*?)\1" % k, t)
        if m:
            cfg[k] = m.group(2).replace('\\\\', '\\')
    cfg['sections'] = {}
    for k in ('bar', 'content', 'nav', 'sub'):
        m = re.search(r"\b%s\s*:\s*(['\"])(.*?)\1" % k, t)
        if m:
            cfg['sections'][k] = m.group(2)
    return cfg


def open_tags(html):
    """(tag, id, classes) for every opening tag in the text."""
    out = []
    for m in re.finditer(r'<([a-zA-Z][\w-]*)\b([^>]*)>', html):
        attrs = m.group(2)
        i = re.search(r'\bid=["\']([^"\']+)["\']', attrs)
        c = re.search(r'\bclass=["\']([^"\']*)["\']', attrs)
        out.append((m.group(1).lower(), i.group(1) if i else '', (c.group(1) if c else '').split()))
    return out


def selector_hits(selector_list, tags):
    """True when a simple selector (tag, .class, tag.class, #id) in the comma list matches a tag; None when only complex selectors remain (cannot tell)."""
    unknown = False
    for sel in [s.strip() for s in selector_list.split(',') if s.strip()]:
        m = re.match(r'^([a-zA-Z][\w-]*)?((?:\.[\w-]+)*)(?:#([\w-]+))?$', sel)
        if not m or not (m.group(1) or m.group(2) or m.group(3)):
            unknown = True
            continue
        tag, classes, ident = (m.group(1) or '').lower(), [c for c in (m.group(2) or '').split('.') if c], m.group(3)
        for t, i, cl in tags:
            if (not tag or t == tag) and all(c in cl for c in classes) and (not ident or i == ident):
                return True
    return None if unknown else False


def tokens_report(root, pattern):
    """Token chips are optional and work with any naming: every custom property on :root / html is read and sorted by its value."""
    rx = None
    if pattern:
        try:
            rx = re.compile(pattern)
        except re.error as e:
            errors.append('devmode.config.js: tokenFiles %r is not a valid regular expression (%s)' % (pattern, e))
            return
    files = []
    for d, dirs, fs in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), root).replace(os.sep, '/')
            if not f.endswith('.css') or rel.startswith('css/shell/') or rel.endswith('pages/lock.css'):
                continue                                 # the shell's own styles are not the prototype's tokens
            if rx is None or rx.search(rel):
                files.append(rel)
    fam = {'colour': 0, 'length': 0, 'shadow': 0, 'alias': 0, 'other': 0}
    used = []
    for rel in files:
        css = re.sub(r'/\*.*?\*/', '', read(os.path.join(root, rel)), flags=re.S)
        n = 0
        for blk in re.finditer(r'(?:^|[,}\s])(?::root|html)\s*\{([^}]*)\}', css):
            for name, val in re.findall(r'(--[\w-]+)\s*:\s*([^;]+);?', blk.group(1)):
                val = val.strip(); n += 1
                if re.match(r'^(#|rgba?\(|hsla?\(|hwb\(|color\(|oklch\(|oklab\(|lab\(|lch\()', val, re.I):
                    fam['colour'] += 1
                elif re.search(r'(rgba?\(|hsla?\(|#[0-9a-f]{3,8})', val, re.I) and re.search(r'-?[\d.]+(px)?\s+-?[\d.]+(px)?\s+[\d.]+', val):
                    fam['shadow'] += 1
                elif re.match(r'^-?[\d.]+(px|rem|em)$|^calc\(', val):
                    fam['length'] += 1
                elif val.startswith('var('):
                    fam['alias'] += 1
                else:
                    fam['other'] += 1
        if n:
            used.append(rel)
    total = sum(fam.values())
    if not total:
        notes.append('tokens: no custom properties on :root were found in the prototype stylesheets, so the inspector shows raw values without token chips. That is fine; chips appear as soon as the prototype defines tokens (any naming)')
        return
    notes.append('tokens: %d custom properties in %s (colours %d, lengths %d, shadows %d, aliases %d): chips match by value, any naming' % (
        total, ', '.join(used), fam['colour'], fam['length'], fam['shadow'], fam['alias']))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', default='.')
    root = os.path.abspath(ap.parse_args().project)

    # ---- files ----
    for rel in ['devmode.config.js', 'css/shell/devmode.css'] + ['js/shell/' + f for f in JS]:
        if not os.path.exists(os.path.join(root, rel)):
            errors.append('%s is missing (run install_devmode.py)' % rel)

    # ---- index.html ----
    idx = os.path.join(root, 'index.html')
    if not os.path.exists(idx):
        errors.append('index.html is missing')
        html = ''
    else:
        html = read(idx)
        tags = open_tags(html)
        have_ids = {i for _, i, _ in tags}
        for i in IDS:
            if i not in have_ids:
                errors.append('index.html has no element with id="%s" (run install_devmode.py, or add the dev mode snippets)' % i)
        classes = {c for _, _, cl in tags for c in cl}
        for c in ('side--right', 'side__top'):
            if c not in classes:
                errors.append('index.html has no element with class "%s"' % c)
        if 'css/shell/devmode.css' not in html:
            errors.append('index.html does not link css/shell/devmode.css')
        pos, last = {}, -1
        for s in ORDER:
            m = re.search(r'<script[^>]+src=["\']\.?/?%s(\?[^"\']*)?["\']' % re.escape(s), html)
            if not m:
                errors.append('index.html does not load %s' % s)
                continue
            pos[s] = m.start()
            if m.start() < last:
                errors.append('index.html loads %s too early: the order must be %s' % (s, ', '.join(ORDER)))
            last = max(last, m.start())
        link = re.search(r'Material\+Symbols[^"\']*?icon_names=([a-z0-9_,]+)', html)
        if not link:
            errors.append('index.html has no Material Symbols link with icon_names=..., so dev mode icons show as plain words')
        else:
            names = link.group(1).split(',')
            miss = [i for i in ICONS if i not in names]
            if miss:
                errors.append('the Material Symbols icon_names list lacks: %s' % ', '.join(miss))
            if names != sorted(names):
                warnings.append('the Material Symbols icon_names list is not alphabetical; Google requires that and may drop icons otherwise')

    # ---- config ----
    cfg_path = os.path.join(root, 'devmode.config.js')
    cfg = None
    if os.path.exists(cfg_path):
        text = read(cfg_path)
        if re.search(r'window\.DEVMODE\b', text) and 'DEV_MODE' not in text:
            errors.append('devmode.config.js uses the old name window.DEVMODE: rename it to window.DEV_MODE (the scripts read DEV_MODE)')
        else:
            before = len(errors)
            cfg = load_global(cfg_path, 'DEV_MODE')
            if cfg is None and len(errors) == before:
                errors.append('devmode.config.js does not define window.DEV_MODE')
    for f in JS:
        p = os.path.join(root, 'js', 'shell', f)
        if os.path.exists(p) and re.search(r'VTDev|window\.DEVMODE\b|vtdev:', read(p)):
            errors.append('js/shell/%s is an older copy of the skill (it uses the old names): run install_devmode.py --force' % f)

    shell = None
    sc = os.path.join(root, 'shell.config.js')
    if os.path.exists(sc):
        shell = load_global(sc, 'SHELL')
    if cfg:
        pw = cfg.get('password')
        if not pw and cfg.get('passwordLater') is True:
            warnings.append('devmode.config.js: no dev password yet (passwordLater): dev mode opens without asking. Ask the user for it after the first successful deploy')
        elif not pw:
            errors.append('devmode.config.js: password is empty, so dev mode cannot be switched on')
        elif shell and pw == shell.get('password'):
            warnings.append('the dev password is the same as the lock-screen password: every reviewer can then switch dev mode on')
        pre, spre = cfg.get('prefix'), shell and shell.get('prefix')
        if spre and pre != spre:
            errors.append('devmode.config.js prefix %r differs from the shell prefix %r: "Back to lock screen" would not switch dev mode off' % (pre, spre))
        elif not shell:
            warnings.append('shell.config.js could not be read, so the prefix was not compared')
        if cfg.get('credits'):
            warnings.append('devmode.config.js: credits are now set in shell.config.js (credits: design, made, thanks; see dd-presenter-david scripts/credits.py); this block is ignored')
        tokens_report(root, cfg.get('tokenFiles') or '')

        # ---- sections: does each screen have something the selectors can find? ----
        SC = cfg.get('sections') or {}
        defaults = {'bar': '.appbar, header.bar, header', 'content': 'main, .main, .app, .content', 'nav': 'nav.tabbar, nav.nav, nav', 'sub': '.segnav, .subnav'}
        sel = {k: SC.get(k) or defaults[k] for k in defaults}
        pages = []
        if shell:
            for pid, pg in (shell.get('pages') or {}).items():
                src = (pg or {}).get('src', '')
                if src and not src.endswith('lock.html') and os.path.exists(os.path.join(root, src)):
                    pages.append((pid, src))
        seen = {k: False for k in sel}
        unknown = {k: False for k in sel}
        for pid, src in pages:
            tg = open_tags(read(os.path.join(root, src)))
            for k in sel:
                r = selector_hits(sel[k], tg)
                if r:
                    seen[k] = True
                elif r is None:
                    unknown[k] = True
                if k == 'content' and r is False:
                    warnings.append('%s: nothing matches sections.content (%s) in the page text. Sections will list no parts here unless the page is built by JavaScript. Set sections.content in devmode.config.js' % (src, sel['content']))
        for k, label in (('bar', 'an app bar'), ('nav', 'a bottom navigation'), ('sub', 'a sub-navigation')):
            if pages and not seen[k] and not unknown[k]:
                notes.append('sections.%s (%s) matches nothing in any screen: fine if no screen has %s' % (k, sel[k], label))

    for n in notes:
        print('note:   ', n)
    for w in warnings:
        print('warning:', w)
    for e in errors:
        print('ERROR:  ', e)
    if not errors:
        print('No errors (%d warning%s).' % (len(warnings), '' if len(warnings) == 1 else 's'))
    else:
        print('%d error%s, %d warning%s.' % (len(errors), '' if len(errors) == 1 else 's', len(warnings), '' if len(warnings) == 1 else 's'))
    print('Reminder: dev mode needs http (not file://) and a window at least 1380 px wide, because it lives in the right-hand card.')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
