# Lokali — design brief

Build every screen to this brief. Requirements: `REQUIREMENTS.md`, stories: `USER_STORY.md`, screen map: `shell.config.js`.

## Direction

- **Endorsed brand:** Lokali is a new product of The Habitat Group. The product shows the **lokali** wordmark (leaf mark); the Habitat logo appears in the shell, lock screen and footers ("by The Habitat Group").
- **Feel:** calm, earthy, photo-led, trustworthy. Nature does the decorating; the UI stays quiet.
- **Trust before price:** impact badge on cards, "Where your money goes" bar, verified host, cancellation policy in plain words next to the price.
- **Mobile web first** for guests and hosts (iPhone frame, 402 × 874). Admin is desktop (content max 1440 px).

## Design system: custom brand on iOS patterns

- Bottom tab bar (guest 4 tabs, host 5 tabs), sticky app bar with back, bottom sheets for pickers, large titles on top-level screens, 44 px+ tap targets, sticky bottom CTA for the main action.
- Admin: left sidebar, sticky top bar with search, KPI cards, tables with toolbar + filters, right drawers for details, modals for confirmations.

## Colour (tokens in `css/lokali.css`)

One colour set (Airy).

| Token | Value | Use |
|---|---|---|
| `--brand` | #D7263D | Main buttons, search, active tab, saved heart |
| `--primary` | #2F5D3A | Eco and impact, links |
| `--bg` / `--surface` | #FFFFFF | Page |
| `--ink` / `--text` / `--muted` / `--faint` | #222 / #3D3D3D / #6A6A6A / #717171 | Text steps |
| `--line` / `--sand` | #EBEBEB / #F7F7F7 | Hairlines, light fills |

Star ratings use `--star` (#C9A21C). Status: success #2E7D4F, warn #B7791F, danger #B42318, info #2B6CB0 (each with a tint). Never hard-code brand hex in pages; use tokens.

## Type

- One typeface: **Inter** for everything. Montserrat removed 26 Nov 2026.
- Style **Slow morning** (27 Nov 2026): calm, light, easy to scan.
- Weight ladder, nothing heavier than 600: **400** body and footnotes · **500** small labels, tags, meta · **600** titles, prices, buttons, emphasis (`b`, `strong`). Logos keep their own weights.
- Text colour ladder: `--ink` titles · `--text` body · `--muted` secondary · `--faint` footnotes. Each step is lighter; all pass 4.5:1 on `--bg` and white. Footnotes on `--sand` use `--muted`.
- Mobile: h1 26/32, h2 20/26, h3 17/23, body 15/22, small 13/18. Admin body 14/20.

## Icons

- **Phosphor Icons 2.1.1** (regular + fill), via unpkg. `<i class="ph ph-leaf" aria-hidden="true"></i>`; filled `ph-fill`. Size 20 default, 24 in tab bars, 16 for inline meta. Names at phosphoricons.com.
- Active tab = filled; inactive = regular. Icon-only buttons need `aria-label`. No emoji as icons.

## Spacing, radius

Follows iOS layout guidance:
- **Grid:** 8 pt for layout, 4 pt for fine detail. Allowed spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. No 3, 5, 6, 7, 9, 10, 14 or 18.
- **Margins:** 16 pt side margins on phone screens (402 pt wide), heroes included; content inside cards sits 16 pt in.
- **Bars:** navigation bar 44 pt below the status bar; floating tab bar 60 pt; tap targets at least 44 × 44.
- **Safe areas:** spacing next to the status bar and home indicator is the inset plus a grid value (for example 54 = status bar + 0, 62 = status bar + 8).
- **Radius:** 10 / 14 / 20 / 28. Admin page gutter 28 px.

## Writing

Follows dd-ux-writing-kamil (`references/guide.md`).

- **Voice:** Neutral labels (27 Nov 2026). States and actions only; no explaining, no talking to the reader, also in hints and onboarding. A hint stays only when it prevents a mistake or a loss (payments, refunds, bank, allergens), in one line: fact · action.
- **Reviewer notes** (`.anno`) are hidden by default; the presenter's Notes switch shows them.
- **Case:** Sentence case everywhere.
- **Locale:** en-GB · dates 23 Nov 2026 (short: 23 Nov) · numbers as digits.
- **Buttons:** verb + noun, 1-3 words. **Toasts and banners:** what happened · what's next. **Errors:** what went wrong · how to fix.
- **Money:** always `RM 1,234.50` (MYR, 2 dp when there are sen). **Dates:** `Sun, 6 Dec 2026`.
- **Terms:** Remove (items), Delete account (permanent) · Sign in, Cancel booking, Message host, Payout, Submit for review (one word per action, everywhere).

## Sample data

`js/data.js` — one source. The story running through all three modules: **Aina Rahman** (UK) books **Mangrove & fireflies by kampung boat** hosted by **Pak Rahim Osman**, Sun 6 Dec 2026 5:00 PM, 2 adults + 1 child, ref **LK-24817**: subtotal RM 385, service fee 5% RM 19.25, total RM 404.25; commission 15% RM 57.75; host payout RM 327.25 (~24 h after). Admin user: **Nurul Huda** (Operations). Prototype "today": Wed 2 Dec 2026.

## Reviewer annotations

`.anno` boxes (dashed olive) explain a requirement or assumption on screen. They are not part of the UI; use sparingly.

## Accessibility

Follows dd-accessibility-kamil.

- **Level:** WCAG 2.2 AA (text contrast 4.5 : 1, large text and icons 3 : 1).
- **Tap targets:** 44 × 44 at least.
- **Text:** sizes in px; zoom is never blocked and phone screens reflow at 200 % (checked at 201 px wide).
- **Motion:** loops stop with prefers-reduced-motion.
- **Exceptions:**
  - `g-corporate .corp-hero` and `a-login .a-login__art`: white text on a photo under a dark scrim (75% / 70% at the text). The checker cannot read background images; checked by eye at 402 px, and both fall back to `--deep` if the photo fails.
  - `lock.html`: live check skipped (no password set yet, the page redirects). Code check passes.
- **Desktop admin:** controls stay compact for mouse use (36–40 px, above the WCAG 2.5.8 AA minimum of 24 px) and grow to 44 × 44 on touch screens and windows under 760 px.
- **Shared fixes:** darker `--muted`/`--faint` and status colours; 44 px icon buttons, chips, steppers, segmented controls, tabs and standalone links on phone screens; switches keep their look with a 44 px hit area; visible focus ring; heading levels never skip (demoted headings keep their look via `.is-h3`/`.is-h4`).

## Before deploying the final design

- Remove the brief section numbers on the Experience page (`.sec-no` in `pages/g-listing.html`). They are reviewer notes for checking against the brief; keep them until the final deploy.

## Style names (27 Nov 2026)
- **Airy** — the chosen style going forward: white page, neutral greys, photo-led, bunga raya red for actions, green only for eco bits. Home is the reference screen.
- **Canopy** — the earlier style (teammate's "Lokali latest" copy, v0.4.0): dark forest-green headers, gold accent, tinted cards, dark pill tab bar. Kept for reference only.

## Airy Home: the reference screen (27 Nov 2026)
Every screen follows Home. Inter only.

| Text | Size / line | Weight / colour |
|---|---|---|
| Cover headline | 28 / 33 | 700, −0.02em, white on photo + soft shadow, firefly dot |
| Page titles (other screens) | 28 / 34 | 700 |
| Section titles | 18 / 24 | 700 · "See all" 14 / 600 green |
| Search "Where to?" / hint | 15 / 12 | 600 / 400 grey |
| Chips | 13 | 500 · selected: white on #222 |
| Featured card title / tile title | 16 / 21 · 14 / 19 | 600 |
| "with host · place" | 12 (tiles 11) | 400 #6A6A6A |
| Card impact line | 12 / 16 | 400 grey, green leaf |
| Rating · price | 12–13 | 400 with gold star · amount 600 #222 |
| Impact numbers / labels | 30 / 34 · 12 | 800 white ("RM" 14, raised) · 500 white |
| Kicker | 11 uppercase, letter-spaced | 600 green |
| Card/section sub-title | 16 / 21 · companies title 20 / 25 | 600 · 700 |
| Body | 15 / 22 | 400 #3D3D3D |

Layout: cover photo 16:9 under the status bar, search bar on its edge (red round button) · chips · Featured (one wide 11:8 card per swipe, 32 px peek, one-time nudge, white round heart, host face + verified tick) · Impact band (edge-to-edge photo with long soft fades, numbers count up) · More to explore (2-col 16:9 tiles, radius 20) · companies card (photo, kicker, 3 facts, red button).
Shapes: photos 26 (tiles 20), every button / tab / chip / search a pill. Icon gaps: 6 px for small icons inside text (14–16 px), 12 px for icons leading a row (18–24 px). Space: 24 px sides, sections split by a hairline. Eco green comes from the logo: #37664A (leaves), #1C522C (wordmark, strong); brand red #D7263D stays for actions. Shadows only on things that float above scrolling content (search bar, tab bar, Results Map pill, the profile photo overlapping a top photo): the shadow says "this sits above". Docked bars (header, bottom bars, chat booking strip) use a hairline instead.

## Airy and calm (27 Nov 2026)
- Goal: chill, airy, nothing busy. Remove before adding.
- Buttons: main 44 px (15/600, radius 12), regular 40 px (14/600), small 32 px (13/500), icon 36 px. Tap areas never under 44 px (invisible edge). Full width only for the final step of a form (Pay, Submit, Save).
- Strong type is allowed where it earns it: one bold headline per screen (700-800), everything else light.
- Page is pure white; greys are neutral (no green tint): `--ink` #222222, `--text` #3D3D3D, `--muted` #6A6A6A, `--faint` #717171 (4.8:1), `--line` #EBEBEB, `--sand` #F7F7F7.
- Brand red **bunga raya `--brand` #D7263D** (white text 4.96:1). Only on: main buttons, the search button, the active tab, saved hearts. Never for text blocks or backgrounds. Green stays for impact and links. Errors keep `--danger`.
- Space: 24 px side margins, 40 px between sections, body 15/22.
- Surfaces: flat. Shadows only on things that float above scrolling content (search bar, tab bar, Map pill, overlapping profile photo); docked bars and cards use a hairline or nothing.
- Cards: photo + heart, host face, "with host · place", title, "★ rating · From price". Impact lives on the listing.
- Category chips are neutral outlines; only the icon carries the category colour.
- One signature touch: the firefly dot on the Home hero. No gradients, no batik mark.

## Airy scale and Lokali style (27 Nov 2026, replaces the iOS scale below)
- Phone text: body 15/21 · details 13 · notes 11-12 · card titles 15 · section titles 17 · page titles 24 · Home hero 26 · nav bar titles 16. Fields stay 16 (stops iOS zoom).
- Space: 20 px side margins (`--gutter`), 28 px between sections.
- Signature touches: host face and "with <host>" on every experience card · category colours (`--cat-*`: nature green, culture batik red, food turmeric, retreat sea blue) · a small batik mark beside the wordmark · one firefly glow on the Home hero.
- Green is for actions and the active state. Light tab bar, no dark header on Home.

## Typography (iOS scale, phone screens)
Apple HIG default sizes, applied 25 Nov 2026 to all `body.m` screens. Admin (`body.a`) keeps compact desktop sizes.
Large title 34/41 · Title 1 28/34 · Title 2 22/28 · Title 3 20/25 · Headline 17/22 semibold · Body 17/22 · Callout 16/21 · Subheadline 15/20 · Footnote 13/18 · Caption 1 12/16 · Caption 2 11/13.
Inter for everything. Hero display lines (40–44 px) are the only exception.

## Cards (app style, from the search page)
White, no border, 24 pt corners, 16 pt padding, soft shadow `0 6px 20px rgba(16,26,20,.07)` (tokens `--card-r`, `--card-pad`, `--card-shadow`).
- `.card` — base card. `.card--tint / --flat / --accent` drop the shadow.
- `.card-head` + `.card-val` — title left (Inter 20), chosen value right (15 semibold, brand green; `.is-none` grey when empty).
- `.card-row` + `.card-row__label` — one tappable row, min 60 pt: icon + label left, value + › right.
Also applied to custom white cards: `.list .lst .bcard .cat2 .how .bk-card .radio-card` (selected radio card keeps its green outline). Tinted info blocks stay flat. Photo cards (`.exp-card`) keep their own style. Admin keeps its panels.
