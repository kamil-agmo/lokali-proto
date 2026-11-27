#!/usr/bin/env python3
"""Add the design system to a dd-presenter-david prototype: rulebook, Design System button and panel, Rules check, approved
exceptions and Download design skill. Safe to run again: it replaces its own parts and keeps an existing design-system.config.js.

  install_ds.py --project <dir> --preset apple|material|fluent|carbon|ant [--show everyone|dev]
                [--tap 44] [--tap-desktop 24] [--theme "..."] [--new-config] [--dry-run]

Needs the presenter shell with dev mode (index.html with id="devmode"). Prints what it changed.
"""
import argparse, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ASSETS = os.path.join(HERE, '..', 'assets')
BEGIN, END = '<!-- dd-design-system-kamil:begin -->', '<!-- dd-design-system-kamil:end -->'


def read(p):
    try: return open(p, encoding='utf-8').read()
    except OSError: return ''


def js(v): return json.dumps(v, ensure_ascii=False)


def start_page(root):
    cfg = read(os.path.join(root, 'shell.config.js'))
    sid = (re.search(r"startPage\s*:\s*['\"]([\w-]+)['\"]", cfg) or [None, None])[1]
    for m in re.finditer(r"['\"]?([\w-]+)['\"]?\s*:\s*\{[^{}]*?src\s*:\s*['\"]([^'\"]+)['\"]", cfg):
        if sid is None or m.group(1) == sid: return os.path.join(root, m.group(2))
    pages = sorted(f for f in os.listdir(os.path.join(root, 'pages')) if f.endswith('.html') and f != 'lock.html')
    return os.path.join(root, 'pages', pages[0]) if pages else None


def app_styles(page):
    """the <link rel=stylesheet> lines of the start screen, minus the phone-frame helper"""
    links = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>', read(page)) if page else []
    return [l for l in links if 'phone.css' not in l]


def colour_tokens(root, links):
    css = ''
    for l in reversed(links):   # the app's own stylesheet comes last on a screen: read it first, so its tokens lead the list
        href = (re.search(r'href=["\']([^"\']+)', l) or [None, None])[1]
        if href and not href.startswith('http'): css += read(os.path.normpath(os.path.join(root, 'pages', href)))
    css = re.sub(r'/\*[\s\S]*?\*/', '', css)
    root_blocks = ''.join(m.group(1) for m in re.finditer(r'(?:^|\})\s*:root\s*\{([^}]*)\}', css))
    out, seen = [], set()
    for name, val in re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', root_blocks):
        if name in seen or not re.search(r'#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch', val) or re.search(r'\dpx', val): continue   # colours only, no shadows
        if name.startswith('--c-') and any(not n.startswith('--c-') for n, _ in out): continue   # dd-components-kamil' own aliases: the app's tokens are enough
        seen.add(name); out.append([name, name[2:].replace('-', ' ').capitalize()])
    dark = bool(re.search(r'html\.dark|prefers-color-scheme:\s*dark|data-theme=["\']?dark', css))
    return out[:14], dark


def write_config(root, preset, a, links):
    P = json.load(open(os.path.join(HERE, 'presets.json')))[preset]
    colours, dark = colour_tokens(root, links)
    accent = (re.search(r"accent\s*:\s*['\"](#[0-9a-fA-F]{3,8})", read(os.path.join(root, 'shell.config.js'))) or [None, None])[1]
    theme = a.theme or ('Light and dark mode' if dark else 'Light mode') + ('. Brand colour ' + accent if accent else '')
    lines = [
        '/* The design system for this prototype: the one place the rules live (dd-design-system-kamil).',
        '   The Design System button shows it, dev mode\'s Rules check outlines where a screen differs from it, approved exceptions',
        '   record where it is bent on purpose, and dev mode\'s Download design skill turns it into a SKILL.md for building the real app.',
        '   Edit freely; everything updates together. Numbers are CSS px. Started from: ' + P['label'] + ' */',
        'window.DESIGN_SYSTEM = {',
        "  show: %s,          // who sees the Design System button: 'everyone' (presenters can read it) or 'dev' (only with dev mode on). Downloading is always dev mode only" % js(a.show),
        '  style: %s,' % js(P['style']),
        '  theme: %s,' % js(theme), '',
        '  spacing: %s,   // padding, gaps and vertical margins may only use these' % js(P['spacing']),
        '  ignoreBelow: 3,           // the Rules check skips 1-2 px nudges (hairlines) and values above the largest step (status bar and tab bar room)',
        "  radius: %s,   // corner rounding; 'full' = pills and circles" % js(P['radius']),
        '  fontSizes: %s,' % js(P['fontSizes']),
        '  fontWeights: %s,' % js(P['fontWeights']),
        '  minTap: %d,               // smallest tap AREA on phone screens (the visible control may be smaller)' % (a.tap or P['minTap']),
        '  minTapDesktop: %d,        // smallest click area on desktop (admin) screens, used by mouse' % (a.tap_desktop or P['minTapDesktop']),
        '  colors: [                 // the theme colour tokens shown on the Design System page; rename the labels to what each one is for',
        ',\n'.join('    ' + js(c) for c in colours) or '    // ["--brand", "Brand"]',
        '  ],', '',
        '  must: [', ',\n'.join('    ' + js(t) for t in P['must']), '  ],',
        '  cannot: [', ',\n'.join('    ' + js(t) for t in P['cannot']), '  ],', '',
        '  // Approved exceptions: places where a rule is bent on purpose. The Rules check shows them in dashed blue with the reason,',
        '  // the Design System page lists them, and the downloaded skill tells developers not to "fix" them.',
        '  // where = a CSS selector on the screens · rule = spacing | radius | fontSize | fontWeight | tap | pureBlack · reason = why',
        '  // For a one-off, add data-rule-ok="reason" to the element in the screen\'s HTML instead.',
        '  exceptions: [', '  ],', '',
        '  // what the Rules check looks at (true = checked)',
        '  check: { spacing: true, radius: true, fontSize: true, fontWeight: true, tap: true, pureBlack: true }',
        '};', '']
    return '\n'.join(lines), colours


def sort_icons(html, add):
    def fix(m):
        names = sorted(set(m.group(2).split(',')) | set(add)); return m.group(1) + ','.join(names)
    return re.sub(r'(family=Material\+Symbols\+Outlined[^"]*?icon_names=)([a-z0-9_,]+)', fix, html, count=1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True); ap.add_argument('--preset', required=True, choices=['apple', 'material', 'fluent', 'carbon', 'ant'])
    ap.add_argument('--show', default='everyone', choices=['everyone', 'dev']); ap.add_argument('--tap', type=int); ap.add_argument('--tap-desktop', type=int)
    ap.add_argument('--theme'); ap.add_argument('--new-config', action='store_true'); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args(); root = os.path.abspath(a.project); done = []
    J = lambda *p: os.path.join(root, *p)
    index = read(J('index.html'))
    if not index or 'id="devmode"' not in index:
        sys.exit('No presenter shell with dev mode here (index.html with id="devmode"). Run dd-presenter-david, then dd-dev-mode-kamil, first.')
    if os.path.exists(J('ui-standard.config.js')) or 'ui-check.js' in index:
        sys.exit('This project has the earlier OTW test version (ui-standard.config.js / ui-check.js). Ask the user before upgrading it; do not mix the two.')

    page = start_page(root); links = app_styles(page)
    def put(path, text, what):
        done.append(what)
        if not a.dry_run:
            os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'w', encoding='utf-8').write(text)

    # 1. the rulebook
    if a.new_config or not os.path.exists(J('design-system.config.js')):
        cfg, colours = write_config(root, a.preset, a, links)
        put(J('design-system.config.js'), cfg, 'design-system.config.js written from the %s preset (%d colour tokens found)' % (a.preset, len(colours)))
    else:
        done.append('design-system.config.js kept as it is (use --new-config to start again)')

    # 2. scripts, page and styles
    for f in ('ds-check.js', 'ds-skill.js'):
        put(J('js', 'shell', f), read(os.path.join(ASSETS, f)), 'js/shell/' + f)
    pg = read(os.path.join(ASSETS, 'design-system.html'))
    pg = re.sub(r'(<!-- ds:app-styles[^>]*-->)[\s\S]*?(<!-- /ds:app-styles -->)', lambda m: m.group(1) + '\n  ' + '\n  '.join(links) + '\n  ' + m.group(2), pg)
    put(J('pages', 'design-system.html'), pg, 'pages/design-system.html (with the app\'s own stylesheets, so swatches use the real tokens)')
    css_path = J('css', 'shell', 'devmode.css') if os.path.exists(J('css', 'shell', 'devmode.css')) else J('css', 'shell', 'prototype.css')
    css = re.sub(r'/\* dd-design-system-kamil:begin[\s\S]*?dd-design-system-kamil:end \*/\n?', '', read(css_path)).rstrip() + '\n\n' + read(os.path.join(ASSETS, 'ds-shell.css'))
    put(css_path, css, os.path.relpath(css_path, root) + ' (Design System panel and button rows)')

    # 3. index.html: button, panel, scripts, shell icons
    html = re.sub(r'\s*' + re.escape(BEGIN) + r'[\s\S]*?' + re.escape(END), '', index)
    btn = ('%s<button id="stdbtn" class="devbtn stdbtn" type="button" title="The design system every screen follows" hidden>'
           '<span class="mi" style="font-size:16px" aria-hidden="true">rule</span><span class="devbtn__label">Design System</span></button>%s\n        ') % (BEGIN, END)
    html = re.sub(r'(<button id="devmode")', lambda m: btn + m.group(1), html, count=1)
    panel = ('  %s\n  <div id="stdpanel" class="stdpanel" hidden role="dialog" aria-modal="true" aria-labelledby="stdTitle"><div class="stdpanel__card">'
             '<div class="stdpanel__head"><h2 id="stdTitle">Design System</h2><span class="stdpanel__note">The rules every screen follows</span>'
             '<button id="stddl" class="stdpanel__btn stddl" type="button" hidden title="Download this design system as a Claude skill, for building the real app"><span class="mi" style="font-size:16px" aria-hidden="true">download</span>Download design skill</button>'
             '<button id="stdclose" class="stdpanel__btn" type="button">Close</button></div>'
             '<iframe id="stdframe" title="Design System" src="about:blank"></iframe></div></div>\n'
             '  <script src="design-system.config.js"></script>\n  <script src="js/shell/ds-check.js"></script>\n  <script src="js/shell/ds-skill.js"></script>\n  %s\n') % (BEGIN, END)
    html = html.replace('</body>', panel + '</body>', 1)
    html = sort_icons(html, ['rule', 'download'])
    put(J('index.html'), html, 'index.html: Design System button beside Dev mode, its panel, the scripts, and the rule / download icons')

    # 4. hosting: the download reads COMPONENTS.md, so it must be published
    fb = read(J('firebase.json'))
    if '"*.md"' in fb:
        put(J('firebase.json'), fb.replace('"*.md"', ', '.join('"%s"' % f for f in ('USER_STORY.md', 'IMAGE_URLS.md', 'REQUIREMENTS.md') )), 'firebase.json: COMPONENTS.md and DESIGN.md now published (the download uses them); USER_STORY / IMAGE_URLS / REQUIREMENTS still kept out')

    print(('Would change (dry run):' if a.dry_run else 'Done:') + '\n- ' + '\n- '.join(done))
    print('\nNext: open the prototype, Design System (beside Dev mode) shows the rules; turn on dev mode, then Rules outlines differences.'
          '\nTo move existing screens onto the scales: python3 %s --project %s' % (os.path.join(HERE, 'conform.py'), a.project))


if __name__ == '__main__':
    main()
