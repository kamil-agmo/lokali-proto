# Case study — GD Admin Portal and GD member app (where the rules came from)

Background only. The rules in SKILL.md are the result of this project; this file keeps the evidence.

## Projects
- **GD Admin Portal** (`~/gd-admin-portal`, Golden Destinations loyalty admin): 142 screens, organised by flow (Q1), `src/` → `build.py` → offline `index.html`. The encoder was built and confirmed here. Config: `examples/gd-admin.config.js`.
- **GD member app** (`~/gd-mobile-app`): 61 phone screens, organised by module (Module → Function → Screen). A port of the admin encoder from before the 2026-11-13 changes. Config: `examples/gd-mobile.config.js`.

## What was confirmed in real Figma (designer pastes)
| Round | Date | What | Test |
|---|---|---|---|
| 1 | Nov 2026 | Plain copy, components, instances, variant sets, sections, `bordersTakeSpace` | ladders 0–E, 0c, 0s, C1–C3 |
| 2 | Nov 2026 | Named variant properties, merged optional slots (hidden layers), Hug sizing | design page |
| 3 | 2026-11-11 | §11.1 stable layer names + one layer tree per set: variant swaps keep content | C4 |
| 4 | 2026-11-11 | R5 one main per container, R8 one set per container item, generated missing states | design page |
| 5 | 2026-11-12 | R4 component properties (Text, Boolean, Instance swap) from `data-prop-*` | C5 |

The 2026-11-13 re-apply (properties on every atom, case tags, child defs on every variant) was checked offline only: the real-click clipboard decodes, but the design page wasn't pasted in Figma after it.

## Why a navbar swap changed every icon and label
A designer swapped a `NavItem` variant (Default → Active) and the icon and label reset to another item's content. In another case every nav item changed at once.

Causes found in the encoder:
1. Each `NavItem` variant's main was the **first occurrence** of that variant: "Overview" for Default, another item for Active. Their icon layers were named after the icon (`icon / layout-dashboard` vs `icon / clipboard-check`), so Figma couldn't match the icon override across variants → it reset. Broke R3.
2. The variants had different trees: Active carried a `Count` badge, Group a chevron. Layers that don't line up lose their overrides. Broke R2.
3. `Sidebar` was a variant set keyed by which group is open (`Open group = …`). Swapping it replaced every nav item. Broke R5.

Fixes: role names and unified trees (causes 1–2, confirmed with C4: swapping Members Default → Active → Group keeps icon and label); one `Sidebar` main built from `NavItem` instances, each module slot named with `data-layer`, sub-menus hidden where closed (cause 3, confirmed 2026-11-11). A first try pasting the Sidebar as a plain frame was rejected (no main component; the swap test failed). It remains as switch `sidebar-frame`.

## Numbers (GD admin design page, 2026-11-17 engine)
142 screens → 447 components in 125 sets, 3,083 instances, 31 optional-slot merges, 685 hidden-layer overrides, 6 generated states, 46 component properties with 2,926 values, ~1.9 MB. Validate: 0 errors. Auto-layout simulation: 3 known Input mismatches (2 px, invisible). Variant trees: 108 of 125 sets share one tree; the rest are excluded containers, table rows, or deeper differences (Button text-only variants, Input, NotificationItem, SortableRow, StatTile, TierBonusRow).

## GD-only test ladders
Kept in the GD repos as console functions (`figmaCompTest('C4', document.body)`), not in the bundle, because they use GD markup:
- **C1** component + instance with text override · **C1e** same without layout cache · **C2** section + 2-variant set · **C3** nested swap
- **C4** variant swap keeps content (nav items; swap Members Default → Active → Group, icon + label must stay)
- **C5** component properties (Rows 1–7 + Card A/B: change Label, swap Icon, toggle Show count; Rows 3/6 assignments only, Row 7 none, Card B nested)
- **F** one flow in design-page format

## GD markup lessons
- Mark the same slot the same way everywhere. Unmarked Microsoft button text grew Button's shared tree past the 3-layer cap (2 → 6 trees) until it was marked `Label` too.
- Name container items with `data-layer`. Otherwise R8 takes identity from the badge text (`IconButton / 3`).
- Don't put a Text property on rich text (`<b>` runs): the property value is plain text. Toast, Banner text and notification text stay unbound.
- `Field` was tried as a component and produced 25 meaningless variants: keep form fields as frames.
- The GD sidebar needed a grow spacer instead of `margin-top:auto`, and padding instead of the sub-menu margin, before it exported as auto layout.

## Universal bundle regression (2026-11-17)
The bundle's engine with `examples/gd-admin.config.js` produces a design-page payload identical to the GD repo's own (decoded and compared, excluding the random paste ID), both with GD's own viewer and with GD's viewer replaced by `figma-panel.js`. With `examples/gd-mobile.config.js`, the GD app's payload differs only by the three 2026-11-13 encoder improvements the app never received (`data-layer` names in `Content=` values, child defs on every variant, `screenTitle` for table rows); with those three reverted the payloads are identical.
