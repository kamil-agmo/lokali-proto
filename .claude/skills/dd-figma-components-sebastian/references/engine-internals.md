# Engine internals — read when debugging or changing the encoder

How `engine/figma-export.js` (FX) and `engine/figma-native.js` (FN) turn a rendered screen into Figma's clipboard format. You don't need this to apply the skill; you need it when a paste looks wrong, or before you change the encoder.

## 1. Pipeline

```
SCREENS[i] → FX.renderHtml (render() or <template>, then config transformHtml)
  → hidden host (config frameWidth, off-screen) → FX.node() layout tree
  → plain:  FN.toHtml([screenTrees], opts)
  → page:   FN.toHtml([{ key, name, screens:[trees] }], { page: true })
→ NodeChanges message → Kiwi encode (bundled schema) → deflate-raw
→ "fig-kiwi" archive → text/html with (figmeta)/(figma) markers → copy event → ⌘V in Figma
```
Reference size (GD admin, 142 screens): ~2 s, ~1.9 MB, fits inside Chrome's click activation window.

## 2. Layout tree rules (FX serializer) — the hard-won ones

- **Node types**: TEXT (pure text element or loose text), SVG (with live `shapes`), IMAGE (`src`, `nat` natural size), FRAME (fill, border, `bw`, radius, effects, clip, `layout`, children). Carry `comp`, `variant`, `icon`, `abs`, `grow`, `stretch`, `self`, `layer`, `props`.
- **Auto layout only when it is true**: flex container, no child margins, no wrap, and (for `justify: MIN`) children sit in sequence within 2 px of `padding + Σ(size + gap)`. Otherwise keep absolute positions.
- **Stretch** = child cross size equals inner cross size and container align is MIN.
- **`align-self` children**: Figma has no per-child cross alignment. Wrap the child in an "align" frame that stretches across the cross axis with `justify = self`. Making it absolute breaks neighbours that grow.
- **Borders** (two separate things):
  - `border` = visible stroke (colour + per-side weights).
  - `bw` = CSS border widths that take layout space, including transparent ones.
  - Visible border → `bordersTakeSpace: true` (Figma "include stroke in layout"); padding stays the CSS value.
  - Invisible ≤1 px border → drop it so padding reads 16, not 17.
  - Stroke width always comes from `border.weights`, never from `bw`.
- **`box-shadow: inset 0 0 0 1px c`** (ring) → INSIDE stroke with `ring: true`; it takes no layout space.
- **Loose text** (text node directly in a flex container): Range rects are glyph boxes. Convert to the line box: `top -= (LH - glyphH)/2`, `h = lines × LH`. With `line-height: normal`, LH = size × config `normalLineHeight[family]` (Poppins 1.5, Inter 1.21, Roboto 1.172); unknown families skip the correction, so give loose text an explicit line-height.
- **Text lines**: measure words with `Range.getClientRects()`, group into visual lines (new line when `top` moves > half the first word height), keep `x`, `w`, `top`, `bottom` and styled segments.
- **Text hug**: TEXT is `WIDTH_AND_HEIGHT` unless multiline / stretch / grow / non-left aligned *and wider than its text*. A centred label that already wraps its text must hug, or Figma wraps it.
- **Frame Hug** (per axis): hug when the frame's size equals padding (+ included strokes) + content (Σ children + gaps on the primary axis, max child on the counter axis) within 1 px, and nothing fills that axis: no `grow` children (primary), no `stretch` children (counter), not SPACE_BETWEEN, and the frame itself doesn't fill that axis in its parent. Screens stay fixed.
- **SVG**: read shapes while the SVG is in the DOM — `getComputedStyle` (fill, stroke, opacity, dash, cap, join, fill-rule) and `getScreenCTM()` minus the frame origin. Convert circle/ellipse/rect/line/poly* to path `d`. SVG `<text>` → TEXT with fill as colour.
- **Inputs**: value or placeholder as TEXT, placeholder colour tertiary.

## 3. Fonts

- **Family in Figma** = config `fontFamily(cssFamily)`. Default: the first CSS family as written, with CSS generics mapped (`system-ui` → Inter, `ui-monospace`/`monospace` → Roboto Mono, `serif` → Georgia). CJK text → Noto Sans SC.
- **Style weight** = the inline face Chrome actually renders (nearest available weight, `styleFromFaces`, default on); without inline faces, the CSS weight.
- **Style name** = Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black (+ Italic), unless config `fontStyles[family][weight]` says otherwise. Some families use other names in Figma (e.g. Inter has `Semi Bold` with a space in some versions): check the family's style list in Figma's font picker and set `fontStyles`. A wrong style name pastes as a missing font.
- **Glyph cache** (`derivedTextData`): FN reads every `@font-face` whose `src` is a base64 data URL, parses the TrueType `glyf` outlines and writes glyph blobs, so text renders exactly even before Figma re-lays it out. Lookup: the text's CSS family, nearest weight (ties go up), italic face if present; else config `glyphFallback`'s face; else no glyph cache. Without a glyph cache text still pastes and Figma lays it out itself, as long as the font is installed for the person pasting.
- Linked font stylesheets (Google Fonts `<link>`, and any `<link>`ed local CSS when the page is opened from `file://`) can't be read: inline the TTFs with `tools/inline-fonts.py --js`. Variable fonts and CFF `.otf`/`.woff2` can't be drawn by the glyph reader.

## 4. Figma clipboard format (verified against real payloads)

**HTML** (write exactly; Figma searches for the literal markers):
```html
<meta charset="utf-8" /><span data-metadata="<!--(figmeta)BASE64(JSON {fileKey, pasteID, dataType:"scene"} + "\n")(/figmeta)-->"></span><span data-buffer="<!--(figma)BASE64(archive)(/figma)-->"></span><span style="white-space: pre-wrap"></span>
```
**Archive**: `"fig-kiwi"` (8 bytes) + `uint32 LE version` (101 for the bundled schema) + `[uint32 len][schema chunk]` + `[uint32 len][data chunk]`. Both chunks are **raw deflate** (`CompressionStream('deflate-raw')`). Re-use the schema chunk byte for byte; the clipboard is self-describing, so a slightly old schema still pastes. Payloads copied *from* current Figma (Nov 2026) are version 106 with a **zstd** data chunk (magic `28 b5 2f fd`); `tools/figma-check/decode.js` reads both. Writing v101 + deflate still pastes.

**Kiwi**: MESSAGE = (field id varuint + value)… 0; STRUCT = all fields in order, **every field required** (`Color{r,g,b,a}`, `Vector`, `Matrix`, `GUID`, `FontName`, `ParentIndex`); enums as varuint; floats use Kiwi's bit-rotated encoding; byte arrays length-prefixed. Unknown JS props are ignored — typos fail silently, so validate by decoding.

**Message**:
```js
{ type:'NODE_CHANGES', sessionID:0, ackID:0, pasteID, pasteFileKey, pasteIsPartiallyOutsideEnclosingFrame:false,
  pastePageId:PAGE, isCut:false, pasteEditorType:'DESIGN', publishedAssetGuids:[],
  clipboardSelectionRegions:[{ parent:PAGE, nodes:[topLevelGuids], pasteIsPartiallyOutsideEnclosingFrame:false, focusType:'NONE' }],
  pasteAssetType:'UNKNOWN', nodeChanges:[…], blobs:[{bytes}] }
```
Scaffold: DOCUMENT `0:0`; CANVAS `0:1` ("Page 1"); CANVAS "Internal Only Canvas" (`internalOnly:true`, visible false). Every node: `guid`, `phase:'CREATED'`, `parentIndex:{guid, position}`, `type`, `name`, `visible`, `opacity`, `size`, `transform` (m02/m12 = x/y relative to parent).

**`parentIndex.position`**: strings that sort in child order (later = on top). Fixed-width keys from printable ASCII 33–122 (1 char < 90 children, else 2–3 chars). Unique per parent; array order does not matter.

### Node field cheat sheet
| Need | Fields |
|---|---|
| Frame | `type:'FRAME'`, `fillPaints`, `strokePaints`, `strokeWeight`, `strokeAlign:'INSIDE'`, `frameMaskDisabled` (= !clip), `cornerRadius` + `rectangle{TopLeft,TopRight,BottomRight,BottomLeft}CornerRadius` + `rectangleCornerRadiiIndependent`, `effects[{type, offset, radius, spread, color, visible, blendMode, showShadowBehindNode}]`, `dashPattern` |
| Per-side border | `border{Top,Right,Bottom,Left}Weight` + `borderStrokeWeightsIndependent:true` |
| Auto layout | `stackMode` H/V, `stackSpacing`, `stackVerticalPadding` (top), `stackPaddingRight`, `stackPaddingBottom`, `stackHorizontalPadding` (left), `stackPrimaryAlignItems` MIN/CENTER/MAX/SPACE_BETWEEN, `stackCounterAlignItems` MIN/CENTER/MAX/BASELINE, `bordersTakeSpace` (= "include stroke in layout") |
| Sizing (from 2,800 real frames) | **Primary**: Hug = field **absent**, Fixed = `stackPrimarySizing:'FIXED'`. **Counter**: Hug = `stackCounterSizing:'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE'`, Fixed = `'FIXED'` or absent. Defaults differ per axis — don't send RESIZE values for primary. |
| Child in auto layout | `stackChildPrimaryGrow:1`, `stackChildAlignSelf:'STRETCH'`, `stackPositioning:'ABSOLUTE'` |
| Solid paint | `{type:'SOLID', color:{r,g,b,a:1}, opacity:a, visible:true, blendMode:'NORMAL'}` |
| Text | `fontName{family, style, postscript}` (exact weights — no rounding), `fontSize`, `lineHeight{value, units:'PIXELS'}`, `letterSpacing`, `textAlignHorizontal`, `textAutoResize`, `textCase`, `textDecoration`, `textData{characters, lines:[{lineType:'PLAIN',…}]}`; styled runs: `textData.characterStyleIDs` + `styleOverrideTable[{styleID, fontName?, fontSize?, fillPaints?, textDecoration?}]` |
| Derived text (glyph cache) | `derivedTextData{layoutSize, baselines[{position, width, lineY, lineHeight, lineAscent, firstCharacter, endCharacter}], glyphs[{commandsBlob, position(baseline px), styleID, fontSize, firstCharacter, advance(em), rotation}], fontMetaData[{key, fontLineHeight, fontDigest(SHA-1 20B), fontStyle, fontWeight}], logicalIndexToCharacterOffsetMap, derivedLines, truncationStartIndex:-1, truncatedHeight:-1}` — glyph blob = u8 cmd (0 Z,1 M,2 L,3 Q,4 C) + f32 LE coords, em-normalised, y up. Skipped for CJK text. |
| Vector | `type:'VECTOR'`, `vectorData{vectorNetworkBlob, normalizedSize}` (= size), `strokeCap`, `strokeJoin`, `strokeAlign:'CENTER'`. Network blob: u32 counts (vertices, segments, regions); vertex u32 style + f32 x,y; segment u32 style, u32 start, f32 dx,dy, u32 end, f32 dx,dy (tangents relative to own vertex); region u32 (style<<1 \| nonzero), loops. |
| Image | `ROUNDED_RECTANGLE` with paint `{type:'IMAGE', image:{hash:SHA-1(bytes), name, dataBlob}, imageScaleMode:'FIT', transform:identity, originalImageWidth/Height, …}`; bytes in `blobs` |
| Section | `type:'SECTION'`, fills, strokes, radius 8, `frameMaskDisabled:true` |
| Main component | `type:'SYMBOL'`, `isSymbolPublishable:true` (+ frame fields) |
| Variant set | `FRAME` + `isStateGroup:true`, `isPublishable:true`, `stateGroupPropertyValueOrders:[{property, values}]`, `componentPropDefs:[{id:GUID, name, type:'VARIANT', initialValue:{}, sortPosition:'!'/'"'/'#'…, preferredValues:{}, varValue:{value:{textValue:''}, dataType:'STRING', resolvedDataType:'STRING'}}]`, purple dashed stroke `dashPattern:[10,5]`; children SYMBOL named `Type=Primary, Size=Medium, State=Default` with `variantPropSpecs:[{propDefId, value}]`. Every variant carries every property; values without `=` or `,`; combinations unique. |
| Instance | `type:'INSTANCE'` + own frame fields, `symbolData{symbolID, symbolOverrides, uniformScaleFactor:1}`, `derivedSymbolData[]`, `derivedSymbolDataLayoutVersion:1`. **No child nodes** — Figma derives them from the main. |
| Override | `{guidPath:{guids:[…]}, textData? fillPaints? strokePaints? opacity? fontName? fontSize?}`; root = `[symbolID]`; child = `[guidInsideSymbol]`; inside a nested instance = `[nestedInstanceGuid, guidInsideNestedSymbol]` |
| Nested swap | `{guidPath:[nestedInstanceGuid], overriddenSymbolID:otherVariantGuid}` |
| Hidden layer | `{guidPath:[layerGuid], visible:false}` (and `visible:true` to re-show when diffing against the full main) |
| Component property def | On the **set** (or a lone main): `componentPropDefs:[{id, name, type:'TEXT'\|'BOOL'\|'INSTANCE_SWAP', initialValue:{textValue:TextData \| boolValue \| guidValue}, sortPosition, preferredValues:{} (swap: {instanceSwapValues:[]}), varValue:{value:{textDataValue \| boolValue \| symbolIdValue:{guid}}, dataType:'TEXT_DATA'\|'BOOLEAN'\|'SYMBOL_ID', resolvedDataType: same}}]`. Each **variant** gets child defs `componentPropDefs:[{id:new, parentPropDefId:setDefId}]`, one for **every** set property in set order, even unbound ones. |
| Bound layer | `parameterConsumptionMap:{entries:[{variableData:{value:{propRefValue:{defId:variantChildDefId}}, dataType:'PROP_REF', resolvedDataType:'TEXT_DATA'\|'BOOLEAN'\|'SYMBOL_ID'}, variableField:'TEXT_DATA'\|'VISIBLE'\|'OVERRIDDEN_SYMBOL_ID'}]}`. Current Figma writes this, **not** `componentPropRefs`. |
| Property value on an instance | `componentPropAssignments:[{defID:childDefOfTheVariantItPointsTo, value:{…}, varValue:{…}}]` on the instance; for a nested instance, on its `symbolOverrides` entry `{guidPath:[nestedGuid], componentPropAssignments}`. Use the child def of the variant the instance actually shows. Booleans are assigned on every instance. |
| Layout cache | `derivedSymbolData:[{guidPath, size?, transform?, derivedTextData?}]` — one entry per path whose size/position/text differs from the main. Switch off with `<storageKey>-fig-dsd = 0` if Figma disagrees. |

## 5. Components algorithm (design page)

1. **Candidates**: elements with `data-component` that pass config `components` (`'*'` or an allowlist) and are not in `frameOnly`, plus every `data-icon` SVG. Never whole screens (R6).
2. **Key** = `comp | identity | variant | structural signature`. The signature covers node types, layout mode/justify/align/gap/padding, child flags (abs/grow/stretch), `data-prop-*` of child layers, and nested candidates as `C<name>` without recursing. Icons: `icon:<name>:<w>x<h>`. Same key → same main component.
3. **Registry**: walk every screen; the first occurrence is the main. Record the groups that use each set. Rows of config `tableRow` get one set per screen: `Table row / <screen title>`.
4. **Merge optional slots**: within the same component + variant, if one version's top-level children are an ordered subsequence of a bigger version (same root layout), the bigger one becomes the main and the smaller ones its instances with the missing layers hidden.
5. **Variant properties**: split `data-variant` by `/` into config `variantProps[component]` names (unknown → `Variant`); a property named `Badge` reads Yes/No. Values humanised (config `words`, else kebab → Title Case). Properties that never vary are dropped. Remaining duplicates get a `Content` property from the top-level layer tokens (`data-layer` names first; > 36 chars → `Layout N`), then numeric suffixes. Keep variant strings complete in the markup (`primary/md/default`), or values drift (`Size=Loading`).
6. **Placement**: icon sets and sets used in 2+ groups → config `universalSection`; others beside their only group. Shelf-pack sets (gap 64); variants inside a set (gap 24, pad 24).
7. **Emission order**: mains nested-first, then the screens, where every candidate becomes an INSTANCE.
8. **Overrides** = diff the instance subtree against the node as rendered inside the main: text → `textData` (+ derived text); colour/opacity → paints; nested component with a different key → `overriddenSymbolID` + diff against the new main; geometry → `derivedSymbolData`; missing optional layers → `visible:false`. Guids map through a parallel walk that aligns differing child lists by subsequence.
9. **Unify** (R2): per set and layout direction, the shortest common supersequence of top-level children; each main gets missing children as hidden deep clones. Excluded: config `noUnify` (containers + table rows). Max 3 added layers per variant.
10. **Role names** (R3, emission only): `data-layer` wins; nested icon → `Icon` / `Trailing icon`; nested component → its name; text → `Label` / BEM part / `Text`; frames → BEM part / `Group`; duplicates ` 2`, ` 3`.
11. **Containers** (R5, config `containers`): one main per container and real variant, superset of all slots (max 12 extra), slots hidden where unused; per-screen state as nested overrides.
12. **Item identity** (R8): items inside containers get their own set `NavItem / <label or data-layer>`; missing states are generated from a sibling's style change.
13. **Properties** (R4): `data-prop-text|swap|bool` → set-level defs, bound layers, per-instance assignments (top level and nested).

## 6. Writing the clipboard (Chrome)

- **Do not use `navigator.clipboard.write` for text/html.** Chrome sanitises it and escapes `<` in attributes (`&lt;!--(figma)`), so Figma may not find the payload.
- Use a **copy event** (`FN.copyEvent(html)`), which writes the bytes exactly. It needs the click's user activation (about 5 s). If it returns false, the panel shows a "Copy now" button that re-runs it with the cached HTML.

## 7. Switches

localStorage `<storageKey>-fig-<name>`, on by default, `'0'` = off: `hug`, `merge`, `names`, `unify`, `containers`, `identity`, `states`, `props`, `derived`, `dsd`. Off by default, `'1'` = on: `props-only` (property values without the matching override, as Figma writes them), `sidebar-frame` (the `openGroup.container` pasted as a plain frame). The panel's "Figma switches" section toggles the common ones. Use them to isolate a regression in one paste round without editing code.

## 8. Pitfalls already hit (check these first)

- Relative `m` in SVG paths: following pairs are implicit `l`. Recompute the command per pair, or chevrons and search handles vanish.
- Figma SVG import rounds font weights (500 → Regular, 600 → Bold). The native format keeps exact styles — another reason not to use SVG.
- Transparent borders still take CSS space: fold or drop them, never ignore silently.
- Stroke weight from `bw` (zeros for rings) produced invisible strokes. Use `border.weights`.
- Centred single-line labels set to fixed width wrap in Figma. Hug them.
- `align-self` children as absolute let a growing sibling expand under them. Use the align wrapper.
- Test files sort children by array order; Figma uses `position`. Only uniqueness matters.
- Partial derived glyph data for CJK text renders wrong. Omit `derivedTextData` there.
- Chrome renders `<button>/<input>` in Arial unless `font-family: inherit`.
- Sizing defaults differ per axis (primary hug = absent field). Check real data before choosing enum values.
- Containers with free content as components create junk variants; keep them as frames.
- Class-name-based labels leak utility classes; filter generic names before using them in property values.
- Unmarked slots grow a set's shared tree past the 3-layer cap. Mark the same slot the same way everywhere.
- Container items without `data-layer` take identity from badge text (`IconButton / 3`).
