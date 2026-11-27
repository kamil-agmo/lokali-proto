#!/usr/bin/env python3
"""Add Designer mode to a project that has a presenter shell (dd-presenter-david).

  python3 install_designer.py --project ./my-prototype          # install (safe to run again)
  python3 install_designer.py --project ./my-prototype --check  # only check it is wired

What it does:
  * copies Sebastian's engine (dd-figma-components-sebastian) to js/shell/figma/ with a one-line nodeOf hook, the fonts
    it draws text with (js/shell/figma/fonts/), and js/shell/figma-bridge.js (our pages → his engine), js/shell/designer.js, css/shell/designer.css; retires the old SVG export and Figma plugin
  * patches index.html: the stylesheet, the two scripts after the shell's, and the icons it uses (palette, content_copy,
    dashboard) in the Material Symbols link
  * refreshes the prototype's credits (Designer mode joins them)
A file that already exists and differs from the skill's is kept unless --force.
"""
import argparse, glob, json, os, re, shutil, subprocess, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, '..', 'assets')
FILES = [('js/figma-bridge.js', 'js/shell/figma-bridge.js'), ('js/designer.js', 'js/shell/designer.js'), ('css/designer.css', 'css/shell/designer.css')]
# Designer mode before 1.2 had its own SVG export and a Figma plugin; the ⌘V paste replaces both. Moved to the Trash on install.
RETIRED = ['js/shell/figma-export.js', 'figma-plugin']
ICONS = ['content_copy', 'dashboard', 'palette']
# Sebastian's engine (dd-figma-components-sebastian), copied from his skill next to this one. One small hook is added to
# figma-export.js: FX.nodeOf(el) serialises a live element (his screenNode re-renders HTML, which presenter pages are not).
ENGINE = os.path.join(HERE, '..', '..', 'dd-figma-components-sebastian', 'engine')
ENGINE_FILES = ['figma-assets.js', 'figma-export.js', 'figma-native.js']
HOOK_AT = 'return { payload, copy, screenNode, renderHtml, toSvg, copyText };'
HOOK = 'return { payload, copy, screenNode, renderHtml, toSvg, copyText, nodeOf: (el) => { NLH = figmaConfig().normalLineHeight; return node(el, el.getBoundingClientRect(), null); } };   // dd-designer-mode-kamil hook'

FONT = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=%s'

FONT_WEIGHTS = (400, 500, 600, 700)


def project_fonts(root):
    """Inter (the stand-in for system-ui / SF Pro) plus every Google Font the project loads (not icon fonts)."""
    fams = ['Inter']
    for f in glob.glob(os.path.join(root, '**', '*.html'), recursive=True) + glob.glob(os.path.join(root, '**', '*.css'), recursive=True):
        if '/js/shell/figma/' in f:
            continue
        for m in re.finditer(r'fonts\.googleapis\.com/css2?\?([^"\')\s>]+)', open(f, encoding='utf-8', errors='ignore').read()):
            for fam in re.findall(r'family=([^&:]+)', m.group(1).replace('&amp;', '&')):
                fam = urllib.parse.unquote_plus(fam).strip()
                if fam and 'Symbols' not in fam and 'Icons' not in fam and fam not in fams:
                    fams.append(fam)
    return fams


def get_fonts(root):
    """Static TrueType files for the Figma engine: it draws text with them (glyphs), so the paste shows exact text.
    Google Fonts' CSS API returns static .ttf links to clients that are not browsers. Saved in js/shell/figma/fonts/."""
    out_dir = os.path.join(root, 'js/shell/figma/fonts'); os.makedirs(out_dir, exist_ok=True)
    have, faces = [], []
    for fam in project_fonts(root):
        q = urllib.parse.quote_plus(fam)
        css = None
        for url in ('https://fonts.googleapis.com/css2?family=%s:wght@%s' % (q, ';'.join(map(str, FONT_WEIGHTS))), 'https://fonts.googleapis.com/css2?family=%s' % q):
            try:
                css = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'curl/8'}), timeout=20).read().decode()
                break
            except Exception:
                continue
        if not css:
            print('Font %s: not on Google Fonts or no network; Figma lays its text out itself (it must have the font)' % fam); continue
        for block in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
            w = re.search(r'font-weight:\s*(\d+)', block); u = re.search(r'url\((https://[^)]+\.ttf)\)', block)
            if not u or 'italic' in block:
                continue
            w = int(w.group(1)) if w else 400
            name = '%s-%d.ttf' % (re.sub(r'[^A-Za-z0-9]+', '', fam), w)
            dest = os.path.join(out_dir, name)
            if not os.path.exists(dest):
                urllib.request.urlretrieve(u.group(1), dest)
            faces.append({'family': fam, 'weight': w, 'file': 'js/shell/figma/fonts/' + name})
        have.append(fam)
    json.dump(faces, open(os.path.join(out_dir, 'fonts.json'), 'w'), indent=1)
    print('Fonts for exact text in Figma: %s' % (', '.join(have) or 'none'))


def check(root):
    errs = []
    for _, dst in FILES:
        if not os.path.exists(os.path.join(root, dst)):
            errs.append('missing ' + dst)
    html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
    for f in ENGINE_FILES:
        if not os.path.exists(os.path.join(root, 'js/shell/figma', f)):
            errs.append('missing js/shell/figma/' + f + ' (Sebastian\'s engine)')
    if not os.path.exists(os.path.join(root, 'js/shell/figma/fonts/fonts.json')):
        errs.append('missing js/shell/figma/fonts/fonts.json (fonts for exact text: run the installer again)')
    if 'js/shell/figma-export.js' in html:
        errs.append('index.html still loads the retired js/shell/figma-export.js: run the installer again')
    for need in ('css/shell/designer.css', 'js/shell/figma/figma-native.js', 'js/shell/figma-bridge.js', 'js/shell/designer.js'):
        if need not in html:
            errs.append('index.html does not load ' + need)
    if html.find('figma-bridge.js') > html.find('designer.js'):
        errs.append('index.html: figma-bridge.js must load before designer.js')
    if 'class="side__top"' not in html:
        errs.append('index.html has no add-on row (class="side__top") in the right card: update the presenter shell')
    icons = re.search(r'icon_names=([a-z0-9_,]+)', html)
    missing = [i for i in ICONS if not icons or i not in icons.group(1).split(',')]
    if missing:
        errs.append('icons missing from the Material Symbols link: ' + ', '.join(missing))
    return errs


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--check', action='store_true', help='only check the wiring')
    ap.add_argument('--force', action='store_true', help='replace files that differ from the skill\'s')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    index = os.path.join(root, 'index.html')
    if not os.path.exists(index) or 'id="screen"' not in open(index, encoding='utf-8').read():
        sys.exit('No presenter shell in %s (index.html with #screen). Set it up first with dd-presenter-david.' % root)
    if a.check:
        errs = check(root)
        print('\n'.join('ERROR: ' + e for e in errs) if errs else 'Designer mode is wired.')
        sys.exit(1 if errs else 0)

    for src, dst in FILES:
        s, d = os.path.join(A, src), os.path.join(root, dst)
        if os.path.exists(d) and not a.force and open(s, 'rb').read() != open(d, 'rb').read():
            print('Kept your own %s (differs from the skill\'s; --force replaces it)' % dst); continue
        os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(s, d)
    if not os.path.isdir(ENGINE):
        sys.exit('Designer mode needs dd-figma-components-sebastian installed next to it (its engine makes the Figma paste).')
    os.makedirs(os.path.join(root, 'js/shell/figma'), exist_ok=True)
    for f in ENGINE_FILES:
        t = open(os.path.join(ENGINE, f), encoding='utf-8').read()
        if f == 'figma-export.js':
            if HOOK_AT not in t:
                sys.exit('dd-figma-components-sebastian changed: could not add the nodeOf hook to figma-export.js.')
            t = t.replace(HOOK_AT, HOOK)
        open(os.path.join(root, 'js/shell/figma', f), 'w', encoding='utf-8').write(t)
    get_fonts(root)
    html = open(index, encoding='utf-8').read()
    eng = ''.join('  <script src="js/shell/figma/%s"></script>\n' % f for f in ENGINE_FILES) + '  <script src="js/shell/figma-bridge.js"></script>\n'
    if 'designer.js' in html and 'figma-bridge.js' not in html:   # an older install: add the engine before designer.js
        html = re.sub(r'([ \t]*<script src="js/shell/designer\.js)', lambda m: eng + m.group(1), html, count=1)
    if 'css/shell/designer.css' not in html:
        css = '  <link rel="stylesheet" href="css/shell/designer.css">\n'
        m = re.search(r'[ \t]*<link rel="stylesheet" href="css/shell/prototype\.css[^"]*">\n', html)
        html = html[:m.end()] + css + html[m.end():] if m else html.replace('</head>', css + '</head>', 1)
    if 'designer.js' not in html:
        js = eng + '  <script src="js/shell/designer.js"></script>\n'
        m = re.search(r'[ \t]*<script src="js/shell/prototype\.js[^"]*"></script>\n', html)
        if not m:
            sys.exit('Could not find <script src="js/shell/prototype.js"> in index.html.')
        html = html[:m.end()] + js + html[m.end():]
    html = re.sub(r'[ \t]*<script src="js/shell/figma-export\.js[^"]*"></script>\n', '', html)   # retired
    trash = os.path.expanduser('~/.Trash')
    for r in RETIRED:
        p = os.path.join(root, r)
        if os.path.exists(p):
            dest = os.path.join(trash, 'dd-designer-%s-%s' % (os.path.basename(root), r.replace('/', '-')))
            if os.path.exists(dest):
                dest += '-' + str(int(os.path.getmtime(p)))
            shutil.move(p, dest); print('Retired %s (moved to the Trash): the ⌘V paste replaces it' % r)
    def add(mm):
        return mm.group(1) + ','.join(sorted(set(mm.group(2).split(',')) | set(ICONS)))
    html, n = re.subn(r'(Material\+Symbols[^"\']*?icon_names=)([a-z0-9_,]+)', add, html, count=1)
    if not n:
        html = html.replace('</head>', '  <link rel="stylesheet" href="%s">\n</head>' % (FONT % ','.join(ICONS)), 1)
    open(index, 'w', encoding='utf-8').write(html)
    print('Designer mode installed: Designer button in the right card, Copy this screen and Copy all screens (⌘V into Figma).')
    credits = next((c for c in (os.path.join(HERE, '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py'), os.path.join(HERE, '..', '..', 'dd-presenter-david', 'scripts', 'credits.py')) if os.path.exists(c)), '')
    if os.path.exists(credits):
        subprocess.run([sys.executable, credits, '--project', root])
    errs = check(root)
    for e in errs:
        print('ERROR: ' + e)
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
