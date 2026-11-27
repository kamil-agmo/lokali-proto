#!/usr/bin/env python3
"""Add the side-card drawers (edge tabs, backdrop, js/shell/drawers.js) to a presenter shell made before they were built in.

  python3 install_drawers.py --project ./my-prototype

New projects from scaffold.py already have them. dd-desktop-kamil and dd-iphone-duo-kamil run this before installing, so
neither depends on the other. Safe to run again: a project that has them is left as it is.
"""
import argparse, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(HERE, '..', 'assets', 'template')
SNIP = '''  <!-- Side-card drawers (js/shell/drawers.js): add-ons (admin pages, the open iPhone Duo) show these tabs when the side cards have no room -->
  <button class="edgetab edgetab--left" id="tabNav" type="button" aria-controls="sideLeft" aria-expanded="false" hidden>Navigation</button>
  <button class="edgetab edgetab--right" id="tabSum" type="button" aria-controls="sideRight" aria-expanded="false" hidden>Summary</button>
  <div class="drawerbg" id="drawerBg" hidden></div>
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    idx = os.path.join(root, 'index.html')
    if not os.path.exists(idx) or 'id="screen"' not in open(idx, encoding='utf-8').read():
        sys.exit('No presenter shell in %s: set it up with dd-presenter-david first.' % root)
    proto = os.path.join(root, 'js', 'shell', 'prototype.js')
    if not os.path.exists(proto) or 'window.Shell' not in open(proto, encoding='utf-8').read():
        sys.exit('This shell has no add-on hooks (window.Shell): update it with dd-presenter-david first.')
    dst = os.path.join(root, 'js', 'shell', 'drawers.js')
    if not os.path.exists(dst):
        shutil.copy2(os.path.join(T, 'js', 'shell', 'drawers.js'), dst); print('copied js/shell/drawers.js')
    h = open(idx, encoding='utf-8').read()
    if 'id="tabNav"' not in h:
        m = re.search(r'\n\s*<!-- Back to lock screen|\n\s*<div id="relockgate"|\n[ \t]*<script src="js/shell/prototype\.js', h)
        h = h[:m.start()] + '\n' + SNIP.rstrip('\n') + h[m.start():] if m else h.replace('</body>', SNIP + '</body>', 1)
    for side, sid in (('left', 'sideLeft'), ('right', 'sideRight')):
        if 'id="%s"' % sid not in h:
            h = h.replace('<aside class="side side--%s"' % side, '<aside class="side side--%s" id="%s"' % (side, sid), 1)
    if 'drawers.js' not in h:
        m = re.search(r'[ \t]*<script src="js/shell/prototype\.js[^"]*"></script>\n', h)
        h = h[:m.end()] + '  <script src="js/shell/drawers.js"></script>\n' + h[m.end():]
    open(idx, 'w', encoding='utf-8').write(h)
    css = os.path.join(root, 'css', 'shell', 'prototype.css')
    c = open(css, encoding='utf-8').read()
    if '.edgetab' not in c and '.drawerbg' not in c:
        t = open(os.path.join(T, 'css', 'shell', 'prototype.css'), encoding='utf-8').read()
        c = c.rstrip('\n') + '\n\n' + t[t.index('/* side-card drawers'):]
        open(css, 'w', encoding='utf-8').write(c)
    print('Drawers ready: edge tabs, backdrop and js/shell/drawers.js.')


if __name__ == '__main__':
    main()
