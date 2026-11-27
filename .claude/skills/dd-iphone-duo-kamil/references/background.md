# Background

Moved out of SKILL.md to keep it short; read it when changing how the add-on works or when something behaves unexpectedly.

## Feature details (moved from SKILL.md "What it adds")

- **Device tabs above the phone**: iPhone | iPhone Duo, with a **rotate-phone button** beside them that turns the phone 90° to the right: the iPhone sideways (874 × 402, Dynamic Island on the right, no status bar, bars at the bottom) or the open Duo between horizontal and vertical; it turns the closed Duo too (hinge on top, camera bottom-right). A phone turned sideways shows a styled "turn it upright" screen or the app's wide layout, as chosen (`SHELL.duo.sideways`: one value for both, or `{ iphone, closed }` per device); the open Duo always shows its layouts. The button uses the Material Symbols `screen_rotation` icon from the shell's icon font. **Closed | Open** sits under the frame, only for the Duo. Both bars keep the same 16 px gap from the frame and move with it. A link can open a pose directly: `?device=iphone-l|outer|open-l|open-p`.
- **Frames** in proportion to Apple's photos (open 920 × 650, closed 451 × 650, one display scale for every pose): a D-shaped closed frame with the camera in the corner (always visible), a thin frame with a shadow, a soft fold crease when open, no side buttons. Replace the sizes with Apple Design Resources numbers when they are available.
- **Open and close animation**: the right half swings in 3D (see-through, titanium edge, blur and dark gradient) while the screen underneath resizes live, so the content reflows like a resized window. The status bar and rail slide, the fold crease fades in and out, and the side cards ride along or become edge drawers when the window is too narrow. Opening keeps the hinge where it is: the upright closed Duo opens sideways into the open horizontal Duo; the sideways closed Duo (hinge on top) opens upward into the open vertical Duo, and closes back down into it. Check either with `Duo.still(0.5)` / `Duo.stillTurned(0.5)`.
- **Status rail** as in Apple's art: camera, time and one status ring on the rail; the colour follows a dark page or dark mode.
- **Side rail on the screens** (Apple's guidance): on the closed display and when open horizontally, the tab bar and the icon buttons of the top bar move into a floating glass rail on the right edge. Their click handlers keep working. Works with the kit's components and with plain markup (a bar fixed to the bottom with 2-6 links; icon-only buttons with an `aria-label` in the top bar). Tabs with words only get a matching symbol in the rail from their name (Orders: a receipt; no match: the first letter); the phone keeps its words. Bars with text buttons (Cancel / Save) stay horizontal.
  - **Order**, as in Apple's "Raise the bar with iPhone Duo": going back or closing at the top, then the main action (an icon-only Done / Save, or `data-prominent`) as a filled accent circle, then the rest.
  - **Where items came from**: top bar buttons at the top of the column, bottom toolbar buttons (`.c-toolbar`, `[data-duo-toolbar]`, or icon buttons fixed near the bottom) at its bottom, just above the tab bar; the emptied toolbar hides.
  - **Groups stay groups**: a `.c-appbar__group` (or `[data-duo-group]`) becomes one capsule.
  - **Badges, not text**: `data-badge="3"` on a button or tab shows a count on its symbol (also on the phone).
  - **Overflow**: when the rail runs out of room (sideways closed Duo, keyboard) items move into one "more" menu, bottom-up, lowest `data-priority` first (badged items count as high); going back never leaves. Navigation screens keep the tab bar longest; `<html data-rail-compress="tabs">` (task screens) shrinks the tab bar to its current tab first.
  - **Column width** 72 px (48 px buttons, 12 px each side), so content sits close to the controls, as Apple's uneven margins allow.
  - **Opt out**: `<html data-rail="off">` keeps a screen's own horizontal bars (bottom-heavy single-page screens, control-heavy views) while keeping its layouts.
  - **Title** stays top-left in a horizontal bar; text buttons (Edit, Cancel / Save) stay horizontal.
  - **Sheets**: on the closed Duo a sheet's own bar goes vertical on its right edge; open, sheets are centred and keep a horizontal bar.
- **Automatic tablet layouts** for the open screen: `js/shared/duo-auto.js` recognises each screen (sign-in, form, profile with a photo grid, photo grid, product or place cards, feed, a product or article with a big picture, a post with photos and comments, a list whose rows open other screens (side by side or stacked), a chat, anything else; stat tiles get more columns on any screen) and applies the matching layout from Google's canonical layouts and Apple's guidance, at medium (open vertical, 650) and expanded (open horizontal, 920). Nothing to write per screen; content that loads later (a feed) is picked up as it arrives. See `references/tablet-layouts.md`.
- **Half-open (book) pose**, off unless chosen: the fold becomes a reserved region and content moves clear of it.



## Everything the add-on adds (full list)

- **Controls around the phone**: iPhone | iPhone Duo tabs and a rotate-phone button (turns 90° right) above it, Closed | Open under it (Duo only). Links can open a pose: `?device=iphone-l|outer|open-l|open-p`.
- **Frames and the opening animation**: closed (451 × 650) and open (920 × 650) frames, a 3D swing with the screen resizing live; the hinge stays put (upright closed opens horizontal, sideways closed opens vertical).
- **Sideways phones** show a "turn it upright" screen or the app's wide layout: `SHELL.duo.sideways` (`'notice'` / `'layout'`, or `{ iphone, closed }`).
- **Side rail** (closed, and open horizontally): top bar icon buttons at the top, bottom toolbar buttons at the bottom, tab bar bottom-aligned (48 px wide like the buttons, 44 px tabs, centred, inside the safe area, selected tab a 44 × 58 vertical pill); text buttons and the title stay horizontal. Page hooks: `data-prominent` (main action), `data-duo-group`, `data-duo-toolbar`, `data-badge`, `data-priority="high|low"`, `<html data-rail-compress="tabs">`, `<html data-rail="off">`.
- **Status bar colour** (every pose): white on a dark colour, black on a light one, read from what is under the time (header, panel, page; the page colour under a photo); re-checked on scroll, theme fades and turns.
- **Camera never covered** (any pose, screen, sheet, alert, snackbar or menu): nothing visible may sit under the Dynamic Island or the Duo camera; check with `scripts/camera-check.js` (paste into the shell page console) and move anything it lists.
- **Apple's Duo rules also in force**: the inner camera is a reserved region only while in use; navigation stays outside split/overlay arrangements; no extreme layout jumps when folding.
- **Round search tab** (`c-tab--search`): on wide screens the bar and the circle are centred together and the circle keeps its size; in the rail it is a normal tab. A tab with `aria-label` stays a tab in the rail.
- **Automatic tablet layouts** when open, by screen kind (see `references/tablet-layouts.md`); override with `<html data-tablet="…|off">`; a main + secondary view with `data-arrange="split|overlay"`.
- **Folded (book) pose**: built in, off unless a project asks.
