#!/usr/bin/env python3
"""Build an ELI5 comic strip (one HTML page) from a short story file, so the drawn cast and the styles are never
written out again. Only the story is written per explainer.

  python3 build_strip.py story.json --out explainer.html
  python3 build_strip.py --cast            # list the characters and badges

story.json:
  {"title": "How does a pull request work?",
   "scenes": [
     {"title": "Everyone shares one copy of the code.",
      "row": ["doc:k:Live code", ">", "browser:k:What users see"],
      "cap": "This is the real thing users run. Nobody edits it directly."}, ...]}

row items, left to right (one action per scene, 2-5 items):
  "name[:colour][:label][+badge]"   a character. colour k = black (shared, neutral), r = red (yours, active). Default k.
  ">" / ">r"                        an arrow, black or red
  ["doc:r", "doc:k"]                two characters stacked; an arrow after a stack joins both into the next item (merge)
cap: one plain sentence; **word** marks the key term taught in this scene (bold red).
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, '..', 'assets', 'template.html')
WIDE = {'browser': 72, 'cloud': 72}          # symbol widths at full size (others are 48 x 56 boxes drawn 56 wide)
H, VW, VH, ARROW, GAP = 66, 340, 120, 54, 10


def cast():
    t = open(TEMPLATE, encoding='utf-8').read()
    ids = re.findall(r'<symbol id="([\w-]+)"', t)
    return [i for i in ids if not i.startswith('b-')], [i[2:] for i in ids if i.startswith('b-')]


def parse(item):
    badge = None
    if '+' in item:
        item, badge = item.split('+', 1)
    p = item.split(':', 2)
    return {'name': p[0], 'col': (p[1] if len(p) > 1 and p[1] else 'k'), 'label': p[2] if len(p) > 2 else '', 'badge': badge}


def width(it):
    if isinstance(it, list):
        return 44
    if it in ('>', '>r'):
        return ARROW
    return WIDE.get(parse(it)['name'], 56)


def use(c, x, y, w, h, out):
    chars, badges = cast()
    if c['name'] not in chars:
        sys.exit('Unknown character "%s". Characters: %s' % (c['name'], ', '.join(chars)))
    out.append('<use href="#%s" class="%s" x="%.0f" y="%.0f" width="%.0f" height="%.0f"/>' % (c['name'], 'r' if c['col'] == 'r' else 'k', x, y, w, h))
    if c['badge']:
        if c['badge'] not in badges:
            sys.exit('Unknown badge "%s". Badges: %s' % (c['badge'], ', '.join(badges)))
        out.append('<use href="#b-%s" x="%.0f" y="%.0f" width="20" height="20"/>' % (c['badge'], x + w - 14, y - 4))
    if c['label']:
        out.append('<text x="%.0f" y="%d" text-anchor="middle">%s</text>' % (x + w / 2, VH - 14, html.escape(c['label'].upper())))


def scene_svg(row):
    total = sum(width(i) for i in row) + GAP * (len(row) - 1)
    if total > VW - 20:
        sys.exit('Scene too wide (%d items). Split it into two scenes: one action each.' % len(row))
    x, out, boxes = (VW - total) / 2, [], []
    for it in row:
        w = width(it)
        if isinstance(it, list):          # a stack of two, smaller
            ys = [6, 62]
            for c, y in zip(it, ys):
                use(parse(c), x, y, 44, 52, out)
            boxes.append(('stack', x, w, [(y + 26, parse(c)['col']) for c, y in zip(it, ys)]))
        elif it in ('>', '>r'):
            boxes.append(('arrow', x, w, 'r' if it == '>r' else 'k'))
        else:
            c = parse(it)
            use(c, x, (VH - 20 - H) / 2 + 2, w, H, out)
            boxes.append(('item', x, w, None))
        x += w + GAP
    for i, b in enumerate(boxes):        # arrows, drawn between their neighbours
        if b[0] != 'arrow':
            continue
        col = b[3]; cls = 'ln r' if col == 'r' else 'ln'; mk = 'ahr' if col == 'r' else 'ah'
        prev = boxes[i - 1] if i else None
        if prev and prev[0] == 'stack':
            for j, (y, sc) in enumerate(prev[3]):   # each line takes the colour of the thing it comes from
                ty = 46 + (j * 8)
                out.append('<path class="%s" d="M%.0f %d C%.0f %d %.0f %d %.0f %d" marker-end="url(#%s)"/>' % (
                    'ln r' if sc == 'r' else 'ln', b[1] - 4, y, b[1] + b[2] / 2, y, b[1] + b[2] / 2, ty, b[1] + b[2] + 2, ty, 'ahr' if sc == 'r' else 'ah'))
        else:
            out.append('<path class="%s" d="M%.0f 50 H%.0f" marker-end="url(#%s)"/>' % (cls, b[1], b[1] + b[2] - 2, mk))
    return out


def caption(t):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', html.escape(t))


def build(story):
    scenes = []
    for n, s in enumerate(story['scenes'], 1):
        alt = ', '.join(parse(i)['label'] or parse(i)['name'] for i in s['row'] if isinstance(i, str) and i not in ('>', '>r'))
        scenes.append('<section class="scene">\n<div class="eyebrow">Step %d</div>\n<h2>%s</h2>\n'
                      '<svg viewBox="0 0 %d %d" role="img" aria-label="%s">\n%s\n</svg>\n<p class="cap">%s</p>\n</section>' % (
                          n, html.escape(s['title']), VW, VH, html.escape(alt), '\n'.join(scene_svg(s['row'])), caption(s.get('cap', ''))))
    t = open(TEMPLATE, encoding='utf-8').read()
    return t.replace('{{TITLE}}', html.escape(story['title'])).replace('{{SCENES}}', '\n'.join(scenes))


def main():
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help'):
        print(__doc__); return
    if a[0] == '--cast':
        c, b = cast(); print('characters: ' + ', '.join(c)); print('badges: ' + ', '.join(b)); return
    story = json.load(open(a[0], encoding='utf-8'))
    out = a[a.index('--out') + 1] if '--out' in a else os.path.splitext(a[0])[0] + '.html'
    if not 3 <= len(story.get('scenes', [])) <= 6:
        print('note: %d scenes; 3-6 reads best' % len(story.get('scenes', [])))
    open(out, 'w', encoding='utf-8').write(build(story))
    print(os.path.abspath(out))


if __name__ == '__main__':
    main()
