# Icons and manifest

The icon set, how to generate it, what the manifest says, and what happens when something changes.

Contents: the icon set · making the icons · the manifest · hosting notes · changing things later

## The icon set

`scripts/make_icons.py` (called by `install.py` when you pass `--mark` or `--icon`) writes into `assets/icons/`:

| File | Size | Used for |
|---|---|---|
| `icon-192.png`, `icon-512.png` | 192, 512 | the manifest's normal icons (Chrome needs both to offer install); `icon-192.png` is also the banner icon |
| `icon-maskable-512.png` | 512 | Android's adaptive icon: the OS crops it to a circle or rounded square, so the artwork sits inside a central safe zone |
| `apple-touch-icon.png` | 180, opaque | iPhone's home-screen icon; iOS paints transparency black, so it is flattened onto a colour |
| `favicon-16.png`, `-32.png`, `-48.png` | 16, 32, 48 | browser tabs |
| `icon-1024.png` | 1024 | a master copy for stores or later changes |

## Making the icons

Two ways in; pick by what the user has.

- **`--mark FILE`:** a logo mark on a transparent background (PNG or SVG). The script centres it at 62% of the icon on a background you choose (`--icon-bg`, optionally `--icon-bg2` for a diagonal gradient) and builds the maskable version with the mark inside the safe zone (its bounding-box diagonal is kept near 66% of the icon; the OS-safe circle is 80%). This is the right choice whenever the background is a gradient, because the maskable icon is drawn from scratch.
- **`--icon FILE`:** a finished square icon, at least 512 px (1024 is best). It is resized as it is. The maskable icon shrinks it to 80% onto a background that continues its own corner colours, so a gradient stays smooth. A faint edge can show on busy artwork; if it does, supply a mark instead.

Notes:

- SVG sources are rasterised with the first tool found: `cairosvg`, `rsvg-convert`, `inkscape`, or macOS `qlmanage`. `qlmanage` paints on white, so in `--mark` mode the white is converted back to transparency. With none of them, export a 1024 px PNG first.
- Pillow is required (`pip install pillow`).
- Look at the results: open `icon-maskable-512.png` and imagine a circle cut from the middle at 80% width. Nothing important should touch that circle's edge.
- A dark app usually wants a dark `--icon-bg` with the mark in its light colour, which also matches `--theme-color` and the manifest's `background_color`.

## The manifest

`install.py` writes `manifest.webmanifest` from `assets/manifest.template.webmanifest` and fills in your values:

| Field | Value | Notes |
|---|---|---|
| `name` | `--name` | shown on the install dialog and splash |
| `short_name` | `--short-name` (default: the name cut to 12 characters) | the label under the home-screen icon; longer ones are cut |
| `start_url` | `--start-url` (default: `pages/lock.html` if it exists, else `index.html`) | what the installed app opens. For a gated prototype this is the lock screen |
| `scope` | `./` | the whole site |
| `display` | `standalone` | no browser bar. `check.py` errors on a value that would not open as an app |
| `orientation` | `portrait` (or `any`) | `portrait` for a phone prototype; `any` when the iPhone Duo skill's sideways choice is "the app's wide layout" for the iPhone (`SHELL.duo.sideways`). install.py picks it and check.py warns on a mismatch |
| `theme_color` / `background_color` | `--theme-color` / `--background-color` (default white) | status bar tint and splash colour. `theme_color` is also the `theme-color` meta in every page |
| `icons` | 192 and 512 (`any`), 512 (`maskable`) | `check.py` verifies each file exists and is the size it claims |

Edit the file by hand for anything else (a `description`, `shortcuts`, `lang`). `install.py` keeps an existing manifest unless `--force`.

The iOS-specific tags go in the pages' heads (not in the manifest): `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, the touch icon, and, with `--status-bar`, `apple-mobile-web-app-status-bar-style` (`default`, `black` or `black-translucent`).

## Hosting notes

- **https is required** for install and for the service worker (localhost is exempt). Firebase Hosting, Netlify, Vercel, GitHub Pages and similar are all fine.
- **`sw.js` must live at the site root** (or its scope shrinks to its folder). `install.py` puts it there.
- **Rewrites:** make sure no catch-all rewrite answers `/sw.js` or `/manifest.webmanifest` with `index.html`. A service worker that returns HTML fails to register without a clear message.
- **A site in a sub-folder** (for example `https://host/project/`) works: every path is relative and the scope is the folder that holds `sw.js`.
- **Content type:** `.webmanifest` should be served as `application/manifest+json`; most hosts do it, and Chrome is lenient.

## Changing things later

| Change | What reaches phones that already installed it |
|---|---|
| CSS, JS, screens | immediately: an installed web app loads the live site (the service worker caches nothing) |
| Name, theme colour, start URL | iPhone: after the app is removed and added again. Android: the browser refreshes the installed app in the background, which can take about a day |
| Icons | the same as above; on iPhone always remove and add again |
| Moving to a new URL | the old installed app keeps pointing at the old address: install again from the new one |

Re-run `install.py --force` after changing a name, colour or icon so every page's head and the manifest agree.
