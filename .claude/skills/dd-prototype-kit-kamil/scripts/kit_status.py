#!/usr/bin/env python3
"""Where does a prototype stand in the Design Department kit? Reads the project's files (no network, nothing changed).

  kit_status.py --project <dir> [--json]

Prints one line per step: done / partly / not started, what was found, and the next step to run.
Steps (in the order the kit runs them): brief, design references, shell, design system, typography, UX writing, icons, components, screens, admin, iPhone Duo, phone, deploy, passwords.
"""
import argparse, glob, json, os, re

STEPS = [
    ('brief', 'Brief and user story'),
    ('references', 'Design references'),
    ('shell', 'Presenter shell and design brief'),
    ('addons', 'Add-ons (dev mode, designer mode)'),
    ('designsystem', 'Design system'),
    ('typography', 'Typography'),
    ('writing', 'UX writing'),
    ('icons', 'Icons'),
    ('components', 'Components'),
    ('content', 'Localized content'),
    ('map', 'Map (optional)'),
    ('screens', 'Screens'),
    ('a11y', 'Accessibility'),
    ('admin', 'Admin screens'),
    ('duo', 'iPhone Duo mode'),
    ('phone', 'Phone fit and install'),
    ('deploy', 'Deploy'),
    ('passwords', 'Passwords'),
]


def read(p):
    try:
        return open(p, encoding='utf-8', errors='ignore').read()
    except OSError:
        return ''


def status(root):
    j = lambda *p: os.path.join(root, *p)
    pages = [p for p in glob.glob(j('pages', '*.html')) if not p.endswith('lock.html')]
    texts = {p: read(p) for p in pages}
    allhtml = ''.join(texts.values())
    cfg, design = read(j('shell.config.js')), read(j('DESIGN.md'))
    css = ''.join(read(p) for p in glob.glob(j('css', 'pages', '*.css')))
    r = {}
    # brief: a user story or a design brief written for this prototype
    story = [os.path.basename(p) for p in glob.glob(j('*.md')) if re.search(r'stor(y|ies)|brief|requirement', os.path.basename(p), re.I)]
    r['brief'] = ('done', ', '.join(story)) if story else ('not started', 'no USER_STORY.md / brief yet')
    # shell
    if cfg and os.path.exists(j('index.html')):
        r['shell'] = ('done', 'shell.config.js' + (', DESIGN.md' if design else ', no DESIGN.md'))
    else:
        r['shell'] = ('not started', 'no shell.config.js')
    # add-ons: optional, so "skipped" rather than "not started" when none is there
    have = [n for n, f in (('dev mode', 'devmode.config.js'), ('designer mode', os.path.join('js', 'shell', 'designer.js'))) if os.path.exists(j(f))]
    r['addons'] = ('done', ', '.join(have)) if have else ('skipped', 'none (optional: dd-dev-mode-kamil, dd-designer-mode-kamil)')
    # design system: the rulebook and its panel
    if os.path.exists(j('design-system.config.js')):
        ex = len(re.findall(r"where\s*:", read(j('design-system.config.js'))))
        r['designsystem'] = ('done', 'design-system.config.js' + (', %d approved exception(s)' % ex if ex else '') + ('' if 'ds-check.js' in read(j('index.html')) else ', panel not installed'))
    elif os.path.exists(j('ui-standard.config.js')):
        r['designsystem'] = ('partly', 'earlier test version (ui-standard.config.js): ask before upgrading')
    else:
        r['designsystem'] = ('not started', 'no design-system.config.js')
    # typography: font tokens + a font loaded on the screens
    fs_tokens = len(re.findall(r'--fs-[a-z0-9-]+\s*:', css))
    font_link = re.search(r'fonts\.googleapis\.com/css2\?family=(?!Material)', allhtml)
    if fs_tokens and ('## Typography' in design or font_link):
        r['typography'] = ('done', '%d size tokens' % fs_tokens)
    elif fs_tokens or font_link or '## Typography' in design:
        r['typography'] = ('partly', 'some type set up, no full token scale' if not fs_tokens else 'tokens but not recorded in DESIGN.md')
    else:
        r['typography'] = ('not started', 'no type tokens (--fs-*)')
    r['references'] = ('done', 'direction in DESIGN.md') if '## References' in design else ('not started', 'no "## References" in DESIGN.md')
    r['map'] = ('done', '"## Map" in DESIGN.md (check: map.py check)') if '## Map' in design else ('skipped', 'none (optional: dd-map-kamil, when screens need a map)')
    r['content'] = ('done', 'market and names in DESIGN.md (check: content.py scan)') if '## Content' in design else ('not started', 'no "## Content" in DESIGN.md')
    r['a11y'] = ('done', 'level in DESIGN.md (check: a11y_check.py)') if '## Accessibility' in design else ('not started', 'no "## Accessibility" in DESIGN.md')
    # UX writing: the voice recorded in DESIGN.md
    r['writing'] = ('done', 'voice in DESIGN.md (check: dd-ux-writing-kamil copy_check.py)') if '## Writing' in design else ('not started', 'no "## Writing" in DESIGN.md')
    # icons
    m = re.search(r'family=Material\+Symbols\+(\w+)[^"]*icon_names=([a-z0-9_,]+)', allhtml)
    other = re.search(r'font-awesome|flaticon-uicons|bootstrap-icons|phosphor-icons|remixicon|tabler-icons', allhtml)
    if m:
        r['icons'] = ('done', 'Material Symbols %s, %d icons' % (m.group(1), len(m.group(2).split(','))))
    elif other:
        r['icons'] = ('done', other.group(0))
    elif pages:
        r['icons'] = ('not started', 'no icon font on the screens')
    else:
        r['icons'] = ('not started', '')
    # components
    cj = j('components.json')
    if os.path.exists(cj):
        try:
            picks = json.load(open(cj))['picks']
        except Exception:
            picks = []
        unused = 0
        chk = os.path.expanduser('~/.claude/skills/dd-components-kamil/scripts/components.py')
        if os.path.exists(chk):   # ask the components skill itself which picks no screen uses yet
            import subprocess
            out = subprocess.run(['python3', chk, 'check', '--project', root], capture_output=True, text=True).stdout
            unused = out.count('installed but no screen uses it')
        r['components'] = ('done', '%d picked%s' % (len(picks), ', %d not used on any screen yet' % unused if unused else ', all in use'))
    else:
        r['components'] = ('not started', 'no components.json')
    # screens: real screens beyond the scaffold samples
    sample = {'home.html', 'details.html'}
    real = [os.path.basename(p) for p in pages if os.path.basename(p) not in sample or 'A card with a moving indicator' not in texts[p]]
    r['screens'] = ('done', '%d screens' % len(real)) if len(real) >= 2 else (('partly', '%d screen' % len(real)) if real else ('not started', 'only the scaffold samples'))
    # admin
    has_admin_pages = re.search(r"device\s*:\s*['\"]desktop['\"]", cfg)
    if os.path.exists(j('js', 'shell', 'admin-shell.js')):
        r['admin'] = ('done' if has_admin_pages else 'partly', 'add-on installed' + ('' if has_admin_pages else ', no desktop pages marked'))
    else:
        r['admin'] = ('skipped', 'no admin add-on (only needed for admin / desktop screens)')
    # iPhone Duo: optional, like admin
    if 'js/shell/duo.js' in read(j('index.html')):
        lay = re.search(r'@media \(min-width: ?840px\)\s*\{[^}]*\{', read(j('css', 'shared', 'duo.css')))
        n = sum(1 for p in pages if 'shared/duo.js' in texts[p])
        r['duo'] = ('done' if lay else 'partly', 'frames + animation, %d screen(s) linked%s' % (n, '' if lay else ', no tablet layouts yet'))
    else:
        r['duo'] = ('skipped', 'no iPhone Duo mode (only if wanted)')
    # phone
    man = os.path.exists(j('manifest.webmanifest')) or os.path.exists(j('manifest.json'))
    if man and os.path.exists(j('sw.js')):
        r['phone'] = ('done', 'manifest, service worker, icons')
    elif man:
        r['phone'] = ('partly', 'manifest without service worker')
    else:
        r['phone'] = ('not started', 'no web app manifest')
    # deploy
    if os.path.exists(j('firebase.json')):
        site = re.search(r'"site"\s*:\s*"([^"]+)"', read(j('firebase.json')))
        r['deploy'] = ('done', 'Firebase' + (' site %s' % site.group(1) if site else ''))
    elif os.path.exists(j('netlify.toml')) or os.path.exists(j('vercel.json')):
        r['deploy'] = ('done', 'hosting config found')
    else:
        r['deploy'] = ('not started', 'no hosting config')
    # passwords
    pw_null = re.search(r'password\s*:\s*null', cfg)
    later = 'passwordLater' in read(j('devmode.config.js'))
    if not cfg:
        r['passwords'] = ('not started', '')
    elif pw_null or later:
        r['passwords'] = ('partly', 'set to "after deploying": ask for them now if it is deployed')
    else:
        r['passwords'] = ('done', 'lock password set' + (', dev password set' if os.path.exists(j('devmode.config.js')) else ''))
    return r


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True); ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    r = status(root) if os.path.isdir(root) else {k: ('not started', 'folder does not exist yet') for k, _ in STEPS}
    if a.json:
        print(json.dumps({k: {'state': v[0], 'found': v[1]} for k, v in r.items()}, indent=1)); return
    mark = {'done': '[x]', 'partly': '[~]', 'not started': '[ ]', 'skipped': '[-]'}
    nxt = None
    for k, name in STEPS:
        st, found = r[k]
        if nxt is None and st in ('not started', 'partly') and k not in ('admin', 'duo'):
            nxt = name
        print('%s %-44s %s' % (mark[st], name, found))
    print('\nNext step: %s' % (nxt or 'all done; run the final sense check'))


if __name__ == '__main__':
    main()
