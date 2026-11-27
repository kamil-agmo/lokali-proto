---
name: dd-map-kamil
description: 'By Kamil · A free, light map for static HTML/CSS/JS prototypes - MapLibre with OpenFreeMap tiles (no key, no account, no billing), light and dark maps that follow the theme, and markers designed for each prototype (pins with Material Symbols, label or price bubbles, photos, numbers, dots, current location, route line, grouped counts) in the design system''s tokens. Dev mode shows which map it is; Designer mode pastes it into Figma as SVG layers. Asks first, as explained options. Use when screens need a map, location, "nearby", branch or store finder, delivery or ride tracking, check-in, addresses on a map, or a map dashboard in an admin panel.'
metadata:
  author: Kamil
  credit: 'Map'
  marker: 'DESIGN.md::(?m)^## Map'
  version: 1.0.0
  tier: Look & feel
  summary: 'A free map with markers in your own design.'
  requires: ''
---

# Map

**Made by Kamil**

A real, zoomable map for a prototype that costs nothing: **MapLibre GL JS** (open source) draws **OpenFreeMap** tiles (OpenStreetMap data, no API key, no account, no usage limit). It is the map from the MOH DRG prototype's Quality performance page, with its markers taken out and replaced by markers made for each prototype. The engine loads only on pages that have a map.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

**Never paid maps:** no Google Maps, Mapbox or MapTiler keys, no billing on any account. `map.py check` flags paid keys.

## Step 0: ask first (do not guess)

AskUserQuestion, recommended option first, every option explained (on claude.ai: a numbered list). Skip what `DESIGN.md` or the brief already answers.

1. **Which screens** get a map: name the candidates found in the brief or screens (store finder, "nearby", delivery tracking, check-in, an admin map dashboard) and ask which.
2. **Markers** (multiSelect): **Pin with an icon (Recommended)**: a Material Symbol in a round pin, one icon per kind of place · **Label or price bubble**: text such as "RM 12.90" or "32 photos" · **Photo**: a round photo or avatar · **Number**: stops in order · **Dot**: small and many, for data maps (colour by met / missed, like MOH DRG).
3. **Extras** (multiSelect): **Current location** (a pulsing dot and a locate button) · **Route line** (joins the points in order; straight lines, no routing service) · **Group nearby markers** (a count when zoomed out) · **Full-screen button**.
4. **Map look**: **Light and dark, follows the theme (Recommended)**: positron and dark · **Colourful in light**: liberty, dark in dark · **Bright**: bright, dark in dark.
5. **Places**: **Believable Malaysian places (Recommended)**: `content.py gen places` (dd-localized-content-kamil) · **Real addresses from the brief**: needs their coordinates; ask for them, never guess.

## Workflow

1. `python3 <skill>/scripts/map.py install --project <project> --pages <a.html,b.html> --markers <types> --style positron/dark --icons <pin icons>`
   Copies `js/shared/map.js` and `css/shared/map.css`, links them in those pages, adds the map's icons to each page's `icon_names`, adds dev mode's Map card when dev mode is there, keeps seen map tiles for offline in dd-phone-install's `sw.js`, and writes `## Map` in `DESIGN.md`.
2. Points: `python3 <dd-localized-content-kamil>/scripts/content.py gen places --n 8 --seed 3 --cat "Kuala Lumpur" --format json`; keep the same seed so places match across screens. Inline for a few, `data/<name>.json` for many.
3. Put the map on the page (`references/usage.md` has the snippets):
   `<div class="dd-map" id="map" aria-label="Stores map" style="height:360px"></div>` then `DDMap.create('#map', { points, marker: 'pin', icon: 'storefront' })`.
4. Marker detail: the built-in popup, or `onSelect` opens the component library's sheet (dd-components-kamil) and a list row calls `handle.select(id)`. On a phone screen the map scrolls with two fingers, so the page never gets stuck.
5. Look: only the `--map-*` tokens change (accent from the brand); never restyle MapLibre's own controls.
6. Check over http: tiles show, markers sit on the right places, the map swaps light/dark with the presenter, controls are 44 px, the credit is visible, nothing sits under the Dynamic Island. Then `map.py check --project <project>`.
7. Run `credits.py` (dd-credits-kamil) again: the map adds "Map by Kamil".

## Connected skills

Presenter (theme) · iPhone / iPhone Duo (fits the screen; open Duo shows map and list side by side) · Desktop / Admin panel (map dashboards: table row flies to its marker) · Design system (tokens; Rules check) · Icons (pins and controls) · Components (detail sheet) · Typography · Localized content (places) · Accessibility (focusable, labelled markers; 44 px) · UX writing (labels) · Dev mode (Map card: engine, tiles, style link, credit, data, SDK for the real app) · Designer mode + Figma components (SVG layers, markers as components) · Phone install (offline tiles) · Requirements and Design references (spot map needs, map references) · Prototype kit (step 5c).

## Last step: make things make sense

- Every marker means one place and says what it is (aria-label and popup); colours mean one thing each, with a key if they carry data.
- The first view shows all the points (or the user's area), not the whole world.
- The map works without internet only as "Map unavailable · no connection"; anything important is also in a list.

Report the screens with a map, marker types, the places' source and what could not be checked. Details, API and Figma/dev notes: `references/usage.md`.
