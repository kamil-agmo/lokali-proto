#!/usr/bin/env python3
"""Propose theme values for the presenter shell by reading a prototype's own CSS (it only reads; it changes nothing).

  python3 suggest_theme.py --project ./my-prototype [--json]

It looks for: the brand colour (a custom property named brand / primary / accent / main, else the most used saturated colour), the font
(the most used first family in font-family, plus a Google Fonts URL if the project links one), the card radius (the most used border-radius
of 12 px or more), and the page background (a custom property named bg / background / surface). These are SUGGESTIONS to show the user and
confirm: the accent is asked for in the intake, and font / radius / page background are optional theme keys that are off by default.
"""
import argparse, colorsys, collections, glob, json, os, re, sys

SKIP_DIRS = ('node_modules', '.git', 'skills', '_archive')
SHELL_FILES = ('css/shell/', 'js/shell/', 'css/pages/lock.css', 'pages/lock.html', 'js/pages/lock.js', 'shell.config.js', 'devmode')
GENERIC = {'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', '-apple-system', 'blinkmacsystemfont', 'inherit', 'initial', 'unset',
           'segoe ui', 'roboto', 'helvetica', 'helvetica neue', 'arial', 'material symbols outlined', 'sf pro text', 'sf pro display'}
HEX = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')


def norm(h):
    h = h.lstrip('#').lower()
    return '#' + (''.join(c * 2 for c in h) if len(h) == 3 else h)


def hsl(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    return hh, s, l


def files(root, patterns):
    out = []
    for p in patterns:
        for f in glob.glob(os.path.join(root, '**', p), recursive=True):
            rel = os.path.relpath(f, root).replace(os.sep, '/')
            if any(rel.startswith(d + '/') or ('/' + d + '/') in rel for d in SKIP_DIRS) or any(x in rel for x in SHELL_FILES):
                continue
            out.append((rel, f))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', default='.'); ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    root = a.project
    css = ''
    for rel, f in files(root, ['*.css']):
        css += open(f, encoding='utf-8', errors='ignore').read() + '\n'
    htmls = ''
    for rel, f in files(root, ['*.html']):
        t = open(f, encoding='utf-8', errors='ignore').read()
        htmls += t + '\n'
        css += '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', t, re.S)) + '\n'
    if not css.strip():
        sys.exit('No CSS found in %s (outside the shell files).' % root)

    # brand colour
    named, why = None, ''
    decl = {}
    for n, v in re.findall(r'(--[\w-]+)\s*:\s*([^;}]+)', css):
        decl.setdefault(n, v.strip())
    def resolve(v, hops=0):        # var(--brand) -> var(--purple-600) -> #6b72ee
        m = re.match(r'var\((--[\w-]+)', v)
        if m and hops < 6 and m.group(1) in decl:
            return resolve(decl[m.group(1)], hops + 1)
        return v
    props = []
    for n, v in decl.items():
        r = resolve(v)
        if HEX.fullmatch(r.strip()):
            props.append((n, r.strip()))
    for key in ('brand', 'primary', 'accent', 'main', 'theme'):
        for n, v in props:
            if re.search(r'(^|-)%s(-|$)' % key, n) and not re.search(r'(soft|bg|tint|light|muted|hover|strong|deep|dark)', n):
                named = norm(v); why = 'custom property %s' % n; break
        if named:
            break
    freq = collections.Counter()
    for m in HEX.finditer(css):
        h = norm(m.group(0)); _, s, l = hsl(h)
        if s >= 0.35 and 0.25 <= l <= 0.75:
            freq[h] += 1
    colours = [{'value': c, 'uses': n} for c, n in freq.most_common(3)]
    accent = named or (colours[0]['value'] if colours else None)
    if accent and not named:
        why = 'the most used saturated colour (%d uses)' % freq[accent]

    # font
    fam = collections.Counter()
    for m in re.finditer(r'font-family\s*:\s*([^;}]+)', css):
        first = m.group(1).split(',')[0].strip().strip('"\'')
        if first and first.lower() not in GENERIC and 'var(' not in first:
            fam[first] += 1
    for m in re.finditer(r'font\s*:\s*[^;}]*?\d+px(?:/[\d.]+(?:px)?)?\s+([^;}]+)', css):
        first = m.group(1).split(',')[0].strip().strip('"\'')
        if first and first.lower() not in GENERIC and 'var(' not in first and not first.startswith(('system', '-')):
            fam[first] += 1
    font = fam.most_common(1)[0][0] if fam else None
    font_url = None
    m = re.search(r'https://fonts\.googleapis\.com/css2?\?family=[^"\')\s>]+', htmls + css)
    if m and 'Material' not in m.group(0).split('&')[0]:
        font_url = m.group(0).replace('&amp;', '&')
    elif m:
        for u in re.findall(r'https://fonts\.googleapis\.com/css2?\?[^"\')\s>]+', htmls + css):
            if 'Material' not in u:
                font_url = u.replace('&amp;', '&'); break

    # radius
    rad = collections.Counter(int(float(x)) for x in re.findall(r'border-radius\s*:\s*(\d+(?:\.\d+)?)px\b', css) if float(x) >= 12 and float(x) <= 40)
    radius = rad.most_common(1)[0][0] if rad else None

    # page background
    page_bg = None
    for n, v in props:
        if re.search(r'(^|-)(bg|background|surface-page|page)(-|$)', n) and not re.search(r'(soft|tint|hover|card|panel|inverse|sunken)', n):
            page_bg = norm(v); break

    res = {'accent': accent, 'accentWhy': why, 'otherColours': colours[1:], 'font': font, 'fontUrl': font_url, 'radius': radius, 'pageBg': page_bg}
    if a.json:
        print(json.dumps(res, indent=2)); return
    print('Suggestions read from the prototype\'s CSS (confirm each with the user):')
    print('  accent   :', accent or 'none found: ask the user for the brand colour', ('(' + why + ')') if accent else '')
    if colours[1:]:
        print('  also seen:', ', '.join('%s (%d)' % (c['value'], c['uses']) for c in colours[1:]))
    print('  font     :', font or 'none found (the shell keeps the system font)', ('| load it with ' + font_url) if font and font_url else '')
    print('  radius   :', ('%d px for the side cards' % radius) if radius else 'none found (the shell keeps 24 px)')
    print('  page bg  :', page_bg or 'none found (the shell keeps its grey)')
    print('The accent is part of the intake; font, radius and page background are optional theme keys (off unless the user wants the shell to match).')


if __name__ == '__main__':
    main()
