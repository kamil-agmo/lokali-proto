#!/usr/bin/env python3
"""dd-components-kamil: build the picker gallery, install picked components, swap a component's style, check a project.

  components.py gallery --out <scratch dir> [--project <dir>] [--app "OTW"] [--accent "#7c3aed"]
        writes <out>/components.html; previews wear the project's own :root tokens (brand colour, font) when --project is given.
        The page sets window.componentChoice = { picks: [{id, variant}] } when the designer presses "Add to prototype".
  components.py install --project <dir> --pick "tabbar:ios,appbar:ios,button:md" [--pages pages]
        copies only the picked components into css/shared/components.css + js/shared/components.js, links them in every screen,
        writes components.json (the picks) and COMPONENTS.md (copy-paste snippets), and adds a "Components" section to DESIGN.md.
  components.py swap --project <dir> --component tabbar --to md|ios|fluent|carbon|ant
        switches a component's style in every screen (class names) and reinstalls; markup that differs between styles is listed.
  components.py check --project <dir>
        lists components used in screens but not installed, installed but unused, and screens mixing two styles of one component.
"""
import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, '..', 'assets')
COMP = os.path.join(A, 'components')
ROOT_CLASS = {'tabbar': ['c-tabbar'], 'appbar': ['c-appbar'], 'largetitle': ['c-large'], 'segmented': ['c-seg'], 'button': ['c-btn'], 'fab': ['c-fab'],
              'textfield': ['c-field'], 'search': ['c-search'], 'switch': ['c-switch'], 'checkbox': ['c-check'], 'slider': ['c-slider'], 'card': ['c-card'],
              'list': ['c-list'], 'sheet': ['c-sheet'], 'dialog': ['c-dialog'], 'snackbar': [], 'progress': ['c-progress', 'c-spinner'], 'skeleton': ['c-skel'],
              'toolbar': ['c-toolbar'], 'drawer': ['c-drawer'], 'pagedots': ['c-dots'], 'iconbutton': ['c-icon'], 'chips': ['c-chips'], 'menu': ['c-menu'],
              'actions': ['c-asheet', 'c-fabmenu'], 'buttongroup': ['c-bgroup'], 'stepper': ['c-stepper'], 'select': ['c-select'], 'datetime': ['c-date'],
              'textarea': ['c-area'], 'otp': ['c-otp'], 'tooltip': ['c-tip', 'c-pop'], 'accordion': ['c-acc'], 'carousel': ['c-carousel'], 'avatar': ['c-avatar'],
              'banner': ['c-banner'], 'emptystate': ['c-empty'], 'swipe': ['c-swipe']}
STYLES = ('md', 'ios', 'fluent', 'carbon', 'ant')
SNAME = {'md': 'Material', 'ios': 'Apple', 'fluent': 'Fluent 2', 'carbon': 'Carbon', 'ant': 'Ant Design'}
SRE = '(md|ios|fluent|carbon|ant)'


def sys_blocks(style, ids):
    """The /* @c id */ blocks of sys-<style>.css for these components (plus the system's _base block)."""
    text = read(os.path.join(COMP, 'sys-%s.css' % style)); out = []
    for part in text.split('/* @c ')[1:]:
        cid, _, body = part.partition(' */')
        if cid == '_base' or cid in ids:
            out.append('/* %s: %s */%s' % (SNAME[style], cid, body.rstrip()))
    return '\n'.join(out)


MARKUP_DIFFERS = {'appbar': 'Apple uses text buttons (.c-appbar__text) and a spacer; Material uses icon buttons. Check the bar contents.',
                  'largetitle': 'the leading/trailing buttons differ (Apple: none on the left). Check the bar contents.',
                  'list': 'Apple lists sit in an inset group and usually have a .c-list__header above them.',
                  'checkbox': 'Apple radios show a trailing checkmark instead of a ring; labels read better as full-width rows.',
                  'actions': 'these are two different patterns (Apple action sheet vs Material FAB menu): rebuild it from the new snippet in COMPONENTS.md.',
                  'stepper': 'Apple puts the number first and wraps the buttons in .c-stepper__pair.',
                  'drawer': 'check the section names and icons still read well at the new row size.'}


def manifest():
    return json.load(open(os.path.join(A, 'manifest.json'), encoding='utf-8'))


def read(p):
    return open(p, encoding='utf-8').read()


def tokens_of(project):
    """Custom properties declared on :root / html in the project's own stylesheets (not the shell's), so previews wear its brand."""
    if not project:
        return ''
    out = []
    for p in sorted(glob.glob(os.path.join(project, 'css', '**', '*.css'), recursive=True)):
        if '/shell/' in p or os.path.basename(p) == 'components.css':
            continue
        for m in re.finditer(r'(?:^|\n)\s*(:root|html)\s*\{([^}]*)\}', read(p)):
            decl = ';'.join(d for d in m.group(2).split(';') if d.strip().startswith('--'))
            if decl:
                out.append(':root{' + decl + '}')
    return '\n'.join(out)


def js_lit(v):
    return json.dumps(v, ensure_ascii=False).replace('</', '<\\/')


def gallery(a):
    M = manifest()
    css = {f: read(os.path.join(COMP, f)) for f in os.listdir(COMP) if f.endswith('.css')}
    js = {f: read(os.path.join(COMP, f)) for f in os.listdir(COMP) if f.endswith('.js')}
    preset = []
    if a.project and os.path.exists(os.path.join(a.project, 'components.json')):
        preset = json.load(open(os.path.join(a.project, 'components.json')))['picks']
    icons = sorted(set(M['icons']) | {'add_circle', 'check', 'check_circle'})
    page = read(os.path.join(A, 'gallery.html'))
    page = (page.replace('__MANIFEST__', js_lit(M)).replace('__CSS__', js_lit(css)).replace('__JS__', js_lit(js))
                .replace('__TOKENS__', js_lit(tokens_of(a.project))).replace('__PRESET__', js_lit(preset))
                .replace('__ICON_NAMES__', ','.join(icons)).replace('__ACCENT__', a.accent if re.match(r'^#[0-9a-fA-F]{3,8}$', a.accent or '') else '#6750a4')
                .replace('__APP__', (a.app or 'your app').replace('&', '&amp;').replace('<', '&lt;')))
    os.makedirs(a.out, exist_ok=True)
    out = os.path.join(a.out, 'components.html')
    open(out, 'w', encoding='utf-8').write(page)
    print('Wrote %s (%d components, %d preset)' % (out, len(M['components']), len(preset)))


def parse_picks(s):
    picks = []
    for part in [x.strip() for x in s.split(',') if x.strip()]:
        cid, _, v = part.partition(':')
        if v not in STYLES:
            sys.exit('pick "%s": use component:md, :ios, :fluent, :carbon or :ant' % part)
        picks.append({'id': cid, 'variant': v})
    return picks


def screens(project, pages_dir):
    return [p for p in sorted(glob.glob(os.path.join(project, pages_dir, '*.html'))) if os.path.basename(p) != 'lock.html']


def install(a, picks=None):
    M = manifest(); by = {c['id']: c for c in M['components']}
    picks = picks if picks is not None else parse_picks(a.pick)
    bad = [p['id'] for p in picks if p['id'] not in by]
    if bad:
        sys.exit('unknown component(s): %s. Known: %s' % (', '.join(bad), ', '.join(by)))
    css_files, js_files = ['base.css'], []
    for p in picks:
        for f in by[p['id']]['files']['css']:
            if f not in css_files: css_files.append(f)
        for f in by[p['id']]['files']['js']:
            if f not in js_files: js_files.append(f)
    root = os.path.abspath(a.project)
    os.makedirs(os.path.join(root, 'css', 'shared'), exist_ok=True); os.makedirs(os.path.join(root, 'js', 'shared'), exist_ok=True)
    head = '/* Generated by dd-components-kamil from components.json: %s. Re-run install (or swap) instead of editing by hand. */\n' % ', '.join('%s:%s' % (p['id'], p['variant']) for p in picks)
    css = '\n'.join(read(os.path.join(COMP, f)) for f in css_files)
    for st in sorted({p['variant'] for p in picks} - {'md', 'ios'}):   # Fluent / Carbon / Ant: only the blocks for the components (and the pieces they use) picked in that style
        ids = set()
        for p in picks:
            if p['variant'] == st: ids |= {f[:-4] for f in by[p['id']]['files']['css']}
        css += '\n' + sys_blocks(st, ids)
    open(os.path.join(root, 'css', 'shared', 'components.css'), 'w').write(head + css)
    open(os.path.join(root, 'js', 'shared', 'components.js'), 'w').write(head + '\n'.join(read(os.path.join(COMP, f)) for f in js_files))
    json.dump({'picks': picks}, open(os.path.join(root, 'components.json'), 'w'), indent=1)
    # COMPONENTS.md: plain-words guide + snippets for exactly what was picked
    md = ['# Components in this prototype', '', 'Picked with dd-components-kamil. Copy a snippet into a screen; it already uses the app\'s colours and font. To change a style later, ask Claude to swap it (for example "make the tab bar Material").', '']
    for p in picks:
        c = by[p['id']]; v = c['variants'][p['variant']]
        md += ['## %s: %s' % (c['name'], v['label']), '', c['what'] + ' ' + v['note'], '', '*When to use:* ' + c['when'], '', '```html', v['snippet'], '```', '']
    open(os.path.join(root, 'COMPONENTS.md'), 'w').write('\n'.join(md))
    # DESIGN.md section
    dp = os.path.join(root, 'DESIGN.md'); d = read(dp) if os.path.exists(dp) else '# Design brief\n'
    sec = '## Components\n\nPicked with dd-components-kamil (details and snippets in COMPONENTS.md):\n\n' + '\n'.join('- **%s**: %s' % (by[p['id']]['name'], by[p['id']]['variants'][p['variant']]['label']) for p in picks) + '\n'
    d = re.sub(r'## Components\n.*?(?=\n## |\Z)', sec.rstrip('\n'), d, flags=re.S) if '## Components' in d else d.rstrip('\n') + '\n\n' + sec
    open(dp, 'w').write(d)
    # link in every screen
    linked = 0; icons_needed = set()
    for p in picks:   # icons the picked snippets use
        icons_needed |= set(re.findall(r'class="c-ico[^"]*">([a-z0-9_]+)<', by[p['id']]['variants'][p['variant']]['snippet']))
        icons_needed |= set(by[p['id']].get('extra', {}).get('cssicons', []))   # icons drawn by the CSS itself (ticks, chevrons)
    for s in screens(root, a.pages):
        t = read(s); o = t
        if 'components.css' not in t:
            m = re.search(r'\n(\s*)<link rel="stylesheet" href="\.\./css/pages/', t)
            t = t[:m.start()] + '\n%s<link rel="stylesheet" href="../css/shared/components.css">' % m.group(1) + t[m.start():] if m else t.replace('</head>', '  <link rel="stylesheet" href="../css/shared/components.css">\n</head>', 1)
        if 'components.js' not in t:   # before the screen's own scripts, so they can use C.toast / C.open straight away
            m2 = re.search(r'\n(\s*)<script src="\.\./js/pages/', t)
            t = t[:m2.start()] + '\n%s<script src="../js/shared/components.js"></script>' % m2.group(1) + t[m2.start():] if m2 else t.replace('</body>', '  <script src="../js/shared/components.js"></script>\n</body>', 1)
        tv = next((p['variant'] for p in picks if p['id'] == 'snackbar'), None)
        if tv:
            t = re.sub(r'<body(?![^>]*data-c-toast)', '<body data-c-toast="%s"' % tv, t, 1); t = re.sub(r'data-c-toast="%s"' % SRE, 'data-c-toast="%s"' % tv, t)
        # icon font: add the names the snippets use to an existing Material Symbols subset
        m = re.search(r'(family=Material\+Symbols\+(?:Rounded|Outlined|Sharp)[^"]*icon_names=)([a-z0-9_,]+)', t)
        here = icons_needed | set(re.findall(r'class="c-ico[^"]*">([a-z0-9_]+)<', t))   # plus icons already written into this screen's components
        if m and here - set(m.group(2).split(',')):
            names = sorted(set(m.group(2).split(',')) | here); t = t.replace(m.group(0), m.group(1) + ','.join(names))
        if t != o:
            open(s, 'w').write(t); linked += 1
    print('Installed %d component(s): %s' % (len(picks), ', '.join('%s (%s)' % (by[p['id']]['name'], SNAME[p['variant']]) for p in picks)))
    print('  css/shared/components.css (%d files), js/shared/components.js (%d files), components.json, COMPONENTS.md, DESIGN.md "Components"' % (len(css_files), len(js_files)))
    print('  linked in %d screen(s)' % linked)
    if icons_needed:
        print('  icons used by these snippets: %s (added to Material Symbols subsets where a screen has one; otherwise load them, e.g. with dd-icons-kamil)' % ', '.join(sorted(icons_needed)))


def swap(a):
    root = os.path.abspath(a.project); jp = os.path.join(root, 'components.json')
    if not os.path.exists(jp):
        sys.exit('No components.json: install components first.')
    picks = json.load(open(jp))['picks']
    frm = next((p['variant'] for p in picks if p['id'] == a.component), None)
    M = manifest(); comp = next(c for c in M['components'] if c['id'] == a.component)
    base = lambda v: comp['variants'][v].get('base', v)
    if not any(p['id'] == a.component for p in picks):
        picks.append({'id': a.component, 'variant': a.to})
    for p in picks:
        if p['id'] == a.component: p['variant'] = a.to
    n = 0
    for s in screens(root, a.pages):
        t = read(s); o = t
        for rc in ROOT_CLASS.get(a.component, []):
            t = re.sub(r'\b%s--%s\b' % (re.escape(rc), SRE), '%s--%s' % (rc, a.to), t)
        if t != o: open(s, 'w').write(t); n += 1
    install(a, picks)
    print('Swapped %s to %s in %d screen(s).' % (a.component, SNAME[a.to], n))
    if frm and base(frm) != base(a.to):
        print('Look at it: the %s and %s versions use different markup; rebuild it from the snippet in COMPONENTS.md.' % (SNAME[frm], SNAME[a.to]))
    if a.component in MARKUP_DIFFERS:
        print('Look at it: ' + MARKUP_DIFFERS[a.component])


def check(a):
    root = os.path.abspath(a.project); jp = os.path.join(root, 'components.json')
    picks = json.load(open(jp))['picks'] if os.path.exists(jp) else []
    have = {p['id']: p['variant'] for p in picks}; errs, warns, notes = [], [], []
    used = {}
    for s in screens(root, a.pages):
        t = read(s); rel = os.path.relpath(s, root)
        if picks and ('components.css' not in t or 'components.js' not in t):
            errs.append('%s: components.css / components.js not linked (run install again)' % rel)
        for cid, rcs in ROOT_CLASS.items():
            for rc in rcs:
                for v in set(re.findall(r'\b%s--%s\b' % (re.escape(rc), SRE), t)):
                    used.setdefault(cid, {}).setdefault(v, []).append(rel)
        if 'C.toast(' in t: used.setdefault('snackbar', {}).setdefault(have.get('snackbar', 'md'), []).append(rel)
    # components built by the prototype's own scripts (js/**/*.js, not the generated components.js)
    for jsf in glob.glob(os.path.join(root, 'js', '**', '*.js'), recursive=True):
        if os.path.basename(jsf) == 'components.js' or '/shell/' in jsf:
            continue
        t = read(jsf)
        for cid, rcs in ROOT_CLASS.items():
            for rc in rcs:
                for v in set(re.findall(r'\b%s--%s\b' % (re.escape(rc), SRE), t)):
                    used.setdefault(cid, {}).setdefault(v, []).append(os.path.relpath(jsf, root))
        if 'C.toast(' in t: used.setdefault('snackbar', {}).setdefault(have.get('snackbar', 'md'), []).append(os.path.relpath(jsf, root))
    for cid, vs in used.items():
        if cid not in have:
            errs.append('%s is used in %s but not installed' % (cid, ', '.join(sorted({x for l in vs.values() for x in l}))))
        elif have[cid] not in vs:
            warns.append('%s is installed as %s but the screens use %s' % (cid, have[cid], '/'.join(vs)))
        if len(vs) > 1:
            warns.append('%s mixes styles across screens (%s): pick one so the app feels consistent' % (cid, '; '.join('%s: %s' % (k, ', '.join(sorted(set(l)))) for k, l in vs.items())))
    for cid in have:
        if cid not in used: notes.append('%s is installed but no screen uses it yet' % cid)
    for n in notes: print('note:   ', n)
    for w in warns: print('warning:', w)
    for e in errs: print('ERROR:  ', e)
    print('\n%d error(s), %d warning(s).' % (len(errs), len(warns)))
    return 1 if errs else 0


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sub = ap.add_subparsers(dest='cmd', required=True)
g = sub.add_parser('gallery'); g.add_argument('--out', required=True); g.add_argument('--project'); g.add_argument('--app'); g.add_argument('--accent', default='#6750a4')
i = sub.add_parser('install'); i.add_argument('--project', required=True); i.add_argument('--pick', required=True); i.add_argument('--pages', default='pages')
w = sub.add_parser('swap'); w.add_argument('--project', required=True); w.add_argument('--component', required=True, choices=list(ROOT_CLASS)); w.add_argument('--to', required=True, choices=list(STYLES)); w.add_argument('--pages', default='pages')
k = sub.add_parser('check'); k.add_argument('--project', required=True); k.add_argument('--pages', default='pages')
a = ap.parse_args()
sys.exit({'gallery': gallery, 'install': install, 'swap': swap, 'check': check}[a.cmd](a) or 0)
