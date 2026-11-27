# Font options

Sizes are the Latin download for Regular 400 + Semibold 600 from Google Fonts, measured with `scripts/typo.py measure` (Oct 2026). Re-measure for other weights.

| Font | Size (400+600) | Character | Good for | Pairs with |
|---|---|---|---|---|
| **System font** (SF Pro / Roboto / Segoe UI) | 0 KB | native to each device | Apple HIG apps, anything that should feel built-in | Apple HIG, Fluent |
| **Inter** | ~48 KB | neutral, highly legible, tabular numbers | UI-heavy apps, finance, dashboards | any; closest free match to SF Pro |
| **Plus Jakarta Sans** | ~24 KB | modern, friendly, slightly rounded | social, lifestyle, startups | Material, HIG |
| **Poppins** | ~16 KB | geometric, playful, bold headings | consumer apps, food, kids, marketing | Material |
| **Manrope** | ~28 KB | clean, slightly technical | fintech, SaaS | Fluent, Carbon |
| **DM Sans** | ~28 KB | soft geometric, compact | productivity, e-commerce | Material |
| **Nunito** | ~32 KB | rounded, warm | health, wellness, education | Material |
| **Roboto** | ~33 KB | Android's own font | Material 3 apps | Material |
| **IBM Plex Sans** | ~36 KB | engineered, serious | B2B, data, Carbon | Carbon |
| **Fraunces** (headings) | ~37 KB | soft serif, editorial | magazines, food, premium brands | as a heading font only |

Apple's SF Pro cannot be loaded from a website (licence); the **System font** option shows it on Apple devices only. For a similar look everywhere, use Inter.

Brand fonts the user supplies: self-host the woff2 in `assets/fonts/`, add an `@font-face` with `font-display: swap`, and load only the weights used.
