#!/usr/bin/env python3
"""Stamp ?v=<version> (from shell.config.js) on every local CSS/JS link in the HTML files.
Run after bumping the version: python3 tools/stamp-version.py
GitHub Pages caches files for 10 minutes; a new ?v= makes browsers fetch the new files at once."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
ver = re.search(r'version:\s*"([^"]+)"', (root / 'shell.config.js').read_text()).group(1)
pat = re.compile(r'((?:href|src)="(?!https?:|//|data:)[^"]+?\.(?:css|js))(?:\?v=[^"]*)?"')
n = 0
for f in list(root.glob('*.html')) + list(root.glob('pages/*.html')):
    s = f.read_text(); t = pat.sub(lambda m: m.group(1) + '?v=' + ver + '"', s)
    if t != s: f.write_text(t); n += 1
print(f'v{ver} stamped on {n} files')
