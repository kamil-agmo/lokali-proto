---
name: dd-iphone-duo-kamil
description: 'By Kamil · Add an iPhone Duo (foldable iPhone) mode to a dd-presenter-david prototype - asks first whether it is wanted, beside the iPhone (dd-iphone-david: iPhone | iPhone Duo tabs) or alone (iPhone Duo only). Adds a rotate button, closed and open frames with a 3D opening animation, the side rail Apple asks for, and automatic tablet layouts for the open screen; folded poses on request. Use when the user mentions iPhone Duo, a foldable or folding phone, the fold, inner and outer displays, a "tablet layout" for a phone prototype, or how the app looks opened.'
metadata:
  author: Kamil
  credit: 'iPhone Duo'
  marker: 'js/shell/duo.js'
  version: 1.1.0
  tier: Screens & devices
  summary: 'The foldable iPhone: frames, side rail, tablet layouts.'
  requires: 'dd-presenter-david'
---

# iPhone Duo mode for the presenter shell

**Made by Kamil**

A device skill for **dd-presenter-david**: previews the prototype on Apple's foldable iPhone Duo, next to the normal iPhone (when **dd-iphone-david** is there too) or on its own. Phone screens stay as they are.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

**Phone pages only.** Admin (desktop) pages are always desktop: nothing from the Duo, in any pose.

**Focus: closed to open first.** Folded poses (half-open book, tent) only when a project asks (`references/hig-study.md`, marked **[on request]**).

## What it adds

- iPhone | iPhone Duo tabs when `SHELL.devices` also lists `'iphone'`; iPhone Duo only (it opens closed, no device tabs) when it does not. A rotate button, Closed | Open; links can open a pose (`?device=iphone-l|outer|open-l|open-p`).
- The iPhone frame parts (status bar, Dynamic Island, home indicator, status bar colour) come from `css/shell/phone-frame.css` + `js/shell/phone-frame.js`: the same files dd-iphone-david installs, bundled here so Duo only needs no iPhone skill. Keep the two copies identical.
- Closed (451 × 650) and open (920 × 650) frames with a 3D opening animation.
- Sideways phones: a "turn it upright" screen or the app's wide layout (`SHELL.duo.sideways`).
- The **side rail** (closed and open horizontally), status bar colour that follows what is under it, and automatic **tablet layouts** when open (`references/tablet-layouts.md`).
- **The camera is never covered** (any pose, screen, sheet, alert or menu): check with `scripts/camera-check.js`.

Full list and sizes: `references/background.md`.

## Step 0: ask first (do not guess)

AskUserQuestion, every option explained (wording: `references/intake.md`). First, alone: **which phones?** (**iPhone only** recommended unless the client asked for foldables · **iPhone and iPhone Duo** · **iPhone Duo only**). iPhone only means stop (dd-iphone-david covers it). For both, run dd-iphone-david first. If the presenter or the kit already asked, don't ask again. After a yes, one round: **Screens** (which get tablet layouts), **Rail** (side rail, or none for Pixel Fold and other Android foldables), **Half-open** (off recommended), **Sideways** (upright screen, wide layout, or both), **Default** device (only with the iPhone too).

## Side rail rules (when the rail is on: required)

- Apple's iPhone Duo only; other foldables keep their top and bottom bars (`<html data-rail="off">`).
- The selected tab sits on a **vertical pill** (44 × 58, 44 × 48 in a tight rail), never a dot or colour alone; don't restyle the `::before` pill.
- **Widths:** rail 72 px; buttons and groups 48 px; tab bar 48 px with 44 px tabs; camera 18 px in from the corner. Don't widen the tab bar or narrow the buttons in project CSS.
- After changing `duo-screen.css`, bump the `?v=` on its link in every page.

## Workflow

1. **Install** (safe to run again; adds the presenter's side-card drawers first if an older shell lacks them; dd-desktop-kamil is not needed):
   ```bash
   python3 <skill>/scripts/install_duo.py --project <project> [--half-open] [--sideways notice|layout|iphone=notice,closed=layout] [--pages all|home.html,profile.html]
   ```
2. **Check each screen's kind** (open horizontal, then vertical): `<html data-tl-kind>`. Fix a wrong one with `<html data-tablet="<kind>|off">` (`references/tablet-layouts.md`).
3. **Fill every feed's side panel** from content the app already has, without asking (`references/tablet-layouts.md`, "Feed side panel").
4. **Project tweaks** go only in `css/shared/duo-tablet.css`, scoped with `html.duo-wide`: layout, never style.
5. **Record it** in `DESIGN.md` under "## iPhone Duo": poses, half-open, one line per screen.
6. **Check:** `install_duo.py --project <project> --check`, then for every screen closed, open vertical and open horizontal: measure columns (no overlap, nothing past the fold, rail not covering content), screenshot, open and close once. Rail on: pill shows, 72 px rail, 48 px buttons and tab bar; rail off: no rail anywhere.

"iPhone Duo, open" as the default: share `index.html?device=open-l`.

Remove: `install_duo.py --project <dir> --remove` (files and drawers stay).

## Last step: make things make sense

As a first-time viewer:
- The tabs read as a device choice; frames look like Apple's art (camera shown when closed, faint crease).
- Every screen in every pose: no overlap or stretching, rail icons centred, same functions as on the iPhone.
- The open screen looks like a tablet app, not a wide phone.
- Anything that only works on screen (Follow buttons that don't save) is said in the summary.
- Admin pages show nothing from the Duo, opened directly and by switching.

Summarise per screen and pose in a short table; say what could not be checked (real hardware, official sizes).
