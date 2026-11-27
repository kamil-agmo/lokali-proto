# Desktop: details

## What it does

- **Desktop is always desktop.** A desktop page is never shown as a phone: no phone frame, no iPhone Duo frame, crease, camera, side rail, tablet layouts, rotation or device tabs, whatever device the presenter has chosen and however the page is reached.
- **Full-window desktop view.** Pages with `device: 'desktop'` (on the page, or on its `tree` group) fill the whole window like a real desktop app: no phone frame, no browser frame. Switching between phone and admin pages restyles the same iframe, so nothing reloads. Phone pages look exactly as before.
- **Full-height panels.** The shell's Navigation (left) and Summary/dev mode (right) cards become solid panels that run the full height of the window.
  - **Normal windows:** slide-in **drawers** behind two minimal vertical edge tabs, **"Navigation"** on the left and **"Summary"** on the right. A click slides the panel in over a dimmed page; a click outside, the other tab, Esc or picking a page closes it.
  - **Ultrawide windows** (2.1 : 1 or wider, or 2560 px and up): the panels stay **docked as full-height columns** beside the page and the tabs hide (unless the user chose "always drawers").
- **Maximum content width.** Desktop pages get `--content-max` (default **1440 px**) and `html.in-desktop` (instead of `in-phone`), so the admin's main content stops growing on ultrawide screens and centres, while its sidebar and header background still reach the edges.

## The questions, in full

| Header | Question | Options (with the explanation to show) |
|---|---|---|
| `Admin width` | On very wide screens, should the admin content stop at a maximum width? | **Cap at 1440 px (Recommended)**: content stays a comfortable reading width and centres on ultrawide screens; sidebar and header background still reach the edges · **Cap at 1280 px**: tighter; suits forms and settings-heavy admin · **Full width**: content stretches across the whole screen; good for wide data tables and dashboards with many columns |
| `Ultrawide` | On ultrawide screens, how should the Navigation and Summary panels behave? | **Docked columns (Recommended)**: both panels stay open as full-height columns beside the admin, using the extra width; no tabs needed · **Always drawers**: panels stay hidden behind the edge tabs on every screen size, so the admin always gets the whole window |

## Desktop pages

**Desktop pages** (admin screens from dd-admin-panel-kamil, or any desktop page). Each is a normal shell screen (config + lock guard in `<head>`, `embed.js` and `ProtoEmbed.report()` before `</body>`, links through `parent.location.hash`). Desktop rules:
   - Fill the window: `html, body { height: 100%; }`, layout at desktop widths (sidebar 220-260 px, sticky top bar, cards, tables).
   - **Content width:** the main content wrapper gets `width: 100%; max-width: var(--content-max, none); margin-inline: auto;`. A sticky header that spans the width keeps its background full width and lines its contents up with: `padding-inline: max(32px, calc((100% - var(--content-max, 100%)) / 2 + 32px));`.
   - No phone safe areas or status-bar room; `html.in-desktop` is set instead of `in-phone`.
   - State that should reset with "Back to lock screen" goes in `sessionStorage`.

## Verifying at real window sizes

**Verify with real window sizes.** An embedded browser pane is often phone-width, which redirects to the phone view, so use headless Chrome screenshots (unlock via `sessionStorage.setItem('<prefix>-unlocked', '1')` in a temporary helper page that loads the shell in a full-size iframe; delete the helper afterwards, never deploy it):
   - about **1600 × 900**: the admin fills the window, both edge tabs show, each drawer opens full height and closes;
   - **2560 × 1080** and **3440 × 1440**: both panels docked full height (or drawers, if chosen), tabs hidden, content stops at the chosen width and centres;
   - a phone page afterwards: the phone frame returns and the page has `in-phone`.
