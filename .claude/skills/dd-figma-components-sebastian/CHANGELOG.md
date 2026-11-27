# Changelog

One line (or a short block) per rule or encoder change. Newest first.

- 2026-11-18 — **Shareable folder.** SKILL.md Step 0 finds the folder (host base dir, `~/.claude/skills`, project `.claude/skills`, claude.ai `/mnt/skills/user`, then search) and stops with one clear message when only SKILL.md is present, instead of rebuilding the engine. Step 3 vendors `engine/*.js` into the project. New `README.md` (team install). `check.sh` runs from a writable copy when the skill folder is read-only.
- 2026-11-17 — **Universal bundle.** The skill ships as a folder with its engine instead of pointing at `~/gd-admin-portal`.
  - `engine/`: `figma-export.js` (config + serializer), `figma-native.js` (encoder), `figma-panel.js` (side panel, new), `figma-assets.js` (generated, no build step needed).
  - Every GD constant moved to `figma.config.js` (roadmap §11.4 built): component allowlist (`'*'` by default), frame-only list, containers, no-unify list, variant property names, value words, table-row and open-group names, Universal section name, fileKey, switch prefix (`<storageKey>-fig-*`), render width, date/HTML transform, section and screen naming.
  - Fonts no longer assume Poppins: Figma family from the CSS family (generics mapped), style names overridable, glyph cache from any inline TTF face (nearest weight, italic), optional `glyphFallback`.
  - Side panel (roadmap §11.6 partly built): Module → Function → Screen or Flow → Screen from the registry, case tags, counts, filter, copy buttons per config `copy`, page copy per `output`, switches, font/input preflight warnings, `?figmaTest=` headless hook.
  - Screens may use `template: '#id'` instead of `render()`.
  - Tools: generic `tools/check.sh <html>`, `tools/inline-fonts.py`, `tools/make-assets.py`.
  - SKILL.md rewritten as a procedure; engine internals → `references/engine-internals.md`; GD history → `references/gd-case-study.md`.
  - Fixed in the doc: status line vs changelog (11-13 not pasted), `MODULES` shape (`[{ key, name }]`), Q3 options vs copy table, rule order (R1–R8), tool list, mismatch count (3), module grouping claims.
  - Regression: GD admin payload identical (decoded, minus paste ID) with GD's viewer and with the new panel; GD app identical once the three 2026-11-13 improvements are reverted. Not yet pasted in real Figma from the bundle.

- 2026-11-13 — (GD) Re-applied to the GD admin portal. Changes:
  - §0.1 answers stored in `~/gd-admin-portal/CLAUDE.md`.
  - R3/R4 markup on every atom: 46 properties on 35 components, 2,926 values on instances.
  - §0.3 case tags and the `<Flow> / <ID> / <Title> · Positive|Negative` screen names (Q1 = by flow).
  - Pre-paste report `FIGMA-REPORT.md` (§11.3).

  Encoder changes:
  - `tokenOf` returns a child's `data-layer`, so `Content=` values read `Leading icon + Value` instead of `Group + Value`.
  - Screens carry `screenTitle`, so `Table row / <title>` survives the new screen names.
  - Every variant now carries a child def for every set property, bound or not, matching the designer's Figma sample. Before, a text-only Button variant had no `Icon` / `Show icon` child defs (48 added on the GD page).

  Lessons:
  - Mark the same slot the same way everywhere. Unmarked Microsoft button text grew Button's shared tree past the 3-layer cap (2 → 6 trees) until it was marked `Label` too.
  - Name container items with `data-layer`. Otherwise R8 takes identity from the badge text (`IconButton / 3`).

  Tools: `render2.js payload /dev/null @dir` writes one SVG per screen ID for a before/after comparison with numeric tolerance; `tools/check.sh`; `?figmaTest=page`.

  Checks: real-click clipboard decodes. Not yet pasted in real Figma.
- 2026-11-12 — (GD) Hand-off pass: R4 and §1 no longer tagged [Proposed]; switch list complete; §7 adds `grab.sh` and how to hand test pastes to designers without the console; known limits and §11 intro updated; Markdown table pipes escaped.
- 2026-11-12 — (GD) §11.2 component properties confirmed in real Figma (C5): Label edit, Icon swap and Show count toggle all drive the canvas from the right panel, for top-level and nested instances, with or without the matching override. Encoding read from a designer-made sample (Figma now sends the data chunk zstd-compressed, archive v106; our v101 payloads still paste). With no `data-prop-*` markup the GD design page is identical to before (only the random paste ID differs).
- 2026-11-11 — (GD) R5 + R8 + generated states confirmed in real Figma by the designer (design page paste).
- 2026-11-11 — (GD) R8 missing states: 13 states generated (every `Tab / …` now has Default + Active), 0 skipped; 449 components in 125 sets. Rendered sets checked by eye. Screens unchanged apart from antialiasing. `render2.js` accepts `"=Exact name"` to render one component set.
- 2026-11-11 — (GD) R8 (designer feedback: "each sub-module should be its own component with swappable states and icons"): per-item component sets inside containers (`gd-fig-identity`). GD page:
  - 436 components in 112 sets.
  - 8 `NavItem / <module>` sets and 18 `NavSubItem / <entry>` sets, plus `Tab / <label>` sets.
  - The Sidebar main nests one instance of each.
  - Validate 0 errors. Screens re-render pixel-identical apart from text antialiasing.
  - Only the placement of the flow-local component sets moved.
- 2026-11-11 — (GD) R5 v2 (designer feedback: "there must be one main navbar component with sub-module components inside"): container merge (`gd-fig-containers`). The GD sidebar now exports as auto layout (grow spacer instead of `margin-top:auto`, padding instead of the sub-menu margin). Result: 1 Sidebar main (15 slots, 4 menus hidden) used by 128 screen instances; 367 components in 85 sets, 2,944 instances, ~1.96 MB. All 25 flow sections re-render **pixel-identical** (headless Chrome raster diff); validate 0 errors; auto-layout simulation unchanged.
- 2026-11-11 — (GD) R5 v1 (rejected): Sidebar copied as a frame (`gd-fig-sidebar-frame`). GD page: 367 components in 85 sets (the 5-variant Sidebar set removed), 4,516 instances (nav items now direct instances on each screen), ~2.3 MB (was ~1.9 MB). All 25 flow sections re-render identically; validate 0 errors; auto-layout simulation unchanged.
- 2026-11-11 — (GD) §11.1 confirmed in real Figma: C4 variant swap keeps icon and label.
- 2026-11-11 — (GD) Built §11.1 in GD: `data-layer`, role names (`gd-fig-names`), cross-variant unify (`gd-fig-unify`), test C4, `tools/figma-check/variants.js`. GD design page: 68/86 sets share one tree (was 54), 0 layers named `icon / …` inside mains (was 125), re-rendered page byte-identical to before, validate 0 errors, auto-layout simulation unchanged (2 known Input mismatches).
- 2026-11-11 — (GD) Added §0 Department rules: pre-flight questions, component rules R1–R7, positive/negative cases, copy granularity, navbar case study. Added contract fields (`module`, `fn`, `case`, `data-layer`, `data-prop-*`), new known limits and the §11 roadmap.
