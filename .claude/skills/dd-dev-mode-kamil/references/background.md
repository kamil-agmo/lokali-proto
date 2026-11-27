# Dev mode: background

An inspector and export toolbox that lives in the right-hand card of the shell. It turns the prototype into something a developer can measure and copy from, without leaving the phone frame. Use it when the user wants an inspector like browser dev tools inside the frame, spacing/token readouts, image export, or animation export to code.

## What it gives developers

- **Inspector (hover).** Outlines the hovered element (margin orange, border yellow, padding green, content blue, all at 25 % so the design shows through) and lists size and position, a box-model diagram, spacing (padding, margin, gap, distance to the siblings above and below), layout, type, fill, border and radius, shadow and motion. Each value shows the design token it matches when the project defines tokens (custom properties on `:root`, **any naming**, matched by value), read live from the prototype's own stylesheets. Shift + click pins an element; path chips select a parent; "Copy CSS" copies the key styles using `var(--token)` where a token matches. Highlighting stops when the pointer leaves the phone.
- **Sections** (button, top left). Outlines every part of the screen with a numbered label; click a label (or a row in the collapsible list) to isolate one part and dim the rest.
- **Download images.** Lists every image showing on the screen (`<img>` and CSS backgrounds) and downloads each as the original and as 1×/2×/3× PNGs (larger sizes only when the file is big enough; SVGs scale freely), or everything in one `.zip`.
- **Download animation.** Reads the animations running inside the pinned element or isolated section (Web Animations API) and exports **Flutter, SwiftUI, Jetpack Compose, React Native, Lottie, CSS, HTML, JSON spec, WebM, GIF** from a "Download as…" dropdown. Details and limits: `references/formats.md`.
- **Tips box** at the top of the card lists the shortcuts; a password gate with a "for developers only" warning; turning it off, or "Back to lock screen", switches it off and asks for the password again.

## How dev mode is built (read before changing it)

- `devmode.js` owns the password gate, the hover inspector, optional tokens, pinning and Copy CSS, and exposes `window.DevMode`. `devtools.js` adds Sections and Download images. `devanim.js` reads animations and builds the spec, CSS, HTML and Flutter; `devanim2.js` adds SwiftUI, Compose, React Native, Lottie, WebM and GIF. They load in that order, after `devmode.config.js` (`window.DEV_MODE`). Source files are in `assets/devmode/`.
- Other tools plug in through `DevMode`: `DevMode.on('attach' | 'detach' | 'redraw' | 'load' | 'pin' | 'on' | 'off', fn)`, `DevMode.parts.push(fn)` to add a block under the tips, and `DevMode.anim.addFormat({ k, title, sub }, fn)` to add an export format. See `references/extending.md`.
- Overlays inside the page carry `data-devui` so the inspector ignores them and clips hide them while recording.
- The panel has two parts: `#dvTop` (tips, images, animation, sections) re-renders on state changes, and `#dvHover` re-renders as the pointer moves. Keep expensive UI out of `#dvHover`.
- The "dev on" flag lives in `sessionStorage` (`<prefix>-dev`), so it survives a reload but not a reset; the shell's `<prefix>:relock` event switches it off.

## Dev mode limits

- Motion driven by timers or `requestAnimationFrame` (numbers counting up, charts drawing) is not seen by the Web Animations API, and properties other than movement, scale, rotation and opacity are listed for hand matching. Kotlin and Dart output is not compiled here: have a developer compile it in a sample app.
- It inspects the page inside the phone frame only; it is not a general browser dev tool, and it cannot run on a phone (no right-hand card).

---
