# Icon font libraries

Five libraries that work as **icon fonts** in a static prototype (no build step). Sizes are the woff2 font for one style, measured Oct 2026. Pin the exact version shown.

| # | Library | Look | Styles | Font size (one style) | Subset from the CDN? |
|---|---|---|---|---|---|
| 1 | **Google Material Symbols** | Android / Google | Outlined, Rounded, Sharp; variable fill, weight 100–700, grade, optical size | **~3–6 KB** for 5–15 icons | **Yes** (`icon_names=`) |
| 2 | **Font Awesome Free 6** | general web | Solid (~1,400 icons), Regular (~160 icons), Brands | Solid 153 KB, Regular 25 KB | No (self-host + subset) |
| 3 | **Flaticon UIcons** | the Flaticon look | Regular/Bold/Solid × Rounded/Straight, plus Thin, Brands | ~377 KB | No (self-host + subset) |
| 4 | **Bootstrap Icons** | clean, iOS-ish | one set, outline + `-fill` variants | 127 KB | No (self-host + subset) |
| 5 | **Phosphor Icons** | friendly, closest to SF Symbols | Thin, Light, Regular, Bold, Fill, Duotone (one CSS per weight) | ~144 KB | No (self-host + subset) |

**Apple SF Symbols cannot be used.** Apple's licence allows them only in apps and mockups for Apple platforms, not on websites, and Apple ships no web font. If the user asks for "Apple icons", say so and offer **Phosphor** (closest look, has weights like SF Symbols) or **Bootstrap Icons**.

Other fonts that also work if the user names them: Remix Icon (`remixicon@4.3.0`, 162 KB), Tabler Icons (`@tabler/icons-webfont@3.19.0`). Icon sites that sell SVG packs (Flaticon's own downloads, Noun Project, Icons8) are **not fonts**; for Flaticon use UIcons above.

---

## 1. Google Material Symbols (lightest)

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=favorite,home,mail&display=block">
```
```html
<span class="ms" aria-hidden="true">home</span>
```
CSS and the link come from `scripts/icons.py link`. Names: https://fonts.google.com/icons. `icon_names` must be alphabetical; a missing name shows as a word. Family is `Material Symbols Outlined | Rounded | Sharp`.

## 2. Font Awesome Free 6

Load only the style(s) used, not `all.min.css`:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/fontawesome.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/regular.min.css">   <!-- or solid.min.css / brands.min.css -->
```
```html
<i class="fa-regular fa-heart" aria-hidden="true"></i>      <!-- outline -->
<i class="fa-solid fa-heart" aria-hidden="true"></i>        <!-- filled (needs solid.min.css) -->
```
Names: https://fontawesome.com/search?o=r&m=free. Free Regular has only ~160 icons; most outline icons are Pro. Size with `font-size`; no weight axis (Solid = 900, Regular = 400).

## 3. Flaticon UIcons

One CSS per style. Prefix: `fi-rr` regular rounded, `fi-rs` regular straight, `fi-br` bold rounded, `fi-bs` bold straight, `fi-sr` solid rounded, `fi-ss` solid straight.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@flaticon/flaticon-uicons@3.3.1/css/regular/rounded.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@flaticon/flaticon-uicons@3.3.1/css/solid/rounded.css">   <!-- only if filled states are wanted -->
```
```html
<i class="fi fi-rr-home" aria-hidden="true"></i>
<i class="fi fi-sr-heart" aria-hidden="true"></i>
```
Names: https://www.flaticon.com/uicons. Glyphs sit a little low; add `.fi { display: inline-flex; line-height: 1; }`. Free use requires attribution to Flaticon ("Uicons by Flaticon"): tell the user.

## 4. Bootstrap Icons

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
```
```html
<i class="bi bi-house" aria-hidden="true"></i>
<i class="bi bi-heart-fill" aria-hidden="true"></i>     <!-- filled variant: add -fill -->
```
Names: https://icons.getbootstrap.com. Designed on a 16 px grid: set `font-size` (e.g. 24px) on `.bi`. Has `vertical-align: -.125em` built in.

## 5. Phosphor Icons

One CSS per weight (`thin`, `light`, `regular`, `bold`, `fill`, `duotone`):
```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">   <!-- only if filled states are wanted -->
```
```html
<i class="ph ph-house" aria-hidden="true"></i>
<i class="ph-fill ph-heart" aria-hidden="true"></i>
```
Names: https://phosphoricons.com. Weight comes from which CSS is loaded, not from `font-weight`.

---

## Making libraries 2–5 light (self-host + subset)

Their CDN fonts ship every icon (100–400 KB). If the user wants the site as light as possible, offer to subset:

1. Download the woff2 and the CSS into `assets/icons-font/` (ask first; downloads need approval).
2. Collect the codepoints of the icons used from the CSS (`.fi-rr-home:before{content:"\f1b2"}`).
3. Subset with fontTools (`pip install fonttools brotli`):
   ```bash
   pyftsubset font.woff2 --unicodes="U+F1B2,U+F15E" --flavor=woff2 --output-file=icons.subset.woff2
   ```
4. Write a small CSS with one `@font-face` pointing at the subset and only the used `:before` rules.
5. Note for the user: adding an icon later means re-running the subset.

Result is typically 2–8 KB, similar to Material Symbols with `icon_names`.
