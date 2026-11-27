#!/usr/bin/env python3
"""Copy the dd-presenter-david template into a project and fill it in from the answers to the intake questions.

  python3 scaffold.py --dest ./my-prototype --name "Acme App" --password "open-sesame" \\
      --design "Designer Name" --tag "Prototype v1" --logo ./brand/logo.svg --logo-lock ./brand/logo-white.svg \\
      --accent "#7c3aed" --replay none --tagline "Solar, simplified." --stat "14|+|years" --footer "prototype"

or put the answers in a JSON file:  python3 scaffold.py --dest ./my-prototype --answers answers.json [--strict]
(keys: name, password, design, thanks[], tag, logo, logoLock, accent, replay, introQuery, introLabel, taglines[], stats[{n,s,label}], footer,
 prefix, theme{accentStrong, lockBg, font, fontUrl, radius, pageBg}). Command-line flags win over the file.

The questions to ask the user first (never guess them): see "Step 0" in SKILL.md and references/intake.md. With --strict this script refuses to
run until every one of them has an answer, and tells you which are missing.

Rules it enforces: the lock password must be given by the user (or --password-later); the logo files must exist; the accent
must be a CSS colour. Existing files are never overwritten unless --force (so it is safe in a folder that already has screens), which also means
a shell.config.js that already exists keeps its old values: edit it or pass --force.

Placeholders are filled safely for where they sit: {{NAME_HTML}} is HTML-escaped; every *_JS placeholder is written as a JavaScript literal
(quotes and backslashes are fine); {{PREFIX}} is a lowercase slug.
"""
import argparse, html, json, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, '..', 'assets', 'template')
TEXT_EXT = ('.html', '.js', '.css', '.svg', '.json', '.webmanifest')
IMG_EXT = ('.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif')
COLOUR = re.compile(r'^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(rgb|rgba|hsl|hsla|oklch|oklab|color)\([^)]+\))$')
PLACEHOLDER_LOCK = ('Your product,', 'Tap around.')
# Design systems the intake offers. Key points go into DESIGN.md so the screens are built to them (details: references/design-systems.md).
SYSTEMS = {
    'material': ('Google Material Design 3', 'https://m3.material.io', [
        'Dynamic colour: roles (primary, secondary, tertiary, surface, on-*) generated from one seed colour; light and dark schemes',
        'Shape: rounded corners on a scale (4, 8, 12, 16, 28 px); FABs and cards are soft and elevated by tone, not heavy shadows',
        'Type: Roboto / Roboto Flex; display, headline, title, body, label roles',
        'Layout: 4 dp grid, 8 dp spacing steps; bottom navigation bar (3-5 items) and top app bar',
        'Motion: emphasised easing, container transforms; ripple on press',
        'Icons: Material Symbols (pairs with dd-icons-kamil, Material)']),
    'hig': ('Apple Human Interface Guidelines (iOS)', 'https://developer.apple.com/design/human-interface-guidelines', [
        'Clarity, deference, depth: content first, translucent bars (materials/blur), little decoration',
        'Type: SF Pro (on the web: -apple-system / system-ui); Dynamic Type sizes, large titles that collapse on scroll',
        'Layout: safe areas, 44 x 44 pt minimum tap targets, 16 pt margins; tab bar (2-5 items) at the bottom, navigation bar at the top',
        'Colour: system colours with one tint colour; grouped lists on a light grey background; full dark mode',
        'Controls: sheets, segmented controls, switches, swipe actions; spring animations',
        'Icons: SF Symbols are not allowed on the web: use Phosphor or Bootstrap Icons via dd-icons-kamil']),
    'fluent': ('Microsoft Fluent 2', 'https://fluent2.microsoft.design', [
        'Calm and functional: neutral greys, one brand colour ramp (10-160 steps), subtle acrylic/mica materials',
        'Type: Segoe UI (on the web: "Segoe UI", system-ui); type ramp from caption to display',
        'Layout: 4 px base grid; corner radius 4-8 px; clear focus rings for keyboard use',
        'Elevation: soft layered shadows (2, 4, 8, 16, 28, 64)',
        'Motion: quick, direct, decelerate easing',
        'Icons: Fluent UI System Icons (regular / filled pairs)']),
    'carbon': ('IBM Carbon', 'https://carbondesignsystem.com', [
        'Productive and data-dense: square corners, flat surfaces, strong grid',
        'Type: IBM Plex Sans; productive and expressive type sets',
        'Layout: 2x grid, 8 px spacing scale, 16-column grid on desktop',
        'Colour: themes White, Gray 10, Gray 90, Gray 100 with blue 60 as the interactive colour',
        'Icons: Carbon icons, 16/20/24/32 px']),
    'custom': ('Custom / brand guidelines', None, ['Follow the brand guidelines the user supplies; record their colours, type, radius and spacing here']),
}


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:20] or 'proto'


def js(v):
    """A JavaScript literal for v that can never close a <script> tag."""
    return json.dumps(v, ensure_ascii=False).replace('</', '<\\/')


def parse_stat(s):
    p = s.split('|')
    if len(p) != 3 or not re.match(r'^-?\d+(\.\d+)?$', p[0].strip()):
        sys.exit('--stat must look like "14|+|years" (number | suffix | label), got: %s' % s)
    n = float(p[0]); n = int(n) if n == int(n) else n
    return {'n': n, 's': p[1], 'label': p[2]}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dest', required=True, help='project folder (created if missing)')
    ap.add_argument('--answers', help='JSON file with the intake answers (flags override it)')
    ap.add_argument('--strict', action='store_true', help='refuse to run until every intake question has an answer')
    ap.add_argument('--name'); ap.add_argument('--password', help='lock screen password (checked in the browser: a soft gate)')
    ap.add_argument('--design', help='who designed this prototype: the credits start with "Design by <name>" ("" to leave it out)')
    ap.add_argument('--thanks', action='append', default=[], help='someone else to thank; repeat. Shown as "Thanks to ..." unless already credited')
    ap.add_argument('--no-credits', action='store_true', help='leave the Credits button out')
    ap.add_argument('--password-later', action='store_true', help='no password yet: the lock screen is skipped until it is set (ask after the first successful deploy)')
    ap.add_argument('--tag', help='subtitle under the logo in the left card ("" for none)')
    ap.add_argument('--logo', help='logo file for the left card, or "none" to show the name as text')
    ap.add_argument('--logo-lock', help='logo for the lock screen\'s dark background (a light/white version), or "none" to reuse --logo')
    ap.add_argument('--accent', help='the prototype\'s brand colour (a CSS colour): highlights and the lock screen tint come from it')
    ap.add_argument('--replay', choices=['none', 'intro', 'restart'], help='none: no Replay button (the prototype has no intro); intro: replay the intro; restart: restart from the first screen')
    ap.add_argument('--intro-query', help='query string the first screen watches to play its intro (default ?intro)')
    ap.add_argument('--intro-label', help='label of the Replay button (default "Replay intro")')
    ap.add_argument('--tagline', action='append', help='a rotating lock screen line (repeat; "<br>" breaks a line)')
    ap.add_argument('--stat', action='append', help='a lock screen counter "number|suffix|label" (repeat up to 3; use --no-stats for none)')
    ap.add_argument('--no-stats', action='store_true')
    ap.add_argument('--footer', help='lock screen footer: shown as "<name> · <footer>" ("" for none)')
    ap.add_argument('--design-system', help='material | hig | fluent | carbon | custom | none: written to DESIGN.md with its key points so the screens follow it')
    ap.add_argument('--color', action='append', help='a theme colour "role|#hex" (repeat), e.g. "primary|#7c3aed" "secondary|#ec4899" "background|#ffffff"; written to DESIGN.md')
    ap.add_argument('--color-mode', choices=['light', 'dark', 'both'], help='light, dark or both (written to DESIGN.md)')
    ap.add_argument('--prefix', help='short storage and message prefix (default: a slug of the name)')
    for k in ('accent-strong', 'lock-bg', 'font', 'font-url', 'page-bg'):
        ap.add_argument('--' + k, help='optional theme: ' + k)
    ap.add_argument('--radius', type=float, help='optional theme: corner radius (px) of the side cards')
    ap.add_argument('--force', action='store_true', help='overwrite files that already exist')
    a = ap.parse_args()

    ans = {}
    if a.answers:
        try:
            ans = json.load(open(a.answers, encoding='utf-8'))
        except Exception as e:
            sys.exit('Could not read %s: %s' % (a.answers, e))
    theme_in = ans.get('theme', {}) or {}

    def pick(flag, key, default=None):
        v = getattr(a, flag)
        return v if v is not None else ans.get(key, default)

    name = pick('name', 'name'); password = pick('password', 'password'); design = pick('design', 'design')
    tag = pick('tag', 'tag'); logo = pick('logo', 'logo'); logo_lock = pick('logo_lock', 'logoLock'); accent = pick('accent', 'accent')
    replay = pick('replay', 'replay'); intro_q = pick('intro_query', 'introQuery', '?intro'); intro_l = pick('intro_label', 'introLabel', 'Replay intro')
    taglines = a.tagline if a.tagline else ans.get('taglines')
    stats = ([parse_stat(s) for s in a.stat] if a.stat else ([] if a.no_stats else ans.get('stats')))
    footer = pick('footer', 'footer')
    prefix = slug(pick('prefix', 'prefix') or name or '')
    th = {'accentStrong': a.accent_strong or theme_in.get('accentStrong'), 'lockBg': a.lock_bg or theme_in.get('lockBg'), 'font': a.font or theme_in.get('font'),
          'fontUrl': a.font_url or theme_in.get('fontUrl'), 'radius': a.radius if a.radius is not None else theme_in.get('radius'), 'pageBg': a.page_bg or theme_in.get('pageBg')}

    # ---- what we must have, and what we must not guess
    problems = []
    if not name:
        problems.append('name: the product name')
    later = a.password_later or ans.get('passwordLater') is True
    if later:
        password = password or None
    if not password and not later:
        problems.append('password: the lock screen password (ask the user; do not invent one), or --password-later to set it after deploying')
    if a.strict:
        if design is None and not a.no_credits:
            problems.append('design: who designed this prototype? (for the credits; pass --design "" to leave it out)')
        if tag is None:
            problems.append('tag: the subtitle under the logo (pass "" for none)')
        if logo is None:
            problems.append('logo: a logo file for the left card, or "none"')
        if accent is None:
            problems.append('accent: the prototype\'s brand colour (run suggest_theme.py to propose one)')
        if replay is None:
            problems.append('replay: does the prototype have an intro? none / intro / restart')
        if not taglines:
            problems.append('taglines: at least one line for the lock screen')
        if stats is None:
            problems.append('stats: up to three lock screen counters, or --no-stats')
        if footer is None:
            problems.append('footer: the lock screen footer text (pass "" for none)')
    if accent and not COLOUR.match(accent.strip()):
        problems.append('accent: "%s" is not a CSS colour (use #rrggbb, rgb(), hsl() ...)' % accent)
    for label, p in (('logo', logo), ('logo-lock', logo_lock)):
        if p and p.lower() != 'none':
            if not os.path.isfile(p):
                problems.append('%s: file not found: %s' % (label, p))
            elif not p.lower().endswith(IMG_EXT):
                problems.append('%s: use an SVG, PNG, JPG, WebP or GIF file' % label)
    if stats and len(stats) > 3:
        problems.append('stats: at most three counters fit on the lock screen')
    dsys = pick('design_system', 'designSystem'); colors = a.color or ans.get('colors') or []; cmode = pick('color_mode', 'colorMode')
    if a.strict and dsys is None:
        problems.append('designSystem: which design guidelines the screens follow (material / hig / fluent / carbon / custom / none)')
    if dsys and dsys not in SYSTEMS and dsys != 'none':
        problems.append('designSystem: use material, hig, fluent, carbon, custom or none')
    for c in colors:
        if '|' not in c or not COLOUR.match(c.split('|', 1)[1].strip()):
            problems.append('color: "%s" must look like "primary|#7c3aed"' % c)
    if problems:
        print('Cannot scaffold yet. Missing or wrong answers:', file=sys.stderr)
        for p in problems:
            print('  - ' + p, file=sys.stderr)
        return 2

    # ---- derived values
    notes = []
    if not accent:
        accent = '#2563eb'; notes.append('no accent given: using the neutral blue. Pass the prototype\'s brand colour with --accent.')
    taglines = taglines or ['Your product,<br>in one place.', 'Tap around.<br>Nothing is real.', 'Built to be reviewed.']
    if taglines and taglines[0].startswith(PLACEHOLDER_LOCK):
        notes.append('the lock screen text is still the template\'s placeholder: ask the user what it should say.')
    if stats is None:
        stats = [{'n': 12, 's': '+', 'label': 'screens'}, {'n': 3, 's': '', 'label': 'flows'}, {'n': 100, 's': '%', 'label': 'clickable'}]
    footer = 'prototype' if footer is None else footer
    tag = 'Prototype v1' if tag is None else tag
    if replay in (None, 'none'):
        replay_js = js(None)
        if replay is None:
            notes.append('no replay answer: the Replay button is hidden. Pass --replay intro if the prototype has an intro.')
    elif replay == 'intro':
        replay_js = js({'label': intro_l, 'page': 'home', 'query': intro_q})
    else:
        replay_js = js({'label': 'Restart from Home', 'page': 'home', 'query': ''})

    dest = a.dest
    os.makedirs(os.path.join(dest, 'assets'), exist_ok=True)
    def bring(path):
        if not path or path.lower() == 'none':
            return None
        rel = 'assets/' + os.path.basename(path)
        shutil.copy2(path, os.path.join(dest, rel))
        return rel
    logo_rel = bring(logo); lock_rel = bring(logo_lock)

    extra = []
    for k in ('accentStrong', 'lockBg', 'font', 'fontUrl', 'radius', 'pageBg'):
        if th[k] is not None and th[k] != '':
            extra.append('    %s: %s,\n' % (k, js(th[k])))
    sub = {
        '{{NAME_HTML}}': html.escape(name), '{{NAME_JS}}': js(name), '{{PASSWORD_JS}}': js(password), '{{PREFIX}}': prefix, '{{APPEARANCE_JS}}': 'true' if cmode == 'both' else 'false',
        '{{TAG_JS}}': js(tag), '{{LOGO_JS}}': js(logo_rel), '{{LOGO_LOCK_JS}}': js(lock_rel), '{{ACCENT_JS}}': js(accent.strip()),
        '{{REPLAY_JS}}': replay_js, '{{TAGLINES_JS}}': js(taglines), '{{STATS_JS}}': js(stats), '{{FOOTER_JS}}': js(footer),
        '{{THEME_EXTRA_JS}}': ''.join(extra),
        '{{CREDITS_JS}}': 'null' if a.no_credits else '{\n    design: %s,\n    made: [],                         // filled by scripts/credits.py from the kit skills in use\n    thanks: %s\n  }' % (js(design or ''), js(a.thanks or ans.get('thanks') or [])),
    }
    created, kept = [], []
    for root, _, files in os.walk(TEMPLATE):
        for f in files:
            src = os.path.join(root, f)
            rel = os.path.relpath(src, TEMPLATE)
            out = os.path.join(dest, rel)
            if os.path.exists(out) and not a.force:
                kept.append(rel)
                continue
            os.makedirs(os.path.dirname(out), exist_ok=True)
            if f.endswith(TEXT_EXT):
                text = open(src, encoding='utf-8').read()
                for k, v in sub.items():
                    text = text.replace(k, v)
                open(out, 'w', encoding='utf-8').write(text)
            else:
                shutil.copy2(src, out)
            created.append(rel)

    if dsys or colors:
        dpath = os.path.join(dest, 'DESIGN.md')
        if os.path.exists(dpath) and not a.force:
            kept.append('DESIGN.md')
        else:
            lines = ['# %s: design brief' % name, '', 'Build every screen to this brief. Written by the presenter intake; edit freely.', '']
            if dsys and dsys != 'none':
                t, url, pts = SYSTEMS[dsys]
                lines += ['## Design system: %s' % t] + (['', url] if url else []) + [''] + ['- ' + x for x in pts] + ['']
            if colors or cmode:
                lines += ['## Colour theme', ''] + (['Mode: **%s**' % cmode, ''] if cmode else [])
                lines += ['| Role | Colour |', '|---|---|'] + ['| %s | `%s` |' % tuple(x.strip() for x in c.split('|', 1)) for c in colors]
                lines += ['', 'Define these as custom properties on `:root` (for example `--color-primary`) so dev mode (dd-dev-mode-kamil) shows them as token chips.', '']
            open(dpath, 'w', encoding='utf-8').write('\n'.join(lines))
            created.append('DESIGN.md')
    print('Created %d files in %s (prefix "%s")' % (len(created), dest, prefix))
    for r in sorted(created):
        print('  +', r)
    for r in sorted(kept):
        print('  = kept existing', r)
    if 'shell.config.js' in kept:
        print('\nNOTE: shell.config.js already existed, so your answers were NOT written to it. Edit it by hand, or run again with --force.')
    if logo_rel:
        print('\nLogo: %s%s. In the left card it shows with the subtitle underneath; on the lock screen it sits on a dark background, so give --logo-lock a light version if the logo is dark.' % (logo_rel, ' + lock logo ' + lock_rel if lock_rel else ''))
    for n in notes:
        print('NOTE: ' + n)
    print('\nNext:')
    print('  1. Edit shell.config.js: pages, tree, startPage (the answers above are already in it).')
    print('  2. Every screen needs, in <head>:  <script src="../shell.config.js"></script> then <script src="../js/shared/lock-guard.js"></script>')
    print('     and before </body>:            <script src="../js/shared/embed.js"></script> then ProtoEmbed.report("<page-id>", [...]).')
    print('  3. Check the wiring:  python3 %s --project %s' % (os.path.join(HERE, 'check.py'), dest))
    print('  4. Serve over http and open index.html:  cd %s && python3 -m http.server 8000' % dest)

    if not a.no_credits:
        subprocess.run([sys.executable, os.path.join(HERE, 'credits.py'), '--project', dest])
    print('\nAdd-ons (each its own skill, run when wanted): dd-dev-mode-kamil (inspector and exports for developers), dd-designer-mode-kamil (copy screens into Figma).')
    if later:
        print('\nPASSWORD NOT SET YET: the lock screen is skipped. After the first successful deploy, ask the user for it, set `password` in shell.config.js, and deploy again.')
    print('\nNext: set up the icons now with the dd-icons-kamil skill (library, style, size), so every screen is built with real icons from the start.')
    print('\nThe password sits in plain text in shell.config.js: it is a soft gate, not security.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
