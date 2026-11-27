# Real-phone fit

How screens leave the right room for the status bar and the home indicator, and how a phone-sized window opens a screen full screen.

Contents: the two variables · retrofitting a prototype · patterns · full height and fields · full-screen redirect · checking it · what goes wrong

## The two variables

`css/shared/phone.css` (link it last in every page's `<head>`, so nothing earlier overrides it):

```css
:root { --sb: calc(env(safe-area-inset-top, 0px) + 12px); --safe-b: env(safe-area-inset-bottom, 0px); }
html.in-phone { --sb: 62px; --safe-b: 34px; }
```

- `--sb` is the room a screen leaves at the top. `env(safe-area-inset-top)` is what the operating system says it covers (notch, island, status bar); the extra 12 px is breathing room. The `0px` fallback matters: where the system keeps its own strip above the page, the inset is 0 and `--sb` is a small, correct 12 px.
- `--safe-b` is the room fixed bars and sheets leave at the bottom for the home indicator.
- Inside the presenter's frame (`html.in-phone`, set by the shell's `embed.js`) there is a fake status bar and home indicator of fixed size, so fixed stand-ins apply. Without a shell the class never appears and that line is harmless.
- `env(...)` returns 0 unless the viewport meta has `viewport-fit=cover`. `install.py` adds it to every page; `check.py` errors when it is missing.

Why a variable and not a number: the old way (a fixed 62 px designed for the frame) is right in the frame and wrong everywhere else. Installed on an iPhone with the default status bar, it leaves a big empty band; on a phone with a bigger notch, a fixed small number hides content.

## Retrofitting a prototype

1. Run `scripts/check.py`. Its `review:` lines list CSS that sets a fixed size typical of a status bar or top bar (44 to 64 px, or 100 to 140 px for a bar plus status bar) on `top`, `height`, `padding-top` and similar in a bar, header, nav, page or hero rule, plus `100vh` and input text under 16 px. Those are candidates, not verdicts: a 100 px hero image is fine.
2. Search the project for the numbers your design used for the status bar (commonly `47px`, `54px`, `59px`, `62px`), for `padding-top` on top bars, and for `top:` on fixed elements. `grep -rn "62px" css pages` finds most of them.
3. If the prototype already defines its own status-bar variable (for example `--sb: 62px` in a tokens file), `phone.css` still wins where it is linked last, but two definitions are confusing. Delete the project's own, or point it at the formula above. Variables derived from it (`--appbar-h: calc(var(--sb) + 56px)`) then follow automatically.
4. Change one pattern at a time and look at the result at phone width, then in the frame (`/?shell` at a desktop width), because both must still look right.

## Patterns

```css
.appbar  { height: calc(var(--sb) + 56px); padding-top: var(--sb); }      /* fixed top bar: status-bar room + 56 px of bar */
.page    { padding-top: calc(var(--sb) + 56px + 16px); }                  /* content starts below the bar */
.hero    { margin-top: calc(var(--sb) * -1); padding-top: var(--sb); }    /* artwork that runs under the status bar */
.tabbar  { padding-bottom: var(--safe-b); }                               /* a bottom bar clears the home indicator */
.sheet   { padding-bottom: calc(24px + var(--safe-b)); }                  /* a bottom sheet too */
.fab     { bottom: calc(16px + var(--safe-b)); }                          /* a floating button */
```

- A bar's height and the content's top padding must change together, or the first card slides under the bar.
- Bars measured with a fixed number elsewhere (a sticky header at `top: 62px`) need `top: calc(var(--sb) + 56px)` or similar.

## Full height and form fields

- **`100dvh` instead of `100vh`.** On phones `100vh` is the height with the browser toolbar hidden, so a bottom bar sits under the toolbar until it slides away. `100dvh` follows the visible area. Write both on one line so old browsers fall back: `min-height: 100vh; min-height: 100dvh;`. `check.py` accepts that pattern.
- **Inputs at 16 px or more.** iOS zooms into a field whose text is smaller and does not zoom back. `phone.css` sets `font-size: max(16px, 1em)` on `input, select, textarea`; a more specific rule in the project can override it, and `check.py` lists those.
- `-webkit-text-size-adjust: 100%` (in `phone.css`) stops phones enlarging text when the device turns.
- Optional for installed apps: `overscroll-behavior-y: none` on `body` stops the white rubber-band bounce at the page edges.

## Opening full screen on a phone

When `index.html` is a presenter shell, a phone would otherwise see the shell: a frame inside the phone. `install.py` adds this just after `shell.config.js` loads:

```html
<script>/* phone-install: on a phone-sized window open the first screen full screen instead of the presenter frame (add ?shell to see the frame) */
  (function () { var S = window.SHELL, p = S && S.pages && S.pages[S.startPage];
    if (p && matchMedia('(max-width: 500px)').matches && location.search.indexOf('shell') < 0) location.replace(p.src); })();
</script>
```

- The start screen is `SHELL.pages[SHELL.startPage].src`, so it follows the config. With a lock screen as the start page, the visitor lands on the lock screen, unlocks, and moves on without any shell.
- 500 px is the breakpoint: phones in portrait go full screen; landscape phones, tablets and desktops keep the frame. Edit the number to change that.
- `?shell` is the escape hatch for looking at the frame on a narrow window (for example while resizing a desktop browser).
- Without the redirect (`--no-redirect`), the shell is still safe on a phone but shows the frame.

## Checking it

| Where | What it can tell you |
|---|---|
| `check.py` | the head tags, the viewport, the touch icon, the redirect, and the CSS review list |
| Browser at about 375 × 812 | the layout at phone width, with the fallback 12 px: no overlap, no empty band |
| `/?shell` at a desktop width | the frame still looks right (62 px) |
| A real iPhone, in Safari | the browser-tab case |
| A real iPhone, installed | the case that usually reveals the top gap |
| A real Android phone, in Chrome and installed | the same two cases |

Emulators and DevTools device mode report insets of 0, so they confirm the fallback only. Say that in the hand-over instead of claiming the notch case is verified.

## What goes wrong

- **A big empty band at the top when installed:** a fixed status-bar gap is still in use somewhere (the `review:` list, or a second `--sb` definition after `phone.css`).
- **Content hidden under the notch:** the viewport meta lacks `viewport-fit=cover`, so the inset reads 0.
- **The bottom bar sits under the home indicator:** `--safe-b` is not added to the bar's padding.
- **The bottom bar jumps while scrolling in Safari:** `100vh` somewhere; use `100dvh`.
- **The page zooms when a field gets focus:** input text under 16 px.
- **The frame shows up on a phone:** the redirect is missing, the window is wider than 500 px (landscape), or the address has `?shell`.


## How the top room (`--sb`) works

| Where the screen is shown | `--sb` | Why |
|---|---|---|
| Inside the presenter's frame (`html.in-phone`) | 62 px | the shell draws a fake status bar and island there |
| A real phone, in a browser tab | 12 px plus the inset (normally 0) | the browser's own bar already sits above the page |
| A real phone, installed | 12 px plus the inset | the inset is 0 where the system keeps a strip above the page (the iOS default), and the full status-bar height (about 44-62 px) where the page draws underneath it |

`--safe-b` follows the same idea for the home indicator (34 px in the frame, `env(safe-area-inset-bottom)` on a phone). The formula `calc(env(safe-area-inset-top, 0px) + 12px)` is what stops the "huge gap at the top" in an installed app: the fixed gap designed for the frame is the wrong number on a real phone, while the OS inset is always the right one. It only works with `viewport-fit=cover` on the viewport meta, which `install.py` adds.

On iPhone the installed app's status bar is an opaque light strip by default. Dark or full-bleed screens usually want `--status-bar black-translucent` (the page draws under a transparent bar with white text); `--sb` then picks up the inset by itself.
