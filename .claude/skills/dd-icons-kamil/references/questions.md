# Icons: the questions, in full

### Round 1: library (always first, never skipped)

One question, header `Library`. Mention in the question text that Apple SF Symbols cannot be used on a website (Apple's licence, no web font). Options:
1. **Google Material (Recommended)**: Google/Android look; Outlined, Rounded or Sharp; only ~3–6 KB because Google sends only the icons used.
2. **Apple-like look**: Phosphor or Bootstrap Icons, the closest to SF Symbols (a follow-up asks which).
3. **Flaticon UIcons**: the Flaticon look; ~377 KB, or ~5 KB if trimmed; free use needs a credit line.
4. **Font Awesome Free**: common web icons; 25–153 KB, or ~5 KB if trimmed.

If "Apple-like look": ask header `Apple-like` with **Phosphor (Recommended)** (Thin to Bold, Fill, Duotone; closest to SF Symbols) and **Bootstrap Icons** (clean, outline + fill). Any other icon font typed under "Other" is fine if it ships a web font; details for all of them are in `references/libraries.md`.

### Round 2: look (one call, up to 4 questions; only what the library supports)

**Google Material Symbols**
- `Style`: Rounded (Recommended) / Outlined / Sharp.
- `Weight`: 400 Regular (Recommended) / 300 Light / 500 Medium / 600 Semibold (100–700 via Other).
- `Size`: 24 × 24 (Recommended) / 20 × 20 / 32 × 32 / 40 × 40. This is the box and the optical size.
- `Fill`: Outline (Recommended) / Filled.

**Phosphor**: `Weight`: Regular (Recommended) / Light / Thin / Bold (Fill or Duotone via Other); then `Size`.
**Bootstrap Icons**: `Style`: Outline (Recommended) / Filled; then `Size`.
**Flaticon UIcons**: `Weight`: Regular (Recommended) / Bold / Solid / Thin; `Corners`: Rounded (Recommended) / Straight; then `Size`.
**Font Awesome**: `Style`: Regular outline (Recommended, limited free set; Solid used where no free outline exists) / Solid; then `Size`.

### Round 3: behaviour (one call, up to 4 questions)

- `Active`: Fill when selected (Recommended): selected tab and liked hearts turn filled, slightly bigger font / Always outline.
- `Sizes`: Allow other sizes (Recommended): e.g. 16 px in a pill, 40 px in an empty state, same design / Baseline size only.
- `Scope`: Screens only (Recommended) / Screens and presenter shell (only ask if the project has a shell).
- Material only, `Grade`: 0 Normal (Recommended) / -25 Lighter (good on dark backgrounds) / 200 Heavier.
- Libraries 2–5 only, `Lightness`: Trim to icons used (Recommended): downloads the font into the project and subsets it to ~5 KB / Use the CDN as is (full font).

Logos are kept as images without asking; say so in the round-3 question text. If the icon mapping (workflow step 2) has a judgment call, list it in plain text after round 3 and let the user correct it; otherwise just go.
