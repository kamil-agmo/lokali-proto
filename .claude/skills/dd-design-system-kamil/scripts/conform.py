#!/usr/bin/env python3
"""Move a prototype's spacing, text sizes and font weights onto the design system's scales (design-system.config.js).

  conform.py --project <dir>            list what is off the scales (changes nothing; use it before every deploy)
  conform.py --project <dir> --apply    change the values to the nearest allowed step, and back up the originals first

Looks at the app's own CSS (css/shared, css/pages except lock.css) and the screens (<style> blocks and style="" attributes).
Never touches the shell, icons (font sizes of icon selectors), calc() values, negative values, or values under 3 px / above the
largest spacing step (hairlines, status-bar and tab-bar room). Rounding and tap areas are listed only: they need a designer's eye,
so fix them by hand or record an approved exception. Re-check every screen with dev mode's Rules afterwards, including sheets,
dialogs, toasts and anything that appears after a delay.
"""
import argparse, glob, json, os, re, shutil, sys, time

def scales(root):
    t = open(os.path.join(root, 'design-system.config.js'), encoding='utf-8').read()
    t = re.sub(r'//[^\n]*', '', t)
    get = lambda k: json.loads((re.search(k + r'\s*:\s*(\[[^\]]*\])', t).group(1)).replace("'", '"'))
    return get('spacing'), get('fontSizes'), get('fontWeights'), get('radius')

def near(v, scale):
    nums = [s for s in scale if isinstance(s, (int, float))]
    return min(nums, key=lambda s: (abs(s - v), -s))   # ties go to the larger step

SPACE = re.compile(r'^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(gap|row-gap|column-gap)$')
ICON = re.compile(r'c-ico|\.ms\b|\.mi\b|icon|(^|[\s>,])i(\b|$)|\.ic\b|\.fa\b|\.ph\b|\.bi\b|burst|::-|thumb|track')
DECL = re.compile(r'(?<![\w-])([a-z-]+)(\s*:\s*)([^;{}"]+?)(\s*(?:;|(?=\})|(?="|$)))')

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--project', required=True); ap.add_argument('--apply', action='store_true')
    a = ap.parse_args(); root = os.path.abspath(a.project)
    if not os.path.exists(os.path.join(root, 'design-system.config.js')): sys.exit('No design-system.config.js: run install_ds.py first.')
    SP, FS, FW, RAD = scales(root); MAXSP = max(SP)
    found, manual = [], []

    def fix_value(prop, val):
        if 'calc' in val or 'var(' in val and not re.search(r'\d+px', val): return val
        if SPACE.match(prop):
            def r(m):
                v = float(m.group(1))
                if v < 3 or v > MAXSP or v in SP: return m.group(0)
                return '%dpx' % near(v, SP)
            return re.sub(r'(?<![-\w.])(\d+(?:\.\d+)?)px', r, val)
        if prop == 'font-size':
            return re.sub(r'^\s*(\d+(?:\.\d+)?)px', lambda m: m.group(0) if float(m.group(1)) in FS or float(m.group(1)) > max(FS) + 8 else '%dpx' % near(float(m.group(1)), FS), val)
        if prop == 'font-weight':
            return re.sub(r'^\s*(\d{3})\b', lambda m: m.group(0) if int(m.group(1)) in FW else str(near(int(m.group(1)), FW)), val)
        if prop == 'font':
            val = re.sub(r'^(\s*)(\d{3})\b', lambda m: m.group(0) if int(m.group(2)) in FW else m.group(1) + str(near(int(m.group(2)), FW)), val)
            return re.sub(r'(^|\s)(\d+(?:\.\d+)?)px(?=\s*/|\s)', lambda m: m.group(0) if float(m.group(2)) in FS else m.group(1) + '%dpx' % near(float(m.group(2)), FS), val, count=1)
        return val

    def decls(text, where, sel):
        sel = sel.split('*/')[-1].strip()   # drop a comment that ends just before the selector
        icon = bool(ICON.search(sel))
        def r(m):
            prop, val = m.group(1), m.group(3)
            if prop == 'border-radius':
                for v in re.findall(r'(?<![-\w.])(\d+(?:\.\d+)?)px', val):
                    if float(v) not in RAD and float(v) < 99: manual.append('%s [%s] border-radius %spx: not on the rounding scale %s (check by eye; pills/circles are fine)' % (where, sel.strip()[-40:], v, RAD))
                return m.group(0)
            if icon and prop in ('font-size', 'font'): return m.group(0)
            new = fix_value(prop, val)
            if new != val: found.append('%s [%s] %s: %s -> %s' % (where, sel.strip()[-40:], prop, val.strip(), new.strip()))
            return m.group(1) + m.group(2) + (new if a.apply else val) + m.group(4)
        return DECL.sub(r, text)

    def css(text, where):
        out, pos = [], 0
        for m in re.finditer(r'([^{}]*)\{([^{}]*)\}', text):
            out.append(text[pos:m.start()]); out.append(m.group(1) + '{' + decls(m.group(2), where, m.group(1)) + '}'); pos = m.end()
        if not out: return decls(text, where, '')
        out.append(text[pos:]); return ''.join(out)

    files = [f for f in glob.glob(os.path.join(root, 'css', 'shared', '*.css')) + glob.glob(os.path.join(root, 'css', 'pages', '*.css')) if not f.endswith(('lock.css', 'phone.css'))]
    files += [f for f in glob.glob(os.path.join(root, 'pages', '*.html')) if not f.endswith(('lock.html', 'design-system.html'))]
    backup = os.path.join(root, '.ds-backup', time.strftime('%Y%m%d-%H%M%S'))
    for f in files:
        rel = os.path.relpath(f, root); t = open(f, encoding='utf-8').read(); o = t
        if f.endswith('.css'): t = css(t, rel)
        else:
            t = re.sub(r'(<style>)([\s\S]*?)(</style>)', lambda m: m.group(1) + css(m.group(2), rel) + m.group(3), t)
            t = re.sub(r'(style=")([^"]*)(")', lambda m: m.group(1) + css(m.group(2), rel) + m.group(3), t)
        if a.apply and t != o:
            os.makedirs(os.path.dirname(os.path.join(backup, rel)), exist_ok=True); shutil.copy2(f, os.path.join(backup, rel))
            open(f, 'w', encoding='utf-8').write(t)
    print(('Changed' if a.apply else 'Off the scales (run with --apply to change)') + ': %d value(s)' % len(found))
    for x in found: print('  ' + x)
    if manual:
        print('\nRounding to check by hand (%d):' % len(manual))
        for x in manual: print('  ' + x)
    if a.apply and found: print('\nOriginals backed up in %s' % os.path.relpath(backup, root))
    print('\nThen re-check every screen with dev mode > Rules (tap areas and anything that appears later are only visible there).')

if __name__ == '__main__':
    main()
