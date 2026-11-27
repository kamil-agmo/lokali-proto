#!/usr/bin/env python3
"""Build the font picker page: every Google Font with Latin support, searchable, with live previews.

  font_picker.py --out <dir> [--app "OTW"] [--accent "#7c3aed"] [--recommend "Inter,Plus Jakarta Sans"] [--refresh]

Writes <dir>/font-picker.html. Serve <dir> over http (python3 -m http.server) and open it in the browser pane.
When the user presses "Use this font", the page sets window.fontChoice = {family, category, weights, variable};
read it with the browser's JavaScript tool (or ask the user for the name they picked).
--refresh downloads the latest catalogue from fonts.google.com instead of the cached assets/google-fonts.json.
"""
import argparse, json, os, re, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')


def catalogue(refresh):
    path = os.path.join(ASSETS, 'google-fonts.json')
    if refresh:
        try:
            d = json.loads(urllib.request.urlopen('https://fonts.google.com/metadata/fonts', timeout=20).read().decode().lstrip(")]}'\n"))
            out = []
            for f in d['familyMetadataList']:
                if 'latin' not in f.get('subsets', []):
                    continue
                w = sorted({int(k.rstrip('i')) for k in f['fonts'] if k.rstrip('i').isdigit()})
                ax = [x for x in f.get('axes', []) if x['tag'] == 'wght']
                out.append([f['family'], f['category'], w, f.get('popularity', 9999), [ax[0]['min'], ax[0]['max']] if ax else None])
            out.sort(key=lambda x: x[3])
            json.dump(out, open(path, 'w'), separators=(',', ':'))
            print('Refreshed the catalogue: %d fonts' % len(out))
        except Exception as e:
            print('Could not refresh (%s); using the cached list' % e)
    return json.load(open(path))


ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True); ap.add_argument('--app', default='Your app'); ap.add_argument('--accent', default='#2563eb')
ap.add_argument('--recommend', default='Inter,Plus Jakarta Sans,Poppins,Manrope,DM Sans,Nunito'); ap.add_argument('--refresh', action='store_true')
a = ap.parse_args()
if not re.match(r'^#[0-9a-fA-F]{3,8}$', a.accent):
    a.accent = '#2563eb'
fonts = catalogue(a.refresh)
rec = [x.strip() for x in a.recommend.split(',') if x.strip()]
page = open(os.path.join(ASSETS, 'font-picker.html'), encoding='utf-8').read()
page = (page.replace('__FONTS__', json.dumps(fonts, separators=(',', ':')))
            .replace('__RECOMMENDED__', json.dumps(rec))
            .replace('__ACCENT__', a.accent)
            .replace('__APP__', a.app.replace('&', '&amp;').replace('<', '&lt;')))
os.makedirs(a.out, exist_ok=True)
out = os.path.join(a.out, 'font-picker.html')
open(out, 'w', encoding='utf-8').write(page)
print('Wrote %s (%d fonts, %d suggested)' % (out, len(fonts), len(rec)))
