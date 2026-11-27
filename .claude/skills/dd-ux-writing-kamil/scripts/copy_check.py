#!/usr/bin/env python3
"""Check a prototype's interface text against the UX writing guide (dd-ux-writing-kamil). Read-only.

  copy_check.py check   --project <dir> [--json]
  copy_check.py section --project <dir> --voice neutral|light|brand --case sentence|title --locale en-GB|en-US [--terms "Sign in,Delete,Settings"]

check reads every page (pages/*.html, or *.html at the root; also index.html) and reports, per page:
  chatty     "you/your", "we/our", "please", "oops", "sorry", "!" in interface text (buttons, labels, badges, toasts, headings)
  vague      buttons and links that don't say what they do (OK, Submit, Yes, No, Click here, Read more)
  case       Title Case in labels when DESIGN.md says sentence case
  long       buttons over 3 words or 24 characters
  dots       "..." instead of the ellipsis character
  label      inputs whose only label is the placeholder
  terms      two words for the same action across the prototype (Sign in and Log in, Delete and Remove...)
Elements (or their parents) with data-copy-ok are skipped. Voice "light" or "brand" turns chatty findings into notes.
section writes the choices into DESIGN.md under "## Writing" (replacing an older one).
"""
import argparse, glob, json, os, re, sys
from html.parser import HTMLParser

CHATTY = re.compile(r"\b(you|your|yours|you're|we|our|we're|let's|please|oops|whoops|sorry|yay|awesome|hooray)\b|!", re.I)
ALLOWED = {'for you', 'following', 'about you'}   # standard feed and profile tab names
VAGUE = re.compile(r"^(ok|okay|submit|yes|no|go|click here|here|more|read more|learn more|continue|next)$", re.I)
SYNONYMS = [('Sign in', r'\bsign ?in\b', 'Log in', r'\blog ?in\b|\blogin\b'), ('Sign out', r'\bsign ?out\b', 'Log out', r'\blog ?out\b|\blogout\b'),
            ('Delete', r'\bdelete\b', 'Remove', r'\bremove\b'), ('Settings', r'\bsettings\b', 'Preferences', r'\bpreferences\b'),
            ('Sign up', r'\bsign ?up\b', 'Register', r'\bregister\b')]
SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'template', 'code', 'pre'}
UI_TAGS = {'button', 'a', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'summary', 'th', 'option', 'legend', 'caption', 'figcaption'}
UI_CLASS = re.compile(r'(^|[-_])(btn|button|badge|chip|tag|pill|toast|snack|banner|label|title|meta|status|empty|tab|menu|nav)([-_]|$)', re.I)
ICON_CLASS = re.compile(r'^(mi|ms|c-ico|icon|material-symbols\S*|material-icons\S*|fa|ph|bi)$')
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'area', 'col', 'embed', 'track', 'param'}


class Page(HTMLParser):
    """Collects (kind, text, context) for every visible string and attribute."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.items, self.inputs, self.labels_for = [], [], [], set()

    def ctx(self):
        tags = [t for t, _, _ in self.stack]
        if any(t in SKIP_TAGS for t in tags) or any(ok for _, _, ok in self.stack):
            return None
        ui = next((t for t, c, _ in reversed(self.stack) if t in UI_TAGS or UI_CLASS.search(c or '')), None)
        return ui or 'text'

    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = a.get('class') or ''
        icon = a.get('aria-hidden') == 'true' or any(ICON_CLASS.match(c) for c in cls.split())
        ok = 'data-copy-ok' in a or icon
        if tag in ('input', 'textarea', 'select'):
            self.inputs.append((a.get('id'), a.get('placeholder'), a.get('aria-label') or a.get('aria-labelledby') or a.get('title'), a.get('type')))
        if tag == 'label' and a.get('for'):
            self.labels_for.add(a['for'])
        c = self.ctx()
        if c is not None and not ok:
            for k in ('aria-label', 'title', 'placeholder', 'alt'):
                if a.get(k):
                    self.items.append((k, a[k].strip(), tag))
        if tag not in VOID:
            self.stack.append((tag, cls, ok))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]; break

    def handle_data(self, data):
        t = re.sub(r'\s+', ' ', data).strip()
        c = self.ctx()
        if t and c is not None and re.search(r'[A-Za-z]', t):
            self.items.append((c, t, c))


def design(root):
    p = os.path.join(root, 'DESIGN.md')
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    m = re.search(r'^## Writing\n(.*?)(?=^## |\Z)', t, re.S | re.M)
    w = m.group(1) if m else ''
    voice = 'light' if re.search(r'light touch', w, re.I) else 'brand' if re.search(r'brand voice', w, re.I) else 'neutral'
    case = 'title' if re.search(r'title case', w, re.I) else 'sentence'
    return voice, case, bool(m)


def names(root):
    """The app's own name(s): product names keep their case."""
    out = set()
    cfg = os.path.join(root, 'shell.config.js')
    if os.path.exists(cfg):
        out |= set(re.findall(r"\b(?:name|title|app)\s*:\s*['\"]([^'\"]{2,60})['\"]", open(cfg, encoding='utf-8', errors='ignore').read()))
    idx = os.path.join(root, 'index.html')
    if os.path.exists(idx):
        m = re.search(r'<title>([^<]+)</title>', open(idx, encoding='utf-8', errors='ignore').read())
        if m:
            out |= {x.strip() for x in re.split(r'[·|–-]', m.group(1)) if x.strip()}
    return {x.lower() for x in out}


def pages(root):
    files = sorted(set(glob.glob(os.path.join(root, 'pages', '*.html')) + glob.glob(os.path.join(root, '*.html'))))
    return [f for f in files if os.path.basename(f) not in ('credits.html',)]


def title_case(t):
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z'’-]*", t)]
    small = {'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'at', 'by', 'with', 'v'}
    big = [w for w in words[1:] if w.lower() not in small]
    return len(words) >= 3 and len(big) >= 2 and all(w[0].isupper() and not w.isupper() for w in big)


def check(root, as_json):
    voice, case, has_section = design(root)
    findings, all_text, own = [], [], names(root)
    for f in pages(root):
        pg = Page()
        try:
            pg.feed(open(f, encoding='utf-8', errors='ignore').read())
        except Exception:
            continue
        rel = os.path.relpath(f, root)
        seen = set()
        for kind, text, tag in pg.items:
            all_text.append(text)
            key = (kind, text)
            if key in seen:
                continue
            seen.add(key)
            short = len(text) <= 80
            is_ui = kind != 'text' or short
            if is_ui and CHATTY.search(text) and text.lower().strip(' .') not in ALLOWED:
                findings.append((rel, 'chatty' if voice == 'neutral' or kind != 'text' else 'note', text, 'neutral label: states and actions, no "you/we/please/!"'))
            if tag in ('button', 'a') and kind == tag and VAGUE.match(text.strip(' .')):
                findings.append((rel, 'vague', text, 'verb + noun: "Save draft", "Delete post"'))
            if tag == 'button' and kind == 'button' and (len(text.split()) > 4 or len(text) > 28):
                findings.append((rel, 'long', text, 'buttons: 1-3 words is best, 4 at most'))
            if case == 'sentence' and kind != 'text' and short and title_case(text) and text.lower() not in own:
                findings.append((rel, 'case', text, 'sentence case: capitalise the first word only'))
            if '...' in text:
                findings.append((rel, 'dots', text, 'use the ellipsis character "…"'))
        for iid, ph, aria, typ in pg.inputs:
            if ph and not aria and not (iid and iid in pg.labels_for) and typ not in ('hidden', 'submit', 'button', 'checkbox', 'radio'):
                findings.append((rel, 'label', ph, 'add a visible label (or aria-label); a placeholder is only an example'))
    joined = ' \n '.join(all_text)
    for a_name, a_rx, b_name, b_rx in SYNONYMS:
        if re.search(a_rx, joined, re.I) and re.search(b_rx, joined, re.I):
            findings.append(('(all pages)', 'terms', '%s and %s' % (a_name, b_name), 'pick one word and use it everywhere'))
    if as_json:
        print(json.dumps({'voice': voice, 'case': case, 'designSection': has_section,
                          'findings': [dict(zip(('page', 'kind', 'text', 'fix'), x)) for x in findings]}, indent=1, ensure_ascii=False)); return 0
    print('UX writing check · voice: %s · case: %s%s' % (voice, case, '' if has_section else ' (no "## Writing" in DESIGN.md: defaults)'))
    if not findings:
        print('No findings.'); return 0
    last = None
    for page, kind, text, fix in sorted(findings, key=lambda x: (x[0], x[1])):
        if page != last:
            print('\n' + page); last = page
        print('  %-6s "%s"  → %s' % (kind, text[:70] + ('…' if len(text) > 70 else ''), fix))
    counts = {}
    for _, k, _, _ in findings:
        counts[k] = counts.get(k, 0) + 1
    print('\n%d findings: %s' % (len(findings), ', '.join('%s %d' % kv for kv in sorted(counts.items()))))
    return 0


def section(root, voice, case, locale, terms):
    p = os.path.join(root, 'DESIGN.md')
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else '# Design\n'
    vtext = {'neutral': 'Neutral labels: interface text names states and actions; no "you/your", "we/our", "please" or "!".',
             'light': 'Neutral with a light touch: interface text is neutral; help and onboarding may address the reader.',
             'brand': 'Brand voice (see the brief), still short and clear.'}[voice]
    dates = '23 Nov 2026 (short: 23 Nov)' if locale.lower() == 'en-gb' else 'Nov 23, 2026 (short: Nov 23)' if locale.lower() == 'en-us' else 'per ' + locale
    lines = ['## Writing', '', 'Follows dd-ux-writing-kamil (`references/guide.md`).', '',
             '- **Voice:** ' + vtext,
             '- **Case:** ' + ('Sentence case everywhere.' if case == 'sentence' else 'Title Case for buttons, menus and titles; sentence case elsewhere.'),
             '- **Locale:** %s · dates %s · numbers as digits.' % (locale, dates),
             '- **Buttons:** verb + noun, 1-3 words. **Toasts and banners:** what happened · what\'s next. **Errors:** what went wrong · how to fix.']
    if terms:
        lines.append('- **Terms:** ' + ', '.join(x.strip() for x in terms.split(',') if x.strip()) + ' (one word per action, everywhere).')
    block = '\n'.join(lines) + '\n'
    if re.search(r'^## Writing\n', t, re.M):
        t = re.sub(r'^## Writing\n.*?(?=^## |\Z)', block + '\n', t, count=1, flags=re.S | re.M)
    else:
        t = t.rstrip('\n') + '\n\n' + block
    open(p, 'w', encoding='utf-8').write(t)
    print('Wrote "## Writing" in %s' % p)
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('check'); c.add_argument('--project', required=True); c.add_argument('--json', action='store_true')
    s = sub.add_parser('section'); s.add_argument('--project', required=True)
    s.add_argument('--voice', choices=('neutral', 'light', 'brand'), default='neutral')
    s.add_argument('--case', choices=('sentence', 'title'), default='sentence')
    s.add_argument('--locale', default='en-GB'); s.add_argument('--terms', default='')
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    if not os.path.isdir(root):
        sys.exit('No such folder: ' + root)
    return check(root, a.json) if a.cmd == 'check' else section(root, a.voice, a.case, a.locale, a.terms)


if __name__ == '__main__':
    sys.exit(main())
