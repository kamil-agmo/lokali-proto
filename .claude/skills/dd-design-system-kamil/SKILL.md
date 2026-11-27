---
name: dd-design-system-kamil
description: 'By Kamil, with Tze Yong · Give a dd-presenter-david prototype its own design system: a rulebook (allowed spacing, rounding, text sizes, weights, tap areas, colours, do and don''t), a Design System panel, a dev-mode Rules check (amber, never errors), approved exceptions, and a "Download design skill" export for developers. Asks first, as explained options. Use when the user mentions a design system, UI standard, UI/UX rules, spacing scale, "only these values", design tokens, a style guide, rule exceptions, or exporting the design for developers.'
metadata:
  author: Kamil
  contributors: 'Tze Yong'
  credit: 'Design system'
  marker: 'design-system.config.js | ui-standard.config.js'
  version: 1.0.0
  tier: Look & feel
  summary: 'Rules for spacing, sizes and colours, with a Rules check.'
  requires: 'dd-presenter-david, dd-dev-mode-kamil'
---

# Design system (rulebook, panel, Rules check, exceptions, design skill export)

**Made by Kamil**, with Tze Yong

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

One file, `design-system.config.js`, holds the rules; the **Design System** panel, the dev-mode **Rules** check and the **Download design skill** export all read it. Needs dd-presenter-david **with dd-dev-mode-kamil**. In the kit it runs right after the shell, so typography, icons and components use its scales. Parts and the full questions: `references/details.md`.

## Step 0: ask first (do not guess)

Read `DESIGN.md` first and recommend its system. AskUserQuestion, recommended first, every option explained: **Base** (the one in DESIGN.md, Material 3, Fluent/Carbon/Ant, custom) · **Who sees** the panel (everyone view-only, or dev mode only) · **Screens** already built (list then fix, only list, leave) · **Tap** minimum (only with desktop screens or if raised; it's about the tappable area, not the visible size).

## Workflow

1. **Install** (keeps an existing config; `--dry-run` first if unsure):
   ```bash
   python3 <skill>/scripts/install_ds.py --project <dir> --preset apple|material|fluent|carbon|ant --show everyone|dev [--tap N] [--tap-desktop N]
   ```
   It copies `ds-check.js`, `ds-skill.js` and `pages/design-system.html`, adds the buttons and panel to `index.html`, and publishes `COMPONENTS.md` / `DESIGN.md` in `firebase.json` (the download reads them). Stops on the older OTW test version (`ui-standard.config.js`): ask before upgrading.
2. **Fill in the rulebook:** theme line, colour labels, short checkable must / cannot lists.
3. **Existing screens:** `scripts/conform.py --project <dir>` lists; `--apply` moves spacing, sizes and weights to the nearest step (backed up first). Rounding and tap areas: fix by hand or record an exception.
4. **Check every screen with dev mode › Rules**, including content that appears later, sheets, dialogs, toasts and dark mode.
5. **Approved exceptions:** `exceptions` with `where`, `rule` and a **reason**; one-offs via `data-rule-ok="reason"`. No reason means it's a mistake, not an exception.
6. **Before every deploy:** `conform.py` (list only); mention anything found.

## Wording and look (keep it this way)

Differences are **information, never errors**: amber, "N differences from the design system", "Spacing not on the scale: 14 px · use 12 or 16". Exceptions: dashed blue, "Approved exceptions (bent on purpose)". Clean screen: "This screen follows the design system."

## Last step: make things make sense

Propose Apple HIG defaults (`dd-components-kamil/references/hig-rules.md`): contrast 4.5:1, tap areas 44 × 44 with space between, no light body weights, one colour per meaning, never colour alone.
- Presenter mode: Design System beside Dev mode (if `show: 'everyone'`), readable, **no** download. Dev mode: Sections | Rules, and the download in the panel.
- Every screen passes Rules or shows only approved exceptions.
- The scales match `DESIGN.md`, typography and components.
- Download the skill once and read it: right for this app.

Report the preset and changes, who sees the panel, what was conformed (and backed up where), exceptions with reasons, what couldn't be checked.

## Keep it light

The checker and export run only when clicked. Don't read the assets; read `presets.json` only to explain a preset.
