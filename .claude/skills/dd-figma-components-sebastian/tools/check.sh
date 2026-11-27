#!/usr/bin/env bash
# Offline Figma checks for any prototype that loads the engine + panel (macOS or Linux).
# Usage: tools/check.sh path/to/prototype.html [outdir] [page|group:<key>|screen:<id>]
# Writes <outdir>/payload.html (the exact clipboard HTML) and runs decode/validate, the auto-layout
# simulation and the variant-tree check. Needs Chrome/Chromium (set CHROME=/path if not found) and Node 18+.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
HTML="${1:?usage: check.sh prototype.html [outdir] [page|group:key|screen:id]}"; OUT="${2:-./figma-check-out}"; WHAT="${3:-page}"
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"; HTML="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"
CH="${CHROME:-}"
if [ -z "$CH" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" google-chrome google-chrome-stable chromium chromium-browser; do
    if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then CH="$c"; break; fi
  done
fi
[ -n "$CH" ] || { echo "Chrome/Chromium not found: set CHROME=/path/to/chrome" >&2; exit 1; }
FC="$HERE/figma-check"
if [ ! -d "$FC/node_modules" ] && [ ! -w "$FC" ]; then
  # Read-only install (e.g. claude.ai /mnt/skills): run the checks from a writable copy.
  W="${TMPDIR:-/tmp}/figma-check-$(id -u)"; mkdir -p "$W"; chmod -R u+w "$W"
  cp -f "$FC"/*.js "$FC"/package*.json "$W"/; chmod -R u+w "$W"; FC="$W"
fi
[ -d "$FC/node_modules" ] || (cd "$FC" && npm install --silent)
"$CH" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=180000 --window-size=1600,1000 --dump-dom "file://$HTML?figmaTest=$WHAT" 2>/dev/null > "$OUT/dom.html"
python3 -I - "$OUT/dom.html" "$OUT/payload.html" <<'PY'
import sys, html, re, json
t = open(sys.argv[1]).read(); i = t.rfind('<pre id="figma-out"')
if i < 0: sys.exit('No <pre id="figma-out"> in the page: is figma-panel.js loaded and the SCREENS registry valid?')
j = t.find('>', i); k = t.find('</pre>', j); tag = t[i:j]
for a in ('stats', 'warn'):
    m = re.search(r'data-%s="([^"]*)"' % a, tag)
    if m: print(a, html.unescape(m.group(1)))
open(sys.argv[2], 'w').write(html.unescape(t[j + 1:k]))
PY
if head -c 6 "$OUT/payload.html" | grep -q ERROR; then head -c 3000 "$OUT/payload.html"; echo; exit 1; fi
cd "$FC"
node validate.js "$OUT/payload.html" | grep -E "^errors|nodes" || true
echo "auto-layout mismatches: $(node render2.js "$OUT/payload.html" "$OUT/payload.svg" 2>&1 | grep -c 'expected\|grow size' || true)  (details: node tools/figma-check/render2.js $OUT/payload.html out.svg)"
node variants.js "$OUT/payload.html" | head -12
echo "payload: $OUT/payload.html · re-render: $OUT/payload.svg"
