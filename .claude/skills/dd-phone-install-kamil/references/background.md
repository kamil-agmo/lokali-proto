# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing

- **The phone frame stays in dd-presenter-david.** The frame and its scaling are part of presenting on a desktop. Only what happens on a real phone lives here.
- **The redirect uses `max-width: 500px`,** so landscape phones and tablets keep the frame. Change the number in `index.html` if you want something else.
- **The service worker caches nothing.** A prototype is redeployed often, and a cache would show reviewers old screens. It exists because browsers want one before they call a site installable. Add caching only when offline use is a real requirement, and version it.
- **The banner never shows** on desktop, in an installed app, or inside the presenter frame; "Not now" snoozes it for 7 days in `localStorage` (it survives the shell's reset, which clears `sessionStorage` only).
- **Android gets the real install dialog** when the browser offers it (the button then says "Install"); until then, or if it never does, the same button opens step-by-step instructions. iPhone has no install API, so it always gets the steps.
- **An installed prototype asks for the password again on each cold start,** because a new launch is a new session. That is the shell's reset behaviour, not a bug.

## Limits

- Safe-area insets, service worker registration and the native install dialog cannot be verified in an embedded browser or an emulator. The static checks and the logic tests reduce the risk; a device settles it.
- iOS only adds apps to the home screen from the browser's own Share menu. Pages opened inside another app (Facebook, Instagram and similar) are told to open the browser first.
- Icon and manifest changes reach phones that already installed the app only after it is removed and added again (iOS), or after the browser updates it in the background (Android, can take a day).


## What the skill puts where

| Piece | Where it ends up | Job |
|---|---|---|
| `phone.css` | `css/shared/phone.css` | defines `--sb` (top room) and `--safe-b` (bottom room) |
| head tags | every page's `<head>`, between `phone-install:begin/end` markers | manifest link, theme colour, touch icon, favicons, iOS web-app tags, `viewport-fit=cover` |
| `manifest.webmanifest` + 8 icons | project root, `assets/icons/` | what the installed app is called, looks like and opens; it stays portrait unless the iPhone Duo skill's sideways choice gives the iPhone a wide layout (then it may turn) |
| `sw.js` | project root | minimal service worker, so browsers offer the install (it caches nothing) |
| `install.js` | `js/shared/install.js` | the banner, the install row, the steps sheet |
| shell redirect | `index.html` (only if it is a presenter shell) | a phone-sized window opens the start screen full screen; `?shell` shows the frame |
| `scripts/check.py` | stays in the skill | static checks, plus a list of places in your CSS to change by hand |
