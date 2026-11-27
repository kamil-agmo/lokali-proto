# Lock screen and reset

## What the lock does

- `index.html` has a full-page `<iframe id="lockscreen">` over the shell. While it is up the shell is `inert` and the phone is blank, so nothing is reachable by mouse or keyboard.
- The password is compared in the browser (`lock.js`). It sits in `shell.config.js` in plain text, so anyone who can open the file can read it. Present it as "keeps casual visitors out", never as security. If real protection is needed, put the prototype behind real access control (for example hosting-level auth) and say so.
- On success the lock page sets `sessionStorage['<prefix>-unlocked']` and posts `<prefix>:unlocked`; the shell lifts the cover (a short fade and zoom) and opens the start page. Opened on its own, the lock page goes to the start page instead.
- The unlock lasts the browser session: a new tab or window asks again.
- Every screen carries `lock-guard.js`, so a visitor who lands on any screen directly is sent to the lock screen first.

## Changing the password or the lock text

Edit `password`, `lock.taglines`, `lock.stats` and `lock.footer` in `shell.config.js`. Taglines may contain `<br>`. Set `stats` to `[]` to hide the numbers. Tell the user the password is not hidden.

## Reset (the icon beside the logo)

1. Clears what the screens stored: every `sessionStorage` key that does not start with the shell's `prefix`. The shell's and add-ons' own keys (`<prefix>-unlocked`, `<prefix>-dev`, `<prefix>-device`, `<prefix>:designer`) stay, so the prototype stays unlocked and dev mode, device and panels stay as they were.
2. Dispatches `<prefix>:reset` for add-ons, and reopens the start page with a fresh load (also when pages share one document, like `home.html#/a` and `home.html#/b`, which a src change alone would not reload).
3. Shows "Prototype reset · Undo" for 5 seconds. Undo puts the cleared keys back and reopens the page the viewer was on.

No confirmation: Undo makes a mis-click harmless. Screens must not use the shell's prefix for their own keys, or a reset keeps them.

## Locking again

There is no "Back to lock screen" button: unlocking lasts for the browser tab, so closing the tab (and opening the link again) shows the lock screen. A screen can still call `ProtoEmbed.relock()` (it clears everything and shows the lock screen); ask for confirmation first.

What survives both: `localStorage`, so use it on purpose (for example "do not show this banner again", or the appearance choice).

## Screens that offer the same control

A "Prototype controls" group on a profile or settings screen helps reviewers who have no side card. Rules that keep it honest:
- Label it clearly as not part of the design.
- Prefer "Reset prototype" calling `ProtoEmbed.reset()` (no confirmation needed: the shell offers Undo). On its own, outside the shell, clear the screens' keys and reload.
- Keep it out of design reviews and out of any build handed to developers.
