---
name: dd-designer-mode-kamil
description: 'By Kamil · Add Designer mode to a dd-presenter-david prototype, for designers - copy one screen or all screens and paste (⌘V) straight onto the Figma canvas as native design: auto layout, text, photos, vector icons, and components with variants (Sebastian''s engine, dd-figma-components-sebastian). An add-on: asks first. Use when the user wants the prototype in Figma, "copy to Figma", "paste into Figma", "export screens for designers", or a designer handoff.'
metadata:
  author: Kamil
  credit: 'Copy to Figma'
  marker: 'js/shell/designer.js'
  version: 1.4.0
  tier: Share & hand-off
  summary: 'Copy screens into Figma for designers.'
  requires: 'dd-presenter-david, dd-figma-components-sebastian'
---

# Copy to Figma (add-on for dd-presenter-david; folder name: dd-designer-mode-kamil)

**Made by Kamil**

A **Designer** button in the presenter's right card (beside Dev mode, if it is there) opens a panel for bringing the screens into Figma. It only reads the screens: nothing in the prototype changes, and using it costs no tokens.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## What the panel does

- **Copy this screen** / **Copy all screens:** a native Figma paste (⌘V on the canvas, no plugin), built by Sebastian's engine (**dd-figma-components-sebastian**) through `js/shell/figma-bridge.js`: frames clipped to the screen (402 × 874; admin 1440 × 900), auto layout, real text, photos, Material Symbols as vector icons. **All screens** makes one section per page group plus the components (our `c-*` classes: buttons, tabs, rows, switches…) as variant sets with linked instances.
- **Copy all screens** shows a progress bar: it fills as each screen is read, then shows "Building the Figma paste".
- **Maps** (dd-map-kamil): the map drawing becomes SVG layers (Land, Parks, Water, Roads, Labels…) and its markers become `MapMarker` components. A detailed map (usually a wide desktop one) asks first: **Full SVG** (everything, editable, slow paste) · **Simple SVG** (water, parks, main roads, names) · **Image** (one picture). The answer holds for the rest of that copy.
- A long copy outlives the browser's copy permission (about 5 s): the panel then shows **Copy now**; one click copies it.

How the bridge works: each page is loaded in a hidden frame inside the window (off-screen frames are paused by Chrome, so scroll-in reveals and animations never ran), animations are finished, then on that copy: `c-*` elements get `data-component` / `data-variant` (base class → name; modifiers → Type / Size; `is-on`, `aria-current`, `aria-selected`, `aria-pressed`, checked → State "on"); icon-font glyphs become Google's SVG with `data-icon`; photos become `data:` URLs; `::before` / `::after` become real layers (switch knobs, badges, dividers); text fields become boxes with their text (his engine keeps only the text); gradients are drawn to pictures behind the content (his engine has solid fills only; gradient text takes its first colour); out-of-flow layers are reordered to CSS paint order (Figma stacks by layer order); colours his engine cannot read (`color-mix()`, `oklch()` → `color(srgb …)`) become `rgba()`; invisible layers (opacity 0) are dropped and faded text gets its opacity in its colour; `backdrop-filter: blur()` becomes a background blur; absolutely placed layers lose grow/stretch. App bars, large titles, cards, sheets, dialogs, fields and lists stay plain frames, not components: their content differs per screen, and a Figma instance overrides only text, not sizes (a shared app bar squeezed "Online Time Waster" into another screen's title box). His serialiser then runs inside the page. A page can mark its own components with `data-component` and the bridge leaves them alone. The prototype on show is never changed.

Fonts: his engine draws text from static TrueType files, so the installer saves Inter (the stand-in for system-ui / SF Pro) and every Google Font the project loads to `js/shell/figma/fonts/` (with `fonts.json`); the bridge embeds them only while copying. Without them Figma shows the text empty. A font that is not on Google Fonts is left to Figma (it must have it). Run the installer again after changing fonts.

Limits to tell the user: very custom CSS comes across simplified; only what is on screen is copied (nothing below the fold); no `.fig` files; colours and text sizes are not Figma variables or text styles (the old plugin that made them was retired in 1.2: one ⌘V does everything else, without an install).

## Step 0: ask first

If the prototype kit or the presenter's round 4 already chose it, do not ask again. Otherwise ask (AskUserQuestion, options explained): **Add Designer mode (Recommended if designers will work on it in Figma)**: a Designer button that copies screens into Figma · **No**: nothing changes.

## Install

```bash
python3 <skill>/scripts/install_designer.py --project <project>           # safe to run again
python3 <skill>/scripts/install_designer.py --project <project> --check   # only check the wiring
```

It copies Sebastian's engine from **dd-figma-components-sebastian** (installed next to this skill) to `js/shell/figma/`, adding one line to his `figma-export.js` (`FX.nodeOf`, which reads a live page; his own `screenNode` re-renders HTML), plus `js/shell/figma-bridge.js`, `js/shell/designer.js` and `css/shell/designer.css`; moves the retired SVG export and Figma plugin (`js/shell/figma-export.js`, `figma-plugin/`) of older installs to the Trash; adds the stylesheet, the scripts and its icons (palette, content_copy, dashboard) to `index.html`; and refreshes the credits (Designer mode by Kamil; Figma components by Sebastian). A file you changed is kept unless `--force`; the engine is always refreshed from his skill.

## Verify

1. Serve over http, open `index.html` at least 1380 px wide: the **Designer** button sits in the right card's top row, with its palette icon (not the word "palette").
2. Press it, then **Copy all screens**: the note ends with "Copied N screens with components (… KB, … components)". To see what was captured, record the trees (wrap `FigmaBridge.tree`) and draw them with `FX.toSvg(trees)` in the page: every screen should match the prototype (fills, gradients, fields, icons, stacking; this preview ignores clipping, rounding and opacity).
3. The Credits note includes Designer mode and Figma components (Sebastian).
4. Ask the user to paste into real Figma: the one place the result can be judged.

A local server that drops connections (the single-threaded `python3 -m http.server` under many parallel requests) leaves screens half-loaded and the export empty: use a threaded server when testing.

## Last step: make things make sense

Read the panel as a designer who has never seen it: the two copy buttons, the hint ("click the Figma canvas and paste"), the progress bar and Copy now must be clear without help. Then report what changed and what you could not check (real Figma is the one place the result can be judged).
