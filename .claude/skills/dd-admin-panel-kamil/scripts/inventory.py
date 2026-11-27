#!/usr/bin/env python3
"""Read a prototype's phone app, or the brief alone, and list what an admin would need to manage (dd-admin-panel-kamil). Read-only.

  python3 inventory.py --project ./my-prototype [--source auto|app|brief] [--out ADMIN_PLAN.md] [--json]

--source auto (default): the phone screens when there are any, plus the brief; with no phone screens, the brief alone.
--source brief: admin only - ignore any screens and work from REQUIREMENTS.md / USER_STORY.md (features, screen
  inventory, roles, stories); every suggestion cites the requirement it comes from.

It reads shell.config.js (pages, titles, descriptions, parts), every screen's HTML, and USER_STORY.md / REQUIREMENTS.md, and
writes a draft plan (default: ADMIN_PLAN.md in the project; --out - prints it instead) with:
  - per phone screen: repeated items (lists, feeds, grids), actions (buttons and links), form fields, counts, sign-in, reports;
  - the admin screens these suggest, each with the evidence it came from;
  - the user stories that mention managing, reporting, approving or blocking.
The draft is evidence, not a decision: Claude names the things (posts, orders, members), checks it against the brief,
and asks the user which admin screens to build. It never edits the screens.
"""
import argparse, collections, glob, json, os, re, shutil, subprocess, sys
from html.parser import HTMLParser

ACTION_HINTS = {
    'moderate': r'report|flag|block|ban|hide|mute|spam|abuse|inappropriate',
    'remove': r'delete|remove|archive|discard',
    'create': r'new|create|add|post|upload|publish|compose|write',
    'approve': r'approve|reject|review|verify|confirm|accept|decline',
    'money': r'pay|checkout|buy|order|refund|invoice|price|subscribe|plan',
    'people': r'follow|friend|invite|member|profile|account|user',
    'message': r'message|chat|send|reply|comment',
    'settings': r'setting|preference|notification|privacy|language|theme',
}
STORY_HINTS = r'admin|moderat|manage|report|approve|block|ban|remove|delete|verify|dashboard|analytics|statistic|support|refund'


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.buttons, self.fields, self.heads, self.text = [], [], [], [], []
        self.sibling = collections.Counter()   # (parent path, class) -> count, to find repeated items
        self.cur = None
        self.icon = 0   # inside an icon-font element (Material Symbols and the like): its text is an icon name, not a label

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get('class') or '').split()
        if tag not in ('br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'area', 'col', 'embed', 'track') and (self.icon or a.get('aria-hidden') == 'true' or any(re.match(r'^(mi|ms|c-ico|icon|material-symbols\S*|material-icons\S*|fa|ph|bi)$', c) for c in cls)):
            self.icon += 1
        parent = '/'.join(self.stack[-3:])
        if cls and tag in ('li', 'article', 'div', 'a', 'button', 'section'):
            self.sibling[(parent, tag + '.' + cls[0])] += 1
        if tag in ('button',) or (tag == 'a' and (a.get('href') or '').startswith(('#', 'javascript', 'parent'))) or a.get('role') == 'button':
            self.cur = ['button', a.get('aria-label') or a.get('title') or '']
        if tag in ('input', 'textarea', 'select'):
            label = a.get('aria-label') or a.get('placeholder') or a.get('name') or a.get('type') or tag
            if (a.get('type') or '') not in ('hidden', 'submit', 'button'):
                self.fields.append(label.strip())
        if tag in ('h1', 'h2', 'h3'):
            self.cur = ['head', '']
        if tag not in ('br', 'img', 'input', 'meta', 'link', 'hr', 'source'):
            self.stack.append(tag + ('.' + cls[0] if cls else ''))

    def handle_endtag(self, tag):
        if self.icon:
            self.icon -= 1
        if self.cur and ((self.cur[0] == 'button' and tag in ('button', 'a')) or (self.cur[0] == 'head' and tag in ('h1', 'h2', 'h3'))):
            t = re.sub(r'\s+', ' ', self.cur[1]).strip()
            if t and len(t) < 60:
                (self.buttons if self.cur[0] == 'button' else self.heads).append(t)
            self.cur = None
        while self.stack and not self.stack[-1].startswith(tag):
            self.stack.pop()
        if self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.icon:
            return
        if self.cur:
            self.cur[1] += ' ' + data
        self.text.append(data)


def load_config(root):
    cfg = os.path.join(root, 'shell.config.js')
    if not os.path.exists(cfg):
        return {}
    if shutil.which('node'):
        js = "global.window={};require('vm').runInThisContext(require('fs').readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(window.SHELL||{}))"
        try:
            out = subprocess.run(['node', '-e', js, cfg], capture_output=True, text=True, timeout=20)
            if out.returncode == 0:
                return json.loads(out.stdout or '{}')
        except Exception:
            pass
    return {}


def screens(root, cfg):
    pages = cfg.get('pages') or {}
    desk = {c for g in (cfg.get('tree') or []) if g.get('device') == 'desktop' for c in g.get('children', [])}   # desktop groups: already admin
    out = []
    for pid, p in pages.items():
        if p.get('device') == 'desktop' or pid in desk or (p.get('src') or '').endswith('lock.html'):
            continue
        out.append((pid, p, os.path.join(root, p.get('src', ''))))
    if not out:   # no presenter: every page in pages/ (or the root)
        for f in sorted(glob.glob(os.path.join(root, 'pages', '*.html')) or glob.glob(os.path.join(root, '*.html'))):
            if os.path.basename(f) not in ('lock.html', 'credits.html'):
                out.append((os.path.splitext(os.path.basename(f))[0], {}, f))
    return out


def read_page(path):
    pg = Page()
    try:
        pg.feed(open(path, encoding='utf-8', errors='ignore').read())
    except (OSError, AssertionError):
        return None
    text = re.sub(r'\s+', ' ', ' '.join(pg.text))
    repeats = sorted({k[1]: v for k, v in pg.sibling.items() if v >= 3}.items(), key=lambda kv: -kv[1])[:6]
    UNITS = r'(?:characters?|letters?|chars?|mins?|minutes?|hours?|days?|weeks?|months?|years?|seconds?|secs?|ago|px|percent|times?|steps?|of|and|or|to|first|second|third|back|next|more|less|items?)$'
    counts = sorted(set(m.strip() for m in re.findall(r'\b[1-9][\d.,]*\s?[kKmM]?\s+[A-Za-z][a-z]{2,}', text) if not re.search(UNITS, m.strip().split()[-1], re.I)))[:10]
    hints = sorted(k for k, rx in ACTION_HINTS.items() if re.search(rx, ' '.join(pg.buttons + pg.heads + pg.fields), re.I))
    signin = bool(re.search(r'password|log ?in|sign ?in|sign ?up|register', text, re.I))
    return {'heads': pg.heads[:6], 'buttons': sorted(set(pg.buttons))[:16], 'fields': sorted(set(pg.fields))[:12],
            'repeats': repeats, 'counts': counts, 'hints': hints, 'signin': signin}


def stories(root):
    out = []
    for name in ('USER_STORY.md', 'REQUIREMENTS.md'):
        p = os.path.join(root, name)
        if os.path.exists(p):
            for line in open(p, encoding='utf-8', errors='ignore'):
                t = line.strip(' -*#\t\n')
                if t and re.search(STORY_HINTS, t, re.I):
                    out.append((name, t[:200]))
    return out[:30]


BRIEF_MAP = [   # (admin screen, pattern in a requirement line)
    ('Users', r'\b(users?|accounts?|members?|customers?|staff|sign[ -]?(in|up)|log ?in|register|profiles?|roles?|permissions?)\b'),
    ('Moderation queue', r'\b(reported|report (an? |the |this )?(post|user|content|comment|review|listing|abuse|problem)s?|flag(s|ged)?|moderat\w*|block (an? |the )?users?|ban(s|ned)?|abuse|spam|takedown)\b'),
    ('Approvals', r'\b(approv\w*|reject\w*|verif\w*|review (and|or) (approve|reject)|pending|kyc|onboarding check)\b'),
    ('Orders and payments', r'\b(orders?|payments?|pay|refunds?|invoices?|billing|subscriptions?|transactions?|revenue|checkout|payouts?)\b'),
    ('Conversations and comments', r'\b(messages?|chats?|comments?|tickets?|support|enquir\w*|inquir\w*|feedback)\b'),
    ('App settings', r'\b(settings?|configur\w*|feature flags?|announcements?|notifications?|templates?|master data|lookups?)\b'),
    ('Reports and exports', r'\b(reports? (on|of|for)|analytics|statistics|kpis?|export\w*|download (a )?report|csv|excel)\b'),
    ('Activity log', r'\b(audit|activity log|history of (changes|actions)|logs?)\b'),
]
VERBS = r'(?:manage|create|add|edit|update|delete|remove|upload|publish|post|submit|share|maintain|crud)'
MANAGE_RX = r'(?<!\ba )(?<!\ban )(?<!\bthe )(?<!\bmy )\b(' + VERBS + r'(?:\s*(?:,|/|and|or)\s*' + VERBS + r')*)\s+(?:the\s+|a\s+|an\s+|new\s+|all\s+|their\s+)*([a-z][a-z -]{2,30}?)(?=[,.;:)(]|\s+-\s|\s+(?:and|or|with|for|by|from|to|in|on|so|that|which|when|via)\b|$)'
SKIP_THING = r'^(it|them|this|that|these|those|items?|things?|data|details?|information|content|records?|entries)$'


def brief(root):
    """Lines from REQUIREMENTS.md and USER_STORY.md: (file, section, text). Table rows become 'cell - cell' text."""
    out = []
    for name in ('REQUIREMENTS.md', 'USER_STORY.md'):
        p = os.path.join(root, name)
        if not os.path.exists(p):
            continue
        sec = ''
        for line in open(p, encoding='utf-8', errors='ignore'):
            if line.startswith('#'):
                sec = line.strip('# \n'); continue
            t, cells = line.strip(), []
            if t.startswith('|'):
                cells = [c.strip() for c in t.strip('|').split('|')]
                if all(re.match(r'^:?-+:?$', c) for c in cells if c):
                    if out and out[-1][3]:
                        out.pop()   # the row before the separator is the table's header
                    continue
                t = ' - '.join(c for c in cells if c)
            t = t.strip(' -*\t')
            if len(t) > 3:
                out.append((name, sec, t[:240], line.strip().startswith('|'), cells[0] if line.strip().startswith('|') else ''))
    return [(f, sec, t, first) for f, sec, t, _, first in out]


def brief_roles(lines):
    roles = set()
    for f, sec, t, first in lines:
        if first and re.search(r'roles?', sec, re.I) and len(first) < 30:
            roles.add(first.lower()); continue
        if re.search(r'roles?|users', sec, re.I) or f == 'USER_STORY.md':
            for m in re.findall(r'\bas an? ([a-z][a-z ]{1,24}?)(?:,| i want| I want)', t, re.I):
                roles.add(m.strip().lower())
            for m in re.findall(r'\b(admin(?:istrator)?|super ?admin|owner|moderator|manager|editor|operator|agent|support staff|finance|approver|reviewer)s?\b', t, re.I):
                roles.add(m.lower())
    roles = {r for r in roles if not any(r != o and re.search(r'\b%s\b' % re.escape(r), o) for o in roles)}   # "agent" inside "support agent"
    return sorted(roles)[:10]


def suggest_brief(lines):
    """Admin screens the brief asks for. Each: (screen, why, contents) with the requirement quoted as evidence."""
    hits = collections.OrderedDict()
    def add(screen, f, t):
        hits.setdefault(screen, [])
        if len(hits[screen]) < 3 and t not in hits[screen]:
            hits[screen].append('%s: "%s"' % (f, t[:90] + ('...' if len(t) > 90 else '')))
    things = collections.OrderedDict()
    for f, sec, t, _ in lines:
        if re.search(r'^(sources?|open questions)', sec, re.I):
            continue
        for screen, rx in BRIEF_MAP:
            if re.search(rx, t, re.I):
                add(screen, f, t)
        for verb, thing in re.findall(MANAGE_RX, t, re.I):
            thing = re.sub(r'\s+', ' ', thing).strip(' -').lower()
            if not re.match(SKIP_THING, thing) and len(things) < 8:
                things.setdefault(thing, '%s: "%s"' % (f, t[:90] + ('...' if len(t) > 90 else '')))
    s = [('Dashboard', 'always: the first admin screen', 'KPI cards for the numbers the brief cares about (goals, success measures); a trend; items needing attention')]
    for thing, why in things.items():
        s.append(('Manage: %s' % thing, why, 'table with search, filters, bulk actions; create / edit form; row actions from the requirement'))
    for screen, rx in BRIEF_MAP:
        if screen in hits and screen != 'Activity log':
            s.append((screen, '; '.join(hits[screen]), dict((x[0], x[2]) for x in PATTERN_TEXT).get(screen, '')))
    s.append(('Activity log', '; '.join(hits.get('Activity log', [])) or 'always: who changed what in the admin', 'time, admin, action, item, undo where it makes sense'))
    return s


PATTERN_TEXT = [
    ('Users', '', 'user table (status, role, joined, activity), detail, invite, suspend, reset password'),
    ('Moderation queue', '', 'reported items with reason and reporter, keep / remove / warn, history'),
    ('Approvals', '', 'pending items, approve or reject with a note'),
    ('Orders and payments', '', 'orders, status, amounts, refunds, invoices, revenue summary'),
    ('Conversations and comments', '', 'search, flagged or open ones, reply, close, remove'),
    ('App settings', '', 'app-wide switches, templates, announcements'),
    ('Reports and exports', '', 'filters by date and type, charts, export to CSV / Excel'),
]


def suggest(inv, story_lines):
    """Admin screens the evidence points to. Each: (screen, why, contents)."""
    s, all_hints = [], set()
    for _, _, d in inv:
        all_hints |= set(d['hints'])
    counts = [c for _, _, d in inv for c in d['counts']]
    s.append(('Dashboard', 'always: the first admin screen', 'KPI cards from the app\'s numbers%s; a trend chart; latest items needing attention' % (' (' + ', '.join(counts[:5]) + ')' if counts else '')))
    for pid, p, d in inv:
        for cls, n in d['repeats'][:2]:
            s.append(('Manage: items listed on "%s"' % (p.get('title') or pid), 'repeated %s x%d on %s' % (cls, n, pid),
                      'table with search, filters, bulk actions; columns from what each item shows; row actions from its buttons (%s)' % (', '.join(d['buttons'][:5]) or 'view, edit, hide, remove')))
    if any(d['signin'] for _, _, d in inv) or 'people' in all_hints:
        s.append(('Users', 'sign-in or profile screens', 'user table (status, joined, activity), profile detail, verify, suspend, reset'))
    if 'moderate' in all_hints or any(re.search(r'report|block|ban|moderat', t, re.I) for _, t in story_lines):
        s.append(('Moderation queue', 'report / block / hide actions or stories', 'reported items with reason and reporter, approve / remove / warn, history'))
    if 'approve' in all_hints:
        s.append(('Approvals', 'approve / review actions', 'pending items, approve or reject with a note'))
    if 'money' in all_hints:
        s.append(('Orders and payments', 'pay / order / subscribe actions', 'orders, refunds, invoices, revenue summary'))
    if 'message' in all_hints:
        s.append(('Conversations and comments', 'message / comment actions', 'search, flagged messages, remove'))
    if 'settings' in all_hints:
        s.append(('App settings', 'settings / notification screens', 'app-wide switches, feature flags, announcements'))
    s.append(('Activity log', 'always: who changed what in the admin', 'time, admin, action, item, undo where it makes sense'))
    return s


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True)
    ap.add_argument('--out', default=None, help="where to write the draft (default ADMIN_PLAN.md in the project; '-' prints it)")
    ap.add_argument('--json', action='store_true', help='print the raw inventory as JSON instead')
    ap.add_argument('--source', choices=('auto', 'app', 'brief'), default='auto', help='auto: the phone screens if any, else the brief; app: screens only; brief: admin only, from REQUIREMENTS.md / USER_STORY.md')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    cfg = load_config(root)
    inv = []
    if a.source != 'brief':
        for pid, p, path in screens(root, cfg):
            d = read_page(path)
            if d:
                inv.append((pid, p, d))
    st = stories(root)
    mode, why = ('app', '') if inv else ('brief', 'no phone screens')
    if a.source == 'auto' and inv:
        req = ''.join(open(os.path.join(root, n), encoding='utf-8', errors='ignore').read() for n in ('REQUIREMENTS.md', 'USER_STORY.md') if os.path.exists(os.path.join(root, n)))
        if re.search(r'\b(desktop|web)(?: web)?(?: app| portal)? only\b|\bno (?:mobile|phone|native) app\b|\badmin only\b|\bonly the admin\b', req, re.I):
            mode, why = 'brief', 'the brief says desktop / admin only'
        elif req and not any(d['repeats'] or d['counts'] or d['hints'] or d['signin'] for _, _, d in inv):
            mode, why = 'brief', 'the screens show nothing to manage (starter pages?)'
    if a.source == 'app' and not inv:
        sys.exit('No phone screens found in %s. For an admin-only project use --source brief (needs REQUIREMENTS.md or USER_STORY.md).' % root)
    if mode == 'brief':
        bl = brief(root)
        if not bl:
            sys.exit('No phone screens and no REQUIREMENTS.md / USER_STORY.md in %s: run dd-requirements-kamil first, or describe the admin to Claude.' % root)
        sug, roles = suggest_brief(bl), brief_roles(bl)
        if a.json:
            print(json.dumps({'source': 'brief', 'roles': roles, 'suggestions': sug}, indent=1, ensure_ascii=False)); return
        L = ['# Admin plan (draft, from the brief)', '', 'Admin only (%s). Written by dd-admin-panel-kamil/scripts/inventory.py from REQUIREMENTS.md / USER_STORY.md. ' % (why or 'asked for') +
             'Every screen cites the requirement it comes from; Claude checks it against the brief and asks which to build.', '']
        if roles:
            L += ['## Roles in the brief', '', ', '.join(roles), '']
        L += ['## Admin screens the brief asks for', '', '| Admin screen | Why (requirement) | What it holds |', '|---|---|---|']
        for name, ev, what in sug:
            L.append('| %s | %s | %s |' % (name, ev.replace('|', '/'), what))
        L += ['', '## To decide with the user', '', '- Which of these admin screens to build (and anything the brief implies but does not say).', '- The names of things, in the brief\'s own words.',
              '- Who uses the admin (the roles above, or one admin).', '']
        text = '\n'.join(L)
        if a.out == '-':
            print(text); return
        out = a.out or os.path.join(root, 'ADMIN_PLAN.md')
        open(out, 'w', encoding='utf-8').write(text)
        print('Wrote %s: admin only (from the brief: %s), %d admin screens suggested.' % (out, why or '--source brief', len(sug))); return
    if a.json:
        print(json.dumps({'source': 'app', 'screens': [{'id': pid, 'title': p.get('title'), **d} for pid, p, d in inv], 'stories': st}, indent=1, ensure_ascii=False)); return
    L = ['# Admin plan (draft)', '', 'Written by dd-admin-panel-kamil/scripts/inventory.py from the phone screens and the brief. Evidence first; '
         'Claude names the things, checks them against the brief and asks which admin screens to build.', '', '## What the phone app has', '',
         '| Screen | Lists (repeated items) | Actions | Fields | Numbers |', '|---|---|---|---|---|']
    for pid, p, d in inv:
        L.append('| %s | %s | %s | %s | %s |' % (p.get('title') or pid, ', '.join('%s x%d' % r for r in d['repeats'][:3]) or '-', ', '.join(d['buttons'][:6]) or '-',
                                                 ', '.join(d['fields'][:5]) or '-', ', '.join(d['counts'][:4]) or '-'))
    L += ['', '## Admin screens this suggests', '', '| Admin screen | Why (evidence) | What it holds |', '|---|---|---|']
    for name, why, what in suggest(inv, st):
        L.append('| %s | %s | %s |' % (name, why, what))
    if st:
        L += ['', '## Stories and requirements about managing the app', ''] + ['- %s (%s)' % (t, f) for f, t in st]
    L += ['', '## To decide with the user', '', '- Which of these admin screens to build (and anything missing).', '- What the admin manages, in the app\'s own words (posts, orders, members...).',
          '- Who uses the admin (one role, or roles like moderator and owner).', '']
    text = '\n'.join(L)
    if a.out == '-':
        print(text); return
    out = a.out or os.path.join(root, 'ADMIN_PLAN.md')
    open(out, 'w', encoding='utf-8').write(text)
    print('Wrote %s: %d phone screens read, %d admin screens suggested.' % (out, len(inv), len(suggest(inv, st))))


if __name__ == '__main__':
    main()
