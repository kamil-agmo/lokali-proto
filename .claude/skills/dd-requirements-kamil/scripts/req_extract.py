#!/usr/bin/env python3
"""Turn requirement files into plain text Claude can study, with source markers for tracing every requirement back.

  req_extract.py --out <scratch dir> <file or folder> [more files/folders...]

For each file it writes <out>/<name>.txt (with [page N] / [sheet X] / [slide N] markers) and prints an inventory:
type, size, pages/sheets/slides, characters extracted, and how to read it. Nothing is uploaded or changed.

Handled with no extra installs: .docx .xlsx .xlsm .pptx (zipped XML), .csv .tsv .txt .md .json .xml .html,
.doc .rtf .odt .pages-exported .webarchive (via macOS textutil when present).
PDFs and images are listed with their page count / size: read them with Claude's file reader (Read tool, PDFs with pages="1-20"),
which reads text, tables and pictures directly. Scanned PDFs work the same way.
"""
import argparse, csv, html, io, json, os, re, shutil, subprocess, sys, zipfile
from xml.etree import ElementTree as ET

TEXT = ('.txt', '.md', '.markdown', '.json', '.xml', '.yaml', '.yml')
IMG = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tif', '.tiff')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      's': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def docx(p):
    z = zipfile.ZipFile(p); body = ET.fromstring(z.read('word/document.xml')).find('w:body', NS); out = []
    W = '{%s}' % NS['w']

    def walk(node):   # paragraphs in reading order; a table becomes rows, at any depth, and is not repeated as paragraphs
        for el in node:
            tag = el.tag.split('}')[-1]
            if tag == 'tbl':
                out.append('')
                for row in el.iter(W + 'tr'):
                    cells = [' '.join(x.text or '' for x in c.iter(W + 't')).strip() for c in row.iter(W + 'tc')]
                    out.append('| ' + ' | '.join(cells) + ' |')
                out.append('')
            elif tag == 'p':
                t = ''.join(x.text or '' for x in el.iter(W + 't')).strip()
                if not t: continue
                st = el.find('.//w:pStyle', NS); lvl = st.get(W + 'val') if st is not None else ''
                num = el.find('.//w:numPr', NS) is not None
                h = re.match(r'(?i)heading\s*(\d)', lvl or '')
                out.append(('#' * int(h.group(1)) + ' ' if h else '- ' if num or 'List' in (lvl or '') else '') + t)
            else:
                walk(el)
    walk(body)
    return '\n'.join(out), {}


def xlsx(p):
    z = zipfile.ZipFile(p); names = z.namelist(); shared = []
    if 'xl/sharedStrings.xml' in names:
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter('{%s}si' % NS['s']):
            shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['s'])))
    wb = ET.fromstring(z.read('xl/workbook.xml')); rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = {r.get('Id'): r.get('Target') for r in rels}
    out, sheets = [], []
    for sh in wb.iter('{%s}sheet' % NS['s']):
        name = sh.get('name'); rid = sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        path = 'xl/' + target[rid].lstrip('/').replace('xl/', '') if rid in target else None
        if not path or path not in names: continue
        sheets.append(name); out.append('\n[sheet %s]' % name)
        for row in ET.fromstring(z.read(path)).iter('{%s}row' % NS['s']):
            vals = []
            for c in row.iter('{%s}c' % NS['s']):
                v = c.find('{%s}v' % NS['s']); t = c.get('t')
                if t == 'inlineStr': val = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['s']))
                elif v is None: val = ''
                elif t == 's': val = shared[int(v.text)]
                else: val = v.text or ''
                vals.append(val.replace('\n', ' ').strip())
            if any(vals): out.append('| ' + ' | '.join(vals) + ' |')
    return '\n'.join(out), {'sheets': len(sheets)}


def pptx(p):
    z = zipfile.ZipFile(p); slides = sorted([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)], key=lambda n: int(re.findall(r'\d+', n)[-1]))
    out = []
    for i, s in enumerate(slides, 1):
        out.append('\n[slide %d]' % i)
        for para in ET.fromstring(z.read(s)).iter('{%s}p' % NS['a']):
            t = ''.join(x.text or '' for x in para.iter('{%s}t' % NS['a'])).strip()
            if t: out.append(t)
        note = 'ppt/notesSlides/notesSlide%d.xml' % i
        if note in z.namelist():
            nt = ' '.join(x.text or '' for x in ET.fromstring(z.read(note)).iter('{%s}t' % NS['a'])).strip()
            if nt and not nt.isdigit(): out.append('(speaker notes) ' + nt)
    return '\n'.join(out), {'slides': len(slides)}


def table(p, delim):
    rows = list(csv.reader(open(p, encoding='utf-8', errors='ignore'), delimiter=delim))
    return '\n'.join('| ' + ' | '.join(r) + ' |' for r in rows if any(c.strip() for c in r)), {'rows': len(rows)}


def html_text(p):
    t = open(p, encoding='utf-8', errors='ignore').read()
    t = re.sub(r'(?is)<(script|style).*?</\1>', '', t); t = re.sub(r'(?i)<br\s*/?>|</(p|div|li|h\d|tr)>', '\n', t)
    return html.unescape(re.sub(r'<[^>]+>', '', t)), {}


def textutil(p):
    if not shutil.which('textutil'): return None, {}
    r = subprocess.run(['textutil', '-convert', 'txt', '-stdout', p], capture_output=True, text=True)
    return (r.stdout, {}) if r.returncode == 0 else (None, {})


def pdf_pages(p):
    data = open(p, 'rb').read()
    n = len(re.findall(rb'/Type\s*/Page[^s]', data))
    return n or None


def handle(p, out_dir):
    ext = os.path.splitext(p)[1].lower(); size = os.path.getsize(p); info = {'file': p, 'type': ext[1:] or '?', 'kb': round(size / 1024)}
    text, meta = None, {}
    try:
        if ext == '.docx': text, meta = docx(p)
        elif ext in ('.xlsx', '.xlsm'): text, meta = xlsx(p)
        elif ext == '.pptx': text, meta = pptx(p)
        elif ext == '.csv': text, meta = table(p, ',')
        elif ext == '.tsv': text, meta = table(p, '\t')
        elif ext in ('.html', '.htm'): text, meta = html_text(p)
        elif ext in TEXT: text = open(p, encoding='utf-8', errors='ignore').read()
        elif ext in ('.doc', '.rtf', '.odt', '.webarchive', '.wordml'): text, meta = textutil(p)
        elif ext == '.pdf':
            info.update(pages=pdf_pages(p), read='Read tool with pages="1-20", then "21-40"... (text, tables and images are read directly)')
        elif ext in IMG:
            info['read'] = 'Read tool (Claude sees the image: screenshots, wireframes, photos of whiteboards)'
        else:
            info['read'] = 'not supported: ask the user to export it as PDF, DOCX, XLSX or CSV'
    except Exception as e:
        info['read'] = 'could not open (%s): ask for another format' % e.__class__.__name__
    info.update(meta)
    if text is not None:
        name = re.sub(r'[^A-Za-z0-9._-]+', '_', os.path.basename(p)) + '.txt'
        dst = os.path.join(out_dir, name)
        open(dst, 'w', encoding='utf-8').write('[source %s]\n%s' % (os.path.basename(p), text))
        info.update(chars=len(text), tokens_approx=len(text) // 4, text=dst,
                    read='Read %s%s' % (dst, ' in parts (offset/limit), it is long' if len(text) > 60000 else ''))
    return info


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', required=True); ap.add_argument('paths', nargs='+'); ap.add_argument('--json', action='store_true')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); files = []
    for p in a.paths:
        p = os.path.expanduser(p)
        if os.path.isdir(p):
            for dp, dn, fn in os.walk(p):
                dn[:] = [d for d in dn if not d.startswith('.')]
                files += [os.path.join(dp, f) for f in sorted(fn) if not f.startswith(('.', '~$'))]
        elif os.path.exists(p): files.append(p)
        else: print('not found: %s' % p, file=sys.stderr)
    res = [handle(f, a.out) for f in files]
    if a.json:
        print(json.dumps(res, indent=1)); return
    total = 0
    for r in res:
        extra = ', '.join('%s %s' % (k, r[k]) for k in ('pages', 'sheets', 'slides', 'rows') if r.get(k))
        tok = r.get('tokens_approx'); total += tok or 0
        print('- %s (%s, %d KB%s%s)\n    -> %s' % (os.path.basename(r['file']), r['type'], r['kb'], ', ' + extra if extra else '', ', ~%d tokens' % tok if tok else '', r.get('read', '')))
    print('\n%d file(s). Extracted text: ~%d tokens in total (PDFs and images are read separately).' % (len(res), total))


if __name__ == '__main__':
    main()
