`clipboard-schema.deflate` is the Kiwi schema chunk taken from a real Figma clipboard payload
(fixture `frame-with-r-g-b-rect.clipboard.html` in github.com/gridaco/grida, Apache-2.0, captured 2025-12-04).
Figma clipboard payloads carry their own schema, so the "Copy to Figma (auto layout)" export re-uses it
verbatim when it writes native Figma clipboard data. The format is not a public Figma API.

`control-data.deflate` is the data chunk of the same fixture, used by paste test "0" as a known-good control.
`control-instance.bin` / `control-set.bin` (+ `.meta`) are the full archives of the `component-component-instance-blue-with-overrides` and `component-component-set` fixtures (same repo/licence), used by component tests 0c / 0s.

Tools (`tools/figma-check/`, installed by `npm install`, not shipped): `kiwi-schema`, `pako`, `fzstd` — MIT.
`@magicpatterns/html-to-figma` (UNLICENSED) was used as a format reference only; none of its code is copied.
The Figma clipboard format is not a public API and can change; keep the control tests (0, 0c, 0s) to tell a format change from an encoder bug.
