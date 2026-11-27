---
name: dd-desktop-kamil
description: 'By Kamil · The desktop device for a dd-presenter-david prototype - pages marked desktop fill the window like a real web app (no phone frame), Navigation and Summary become full-height drawers (docked on ultrawide), content stops at a maximum width. Beside iPhone and iPhone Duo; admin panels (dd-admin-panel-kamil), desktop web apps and websites use it. Asks first about width and ultrawide. Use when the user wants desktop or web pages in a prototype, a "desktop version", full-window pages, or admin, dashboard or back-office screens.'
metadata:
  author: Kamil
  credit: 'Desktop'
  marker: 'js/shell/admin-shell.js'
  version: 2.0.0
  tier: Screens & devices
  summary: 'Desktop pages that fill the window like a web app.'
  requires: 'dd-presenter-david'
---

# Desktop (device skill for dd-presenter-david)

**Made by Kamil**

The desktop device: where desktop pages show. Like dd-iphone-david and dd-iphone-duo-kamil it only decides how pages are presented; it builds no screens. Admin screens come from **dd-admin-panel-kamil**, which uses this skill. (Formerly dd-admin-kamil: the files in a project are the same, so older prototypes keep working.)

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## What it does

- **Desktop is always desktop:** never a phone or iPhone Duo frame, crease, camera, rail, tablet layout, rotation or device tabs, however the page is reached.
- Pages with `device: 'desktop'` (on the page or its `tree` group) fill the window; switching restyles the same iframe, nothing reloads.
- Navigation and Summary become full-height **drawers** behind "Navigation" / "Summary" edge tabs; on ultrawide windows (2.1 : 1 or 2560 px and up) they **dock** as columns.
- Content stops at `--content-max` (default **1440 px**) and centres; pages get `html.in-desktop` instead of `in-phone`.

Full detail and window-size checks: `references/details.md`.

## Step 0: ask first (do not guess)

AskUserQuestion, recommended first, every option explained: **Width** (cap at 1440 / 1280 / full) · **Ultrawide** (docked columns or always drawers). If the presenter or the prototype kit already asked, don't ask again.

## Workflow

1. **Install:** `python3 <skill>/scripts/install_admin.py --project <project> --content-max <1440|1280|none> [--no-dock]` (needs the presenter's hooks); it writes `desktop: { contentMax, dock }` into `shell.config.js` and refreshes the credits.
2. **Mark the pages:** a tree group `{ label: '…', device: 'desktop', children: [...] }`, or `device: 'desktop'` per page.
3. **Desktop page rules:** main content gets `max-width: var(--content-max, none); margin-inline: auto`; no phone safe areas; session state in `sessionStorage` (`references/details.md`, "Desktop pages").
4. **Check:** `install_admin.py --project <project> --check`, then the shell's `check.py`.
5. **Verify at real sizes** with headless Chrome (an embedded pane is often phone-width): about 1600 × 900 (drawers open full height), 2560 × 1080 and 3440 × 1440 (docked, content centred), then a phone page (frame returns, `in-phone`).

## Last step: make things make sense

- Moving between phone and desktop pages feels intentional; edge tabs only when panels are hidden; Credits reachable.
- Desktop stays desktop in every device mode: with the iPhone Duo chosen (and turned), open a desktop page directly and by switching.

Report what changed and what you could not check. Background: `references/background.md`.
