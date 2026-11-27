# figma-check — verify a Figma clipboard payload without Figma

```bash
cd tools/figma-check && npm install          # once
# grab the payload: Copy in the prototype, then
osascript -e 'the clipboard as «class HTML»' | sed -E 's/^«data HTML//; s/»$//' | xxd -r -p > /tmp/pb.html
node validate.js /tmp/pb.html                 # decode with the embedded schema; orphans, sizes, blobs, colours, duplicate keys
node render.js  /tmp/pb.html /tmp/pb.svg      # plain copies: re-render + auto-layout simulation (expected vs actual child positions)
node render2.js /tmp/pb.html /tmp/pb.svg "Flow 3.1"   # design page: resolves instances (overrides, nested swaps); optional section filter
node render2.js /tmp/pb.html /tmp/set.svg "=Tab / History"   # one node by exact name (e.g. a component set)
node variants.js /tmp/pb.html [Set] [-v]          # variant sets: do all variants share one layer tree? layers still named "icon / ..."
./grab.sh /tmp/pb.html                       # save the current Mac clipboard (Figma ⌘C) as a payload file; decode.js reads Figma's zstd data chunk (v106+)
```
Screenshot the SVG with headless Chrome and compare it to the HTML screen.
