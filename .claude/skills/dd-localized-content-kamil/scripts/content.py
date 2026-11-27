#!/usr/bin/env python3
"""Localized sample content for prototypes (dd-localized-content-kamil). Malaysia by default.

  content.py gen <kind> [--n 6] [--seed 1] [--mix malay,chinese,indian,east] [--cat food] [--format json|csv|lines]
      kinds: people, addresses, phones, products, orders, messages, dates, plates, businesses, places
      places = map points (name, address, lat, lng); --cat narrows them to a city, state or area, e.g. --cat "Kuala Lumpur"
  content.py scan --project <dir>          find placeholder content (Lorem ipsum, John Doe, $9.99, 123 Main St, example.com...)
  content.py section --project <dir> [--market Malaysia] [--language "English, some Malay"] [--mix "..."]

Output is compact (one record per line) so it costs few tokens; the same --seed gives the same data every time, so a
person, order or price stays the same across screens. Data: assets/<market>.json (my.json = Malaysia).
"""
import argparse, glob, json, os, random, re, sys, time
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))


def load(market='my'):
    p = os.path.join(HERE, '..', 'assets', market + '.json')
    if not os.path.exists(p):
        sys.exit('No data for market "%s" (assets/%s.json). Malaysia is my.json.' % (market, market))
    return json.load(open(p, encoding='utf-8'))


def money(d, v):
    return d['currency']['format'].replace('{amount}', '{:,.2f}'.format(v))


def price(r, lo, hi):
    v = r.uniform(lo, hi)
    end = r.choice([0.90, 0.50, 0.00, 0.90, 0.90])
    v = int(v) + end if v >= 10 else round(v * 10) / 10
    return round(max(lo, min(hi, v)), 2)


def person(d, r, mix):
    g = r.choice(['male', 'female'])
    grp = r.choice(mix)
    n = d['names'][grp]
    if grp == 'malay':
        first, father = r.choice(n[g]), r.choice(n['father'])
        full, short = '%s %s %s' % (first, n['link'][g], father), '%s %s' % (first.split()[0], father)
    elif grp == 'chinese':
        sur, first = r.choice(n['surname']), r.choice(n[g])
        full = '%s %s' % (sur, first) if ' ' in first else '%s %s' % (first, sur)
        short = full
    elif grp == 'indian':
        first, father = r.choice(n[g]), r.choice(n['father'])
        full, short = '%s %s %s' % (first, n['link'][g], father), '%s %s' % (first, father)
    else:
        first, sur = r.choice(n[g]), r.choice(n['surname'])
        full, short = '%s %s' % (first, sur), '%s %s' % (first, sur.replace('anak ', ''))
    user = re.sub(r'[^a-z.]', '', short.lower().replace(' ', '.'))
    return {'name': short, 'full_name': full, 'gender': g, 'group': grp, 'username': user + str(r.randint(7, 99)),
            'email': '%s%d@%s' % (user, r.randint(80, 99), r.choice(d['email_domains'])), 'phone': phone(d, r)}


def phone(d, r):
    p = r.choice(d['phone_prefixes'])
    if p == '011':
        return '+60 11-%04d %04d' % (r.randint(1000, 9999), r.randint(0, 9999))
    return '+60 %s-%03d %04d' % (p[1:], r.randint(200, 999), r.randint(0, 9999))


def address(d, r):
    pl = r.choice(d['places'])
    unit = r.choice(['No. %d' % r.randint(2, 88), '%s-%d-%d' % (r.choice('ABC'), r.randint(3, 28), r.randint(1, 12))])
    street = r.choice(pl['streets'])
    out = {'line1': '%s, %s' % (unit, street), 'area': pl['area'], 'postcode': pl['postcode'], 'city': pl['city'], 'state': pl['state'],
           'one_line': '%s, %s, %s, %s %s' % (unit, street, pl['area'], pl['postcode'], pl['city'])}
    if 'lat' in pl:   # within about 600 m of the area's centre, for map markers (dd-map-kamil)
        out['lat'], out['lng'] = round(pl['lat'] + r.uniform(-.0055, .0055), 5), round(pl['lng'] + r.uniform(-.0055, .0055), 5)
    return out


def gen(kind, n, seed, mix, cat):
    d, r = load(), random.Random(seed)
    today = date.today()
    out = []
    for i in range(n):
        if kind == 'people':
            out.append(person(d, r, mix))
        elif kind == 'addresses':
            out.append(address(d, r))
        elif kind == 'phones':
            out.append({'phone': phone(d, r)})
        elif kind == 'products':
            c = cat or r.choice(list(d['catalog']))
            name, lo, hi = r.choice(d['catalog'][c])
            out.append({'name': name, 'category': c, 'price': money(d, price(r, lo, hi)), 'shop': r.choice(d.get('shops', {}).get(c) or d['businesses'])})
        elif kind == 'orders':
            c = cat or 'food'
            items = r.sample(d['catalog'][c], min(len(d['catalog'][c]), r.randint(1, 3)))   # no item twice
            lines = [{'item': it[0], 'qty': r.randint(1, 2), 'price': price(r, it[1], it[2])} for it in items]
            total = sum(l['qty'] * l['price'] for l in lines)
            when = today - timedelta(days=r.randint(0, 20))
            out.append({'id': '#%s%04d' % (r.choice('ABCDEFGH'), r.randint(1000, 9999)), 'shop': r.choice(d.get('shops', {}).get(c) or d['businesses']),
                        'items': ', '.join('%dx %s' % (l['qty'], l['item']) for l in lines), 'total': money(d, total),
                        'date': fmt_date(when), 'status': r.choice(['Delivered', 'Delivered', 'Preparing', 'On the way', 'Cancelled'])})
        elif kind == 'messages':
            p = person(d, r, mix)
            out.append({'from': p['name'], 'text': r.choice(d['messages']), 'time': '%d:%02d %s' % (r.randint(1, 12), r.choice([0, 5, 15, 20, 30, 45, 50]), r.choice(['am', 'pm']))})
        elif kind == 'dates':
            when = today + timedelta(days=r.randint(-30, 30))
            out.append({'date': fmt_date(when), 'short': '%d %s' % (when.day, when.strftime('%b')), 'time': '%d:%02d %s' % (r.randint(1, 12), r.choice([0, 15, 30, 45]), r.choice(['am', 'pm']))})
        elif kind == 'plates':
            out.append({'plate': '%s%s %d' % (r.choice(d['plates']), ''.join(r.choice('ABCDEFGHJKLMNPRSTUVWXY') for _ in range(2)), r.randint(1, 9999))})
        elif kind == 'businesses':
            out.append({'name': d['businesses'][i % len(d['businesses'])], 'address': address(d, r)['one_line']})
        elif kind == 'places':   # map points: a shop or business with its address and coordinates (dd-map-kamil reads these)
            a = address(d, r) if not cat else address({'places': [p for p in d['places'] if cat.lower() in (p['city'] + ' ' + p['state'] + ' ' + p['area']).lower()] or d['places']}, r)
            out.append({'name': r.choice(d['businesses']), 'address': a['one_line'], 'area': a['area'], 'lat': a.get('lat'), 'lng': a.get('lng')})
        else:
            sys.exit('Unknown kind: ' + kind)
    return out


def fmt_date(d):
    return '%d %s %d' % (d.day, d.strftime('%b'), d.year)


PLACEHOLDER = [
    (r'lorem ipsum|dolor sit amet', 'Lorem ipsum'), (r'\b(john|jane) (doe|smith)\b', 'John/Jane Doe'), (r'\$\s?\d', 'dollar prices'),
    (r'\b\d+ main st', '123 Main St'), (r'@example\.(com|org)|example\.com', 'example.com'), (r'\b555-\d{4}', '555 phone'),
    (r'\b(product name|item \d|title here|your name here|sample text|text goes here)\b', 'template text'),
    (r'\b(new york|london|california|san francisco)\b', 'foreign place'), (r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', 'numeric date (use 24 Nov 2026)'),
]


def scan(root):
    files = sorted(set(glob.glob(os.path.join(root, 'pages', '*.html')) + glob.glob(os.path.join(root, '*.html')) + glob.glob(os.path.join(root, 'js', '**', '*.js'), recursive=True)))
    found = 0
    for f in files:
        if '/js/shell/' in f or f.endswith('credits.html'):
            continue
        t = re.sub(r'<script[^>]*src=[^>]*></script>|<style.*?</style>', ' ', open(f, encoding='utf-8', errors='ignore').read(), flags=re.S | re.I)
        t = re.sub(r'<[^>]+>', ' ', t) if f.endswith('.html') else t
        hits = {}
        for rx, label in PLACEHOLDER:
            for m in re.finditer(rx, t, re.I):
                hits.setdefault(label, set()).add(m.group(0).strip()[:30])
        if hits:
            print(os.path.relpath(f, root))
            for label, ex in hits.items():
                print('  %-26s %s' % (label, ', '.join(sorted(ex)[:4]))); found += 1
    print(('%d kinds of placeholder content found; replace with content.py gen' % found) if found else 'No placeholder content found.')


def section(root, market, language, mix):
    p = os.path.join(root, 'DESIGN.md')
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else '# Design\n'
    block = '\n'.join(['## Content', '', 'Follows dd-localized-content-kamil (`content.py gen`, same seed = same data on every screen).', '',
                       '- **Market:** %s · prices RM12.90 · dates 24 Nov 2026 · times 3:45 pm · phones +60 12-345 6789.' % market,
                       '- **Language:** %s.' % language,
                       '- **Names:** %s.' % mix,
                       '- **Never:** Lorem ipsum, John Doe, $ prices, foreign addresses, real people\'s names or numbers.', ''])
    if re.search(r'^## Content\n', t, re.M):
        t = re.sub(r'^## Content\n.*?(?=^## |\Z)', block + '\n', t, count=1, flags=re.S | re.M)
    else:
        t = t.rstrip('\n') + '\n\n' + block
    open(p, 'w', encoding='utf-8').write(t)
    print('Wrote "## Content" in %s' % p)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    g = sub.add_parser('gen'); g.add_argument('kind'); g.add_argument('--n', type=int, default=6); g.add_argument('--seed', type=int, default=1)
    g.add_argument('--mix', default='malay,chinese,indian'); g.add_argument('--cat'); g.add_argument('--format', choices=('lines', 'json', 'csv'), default='lines')
    s = sub.add_parser('scan'); s.add_argument('--project', required=True)
    c = sub.add_parser('section'); c.add_argument('--project', required=True); c.add_argument('--market', default='Malaysia')
    c.add_argument('--language', default='English, with Malay for local terms (nasi lemak, Jalan, kedai)')
    c.add_argument('--mix', default='Malay, Chinese and Indian, roughly like the population; East Malaysian when the brief is Sabah or Sarawak')
    a = ap.parse_args()
    if a.cmd == 'gen':
        mix = [m.strip() for m in a.mix.split(',') if m.strip()]
        rows = gen(a.kind, a.n, a.seed, mix, a.cat)
        if a.format == 'json':
            print(json.dumps(rows, ensure_ascii=False, indent=1))
        elif a.format == 'csv':
            keys = list(rows[0].keys()) if rows else []
            print(','.join(keys))
            for r in rows:
                print(','.join('"%s"' % str(r[k]).replace('"', '""') for k in keys))
        else:
            for r in rows:
                print(json.dumps(r, ensure_ascii=False))
    elif a.cmd == 'scan':
        scan(os.path.abspath(a.project))
    else:
        section(os.path.abspath(a.project), a.market, a.language, a.mix)


if __name__ == '__main__':
    main()
