# Typography: the questions, in full

**Always explain every option**: its description says in plain words what it does and what it changes for the prototype or its users (no bare labels). Ask with the **AskUserQuestion** tool: up to 4 questions per call, 2-4 options each, recommended option first with "(Recommended)", headers of 12 characters or fewer, "Other" for typed answers. Each option's description says what it changes. **The font family question always comes first**, before any scan or other question, even if the user named a font (then it is the Recommended option and they confirm it). Read the project's `DESIGN.md` first if there is one: the design system decides which options are recommended (Apple HIG → System font and the HIG scale; Material 3 → Roboto and the Material scale). Show sizes measured with `scripts/typo.py measure`, not guesses. If AskUserQuestion is not available (claude.ai), ask the same rounds as numbered lists.

### Round 1: font family (always first)

| Header | Question | Options |
|---|---|---|
| `Font` | Which font family should the app use? | **Browse all Google Fonts** (opens the font picker: every Google Font with Latin support, ~1,800, searchable, with live previews and download size) · **System font** (0 KB: SF Pro on iPhone, Roboto on Android, Segoe UI on Windows; looks native) · two fonts that suit the app, with measured size and one-line character (e.g. **Plus Jakarta Sans** ~24 KB, modern and friendly; **Inter** ~48 KB, neutral and very readable). Other: type any font name, or a brand font file. Mark the best fit for the design system "(Recommended)". More options and traits: `references/fonts.md`. |
| `Headings` | Same font for headings, or a different one? | **Same font** (lighter, consistent) · Pick a heading font in the picker (a second font for titles only; adds one weight, ~8-18 KB) |

#### The font picker (for "Browse all Google Fonts" or "Pick a heading font")

1. Build the page, suggesting fonts that fit the app and design system first:
   ```bash
   python3 <skill>/scripts/font_picker.py --out <scratch dir> --app "<App name>" --accent "<brand colour>" --recommend "Plus Jakarta Sans,Inter,Poppins,Manrope"
   ```
   Add `--refresh` to pull the latest catalogue from fonts.google.com (the cached list is in `assets/google-fonts.json`).
2. Serve that folder over http (`python3 -m http.server <port>` in the background) and open `http://localhost:<port>/font-picker.html` in the browser pane (`preview_start` with the url). Keep the picker out of the project folder so it is never deployed.
3. Tell the user, in one line: search or scroll the dropdown list, click a font to preview it (title, heading, 16 px body, a caption, a button and numbers, in any weight it has, plus the download size), then press **Use this font** and say "done".
4. When they say done, read the choice with the browser JavaScript tool: `window.fontChoice` → `{ family, category, weights, variable }`. If it is empty, ask them for the name. Confirm the font in one line, then go on to round 2. Offer only the weights that font has in round 2.
5. Stop the picker's server when typography is finished.

Without the browser pane (claude.ai), list 8-10 suitable fonts with a one-line character each and a link to https://fonts.google.com for browsing, and take the typed name.

### Round 2: size, scale and weights

| Header | Question | Options |
|---|---|---|
| `Default` | What should the default (body) text size be? Explain that every other size in the scale is built from it, and what it means for the app's users (below). | **16 px (Recommended)** · 17 px · 14 px · 18 px |
| `Scale` | Which type scale? | **Apple HIG text styles** (caption 12 → large title 34; native iPhone feel) · **Material 3 type scale** (label → display; Android feel) · **Major third, ×1.25** (clear steps, good for content apps) · **Minor third, ×1.2** (gentle steps, dense screens). Other: ×1.333 (dramatic, marketing-style). Recommend the one matching the design system. |
| `Weights` | Which weights (the "heavier parts") should load? Each weight is another file to download. | **Regular 400 + Semibold 600 (Recommended)** (lightest: body + all emphasis) · 400 + 500 + 700 (adds Medium for labels and Bold for titles) · 400 + 700 (classic regular/bold) · Full variable 100-900 (any weight, heaviest) |
| `Line height` | Body line height? | **1.5 (Recommended)** (comfortable reading, WCAG friendly) · 1.4 (tighter, denser feeds) · 1.6 (airy, long text) |

**How to explain the default size** (put the short version in each option's description, and the line about users in the question text):

| Size | Who it suits | What changes |
|---|---|---|
| **16 px** (house default) | Most adults 18-50, everyday apps: social, shopping, productivity | The web's standard reading size; form fields never trigger iPhone's zoom; the rest of the scale stays compact enough for feeds and cards |
| **17 px** | iPhone-first apps following Apple HIG | Apple's own body size: feels native on iOS; slightly roomier, so a little less fits on a screen |
| **14 px** | Power users, dashboards, data-heavy tools | Fits more on screen but is hard for older users and in sunlight; fields still need 16 px or iPhone zooms in; fails comfort checks for long text |
| **18 px** | Older users (50+), low vision, health, finance, government, reading apps | Easiest to read and most accessible; fewer words per line and longer pages, so layouts need more scrolling |

On phones 1 pt in a design tool = 1 CSS px, so "16 pt" and "16 px" mean the same here.

### Round 3: how bold is used, and behaviour

| Header | Question | Options |
|---|---|---|
| `Emphasis` | Where should the heavier weight be used? | **Titles, buttons and names** (Recommended: usernames, counts, tab labels stay regular) · Titles only (very calm) · Titles, buttons, names, counts and labels (punchy, social-app feel) |
| `Text size` | Should text follow the user's own text-size setting? | **Yes, scale with it** (Recommended: sizes in `rem`; respects accessibility settings) · No, fixed sizes (`px`; layout never shifts) |
| `Scope` | Apply to the screens only, or the presenter shell too? (Only if the project has a shell.) | **Screens only** · Screens and shell (sets `theme.font` / `fontUrl` in `shell.config.js`) |

After round 3, summarise the choices in one paragraph (font, size, scale with the actual px values, weights with the measured KB) and go ahead unless the user corrects something.
