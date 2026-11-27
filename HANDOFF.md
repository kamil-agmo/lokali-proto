# Handoff — Lokali prototype

State as of 27 Nov 2026, version **0.38.0** (see `CHANGELOG.md` for every change).

## How to open and preview

- Open `index.html` (guest + host app in an iPhone frame) or `admin.html` (admin portal) in a browser. The left menu lists every screen by group (one group open at a time); the right panel describes the current screen.
- Photos are Unsplash links, so be online.
- Reload with ⌘⇧R after changes (browsers cache the CSS/JS).
- Working rules for Claude are in `CLAUDE.md` (it loads automatically in Claude Code) and `.claude/rules/`.

## The story to follow

Live link: https://kamil-agmo.github.io/lokali-proto/ (repo kamil-agmo/lokali-proto; push main, GitHub Pages deploys in ~1 min; run tools/stamp-version.py after each version bump).

Host mode (since 0.37.0): Aina is also a host, of "Forest-edge farm walk & kuih morning" on her grandmother's farm in Hulu Langat (no listing is set in a city); switch with the Hosting pill on guest Home (approved hosts) or Switch to guest on host Today. Pak Rahim stays the admin's assisted-onboarding host.


Pak Rahim's **Mangrove & fireflies by kampung boat** (Kuala Selangor) is the only fully written experience; guest Aina Rahman books it for Sun 6 Dec. Every test path should lead there (Home → Featured → experience page → Book now → checkout → confirmed → My bookings → chat).

## Style

**Airy** (Home is the reference): white, neutral greys, brand red #D7263D only for actions, logo greens #37664A / #1C522C for eco, gold star, pills, no card boxes, hairline sections, 24px margins, shadows only on things that float. Details in `DESIGN.md`.

## Done in the last session (highlights)

- Experience page shortened (MIMS: detail behind a tap), scrolled header with ⋯ menu, Reviews rating in heading.
- Host profile (suggestion Q15), Account (photo + round avatar style, Become a host highlighted, Delete set apart), Results, Bookings, Inbox, Chat, Booking details, Cancel, Review, Checkout, Confirmed all brought to Airy and checked with MIMS.
- Reviewer notes switch removed; large titles fixed on tab screens; switch size bug fixed sitewide; art.js script error fixed.
- New logo integrated (`assets/brand/`), tab + home-screen icons, eco green matched to the logo.

## Open / next

1. ~~MIMS on the host screens~~ done in 0.37.0 (Aina's story). Photos for her kuih listing reuse food photo IDs; swap for real kuih photos.
2. **Admin styling** — deliberately left for last; do it only when the user asks.
3. **Old mocks** `explore/listing-long.html`, `listing-fixes.html`, `search-ideas.html` change pages inside iframes, so they only work through a local server; rebuild them self-contained if used again (mock rules).
4. **Public GitHub repo `axttd/lokali-compare`** (compare pages) — the user planned to delete it.
5. ~~Presenter menu green~~ fixed in 0.46.2 (logo green).
6. **Brand rose vs action red**: the logo's rose (#C56969) isn't used in the app; action buttons stay #D7263D for contrast (decided 27 Nov).

## References

- Teammate's older Canopy copy: `~/Desktop/Lokali latest` on the original Mac (not included here).
- Logo source files: provided by a friend of the designer; copies in `assets/brand/`.
