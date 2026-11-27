# Handoff — Lokali prototype

State as of 27 Nov 2026, version **0.33.4** (see `CHANGELOG.md` for every change).

## How to open and preview

- Open `index.html` (guest + host app in an iPhone frame) or `admin.html` (admin portal) in a browser. The left menu lists every screen by group (one group open at a time); the right panel describes the current screen.
- Photos are Unsplash links, so be online.
- Reload with ⌘⇧R after changes (browsers cache the CSS/JS).
- Working rules for Claude are in `CLAUDE.md` (it loads automatically in Claude Code) and `.claude/rules/`.

## The story to follow

Pak Rahim's **Mangrove & fireflies by kampung boat** (Kuala Selangor) is the only fully written experience; guest Aina Rahman books it for Sun 6 Dec. Every test path should lead there (Home → Featured → experience page → Book now → checkout → confirmed → My bookings → chat).

## Style

**Airy** (Home is the reference): white, neutral greys, brand red #D7263D only for actions, logo greens #37664A / #1C522C for eco, gold star, pills, no card boxes, hairline sections, 24px margins, shadows only on things that float. Details in `DESIGN.md`.

## Done in the last session (highlights)

- Experience page shortened (MIMS: detail behind a tap), scrolled header with ⋯ menu, Reviews rating in heading.
- Host profile (suggestion Q15), Account (photo + round avatar style, Become a host highlighted, Delete set apart), Results, Bookings, Inbox, Chat, Booking details, Cancel, Review, Checkout, Confirmed all brought to Airy and checked with MIMS.
- Reviewer notes switch removed; large titles fixed on tab screens; switch size bug fixed sitewide; art.js script error fixed.
- New logo integrated (`assets/brand/`), tab + home-screen icons, eco green matched to the logo.

## Open / next

1. **MIMS on the host screens** (`h-…`): not checked against Airy or the newer MIMS rules yet, and their Summary panel text was not refreshed.
2. **Admin styling** — deliberately left for last; do it only when the user asks.
3. **Old mocks** `explore/listing-long.html`, `listing-fixes.html`, `search-ideas.html` change pages inside iframes, so they only work through a local server; rebuild them self-contained if used again (mock rules).
4. **Public GitHub repo `axttd/lokali-compare`** (compare pages) — the user planned to delete it.
5. **Presenter menu green** in `js/shell/theme.js` still uses the old green #2F5D3A (presenter frame only).
6. **Brand rose vs action red**: the logo's rose (#C56969) isn't used in the app; action buttons stay #D7263D for contrast (decided 27 Nov).

## References

- Teammate's older Canopy copy: `~/Desktop/Lokali latest` on the original Mac (not included here).
- Logo source files: provided by a friend of the designer; copies in `assets/brand/`.
