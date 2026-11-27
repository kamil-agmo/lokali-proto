#!/bin/zsh
# Save the current macOS clipboard (Figma ⌘C) as a payload file for decode/validate.
# Usage: tools/figma-check/grab.sh out.html
set -e
out=${1:-/tmp/pb.html}
osascript -e 'the clipboard as «class HTML»' | sed -E 's/^«data HTML//; s/»$//' | xxd -r -p > "$out"
if ! grep -q '(figma)' "$out"; then echo "No Figma payload on the clipboard (select layers in Figma and press ⌘C first)." >&2; exit 1; fi
echo "saved $out ($(wc -c < "$out" | tr -d ' ') bytes)"
