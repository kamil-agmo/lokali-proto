#!/usr/bin/env python3
"""Add dev mode (dd-dev-mode-kamil) to a project that already has a presenter shell (dd-presenter-david: index.html with #screen,
#summary and a right-hand card).

  python3 install_devmode.py --project ./my-prototype --password "dev-password"

What it does (safe to run twice):
  * copies js/shell/dev*.js and css/shell/devmode.css, and writes devmode.config.js (password, prefix, token file, section selectors)
  * patches index.html: the stylesheet, the toggle buttons in the right card's add-on slot (#addons; an older shell without it gets the row), the inspector container, the password
    dialog, the script tags, and the icons dev mode needs (added to the Material Symbols link, kept alphabetical; the link is added if missing)
A file that already exists and differs from the skill's (your edited devmode.config.js, for example) is kept unless you pass --force.
Requires the shell to be served over http (dev mode reads the page inside the phone frame, which file:// blocks) and a window at least
1380 px wide (the right-hand card is hidden below that).
"""
import argparse, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets', 'devmode')
ICONS = ['animation', 'code', 'content_copy', 'download', 'grid_view', 'image', 'keyboard_arrow_down', 'keyboard_arrow_up', 'lightbulb', 'push_pin', 'warning']
JS = ['devmode.js', 'devtools.js', 'devanim.js', 'devanim2.js']
FONT = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=%s'


def read(p):
    return open(p, encoding='utf-8').read()


def js_str(s):
    """A JavaScript string literal that is safe inside a <script> block and any quoting."""
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')


def shell_prefix(root):
    cfg = os.path.join(root, 'shell.config.js')
    if not os.path.exists(cfg):
        return None
    m = re.search(r"""\bprefix\s*:\s*(['"])([^'"]+)\1""", read(cfg))
    return m.group(2) if m else None


def put(src, dst, force, done, root):
    """Copy src to dst unless dst already exists and differs (then it is the project's own work)."""
    if os.path.exists(dst) and not force:
        done['same' if open(src, 'rb').read() == open(dst, 'rb').read() else 'kept'].append(os.path.relpath(dst, root))
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    done['copied'].append(os.path.relpath(dst, root))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--password', help='dev mode password (a soft gate: it is readable in devmode.config.js). Required the first time')
    ap.add_argument('--prefix', help='defaults to the prefix in shell.config.js')
    ap.add_argument('--password-later', action='store_true', help='no dev password yet: dev mode opens without asking until one is set in devmode.config.js (ask the user for it after the first successful deploy)')
    ap.add_argument('--force', action='store_true', help='replace files that already exist even if you changed them (including devmode.config.js)')
    a = ap.parse_args()

    root = os.path.abspath(a.project)
    index = os.path.join(root, 'index.html')
    if not os.path.exists(index):
        sys.exit('No index.html in %s. Set up the presenter shell first (the dd-presenter-david skill).' % root)
    html = read(index)
    for need in ('id="screen"', 'id="summary"'):
        if need not in html:
            sys.exit('index.html has no %s: this does not look like a presenter shell.' % need)

    conf_path = os.path.join(root, 'devmode.config.js')
    if (not os.path.exists(conf_path) or a.force) and not a.password and not a.password_later:
        sys.exit('Pass --password "<dev password>" (devmode.config.js needs one).')
    prefix = a.prefix or shell_prefix(root)
    if not prefix:
        prefix = 'proto'
        print('Note: no prefix found in shell.config.js; using "proto". Dev mode and the shell must share one prefix: set it in devmode.config.js.')

    # 1. files
    done = {'copied': [], 'same': [], 'kept': []}
    for f in JS:
        put(os.path.join(ASSETS, 'js', f), os.path.join(root, 'js', 'shell', f), a.force, done, root)
    put(os.path.join(ASSETS, 'css', 'devmode.css'), os.path.join(root, 'css', 'shell', 'devmode.css'), a.force, done, root)
    if os.path.exists(conf_path) and not a.force:
        print('devmode.config.js already exists: kept (password and settings unchanged; --force rewrites it)')
    else:
        conf = read(os.path.join(ASSETS, 'snippets', 'devmode.config.js')).replace('{{PASSWORD_JS}}', 'null' if a.password_later and not a.password else js_str(a.password)).replace('{{PASSWORD_LATER}}', '  passwordLater: true,             // TODO: no password yet, so dev mode opens without asking. Set `password` above (and delete this line) before sharing\n' if a.password_later and not a.password else '').replace('{{PREFIX_JS}}', js_str(prefix)).replace('{{CREDITS_BLOCK}}\n', '').replace('{{CREDITS_BLOCK}}', '')
        open(conf_path, 'w', encoding='utf-8').write(conf)
        print('Wrote devmode.config.js (prefix "%s")' % prefix)
    if done['copied']:
        print('Copied %s' % ', '.join(done['copied']))
    if done['same']:
        print('Already up to date: %s' % ', '.join(done['same']))
    if done['kept']:
        print("Kept your own copy of %s (it differs from the skill's; --force replaces it)" % ', '.join(done['kept']))

    # 2. index.html
    if 'devmode.js' in html:
        print('index.html already has dev mode: left as it is.')
        return
    snip = lambda n: read(os.path.join(ASSETS, 'snippets', n))
    # stylesheet after the shell stylesheet
    html, n = re.subn(r'(<link rel="stylesheet" href="css/shell/prototype\.css">)', r'\1\n  <link rel="stylesheet" href="css/shell/devmode.css">', html, count=1)
    if not n:
        html = html.replace('</head>', '  <link rel="stylesheet" href="css/shell/devmode.css">\n</head>', 1)
    # toggle buttons at the top of the right card, inspector after the summary
    slot = re.search(r'(<div class="side__top" id="addons">)(.*?)(</div>)', html, re.S)
    if slot:   # the presenter's add-on slot: Sections and Dev mode go at its end (dev mode stays the last toggle)
        buttons = re.search(r'<div class="side__top">\n(.*)\n[ \t]*</div>', snip('shell-top.html'), re.S).group(1)
        html = html[:slot.end(2)] + '\n' + buttons + '\n      ' + html[slot.end(2):]
        html, n1 = re.subn(r'(\n[ \t]*)(<div id="summary"[^>]*></div>)', lambda m: m.group(1) + m.group(2) + '\n' + snip('shell-inspector.html').rstrip('\n'), html, count=1)
    else:      # an older shell without the slot: add the whole row
        html, n1 = re.subn(r'(\n[ \t]*)(<div id="summary"[^>]*></div>)',
                           lambda m: '\n' + snip('shell-top.html').rstrip('\n') + m.group(1) + m.group(2) + '\n' + snip('shell-inspector.html').rstrip('\n'), html, count=1)
    if not n1:
        sys.exit('Could not find <div id="summary" ...></div> in index.html to attach the inspector to.')
    # password dialog + scripts after the shell script (the dev scripts need the shell's elements and config)
    scripts = '  <script src="devmode.config.js"></script>\n' + ''.join('  <script src="js/shell/%s"></script>\n' % f for f in JS)
    m = re.search(r'([ \t]*<script src="js/shell/prototype\.js"></script>\n)', html)
    if not m:
        sys.exit('Could not find <script src="js/shell/prototype.js"> in index.html.')
    html = html.replace(m.group(1), snip('shell-gate.html') + m.group(1) + scripts, 1)
    # icons: merge into the Material Symbols list, or add the link
    def add_icons(mm):
        return mm.group(1) + ','.join(sorted(set(mm.group(2).split(',')) | set(ICONS)))
    html, n2 = re.subn(r'(Material\+Symbols[^"\']*?icon_names=)([a-z0-9_,]+)', add_icons, html, count=1)
    if not n2:
        html = html.replace('</head>', '  <link rel="stylesheet" href="%s">\n</head>' % (FONT % ','.join(sorted(ICONS))), 1)
        print('Added a Material Symbols link for the dev mode icons (the shell stylesheet defines .mi).')
    open(index, 'w', encoding='utf-8').write(html)
    print('Patched index.html: stylesheet, toggle buttons, inspector container, password dialog, scripts, icons.')
    credits = next((c for c in (os.path.join(HERE, '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py'), os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'credits.py')) if os.path.exists(c)), '')
    if os.path.exists(credits):   # dev mode now shows in the prototype's credits
        import subprocess
        subprocess.run([sys.executable, credits, '--project', root])
    print('Next:')
    print('  1. python3 %s --project %s' % (os.path.join(HERE, 'check_devmode.py'), root))
    print('  2. Open devmode.config.js: sections (your app bar / content / nav selectors). Token chips need no setup: they read any :root custom properties.')
    print('  3. Serve over http, open index.html in a window at least 1380 px wide, unlock, press "Inspect". SKILL.md lists the checks.')


if __name__ == '__main__':
    main()
