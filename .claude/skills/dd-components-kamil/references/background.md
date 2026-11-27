# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing

- **Which guidelines (checked October 2026).** Apple: the Liquid Glass design from iOS 26 with the iOS 27 refinements: floating glass tab bar (search can be a tab again), transparent navigation bars with glass circle/capsule buttons, capsule buttons, a hard-blur scroll edge with a bottom line, glass with defined edges instead of drop shadows and lighter in dark mode, sheets with close on the leading edge and Done on the trailing edge (HIG, March 2026). Google: Material 3 Expressive: 64 dp navigation bar, buttons that change shape when pressed, wavy progress, the shape-morphing loading indicator. When a new major version ships (iOS 28, a new Material release), re-check the HIG "What's new" page and m3.material.io and update the variants and labels.

- **Look-alikes, not originals.** These are lightweight re-creations of the Material 3 and Apple styles, not Google's Material Web components (heavy, hard to restyle) and not Apple assets (SF Symbols and SF Pro cannot be used on the web; icons come from Material Symbols, or another set via dd-icons-kamil).
- **Only what is picked ships.** `components.css` / `components.js` are generated from `components.json`; edit picks and reinstall rather than editing the generated files.
- **Brand first.** `--c-*` variables fall back to the app's tokens, then to neutral defaults, so a prototype with tokens needs no theming; dev mode shows the app's token names on component values.
- **Classes are the contract:** `c-<component>--md | --ios | --fluent | --carbon | --ant` on the root element. That is what `swap` and `check` read.
- **Five styles, one markup per component.** Fluent 2, Carbon and Ant Design reuse the Material or Apple markup that matches them best and get their look from `sys-<style>.css`, which `scripts/systems.py` generates from each system's tokens (corners, heights, field style, shadows, fonts) plus its signature details (Carbon's dark shell and full-width modal buttons, Fluent's underline focus, Ant's soft focus glow). Edit `systems.py`, then run it; never edit the generated files. The installer copies only the blocks for picked components.
- **Pairs with:** dd-icons-kamil (icon font), dd-typography-kamil (fonts, sizes), dd-presenter-david (frame, status-bar room), dd-phone-install-kamil (real phones).

## iPhone Duo side rail

If the prototype has iPhone Duo mode (dd-iphone-duo-kamil), its screen script moves the installed tab bar and app-bar icon buttons into a vertical glass rail on the right edge; they keep their classes and click handlers, so build them as usual. Two rules keep them working there:
- Every icon button keeps an `aria-label` (it becomes the rail's tooltip and screen-reader name); bars with text buttons (Cancel / Save) stay horizontal.
- A tab's hidden label must take no height (`font-size: 0; line-height: 0` on the tab), or the icon sits above the centre of its circle.
