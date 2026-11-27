#!/usr/bin/env python3
"""Reference board for dd-design-references-kamil.

  make_board.py --data refs.json --out references.html                       the board (open it, pick a direction)
  make_board.py --data refs.json --pick "A,C" --note "..." --design DESIGN.md  record the pick under "## References"

refs.json: {"title", "brief", "items": [{"id", "name", "url", "image", "kind": "shipped|concept", "take", "avoid", "fits"}]}
The board is one self-contained HTML file (images load from their source; a blocked image shows the link instead).
"""
import argparse, html, json, os, re, sys, time

CSS = """
:root { --bg: #f6f5fb; --card: #fff; --ink: #17132a; --dim: #6b6880; --line: #e7e4f0; --brand: #6d3fe0; --ok: #15803d; --warn: #b45309; }
@media (prefers-color-scheme: dark) { :root { --bg: #121019; --card: #1c1928; --ink: #f2f0fa; --dim: #a7a3bb; --line: #2c2840; --brand: #b59cff; --ok: #6fdc9a; --warn: #ffbf69; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 "Hanken Grotesk", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.ms { font-family: "Material Symbols Rounded"; font-weight: normal; font-style: normal; font-size: 18px; line-height: 1; display: inline-block; vertical-align: -4px; font-feature-settings: "liga"; }
header { max-width: 1280px; margin: 0 auto; padding: 40px 24px 8px; }
.eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--brand); }
h1 { font-size: 30px; line-height: 1.2; margin: 6px 0 6px; letter-spacing: -.4px; }
.brief { color: var(--dim); margin: 0; }
.grid { max-width: 1280px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; }
.shot { position: relative; aspect-ratio: 4 / 5; background: color-mix(in srgb, var(--brand) 6%, var(--card)); display: grid; place-items: center; overflow: hidden; }
.shot img { width: 100%; height: 100%; object-fit: contain; }
.shot .none { color: var(--dim); font-size: 13px; text-align: center; padding: 16px; }
.id { position: absolute; top: 12px; left: 12px; width: 32px; height: 32px; border-radius: 50%; background: var(--brand); color: #fff; font-weight: 800; display: grid; place-items: center; }
.kind { position: absolute; top: 14px; right: 12px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--card); color: var(--dim); border: 1px solid var(--line); }
.body { padding: 16px 18px 18px; display: grid; gap: 8px; }
.name { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.name b { font-size: 17px; }
.name a { color: var(--brand); font-size: 13px; text-decoration: none; white-space: nowrap; }
.row { display: grid; grid-template-columns: 22px 1fr; gap: 6px; font-size: 14px; }
.row .ms { color: var(--dim); }
.row.take .ms { color: var(--ok); } .row.avoid .ms { color: var(--warn); }
.row small { display: block; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }
footer { max-width: 1280px; margin: 0 auto; padding: 0 24px 40px; color: var(--dim); font-size: 13px; }
"""


def esc(s):
    return html.escape(s or '')


def board(d):
    cards = []
    for it in d.get('items', []):
        img = ('<img src="%s" alt="%s screen" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'none\',textContent:\'Image blocked · open the link\'}))">' % (esc(it.get('image')), esc(it.get('name')))) if it.get('image') else '<div class="none">No image · open the link</div>'
        rows = ''.join('<div class="row %s"><span class="ms">%s</span><div><small>%s</small>%s</div></div>' % (k, icon, label, esc(it.get(k)))
                       for k, icon, label in (('take', 'check_circle', 'Take'), ('avoid', 'block', 'Avoid'), ('fits', 'target', 'Fits because')) if it.get(k))
        cards.append('<article class="card"><div class="shot">%s<span class="id">%s</span><span class="kind">%s</span></div><div class="body"><div class="name"><b>%s</b><a href="%s" target="_blank" rel="noopener">Source <span class="ms">open_in_new</span></a></div>%s</div></article>'
                     % (img, esc(it.get('id')), 'Concept' if it.get('kind') == 'concept' else 'Shipped', esc(it.get('name')), esc(it.get('url')), rows))
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>References · %s</title>'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,500,1,0&display=block">'
            '<style>%s</style></head><body><header><div class="eyebrow">Design references · %d picks</div><h1>%s</h1><p class="brief">%s</p></header>'
            '<main class="grid">%s</main><footer>References inspire the direction; nothing is copied into the prototype. Pick by letter, or mix: "layout from A, colour from B".</footer></body></html>'
            % (esc(d.get('title')), CSS, len(d.get('items', [])), esc(d.get('title')), esc(d.get('brief')), ''.join(cards)))


def record(d, pick, note, design):
    ids = [x.strip().upper() for x in pick.split(',') if x.strip()]
    items = [it for it in d.get('items', []) if (it.get('id') or '').upper() in ids]
    if not items:
        sys.exit('None of %s is on the board (ids: %s)' % (pick, ', '.join(it.get('id', '?') for it in d.get('items', []))))
    lines = ['## References', '', '**Direction:** ' + (note or 'From ' + ', '.join(it['name'] for it in items)) + '  ',
             '%s · %s' % (d.get('title', ''), time.strftime('%d %b %Y')), '']
    for it in items:
        lines.append('- **%s** (%s): take: %s; avoid: %s. %s' % (it.get('name'), 'concept' if it.get('kind') == 'concept' else 'shipped',
                                                                 it.get('take') or '-', it.get('avoid') or '-', it.get('url') or ''))
    lines += ['', 'Inspiration only: no logos, artwork or screenshots in the prototype.', '']
    block = '\n'.join(lines)
    t = open(design, encoding='utf-8').read() if os.path.exists(design) else '# Design\n'
    if re.search(r'^## References\n', t, re.M):
        t = re.sub(r'^## References\n.*?(?=^## |\Z)', block + '\n', t, count=1, flags=re.S | re.M)
    else:
        t = t.rstrip('\n') + '\n\n' + block
    open(design, 'w', encoding='utf-8').write(t)
    print('Wrote "## References" in %s (%s)' % (design, ', '.join(it['name'] for it in items)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--data', required=True)
    ap.add_argument('--out')
    ap.add_argument('--pick'); ap.add_argument('--note', default=''); ap.add_argument('--design')
    a = ap.parse_args()
    d = json.load(open(a.data, encoding='utf-8'))
    if a.pick:
        if not a.design:
            sys.exit('--pick needs --design <project>/DESIGN.md')
        record(d, a.pick, a.note, a.design); return
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.data)), 'references.html')
    open(out, 'w', encoding='utf-8').write(board(d))
    print('Board: %s (%d references)' % (out, len(d.get('items', []))))


if __name__ == '__main__':
    main()
