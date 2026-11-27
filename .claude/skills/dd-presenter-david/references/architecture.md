# Architecture

## Files (all under the project root)

| File | Role |
|---|---|
| `index.html` | the shell page: lock iframe, left card, the screen (`#phone` box with the `#screen` iframe), right card, the Reset icon in the brand row |
| `shell.config.js` | the only file you edit to add screens: name, password, prefix, start page, replay, lock text, pages, tree. Every page loads it |
| `js/shell/prototype.js` | builds the left list and the summary; lock, unlock and reset logic; phone scaling; `#page-id` links; checks the config and logs problems to the console |
| `css/shell/prototype.css` | layout, the plain screen, cards, Reset icon and its toast (variables at the top); device skills add their frame CSS after it (`css/shell/phone-frame.css`, `css/shell/duo.css`) |
| `pages/lock.html`, `css/pages/lock.css`, `js/pages/lock.js` | the lock screen (built from the config) |
| `js/shared/embed.js` | every screen, before `</body>`: adds `.in-phone` inside the shell and exposes `ProtoEmbed.report / reset / relock / replay` |
| `js/shared/lock-guard.js` | every screen's `<head>`, after `shell.config.js`: a visitor who opens a screen directly goes to the lock screen first |
| `pages/home.html`, `pages/details.html`, `css/pages/sample.css` | sample screens showing the patterns; replace them |
| `scripts/scaffold.py`, `scripts/check.py` | create the project; check the wiring |

## Message protocol

Screens and the lock page talk to the shell with `window.parent.postMessage({ type: '<prefix>:<name>', ... }, location.origin)`. The shell ignores a message unless it comes from its own lock iframe or phone iframe and from the same origin.

| Message | From | Meaning |
|---|---|---|
| `<prefix>:page` `{ id, facts }` | screen | this screen is on show; `facts` = `[[label, value], ...]` for the right card |
| `<prefix>:unlocked` | lock page | the password was right; the shell opens the start page |
| `<prefix>:reset` | screen | start again, still unlocked (the shell shows Undo) |
| `<prefix>:relock` | screen | clear everything and lock (the screen already confirmed with the user) |
| `<prefix>:replay` | screen | run the shell's Replay action |
| `<prefix>:nudge` | shell | pulse the lock screen's password field |

On Reset the shell dispatches a window event `<prefix>:reset` on itself, and on a lock `<prefix>:relock`, for add-ons.

## Storage

- `sessionStorage['<prefix>-unlocked']` is set by the lock screen and read by the shell and `lock-guard.js`.
- Everything else a screen stores in `sessionStorage` is wiped by a reset (keys starting with the shell prefix are kept, so never use that prefix for screen state). Use `localStorage` only for things that should survive one.

## Testing in a browser

- **Serve over http.** `file://` blocks reading the iframe's document.
- **Skip the lock in a test:** `sessionStorage.setItem('<prefix>-unlocked', '1')`, then load `index.html`.
- **Hash-only navigation does not reload.** After changing files, fetch them with `{ cache: 'reload' }` and call `location.reload()`, otherwise you are testing the old copy.
- **Hidden browser panes do not run animations or transitions.** Inject `*{animation:none!important}` and force end states before a screenshot.
- **Narrow windows:** under 800 px the left card hides and under 1380 px the right card hides, so only the screen (in its device frame) remains. That is expected; showing a screen full screen on a real phone is the `dd-phone-install-kamil` skill.
- **`[hidden]` loses to `display:flex`.** When hiding a styled element add `.thing[hidden]{display:none}`.
- **Icon font subsets:** the Google Fonts `icon_names=` list in a page's `<link>` must be alphabetical, or some icons render as raw text. The shell and lock page load four and five icons that way, so they need network access (everything else is plain files).

## Browser checks (after scaffolding)

- Serve over http (`python3 -m http.server`), never `file://`: the shell reads the iframe's document. Open `index.html` at least 1380 px wide (narrower hides the right card).
- The lock cover is up, the shell is inert, the phone is blank. A wrong password shows the error and shakes the field; the right one lifts the cover and opens the start page; both cards follow.
- A link inside a screen: the left list highlights the new page and the right card changes.
- **Reset** (icon beside the logo): like something, press Reset: the start page reloads fresh, nothing is liked, the prototype stays unlocked, and "Prototype reset · Undo" appears; Undo brings the state and page back. Closing the tab and reopening the link shows the lock screen.
- A screen's own URL in a fresh tab bounces to the lock screen, then opens after the password.
- Credits: the button under the right card opens one line starting "Design by …".

## Colours and independence

The shell carries no design system and no brand colours of its own: neutral greys and white cards with one accent (`theme.accent`, optionally `accentStrong`, `lockBg`) for the active page, highlights and the lock screen's glow. `theme.font`, `fontUrl`, `radius`, `pageBg` stay off unless the user wants the shell to match the prototype. The shell never touches the screens and reads only the `html.in-phone` class its embed script adds; its variables live in the shell page only, so they cannot clash with the prototype's.

## Screens inside the frame

A device frame (dd-iphone-david, dd-iphone-duo-kamil) draws a fake status bar and island, so a screen leaves about 62 px at the top while `html.in-phone` is set (`embed.js` adds it only inside the shell); the `--sb` line in `sample.css` is the pattern. Real-phone fit (safe areas, full screen, install as app) belongs to dd-phone-install-kamil.
