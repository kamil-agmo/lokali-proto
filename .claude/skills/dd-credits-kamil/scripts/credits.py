#!/usr/bin/env python3
"""Credits for a prototype: who designed it and who made each kit skill it uses (dd-credits-kamil).

  python3 credits.py --project ./my-prototype [--design "Designer Name"] [--thanks "Name"] [--list] [--no-pill] [--no-link]

Every kit skill says in its SKILL.md header who made it and how to tell that a project uses it:

  metadata:
    author: Kamil & Norman          # who made the skill
    credit: Dev mode                # its name in the credits (no `credit`: the skill is never credited)
    marker: devmode.config.js       # a file in the project that only this skill creates; alternatives with " | ";
                                    # "glob::regex" looks inside matching files; "*" means always (the kit itself)
    verb: compiled by               # optional, default "by"

It finds the skills next to this one whose marker is in the project and writes, every time:
  credits.json, CREDITS.md and credits.html (a styled page anyone with the link can open);
  js/shared/credits-data.js + js/shared/credits-badge.js, linked into every page: a quiet console line, and without the
    presenter a small "Credits" pill (wide windows only) that opens credits.html;
  and, with the presenter (shell.config.js), `credits.made` / `design` / `thanks` for its Credits button.
Design and thanks are remembered (shell.config.js, else credits.json). Run it again after adding a skill.
A new skill from anyone is credited as soon as its SKILL.md has those lines: nothing here needs editing.
"""
import argparse, glob, html, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILLS = os.path.dirname(os.path.dirname(HERE))      # the folder that holds this skill and its siblings
ASSETS = os.path.join(HERE, '..', 'assets')
ORDER = ['dd-presenter-david', 'dd-iphone-david', 'dd-dev-mode-kamil', 'dd-designer-mode-kamil', 'dd-design-system-kamil', 'dd-typography-kamil',
         'dd-icons-kamil', 'dd-components-kamil', 'dd-desktop-kamil', 'dd-iphone-duo-kamil', 'dd-phone-install-kamil']


def meta(skill_md):
    """The `metadata:` block of a SKILL.md header, as a dict of plain strings."""
    text = open(skill_md, encoding='utf-8').read()
    m = re.match(r'---\n(.*?)\n---', text, re.S)
    if not m:
        return {}
    out, inside = {}, False
    for line in m.group(1).split('\n'):
        if re.match(r'metadata:\s*$', line):
            inside = True; continue
        if inside:
            mm = re.match(r'\s+([\w-]+):\s*(.*?)\s*$', line)
            if not mm:
                if line.strip() and not line.startswith((' ', '\t')):
                    inside = False
                continue
            v = mm.group(2)
            if len(v) > 1 and v[0] == v[-1] and v[0] in '"\'':
                v = v[1:-1]
            out[mm.group(1)] = v
    return out


def used(root, marker):
    for alt in [a.strip() for a in marker.split('|') if a.strip()]:
        if alt == '*':
            return True
        pat, _, rx = alt.partition('::')
        files = glob.glob(os.path.join(root, pat), recursive=True)
        if not rx and files:
            return True
        for f in files:
            try:
                if re.search(rx, open(f, encoding='utf-8', errors='ignore').read()):
                    return True
            except OSError:
                pass
    return False


def found(root):
    rows = []
    for md in glob.glob(os.path.join(SKILLS, '*', 'SKILL.md')):
        name = os.path.basename(os.path.dirname(md))
        m = meta(md)
        if not m.get('credit') or not m.get('author') or not m.get('marker'):
            continue
        if used(root, m['marker']):
            rows.append((name, {'skill': m['credit'], 'by': m['author'] + (' & ' + m['contributors'] if m.get('contributors') else ''), **({'verb': m['verb']} if m.get('verb') and m['verb'] != 'by' else {})}))
    def key(r):
        name, row = r
        if row.get('verb'):                       # "compiled by" and the like come last
            return (2, name)
        return (0, ORDER.index(name)) if name in ORDER else (1, name)
    return [row for _, row in sorted(rows, key=key)]


def js(v):
    return json.dumps(v, ensure_ascii=False).replace('</', '<\\/')


def and_(xs):
    return ''.join(xs) if len(xs) < 2 else ', '.join(xs[:-1]) + ' & ' + xs[-1]


def people(by):
    return [n for n in re.split(r'\s*(?:,|&|\band\b)\s*', str(by or '')) if n]


def parts_of(design, made, thanks):
    """The same line the presenter's Credits button shows: design first, skills grouped by the same people, then thanks."""
    parts, credited, groups, by_key = [], set(), [], {}
    if design:
        parts.append('Design by ' + design); credited |= {n.lower() for n in people(design)}
    rows = []
    for m in made:
        ppl, verb = people(m['by']), m.get('verb', 'by')
        credited |= {n.lower() for n in ppl}
        key = verb + '|' + '|'.join(sorted(n.lower() for n in ppl))
        if key not in by_key:
            by_key[key] = {'verb': verb, 'by': and_(ppl), 'skills': []}; groups.append(by_key[key])
        if m['skill'] not in by_key[key]['skills']:
            by_key[key]['skills'].append(m['skill'])
    for g in groups:
        parts.append('%s %s %s' % (and_(g['skills']), g['verb'], g['by']))
        rows.append(g)
    left = [t for t in (thanks or []) if t.lower() not in credited]
    if left:
        parts.append('Thanks to ' + and_(left))
    return parts, rows, left


def shell_value(cfg, key):
    """design / thanks from the credits block of shell.config.js (None when not there)."""
    s = open(cfg, encoding='utf-8').read()
    m = re.search(r'\bcredits\s*:\s*\{(.*?)\n\s*\}', s, re.S)
    if not m:
        return None
    mm = re.search(r'\b%s\s*:\s*("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|\[[^\]]*\])' % key, m.group(1))
    if not mm:
        return None
    v = mm.group(1)
    try:
        return json.loads(v if not v.startswith("'") else '"' + v[1:-1].replace('"', '\\"') + '"')
    except ValueError:
        return re.findall(r"['\"]([^'\"]+)['\"]", v) if v.startswith('[') else v[1:-1]


def project_name(root, cfg):
    if os.path.exists(cfg):
        m = re.search(r"\bname\s*:\s*(['\"])(.*?)\1", open(cfg, encoding='utf-8').read())
        if m:
            return m.group(2)
    idx = os.path.join(root, 'index.html')
    if os.path.exists(idx):
        m = re.search(r'<title>(.*?)</title>', open(idx, encoding='utf-8', errors='ignore').read(), re.S)
        if m and m.group(1).strip():
            return html.unescape(m.group(1).strip())
    return os.path.basename(root)


SKIP_DIRS = {'node_modules', '.git', '.firebase', 'figma-plugin', 'dist', 'build'}


def pages(root):
    out = []
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith('.')]
        rel = os.path.relpath(d, root)
        if rel.split(os.sep)[0] in ('js', 'css', 'assets'):
            continue
        for f in files:
            if f.endswith('.html') and f not in ('credits.html', 'lock.html'):
                out.append(os.path.join(d, f))
    return out


def link_pages(root):
    n = 0
    for p in pages(root):
        t = open(p, encoding='utf-8', errors='ignore').read()
        if 'credits-badge.js' in t or '</body>' not in t:
            continue
        rel = os.path.relpath(os.path.join(root, 'js', 'shared'), os.path.dirname(p)).replace(os.sep, '/')
        tag = '  <script src="%s/credits-data.js"></script>\n  <script src="%s/credits-badge.js"></script>\n' % (rel, rel)
        i = t.rfind('</body>')
        open(p, 'w', encoding='utf-8').write(t[:i] + tag + t[i:]); n += 1
    return n


def write_files(root, name, design, made, thanks, pill, accent):
    parts, rows, left = parts_of(design, made, thanks)
    line = ' · '.join(parts)
    data = {'name': name, 'design': design or '', 'made': made, 'thanks': thanks or [], 'line': line, 'parts': parts, 'pill': pill}
    json.dump(data, open(os.path.join(root, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(root, 'js', 'shared'), exist_ok=True)
    open(os.path.join(root, 'js', 'shared', 'credits-data.js'), 'w', encoding='utf-8').write(
        '/* Written by dd-credits-kamil (credits.py): who designed this prototype and who made the skills it uses. Do not edit: run credits.py again. */\nwindow.DD_CREDITS = %s;\n' % js(data))
    shutil.copy(os.path.join(ASSETS, 'credits-badge.js'), os.path.join(root, 'js', 'shared', 'credits-badge.js'))
    md = ['# Credits', '', '**%s**' % name, '']
    if design:
        md += ['Design by %s' % design, '']
    md += ['| Part | Made by |', '|---|---|'] + ['| %s | %s |' % (and_(g['skills']), (g['verb'] + ' ' if g['verb'] != 'by' else '') + g['by']) for g in rows]
    if left:
        md += ['', 'Thanks to %s' % and_(left)]
    md += ['', 'Made with Design Department skills. Written by credits.py (dd-credits-kamil); run it again after adding a skill.', '']
    open(os.path.join(root, 'CREDITS.md'), 'w', encoding='utf-8').write('\n'.join(md))
    e = html.escape
    tpl = open(os.path.join(ASSETS, 'credits.html'), encoding='utf-8').read()
    rows_html = '\n'.join('      <li><span>%s</span><b>%s</b></li>' % (e(and_(g['skills'])), e((g['verb'] + ' ' if g['verb'] != 'by' else '') + g['by'])) for g in rows)
    out = (tpl.replace('{{NAME}}', e(name)).replace('{{ACCENT}}', e(accent or '#4f46e5'))
              .replace('{{DESIGN}}', '<p class="design">Design by <b>%s</b></p>' % e(design) if design else '')
              .replace('{{ROWS}}', rows_html)
              .replace('{{THANKS}}', '<p class="thanks">Thanks to %s</p>' % e(and_(left)) if left else '')
              .replace('{{BACK}}', '<a href="index.html">Back to the prototype</a>' if os.path.exists(os.path.join(root, 'index.html')) else ''))
    open(os.path.join(root, 'credits.html'), 'w', encoding='utf-8').write(out)
    return line


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--design', help='who designed this prototype: shown first as "Design by ..."')
    ap.add_argument('--thanks', action='append', help='someone else to thank (repeat); left out when already credited')
    ap.add_argument('--list', action='store_true', help='only print what would be credited')
    ap.add_argument('--no-pill', action='store_true', help='no Credits pill on pages without the presenter (credits.html, CREDITS.md and the console line stay)')
    ap.add_argument('--no-link', action='store_true', help='do not link the credits scripts into the pages')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    cfg = os.path.join(root, 'shell.config.js')
    if not os.path.isdir(root):
        sys.exit('No folder %s' % root)
    made = found(root)
    if a.list:
        for r in made:
            print('%s %s %s' % (r['skill'], r.get('verb', 'by'), r['by']))
        return
    # design and thanks: given now, else remembered (shell.config.js, then credits.json)
    old = {}
    try:
        old = json.load(open(os.path.join(root, 'credits.json'), encoding='utf-8'))
    except (OSError, ValueError):
        pass
    design = a.design if a.design is not None else ((shell_value(cfg, 'design') if os.path.exists(cfg) else None) or old.get('design') or '')
    thanks = a.thanks if a.thanks else ((shell_value(cfg, 'thanks') if os.path.exists(cfg) else None) or old.get('thanks') or [])
    accent = None
    if os.path.exists(cfg):
        am = re.search(r"\baccent\s*:\s*(['\"])(#[0-9a-fA-F]{3,8})\1", open(cfg, encoding='utf-8').read()); accent = am and am.group(2)
    line = write_files(root, project_name(root, cfg), design, made, thanks, not a.no_pill, accent)
    linked = 0 if a.no_link else link_pages(root)
    print('Credits: ' + (line or 'no kit skills found'))
    print('Wrote credits.html, CREDITS.md, credits.json, js/shared/credits-data.js%s' % (' (linked into %d new page%s)' % (linked, '' if linked == 1 else 's') if linked else ''))
    if not os.path.exists(cfg):
        return
    s = open(cfg, encoding='utf-8').read()
    m = re.search(r'\n([ \t]*)credits\s*:\s*(null|\{)', s)
    if m and m.group(2) == 'null':
        print('The presenter\'s Credits button is switched off (credits: null in shell.config.js); the files above still credit everyone.')
        return
    if not m:   # an older shell: add the block before `pages`
        pm = re.search(r'\n([ \t]*)/\*[^\n]*pages:|\n([ \t]*)pages\s*:', s)
        if not pm:
            sys.exit('Could not find where to add credits in shell.config.js.')
        block = '\n  credits: {\n    design: %s,\n    made: %s,\n    thanks: %s\n  },' % (js(a.design or ''), js(made), js(a.thanks or []))
        s = s[:pm.start()] + block + s[pm.start():]
    else:
        start = m.end() - 1
        depth, i = 0, start
        while i < len(s):      # the end of the credits object
            if s[i] == '{': depth += 1
            elif s[i] == '}':
                depth -= 1
                if depth == 0: break
            elif s[i] in '"\'':
                q = s[i]; i += 1
                while i < len(s) and s[i] != q:
                    i += 2 if s[i] == '\\' else 1
            i += 1
        body = s[start:i + 1]
        def setkey(body, k, v):
            r = re.compile(r'(\b%s\s*:\s*)(\[[^\]]*\]|"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|null)' % k)
            if r.search(body):
                return r.sub(lambda mm: mm.group(1) + js(v), body, count=1)
            return body[:-1].rstrip() + (',' if body[:-1].rstrip()[-1] not in '{,' else '') + '\n    %s: %s\n  }' % (k, js(v))
        body = setkey(body, 'made', made)
        if a.design is not None:
            body = setkey(body, 'design', a.design)
        if a.thanks:
            body = setkey(body, 'thanks', a.thanks)
        s = s[:start] + body + s[i + 1:]
    open(cfg, 'w', encoding='utf-8').write(s)
    print('Presenter Credits button updated (shell.config.js).')


if __name__ == '__main__':
    main()
