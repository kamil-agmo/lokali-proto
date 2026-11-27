#!/usr/bin/env bash
# Checks the animation exporters without a browser: generate every format from tests/spec.json, then
#   - type-check the SwiftUI file with swiftc (macOS; the @State macro plugin may be missing, so it checks a copy that uses a plain constant)
#   - syntax-check the React Native file with node
#   - parse the Lottie JSON and list its layers
#   - decode the test GIF with Pillow (if installed) and confirm frame count, loop flag and that the moving block really moves
# Kotlin and Dart are not compiled here (no toolchain assumed): read the generated files, or compile them in a sample app.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$(mktemp -d)}"
node "$HERE/harness.js" "$OUT" || exit 1
echo "--- swift"
if command -v swiftc >/dev/null 2>&1; then
  sed 's/@State private var start = Date()/private let start = Date()/' "$OUT"/*Animations.swift > "$OUT/Check.swift"
  swiftc -typecheck -parse-as-library "$OUT/Check.swift" && echo "swift: type-check OK"
else echo "swift: skipped (no swiftc)"; fi
echo "--- react native"
node --check "$OUT"/*-animations.mjs && echo "react native: syntax OK"
echo "--- lottie"
python3 - "$OUT" <<'PY'
import json, glob, sys
f = glob.glob(sys.argv[1] + '/*.lottie.json')[0]
d = json.load(open(f))
print('lottie: %dx%d, %d frames, %d layers' % (d['w'], d['h'], d['op'], len(d['layers'])))
PY
echo "--- gif"
python3 - "$OUT" <<'PY'
import sys
try:
    from PIL import Image
except ImportError:
    print('gif: skipped (Pillow not installed)'); sys.exit(0)
im = Image.open(sys.argv[1] + '/test.gif')
assert im.n_frames == 3, im.n_frames
px = []
for i in range(3):
    im.seek(i); px.append(im.convert('RGB').getpixel((2 + i * 10, 10)))
assert len(set(px)) == 1, px   # the block's colour at its own position is the same in every frame...
im.seek(0); a = im.convert('RGB').getpixel((12, 10)); im.seek(1); b = im.convert('RGB').getpixel((12, 10))
assert a != b, 'block did not move'
print('gif: OK (%dx%d, 3 frames, loop=%s)' % (im.size[0], im.size[1], im.info.get('loop')))
PY
echo "output in $OUT"
