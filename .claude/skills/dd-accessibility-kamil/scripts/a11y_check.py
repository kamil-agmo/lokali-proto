#!/usr/bin/env python3
"""Accessibility check for a prototype (dd-accessibility-kamil). Prints only failures.

  a11y_check.py check   --project <dir> [--static] [--json] [--target 44] [--level AA]
  a11y_check.py section --project <dir> --level AA|AAA --target 44|48

Pages: pages/*.html (the screens); without pages/, every *.html at the root.
Code check: alt, names on icon-only controls, field labels, lang, heading order, zoom, tabindex, autoplay, reduced motion.
Live check (headless Google Chrome, 402 x 874, skipped with --static or without Chrome): text contrast and tap target size.
For the live check each page is copied next to itself as .a11y-<name>.html with a measuring script, read, then deleted.
Skip an element with data-a11y-ok. Level and target default to DESIGN.md "## Accessibility", else AA and 44.
"""
import argparse, glob, json, os, re, subprocess, sys
from html.parser import HTMLParser

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
LIMIT = 8
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'area', 'col', 'embed', 'track', 'param'}
ICON_CLASS = re.compile(r'^(mi|ms|c-ico|icon|material-symbols\S*|material-icons\S*|fa|fa-\S+|ph|bi)$')

LIVE_JS = r"""
(function(){
var T=%(target)d, AAA=%(aaa)s, out={contrast:[],target:[],name:[]};
function rgb(c){var m=(c||'').match(/rgba?\(([^)]+)\)/);if(!m)return null;var a=m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);return [a[0],a[1],a[2],a.length>3?a[3]:1];}
function L(c){return [0,1,2].map(function(i){var v=c[i]/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}).reduce(function(s,v,i){return s+v*[0.2126,0.7152,0.0722][i];},0);}
function bg(el){var ls=[];for(var e=el;e;e=e.parentElement){var cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage!=='none'&&!/gradient/.test(cs.backgroundImage))return null;var c=rgb(cs.backgroundColor);if(cs.backgroundImage&&/gradient/.test(cs.backgroundImage)){var g=cs.backgroundImage.match(/rgba?\([^)]+\)/);if(g)c=rgb(g[0]);}if(c&&c[3]>0){ls.push(c);if(c[3]>=1)break;}}var o=[255,255,255];for(var i=ls.length-1;i>=0;i--){var c=ls[i];o=[0,1,2].map(function(k){return c[k]*c[3]+o[k]*(1-c[3]);});}return o;}
function sel(e){var s=e.tagName.toLowerCase();if(e.id)return s+'#'+e.id;var c=(e.getAttribute('class')||'').trim().split(/\s+/)[0];return c?s+'.'+c:s;}
function vis(e){var r=e.getBoundingClientRect(),cs=getComputedStyle(e);if(!(r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'))return false;var o=1;for(var x=e;x;x=x.parentElement){o*=parseFloat(getComputedStyle(x).opacity);}return o>0.1;}
function skip(e){return e.closest('[data-a11y-ok],[aria-hidden="true"],svg,script,style,noscript');}
var seen={};
document.querySelectorAll('body *').forEach(function(e){
  if(skip(e)||!vis(e))return;
  var own=[].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim().length>1;});
  if(!own)return;
  var cs=getComputedStyle(e);if(/Material|Symbols|Icons|FontAwesome/i.test(cs.fontFamily))return;
  var f=rgb(cs.color),b=bg(e);if(!f||!b)return;
  var fc=[0,1,2].map(function(k){return f[k]*f[3]+b[k]*(1-f[3]);});
  var l1=L(fc),l2=L(b),r=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  var px=parseFloat(cs.fontSize),big=px>=24||(px>=18.66&&parseInt(cs.fontWeight)>=700);
  var need=AAA?(big?4.5:7):(big?3:4.5);
  if(r<1.05)return;   /* same colour as its background: hidden on purpose (e.g. a title that fades in on scroll) */
  if(cs.webkitTextFillColor&&cs.webkitTextFillColor!==cs.color)return;
  if(r<need){var k=sel(e)+Math.round(r*10);if(seen[k])return;seen[k]=1;out.contrast.push({el:sel(e),text:e.textContent.trim().slice(0,40),ratio:Math.round(r*100)/100,need:need});}
});
document.querySelectorAll('a,button,input,select,textarea,summary,[role=button],[role=tab],[role=switch],[onclick]').forEach(function(e){
  if(skip(e)||!vis(e))return;if(e.type==='hidden')return;
  if(e.tagName==='A'&&e.parentElement&&/^(P|LI|SPAN|SMALL|TD)$/.test(e.parentElement.tagName)&&e.parentElement.textContent.trim().length>e.textContent.trim().length+8)return;
  var r=e.getBoundingClientRect(),hit=e.closest('label')||e;var hr=hit.getBoundingClientRect();
  var w=Math.max(r.width,hr.width),h=Math.max(r.height,hr.height);
  if(w<T-0.5||h<T-0.5)out.target.push({el:sel(e),text:(e.getAttribute('aria-label')||e.textContent||e.value||'').trim().slice(0,30),w:Math.round(w),h:Math.round(h)});
});
document.querySelectorAll('a[href],button,[role=button]').forEach(function(e){
  if(skip(e)||!vis(e))return;
  var n=(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.getAttribute('title')||'').trim();
  if(!n){var c=e.cloneNode(true);c.querySelectorAll('[aria-hidden="true"],.mi,.ms,.material-symbols-rounded,.material-symbols-outlined,.material-icons,svg').forEach(function(x){x.remove();});n=c.textContent.trim();if(!n){var im=e.querySelector('img[alt]');n=im?im.alt.trim():'';}}
  if(!n)out.name.push({el:sel(e)});
});
var p=document.createElement('pre');p.id='__a11y';p.textContent=JSON.stringify(out);document.body.appendChild(p);
})();
"""


class Code(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.f, self.stack, self.heads, self.lang, self.viewport = [], [], [], None, ''
        self.ctrl = None      # [tag, attrs, text, has_icon]
        self.labels_for = set()
        self.inputs = []
        self.icon_depth = 0

    def ok(self):
        return any(o for _, o in self.stack)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = (a.get('class') or '').split()
        ok = 'data-a11y-ok' in a
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'meta' and a.get('name') == 'viewport':
            self.viewport = a.get('content') or ''
        skip = ok or self.ok()
        if tag == 'img' and not skip and a.get('alt') is None:
            self.f.append(('alt', 'img ' + (a.get('src') or '')[-40:], 'add alt (alt="" if decorative)'))
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6') and not skip:
            self.heads.append(int(tag[1]))
        if a.get('tabindex') and a['tabindex'].lstrip('-').isdigit() and int(a['tabindex']) > 0 and not skip:
            self.f.append(('tabindex', '%s tabindex=%s' % (tag, a['tabindex']), 'remove; use the DOM order'))
        if tag in ('video', 'audio') and 'autoplay' in a and 'muted' not in a and not skip:
            self.f.append(('autoplay', tag, 'mute it or add a play button'))
        if tag == 'label' and a.get('for'):
            self.labels_for.add(a['for'])
        if tag in ('input', 'select', 'textarea') and not skip and a.get('type') not in ('hidden', 'submit', 'button', 'reset', 'image'):
            self.inputs.append((a.get('id'), a.get('aria-label') or a.get('aria-labelledby') or a.get('title'), a.get('placeholder') or a.get('name') or tag, any(t == 'label' for t, _ in self.stack)))
        is_icon = a.get('aria-hidden') == 'true' or any(ICON_CLASS.match(c) for c in cls) or tag == 'svg'
        if tag in ('button', 'a') and not skip:
            self.ctrl = [tag, a, '', False]
        elif self.ctrl and (is_icon or tag == 'img'):
            self.ctrl[3] = True
            if tag == 'img' and a.get('alt'):
                self.ctrl[2] += ' ' + a['alt']
        if tag not in VOID:
            self.stack.append((tag, ok))
            if self.ctrl and is_icon and not self.icon_depth:
                self.icon_depth = len(self.stack)   # text inside is an icon name, not a label

    def handle_endtag(self, tag):
        if self.ctrl and tag == self.ctrl[0]:
            t, a, text, icon = self.ctrl
            name = (a.get('aria-label') or a.get('aria-labelledby') or a.get('title') or '').strip() or text.strip()
            if not name:
                self.f.append(('name', '%s%s' % (t, ('.' + (a.get('class') or '').split()[0]) if a.get('class') else ''), 'icon-only %s: add aria-label' % t))
            self.ctrl = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                if self.icon_depth and i < self.icon_depth:
                    self.icon_depth = 0
                del self.stack[i:]; break

    def handle_data(self, data):
        if self.ctrl and not self.icon_depth:
            self.ctrl[2] += data


def design(root):
    p = os.path.join(root, 'DESIGN.md')
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    m = re.search(r'^## Accessibility\n(.*?)(?=^## |\Z)', t, re.S | re.M)
    w = m.group(1) if m else ''
    lv = 'AAA' if re.search(r'\bAAA\b', w) else 'AA'
    tg = int((re.search(r'(\d{2}) ?[×x] ?\d{2}', w) or [0, 44])[1])
    return lv, tg


def pages(root):
    p = sorted(glob.glob(os.path.join(root, 'pages', '*.html')))
    return p or sorted(f for f in glob.glob(os.path.join(root, '*.html')) if os.path.basename(f) != 'credits.html')


def code_check(f):
    c = Code()
    src = open(f, encoding='utf-8', errors='ignore').read()
    try:
        c.feed(src)
    except Exception:
        pass
    out = list(c.f)
    if not c.lang:
        out.append(('lang', 'html', 'add lang="en" (or "ms")'))
    if re.search(r'user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b', c.viewport):
        out.append(('zoom', 'meta viewport', 'remove maximum-scale / user-scalable'))
    if c.heads:
        if c.heads.count(1) > 1:
            out.append(('heading', 'h1 x%d' % c.heads.count(1), 'one h1 per screen'))
        for a, b in zip(c.heads, c.heads[1:]):
            if b > a + 1:
                out.append(('heading', 'h%d after h%d' % (b, a), 'no skipped levels')); break
    for iid, aria, ph, wrapped in c.inputs:
        if not aria and not wrapped and not (iid and iid in c.labels_for):
            out.append(('label', 'field "%s"' % ph[:30], 'add a visible <label for> (or aria-label)'))
    return out


def motion_check(root):
    css = ''.join(open(f, encoding='utf-8', errors='ignore').read() for f in glob.glob(os.path.join(root, '**', '*.css'), recursive=True)
                  if '/node_modules/' not in f)
    html_ = ''.join(open(f, encoding='utf-8', errors='ignore').read() for f in pages(root))
    anim = re.search(r'@keyframes|animation\s*:', css + html_)
    if anim and 'prefers-reduced-motion' not in css + html_:
        return [('motion', 'animations', 'add @media (prefers-reduced-motion: reduce) to stop loops')]
    return []


def live_check(f, target, aaa):
    d, base = os.path.dirname(f), os.path.basename(f)
    tmp = os.path.join(d, '.a11y-' + base)
    src = open(f, encoding='utf-8', errors='ignore').read()
    js = '<script>window.addEventListener("load",function(){setTimeout(function(){%s},600)});</script>' % (LIVE_JS % {'target': target, 'aaa': 'true' if aaa else 'false'})
    src = src.replace('</body>', js + '</body>', 1) if '</body>' in src else src + js
    open(tmp, 'w', encoding='utf-8').write(src)
    try:
        r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=402,874', '--virtual-time-budget=6000',
                            '--allow-file-access-from-files', '--dump-dom', 'file://' + tmp], capture_output=True, text=True, timeout=60)
        m = re.search(r'<pre id="__a11y">(.*?)</pre>', r.stdout, re.S)
        if not m:
            return None
        import html as h
        return json.loads(h.unescape(m.group(1)))
    except Exception:
        return None
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def dedupe(rows, keys):
    out, seen = [], {}
    for x in rows:
        k = tuple(x.get(q) for q in keys)
        if k in seen:
            seen[k]['n'] = seen[k].get('n', 1) + 1
        else:
            seen[k] = x; out.append(x)
    return out


def times(x):
    return ' ×%d' % x['n'] if x.get('n', 1) > 1 else ''


def check(root, static, as_json, target, level):
    lv, tg = design(root)
    level, target = level or lv, target or tg
    live = not static and os.path.exists(CHROME)
    res = {}
    for f in pages(root):
        rel = os.path.relpath(f, root)
        items = [{'kind': k, 'el': e, 'fix': x} for k, e, x in code_check(f)]
        if live:
            d = live_check(f, target, level == 'AAA')
            if d is None:
                items.append({'kind': 'live', 'el': '-', 'fix': 'live check skipped: the page redirects or never finishes loading (code check still ran)'})
            else:
                items = [it for it in items if it['kind'] != 'name']   # the rendered page decides (scripts may fill names in)
                d['contrast'], d['target'], d['name'] = dedupe(d['contrast'], ('el', 'text')), dedupe(d['target'], ('el', 'text')), dedupe(d.get('name', []), ('el',))
                for c in d['name'][:LIMIT]:
                    items.append({'kind': 'name', 'el': c['el'] + times(c), 'fix': 'icon-only control: add aria-label'})
                for c in d['contrast'][:LIMIT]:
                    items.append({'kind': 'contrast', 'el': '%s "%s"%s' % (c['el'], c['text'], times(c)), 'fix': '%.2f : 1, needs %.1f : 1' % (c['ratio'], c['need'])})
                for t in d['target'][:LIMIT]:
                    items.append({'kind': 'target', 'el': '%s "%s"%s' % (t['el'], t['text'], times(t)), 'fix': '%d × %d, needs %d × %d' % (t['w'], t['h'], target, target)})
        if items:
            res[rel] = items
    m = motion_check(root)
    if m:
        res['(all pages)'] = [{'kind': k, 'el': e, 'fix': x} for k, e, x in m]
    if as_json:
        print(json.dumps({'level': level, 'target': target, 'live': live, 'pages': res}, indent=1, ensure_ascii=False)); return 0
    print('Accessibility check · WCAG 2.2 %s · targets %d × %d · %s' % (level, target, target, 'code + live' if live else 'code only'))
    if not res:
        print('No findings.'); return 0
    n = 0
    for page, items in res.items():
        print('\n' + page)
        for it in items:
            print('  %-9s %s  → %s' % (it['kind'], it['el'][:60], it['fix'])); n += 1
    kinds = {}
    for items in res.values():
        for it in items:
            kinds[it['kind']] = kinds.get(it['kind'], 0) + 1
    print('\n%d findings: %s' % (n, ', '.join('%s %d' % kv for kv in sorted(kinds.items()))))
    return 0


def section(root, level, target):
    p = os.path.join(root, 'DESIGN.md')
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else '# Design\n'
    block = '\n'.join(['## Accessibility', '', 'Follows dd-accessibility-kamil.', '',
                       '- **Level:** WCAG 2.2 %s (text contrast %s, large text and icons %s).' % (level, '7 : 1' if level == 'AAA' else '4.5 : 1', '4.5 : 1' if level == 'AAA' else '3 : 1'),
                       '- **Tap targets:** %d × %d at least.' % (target, target),
                       '- **Text:** sizes in rem, readable at 200 %% zoom; zoom never blocked.',
                       '- **Motion:** loops stop with prefers-reduced-motion.',
                       '- **Exceptions:** none yet (mark with data-a11y-ok and list here with the reason).', ''])
    if re.search(r'^## Accessibility\n', t, re.M):
        t = re.sub(r'^## Accessibility\n.*?(?=^## |\Z)', block + '\n', t, count=1, flags=re.S | re.M)
    else:
        t = t.rstrip('\n') + '\n\n' + block
    open(p, 'w', encoding='utf-8').write(t)
    print('Wrote "## Accessibility" in %s' % p)
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('check'); c.add_argument('--project', required=True); c.add_argument('--static', action='store_true')
    c.add_argument('--json', action='store_true'); c.add_argument('--target', type=int); c.add_argument('--level', choices=('AA', 'AAA'))
    s = sub.add_parser('section'); s.add_argument('--project', required=True); s.add_argument('--level', choices=('AA', 'AAA'), default='AA')
    s.add_argument('--target', type=int, choices=(44, 48), default=44)
    a = ap.parse_args()
    root = os.path.abspath(a.project)
    if not os.path.isdir(root):
        sys.exit('No such folder: ' + root)
    return check(root, a.static, a.json, a.target, a.level) if a.cmd == 'check' else section(root, a.level, a.target)


if __name__ == '__main__':
    sys.exit(main())
