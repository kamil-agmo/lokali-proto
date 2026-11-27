# Map: usage, markers, Figma and dev notes

## Snippets

Page head and end (map.py install adds both):

```html
<link rel="stylesheet" href="../css/shared/map.css">
...
<script src="../js/shared/map.js"></script>
```

A map with pins and a popup:

```html
<div class="dd-map" id="map" aria-label="Stores map" style="height:360px"></div>
<script>
  var STORES = [ { id: 's1', name: 'Kopitiam Lim', sub: 'Bangsar · Open till 10pm', lat: 3.1312, lng: 101.6722, icon: 'local_cafe' } ];
  var MAP = DDMap.create('#map', { points: STORES, marker: 'pin', icon: 'storefront', fly: true });
  // a list row: MAP.select('s1')
</script>
```

Without a script: `<div class="dd-map" data-points="../data/stores.json" data-marker="pin" data-icon="storefront" data-cluster></div>`.

Full-screen map (a map tab): give the box the screen's height; two-finger scrolling turns itself off when the map fills the screen. Keep the controls and credit clear of the tab bar and the Dynamic Island (pad the box, not the controls).

## Options and points

See the comment at the top of `assets/map/map.js` for every option. Points: `{ id, name, sub, lat, lng, type, icon, label, img, n, tone, action, href }`.
- `type` overrides the default marker per point: `pin`, `label`, `photo`, `number`, `dot`.
- `tone`: `ok`, `bad`, `warn`, `muted` (data maps: met / missed). Show a key under the map when tones carry meaning.
- `action` + `href`: a button in the popup ("Directions", "Order here").
- `me: { lat, lng }`, `route: true`, `cluster: true`, `popup: false | fn`, `onSelect(point, handle)`.
- Handle: `select(id)`, `points(list)`, `fit()`, `map` (MapLibre's map for anything else).

## Tokens (css/shared/map.css)

`--map-accent` (brand), `--map-on`, `--map-ok`, `--map-bad`, `--map-warn`, `--map-muted`, `--map-surface`, `--map-ink`, `--map-sub`, `--map-line`, `--map-radius`, `--map-shadow`, `--map-route`. Set them on `:root` or one `.dd-map`. Dark values apply with `html.dark` or the system when there is no `html.light`.

Marker sizes: pin 36, label 30 high, photo 42, number 28, dot 16, cluster 40; every marker is a button at least 44 × 44.

## Map looks (OpenFreeMap styles)

`positron` (light grey, quiet: best under coloured markers), `dark`, `bright`, `liberty` (colourful), `fiord` (dark blue). `style: { light: 'liberty', dark: 'dark' }`.

## Figma (dd-designer-mode-kamil)

`DDMap.forFigma(level)` swaps the canvas, in the off-screen copy only, for:
- `full`: SVG layers named Land, Parks, Water, Buildings, Roads, Borders, Route, Labels; one path per colour and width, clipped to the map box.
- `simple`: no buildings, only main roads, only place names.
- `image`: one JPEG.
Markers, popup and controls stay HTML, so they paste as frames, Material Symbols icons and `MapMarker` components with variants (type / tone / state).
Designer mode calls `DDMap.estimate()` first; above `DDMap.heavyKB` (350 KB of SVG, usually a wide desktop map) it asks Full SVG, Simple SVG or Image, once per copy. Street names along roads are not in the SVG (only point labels).

## Dev mode (dd-dev-mode-kamil)

`js/shell/map-dev.js` adds a Map card under the tips when the screen has a map: engine, tiles, style link, markers and data source, credit, the MapLibre SDK for each platform, and "Copy setup" (Markdown for the developers). The tiles are one canvas, so the inspector measures the markers, popup and controls, not the map drawing.

## Why these choices

- **MapLibre GL JS 4.7.1** (BSD-3): the open fork of Mapbox GL; vector maps, smooth zoom, rotate and tilt, ~230 KB gzipped, loaded from unpkg only on map pages.
- **OpenFreeMap**: free hosted OpenStreetMap vector tiles with no key, account or limit, funded by donations. Attribution to OpenFreeMap and OpenStreetMap must stay visible.
- Same style links work in MapLibre Native (iOS, Android), Flutter and React Native, so the real app can match the prototype.
- No routing, search or geocoding service: those are paid or rate-limited. Routes are straight lines between given points; addresses come with their coordinates.
