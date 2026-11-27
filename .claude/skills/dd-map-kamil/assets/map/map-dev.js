/* dd-map-kamil · map-dev.js · a "Map" card in dev mode (dd-dev-mode-kamil) when the screen has a map: which engine and
   map tiles it uses, the style links, the credit that must stay visible, the markers and where their data comes from,
   and which MapLibre to use in the real app. "Copy setup" puts all of it on the clipboard as Markdown.
   Loaded in the shell's index.html after dev mode's scripts. */
(function () {
  'use strict';
  var PLATFORMS = [
    ['Web', 'maplibre-gl (npm)'], ['Flutter', 'maplibre_gl'], ['iOS', 'MapLibre Native (SwiftUI: maplibre-swiftui-dsl)'],
    ['Android', 'MapLibre Native (Compose: maplibre-compose)'], ['React Native', '@maplibre/maplibre-react-native']
  ];
  function info() { try { var w = window.DevMode && DevMode.win(); return w && w.DDMap && w.DDMap.list().length ? w.DDMap.info() : null; } catch (e) { return null; } }
  function md(i) {
    var m = i.maps[0] || {};
    return ['## Map', '', '- Engine: ' + i.engine + ' · ' + i.licence + ' · ' + i.engineUrl,
      '- Map tiles: ' + i.tiles + ' (' + i.key + ') · ' + i.tilesUrl,
      '- Styles: light ' + i.styles + 'positron · dark ' + i.styles + 'dark (swap with the app theme)',
      '- Credit (must stay visible): ' + i.credit,
      '- Markers: ' + m.points + ' · ' + (m.markers || []).join(', ') + ' · data: ' + m.source + (m.cluster ? ' · clustered' : '') + (m.route ? ' · route line' : '') + (m.me ? ' · current location' : ''),
      '- Marker look: map.css tokens (--map-accent, --map-surface, --map-ink, --map-ok, --map-bad)',
      '', '### Real app', ''].concat(PLATFORMS.map(function (p) { return '- ' + p[0] + ': ' + p[1]; }))
      .concat(['', 'Every MapLibre SDK takes the same style link, so the app looks like the prototype.']).join('\n');
  }
  function card() {
    var i = info(); if (!i) return '';
    var E = DevMode.esc, m = i.maps[0] || {};
    var row = function (k, v) { return '<div class="dvmap__row"><span>' + E(k) + '</span><b>' + v + '</b></div>'; };
    return '<div class="dvsec dvmap"><div class="dvmap__head"><span class="mi" aria-hidden="true">map</span><b>Map</b></div>' +
      row('Engine', E(i.engine) + ' · free') +
      row('Map tiles', E(i.tiles) + ' · no key') +
      row('Style', '<code>' + E(m.styleUrl || '') + '</code>') +
      row('Markers', E(m.points + ' · ' + (m.markers || []).join(', '))) +
      row('Data', '<code>' + E(m.source) + '</code>') +
      row('Credit', E('OpenFreeMap · OpenStreetMap, visible')) +
      row('Real app', E(PLATFORMS.map(function (p) { return p[0]; }).join(' · ') + ': MapLibre')) +
      '<button type="button" class="dvimg__toggle dvmap__copy" data-dvmap="copy"><span class="mi" aria-hidden="true">content_copy</span><span>Copy setup</span></button></div>';
  }
  function boot() {
    if (!window.DevMode || !DevMode.parts) return setTimeout(boot, 300);
    var st = document.createElement('style');
    st.textContent = '.dvmap{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);margin-top:8px}' +
      '.dvmap__head{display:flex;align-items:center;gap:6px}.dvmap__head .mi{font-size:18px;color:var(--accent-strong,#1d4ed8)}' +
      '.dvmap__row{display:flex;justify-content:space-between;gap:10px;font-size:12px;line-height:16px}.dvmap__row span{color:var(--muted)}' +
      '.dvmap__row b{font-weight:600;text-align:right;overflow-wrap:anywhere}.dvmap__row code{font-size:11px}';
    document.head.appendChild(st);
    DevMode.parts.push(card);
    ['load', 'attach', 'on'].forEach(function (h) { DevMode.on(h, function () { setTimeout(DevMode.renderTop, 1500); }); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-dvmap="copy"]')) return;
      var i = info(); if (!i) return;
      var t = md(i), b = e.target.closest('[data-dvmap]');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
        b.lastElementChild.textContent = 'Copied'; setTimeout(function () { b.lastElementChild.textContent = 'Copy setup'; }, 1600);
      }, function () { window.prompt('Map setup', t); });
    });
  }
  boot();
})();
