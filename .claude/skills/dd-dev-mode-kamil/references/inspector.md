# Inspector, tokens and Sections

## The hover panel

Top to bottom: tips box, Download images, Download animation, Sections list (when Sections is on), then the inspector for the hovered (or pinned) element:

1. Element: tag and classes, with ancestor chips (click one to select that parent).
2. **Size and position:** width × height, position on the page, distance from the parent's edges, `position`/`z-index`.
3. **Box model:** margin, border, padding and content numbers.
4. **Spacing:** padding, margin, gap (flex/grid), and the gap to the sibling above and below, each with a token chip when a spacing token holds that value.
5. **Layout:** display, direction, align/justify, grid columns, overflow.
6. **Type** (only when the element has its own text): font, size / line height (with font-size and line-height token chips), weight, letter spacing, transform, colour.
7. **Colour:** fill (with token chip), background image.
8. **Border and radius:** width, style, colour, radius (token chip, or "pill / round").
9. **Effects:** shadow (token chip), opacity, backdrop filter, transform, animation or transition.
10. **Copy CSS** button.

Highlight colours are fixed at 25 % opacity (margin `rgba(246,178,107,.25)`, border `rgba(255,229,153,.25)`, padding `rgba(147,196,125,.25)`, content `rgba(111,168,220,.25)`); the outline and the name tag are full strength. When the pointer leaves the phone, or moves over something that is not a page element, the highlight and the panel reset (a pinned element stays).

## Token matching (optional, no particular design system)

Nothing here assumes a naming scheme or a file name. `buildTokens()` reads every custom property declared on `:root` or `html` in the same-origin stylesheets of the screen, resolves its value, and sorts it by **what the value is**:

| Value | Kind | Matched against |
|---|---|---|
| a colour (`#`, `rgb`, `hsl`, `hwb`, `oklch`, `color()`...) | colour | text, fill and border colours (exact match on the computed colour) |
| a length (`px`, `rem`, `em`, `calc()`), measured in pixels | length | spacing, radius, font size, line height, size |
| a shadow (offsets plus a colour) | shadow | box shadow (exact match on the computed shadow) |
| `100`...`900` with a weight-like name | weight | font weight |

Lengths are told apart by **name hints** (regexes, case-insensitive): spacing `sp|space|spacing|gap|gutter|pad|padding|margin|inset`, radius `r|rad|radius|round|rounded|corner`, font size `fs|font-size|text-size|type|text|size`, line height `lh|line-height|leading`, size `h|height|control|size`. A name only needs to contain the word as a dash-separated part (`--space-3`, `--sp-4`, `--radius-md`, `--text-lg` all work). If **none** of a project's length tokens match any hint (for example `--n3: 12px`), they are offered for every kind of length, so the chips still appear. Override the hints with `DEV_MODE.tokenHints` (`{ sp, r, fs, lh, h, fw }`, regex strings).

Colour tokens are listed semantic first, then raw palette steps (a name ending in a two or three digit step, or `--white` / `--black`), then legacy aliases last. `paletteTokens` and `legacyTokens` (regex strings) change what counts as a palette step and as an old alias. A value is matched by its computed colour, so an alias and the raw step it points to show together. At most two chips are shown per value.

Settings in `devmode.config.js`: `tokens: false` (no chips at all), `tokenFiles` (a regex on the stylesheet URL; default every same-origin stylesheet), `tokenHints`, `paletteTokens`, `legacyTokens`. Stylesheets from another origin cannot be read by the browser and are skipped. `scripts/check.py` reports how many colours, lengths and shadows it found in the prototype's `:root` blocks (information only; no tokens is fine: the panel then shows raw values). The "token chips" tip in the tips box appears only when tokens were found.

## Sections detection

`findSections()` (in `devtools.js`) builds the list from the page structure, using the selectors in `DEV_MODE.sections`:

- `bar` (the app bar), then the **content container** (`content`, first selector that matches), its visible children, then `sub` (a sub-nav outside the container) and `nav` (bottom navigation). Defaults: `bar` `.appbar, header.bar, header`; `content` `main, .main, .app, .content`; `nav` `nav.tabbar, nav.nav, nav`; `sub` `.segnav, .subnav`.
- A child with no class and several children is "unwrapped" one level (lists of groups).
- Skipped: hidden elements, `[aria-hidden="true"]`, `.toast`, and whatever `sections.skip` adds (for example `'.toast, .intro, .fade-bottom'`). The app bar and the navigation are never skipped.
- Names: known classes (`appbar`, `segnav`, `nav`...; `sections.names` adds more, such as `{ cfilter: 'Filter bar' }`), then `aria-label`, then the first heading or `[class*=title]`, then the class name humanised.

If a screen's parts come out wrong, set the right selectors in `devmode.config.js` or give the parts headings or `aria-label`s: that improves the names too. `scripts/check.py` does a rough static match of the selectors against each screen's HTML and warns when `content` finds nothing (a screen built by JavaScript can still work; the browser is the final test).

## Images

Scans `<img>` and computed `background-image` URLs on the screen. Only images actually displayed are listed (displayed width > 0). Sizes: Original (fetched as-is), and 1×/2×/3× PNGs at the displayed width, keeping the file's own aspect ratio. A raster file gets a size only if it is at least that big; SVGs get all. The zip stores everything uncompressed, named after the screen. Original downloads need the file to be fetchable (http, same origin or CORS).

## Credits (on by default)

`DEV_MODE.credits = { title, lines: [...] }` in `devmode.config.js` adds a small button, no fill and no outline, under the right-hand card while dev mode is on. Clicking it slides a mini note down from behind the card: title 10 pt medium, lines 8 pt. It closes on a second click, Escape, a click elsewhere, or when dev mode is switched off. `button` renames the button label (default "Credits"). Delete the `credits` block and nothing is added.

The installer writes the default team credits (title "Credits"; Skill & Dev mode: Kamil; Presenter frame: David; Req. study: Norman; Ideation: Kamil, David, Norman). Add contributors with repeated `--thanks "Name"` ("Thanks to: ..." under Ideation). Override with `--credits-title` and repeated `--credit "Role: Name"`, drop them with `--no-credits`, or change `DEFAULT_CREDITS` in `scripts/install_devmode.py` to change the default for every new prototype.

It is built by `devmode.js` (no markup in `index.html`) and positioned from the card's own rectangle (`ResizeObserver` plus window resize), so it works with any shell layout. The note is text only (set with `textContent`). `check_devmode.py` validates the shape (object, string title, list of string lines).


## devmode.config.js settings

Then open `devmode.config.js` and set what differs from the defaults:
- `prefix`: must equal the shell's `prefix` (the installer copies it; a mismatch stops "Back to lock screen" from switching dev mode off).
- Token chips (all optional): `tokens: false` switches them off; `tokenFiles` limits which stylesheets are read; `tokenHints` says which names mean spacing, radius, font size, line height, size or weight when the defaults guess wrong; `paletteTokens` and `legacyTokens` regexes decide which names come first when several tokens hold the same colour.
- `sections`: selectors for `bar`, `content`, `nav` and `sub` (first match wins within each list), and optionally `skip` (transient overlays to leave out) and `names` (class name to label).

## Requirements (in full)

- A dd-presenter-david shell: `index.html` with `#screen`, `#summary` and the right-hand card. The panel reuses the shell's neutral variables (`--ink`, `--muted`, `--line`, `--accent`, `--accent-strong`, `--ease-out`), never the prototype's design system.
- Served over **http**: the inspector reads the page inside the iframe, and `file://` blocks that. Screens must be same-origin with the shell.
- A browser window **at least 1380 px wide**; below that the shell hides the right-hand card. First thing to check when "the Dev mode button is missing".
- Token chips are optional: every custom property on `:root` / `html` in a same-origin stylesheet is read and matched by what it holds. Without any, everything still works, just without chips.
