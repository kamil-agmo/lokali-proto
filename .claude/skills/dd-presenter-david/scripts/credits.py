#!/usr/bin/env python3
"""Fill the prototype's credits from the kit skills it uses. Forwards to dd-credits-kamil when it is installed (it always is with the kit);
the code below is the fallback for an older skills folder.

  python3 credits.py --project ./my-prototype [--design "Designer Name"] [--thanks "Name"] [--list]

Every kit skill says in its SKILL.md header who made it and how to tell that a project uses it:

  metadata:
    author: Kamil & Norman          # who made the skill
    credit: Dev mode                # its name in the credits (no `credit`: the skill is never credited)
    marker: devmode.config.js       # a file in the project that only this skill creates; alternatives with " | ";
                                    # "glob::regex" looks inside matching files; "*" means always (the kit itself)
    verb: compiled by               # optional, default "by"

This script looks at the skills next to this one, keeps those whose marker is found in the project, and writes
`credits.made` in shell.config.js (plus `design` and `thanks` when given). The shell shows them as one inline line,
grouping skills made by the same people. Run it again after adding a skill to the prototype. A new skill from anyone is
credited as soon as its SKILL.md has those lines: nothing here needs editing.
"""
import os, subprocess, sys

# Credits moved to their own skill, dd-credits-kamil (always installed with the kit): this keeps the old command working.
NEW = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dd-credits-kamil', 'scripts', 'credits.py')
if os.path.exists(NEW) and __name__ == '__main__':
    sys.exit(subprocess.call([sys.executable, NEW] + sys.argv[1:]))

import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILLS = os.path.dirname(os.path.dirname(HERE))      # the folder that holds this skill and its siblings
ORDER = ['dd-presenter-david', 'dd-dev-mode-kamil', 'dd-designer-mode-kamil', 'dd-design-system-kamil', 'dd-typography-kamil',
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


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--design', help='who designed this prototype: shown first as "Design by ..."')
    ap.add_argument('--thanks', action='append', help='someone else to thank (repeat); left out when already credited')
    ap.add_argument('--list', action='store_true', help='only print what would be credited')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    cfg = os.path.join(root, 'shell.config.js')
    if not os.path.exists(cfg):
        sys.exit('No shell.config.js in %s: set up the presenter first (scripts/scaffold.py).' % root)
    made = found(root)
    if a.list:
        for r in made:
            print('%s %s %s' % (r['skill'], r.get('verb', 'by'), r['by']))
        return
    s = open(cfg, encoding='utf-8').read()
    m = re.search(r'\n([ \t]*)credits\s*:\s*(null|\{)', s)
    if m and m.group(2) == 'null':
        print('Credits are switched off in shell.config.js (credits: null): left as they are.')
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
    print('Credits: ' + ('; '.join('%s %s %s' % (r['skill'], r.get('verb', 'by'), r['by']) for r in made) or 'no kit skills found'))


if __name__ == '__main__':
    main()
