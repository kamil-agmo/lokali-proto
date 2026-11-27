/* dd-map-kamil · map.js · a free, light map for prototypes (by Kamil).
   Engine: MapLibre GL JS 4.7.1 (open source, BSD-3). Map tiles: OpenFreeMap (no key, no account, no limits) from
   OpenStreetMap data. Light pages get the "positron" map, dark pages the "dark" map, and it swaps live with the theme
   (html.light / html.dark from the presenter, else the system setting). Markers are the prototype's own: HTML buttons
   styled by map.css with the design tokens, so dev mode can inspect them and Designer mode pastes them as components.

     DDMap.create('#map', { points: [...], marker: 'pin' })      a map in an element; returns the map handle
     <div class="dd-map" data-points="../data/places.json" data-marker="pin"></div>   the same, without a script

   Options (all optional):
     points   [{ id, name, sub, lat, lng, type, icon, label, img, n, tone, action, href }]   or a JSON file's URL
     marker   default marker type: pin | dot | label | photo | number          (a point's own `type` wins)
     icon     default Material Symbol for pins (e.g. 'local_cafe')
     me       { lat, lng }: the "you are here" pulse; the locate control flies to it
     route    true (joins the points in order) or [{lat, lng}, ...]: a line drawn under the markers
     cluster  true: nearby markers join into one count marker when zoomed out
     popup    true (name, sub, action) · false · function (point) { return html }
     onSelect function (point, handle): a marker was chosen (open a sheet, highlight a row...)
     center { lat, lng }, zoom: the start view when there are no points to fit
     fit      true (default): zoom to show every point;   maxZoom (15)
     controls ['zoom', 'compass', 'fullscreen', 'reset', 'locate'] (default: zoom, compass, reset; locate when `me`)
     style    { light: 'positron', dark: 'dark' } (OpenFreeMap styles: positron, bright, liberty, dark, fiord)
     scrollPage true: two fingers (or ⌘ / Ctrl + scroll) move the map, so a scrolling page is never trapped.
              Default: on unless the map fills the screen.

   Handle: select(id), points(list), fit(), map (the MapLibre map), el.
   For Designer mode (dd-designer-mode-kamil): DDMap.estimate(), DDMap.forFigma('full' | 'simple' | 'image').
   For dev mode (dd-dev-mode-kamil): DDMap.info(). */
(function () {
  'use strict';
  if (window.DDMap) return;
  var VERSION = '1.0.0', LIBV = '4.7.1';
  var LIB = 'https://unpkg.com/maplibre-gl@' + LIBV + '/dist/maplibre-gl';
  var TILES = 'https://tiles.openfreemap.org/styles/';
  var CONTROL_ICONS = ['add', 'remove', 'explore', 'fit_screen', 'fullscreen', 'fullscreen_exit', 'my_location'];
  var maps = [], libP = null, html = document.documentElement;

  /* ---------- loading ---------- */
  function loadLib() {
    if (window.maplibregl) return Promise.resolve();
    if (libP) return libP;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = LIB + '.css'; document.head.appendChild(l);
    return (libP = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = LIB + '.js';
      s.onload = ok; s.onerror = function () { libP = null; no(new Error('offline')); };
      document.head.appendChild(s);
    }));
  }
  function iconFont(names) {   // the page's own Material Symbols link wins; with none, load one for the map's icons only
    var have = [].some.call(document.querySelectorAll('link[href*="Material+Symbols"]'), function () { return true; });
    if (have) return;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400,0..1,0&icon_names=' + names.sort().join(',');
    document.head.appendChild(l);
  }
  function isDark() {
    if (html.classList.contains('dark')) return true;
    if (html.classList.contains('light')) return false;
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function calm() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ll(p) { return [Number(p.lng), Number(p.lat)]; }

  /* ---------- markers ---------- */
  var TAIL = '<svg class="dd-mk__tail" viewBox="0 0 14 8" aria-hidden="true"><path d="M0 0H14L7 8Z" fill="currentColor"/></svg>';
  function markerEl(p, type, opt) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dd-mk dd-mk--' + type + (p.tone ? ' dd-mk--' + p.tone : '');
    b.setAttribute('aria-label', [p.name, p.sub, p.label].filter(Boolean).join(', ') || 'Place');
    b.setAttribute('data-component', 'MapMarker');
    b.setAttribute('data-variant', type + '/' + (p.tone || 'default') + '/default');
    var inner;
    if (type === 'pin') inner = '<span class="dd-mk__body"><span class="ms" aria-hidden="true">' + esc(p.icon || opt.icon || 'location_on') + '</span></span>' + TAIL;
    else if (type === 'label') inner = '<span class="dd-mk__body">' + esc(p.label || p.name) + '</span>' + TAIL;
    else if (type === 'photo') inner = '<span class="dd-mk__body"><img src="' + esc(p.img || '') + '" alt=""></span>' + TAIL;
    else if (type === 'number') inner = '<span class="dd-mk__body">' + esc(p.n != null ? p.n : '') + '</span>';
    else if (type === 'me') inner = '<span class="dd-mk__ring" aria-hidden="true"></span><span class="dd-mk__body"></span>';
    else if (type === 'cluster') inner = '<span class="dd-mk__body">' + esc(p.count) + '</span>';
    else inner = '<span class="dd-mk__body"></span>';   // dot
    b.innerHTML = inner;
    return b;
  }
  var ANCHOR = { pin: 'bottom', label: 'bottom', photo: 'bottom' };

  /* ---------- one map ---------- */
  function MapHandle(el, opt) {
    var self = this;
    this.el = el; this.opt = opt; this.list = []; this.marks = {}; this.sel = null; this.clusters = [];
    el.classList.add('dd-map');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'region');
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Map');
    el.innerHTML = '<div class="dd-map__gl"></div><div class="dd-map__ctrls"></div>' +
      '<div class="dd-map__credit"><a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></div>' +
      '<div class="dd-map__msg" hidden></div>';
    this.ready = new Promise(function (ok) { self._ok = ok; });
    var pts = opt.points;
    var got = typeof pts === 'string' ? fetch(pts).then(function (r) { return r.json(); }) : Promise.resolve(pts || []);
    iconFont(CONTROL_ICONS.concat([opt.icon || 'location_on']));
    Promise.all([loadLib(), got]).then(function (r) { self._start(r[1]); }, function (e) {
      self._msg(e && e.message === 'offline' ? 'Map unavailable · no connection' : 'Map unavailable');
      self._ok();
    });
  }
  MapHandle.prototype._msg = function (t) { var m = this.el.querySelector('.dd-map__msg'); m.textContent = t; m.hidden = false; };
  MapHandle.prototype._styleUrl = function () {
    var s = this.opt.style || {}; if (typeof s === 'string') s = { light: s, dark: s };
    this._styleKey = isDark() ? (s.dark || 'dark') : (s.light || 'positron');
    return /^https?:/.test(this._styleKey) ? this._styleKey : TILES + this._styleKey;
  };
  MapHandle.prototype._start = function (points) {
    var self = this, opt = this.opt, el = this.el;
    var full = el.getBoundingClientRect().height >= (window.innerHeight || 800) * 0.85;
    var coop = opt.scrollPage != null ? !!opt.scrollPage : !full;
    var c = opt.center || { lat: 3.139, lng: 101.687 };   // Kuala Lumpur
    var url = this._styleUrl();
    var m = this.map = new maplibregl.Map({
      container: el.querySelector('.dd-map__gl'), style: url, center: ll(c), zoom: opt.zoom != null ? opt.zoom : 11,
      attributionControl: false, cooperativeGestures: coop, fadeDuration: calm() ? 0 : 300, dragRotate: true, pitchWithRotate: true,
      preserveDrawingBuffer: false
    });
    this._controls();
    m.on('style.load', function () { self._styled = true; self._route(); });
    m.on('error', function (e) { if (!self._styled && /style|Failed to fetch/i.test(String(e && e.error && e.error.message))) self._msg('Map unavailable · no connection'); });
    setTimeout(function () { if (!self._styled) m.setStyle(url, { diff: false }); }, 6000);   // a stalled style: try once more
    m.on('rotate', function () { var i = el.querySelector('[data-c="compass"] .ms'); if (i) i.style.transform = 'rotate(' + (-m.getBearing()) + 'deg)'; });
    m.on('click', function (e) { if (!e.originalEvent || !e.originalEvent.target.closest('.dd-mk')) self.select(null); });
    if (opt.cluster) m.on('moveend', function () { self._cluster(); });
    this.points(points);
    m.once('idle', function () { self._ok(); });
    setTimeout(function () { self._ok(); }, 9000);
  };
  MapHandle.prototype._controls = function () {
    var self = this, m = this.map, box = this.el.querySelector('.dd-map__ctrls');
    var want = this.opt.controls || ['zoom', 'compass', 'reset'].concat(this.opt.me ? ['locate'] : []);
    var B = {
      zoom: [['zin', 'add', 'Zoom in', function () { m.zoomIn({ duration: calm() ? 0 : 250 }); }], ['zout', 'remove', 'Zoom out', function () { m.zoomOut({ duration: calm() ? 0 : 250 }); }]],
      compass: [['compass', 'explore', 'Reset rotation', function () { m.easeTo({ bearing: 0, pitch: 0, duration: calm() ? 0 : 300 }); }]],
      reset: [['reset', 'fit_screen', 'Reset view', function () { m.stop(); self.fit(); }]],
      locate: [['locate', 'my_location', 'Current location', function () { if (self.opt.me) m.flyTo({ center: ll(self.opt.me), zoom: Math.max(m.getZoom(), 15), duration: calm() ? 0 : 800 }); }]],
      fullscreen: [['full', 'fullscreen', 'Full screen', function () {
        var d = document, on = d.fullscreenElement === self.el;
        if (on) d.exitFullscreen(); else if (self.el.requestFullscreen) self.el.requestFullscreen();
      }]]
    };
    var groups = [];
    want.forEach(function (k) { if (B[k]) groups.push(B[k]); });
    box.innerHTML = groups.map(function (g) {
      return '<div class="dd-map__grp">' + g.map(function (b) { return '<button type="button" class="dd-map__btn" data-c="' + b[0] + '" aria-label="' + b[2] + '" title="' + b[2] + '"><span class="ms" aria-hidden="true">' + b[1] + '</span></button>'; }).join('') + '</div>';
    }).join('');
    var fns = {}; groups.forEach(function (g) { g.forEach(function (b) { fns[b[0]] = b[3]; }); });
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b && fns[b.dataset.c]) fns[b.dataset.c](); });
    document.addEventListener('fullscreenchange', function () {
      var i = box.querySelector('[data-c="full"] .ms'); if (i) i.textContent = document.fullscreenElement === self.el ? 'fullscreen_exit' : 'fullscreen';
      setTimeout(function () { m.resize(); }, 50);
    });
  };
  MapHandle.prototype.points = function (list) {
    var self = this, opt = this.opt;
    Object.keys(this.marks).forEach(function (k) { self.marks[k].remove(); }); this.marks = {};
    this.list = (list || []).filter(function (p) { return p && isFinite(p.lat) && isFinite(p.lng); }).map(function (p, i) { return Object.assign({ id: p.id != null ? String(p.id) : 'p' + i }, p); });
    this.list.forEach(function (p) {
      var type = p.type || opt.marker || 'pin', b = markerEl(p, type, opt);
      b.addEventListener('click', function (e) { e.stopPropagation(); self.select(p.id); });
      self.marks[p.id] = new maplibregl.Marker({ element: b, anchor: ANCHOR[type] || 'center' }).setLngLat(ll(p)).addTo(self.map);
      self.marks[p.id]._type = type;
    });
    if (opt.me) {
      var me = markerEl({ name: 'Current location' }, 'me', opt);
      me.tabIndex = -1;
      this.marks.__me = new maplibregl.Marker({ element: me, anchor: 'center' }).setLngLat(ll(opt.me)).addTo(this.map);
    }
    if (this._styled) this._route();
    if (opt.fit !== false) this.fit(true);
    if (opt.cluster) this._cluster();
  };
  MapHandle.prototype.fit = function (instant) {
    var all = this.list.slice(); if (this.opt.me) all.push(this.opt.me);
    if (!all.length || !this.map) return;
    if (all.length === 1) { this.map.jumpTo({ center: ll(all[0]), zoom: this.opt.maxZoom || 15 }); return; }
    var b = new maplibregl.LngLatBounds(); all.forEach(function (p) { b.extend(ll(p)); });
    var pad = Math.min(56, Math.round(Math.min(this.el.clientWidth, this.el.clientHeight) / 6));
    this.map.fitBounds(b, { padding: { top: pad + 40, bottom: pad, left: pad, right: pad + 44 }, maxZoom: this.opt.maxZoom || 15, bearing: 0, pitch: 0, duration: instant || calm() ? 0 : 600 });
  };
  MapHandle.prototype.select = function (id) {
    var self = this, opt = this.opt;
    if (this.sel && this.marks[this.sel]) this.marks[this.sel].getElement().classList.remove('is-on');
    if (this._pop) { this._pop.remove(); this._pop = null; }
    this.sel = id != null && this.marks[id] ? String(id) : null;
    if (!this.sel) return;
    var mk = this.marks[this.sel], p = this.list.filter(function (x) { return x.id === self.sel; })[0];
    mk.getElement().classList.add('is-on');
    if (opt.popup !== false) {
      var body = typeof opt.popup === 'function' ? opt.popup(p) :
        '<b class="dd-map__pt">' + esc(p.name) + '</b>' + (p.sub ? '<span class="dd-map__ps">' + esc(p.sub) + '</span>' : '') +
        (p.action ? '<a class="dd-map__pa" href="' + esc(p.href || '#') + '">' + esc(p.action) + '</a>' : '');
      var up = ANCHOR[mk._type] ? -50 : -18;
      this._pop = new maplibregl.Popup({ offset: [0, up], closeButton: false, closeOnClick: false, maxWidth: '260px', className: 'dd-map__popwrap', focusAfterOpen: false })
        .setLngLat(ll(p)).setHTML('<div class="dd-map__pop">' + body + '</div>').addTo(this.map);
    }
    if (opt.fly) this.map.flyTo({ center: ll(p), zoom: Math.max(this.map.getZoom(), 14), duration: calm() ? 0 : 700 });
    if (opt.onSelect) opt.onSelect(p, this);
  };
  MapHandle.prototype._route = function () {
    var m = this.map, r = this.opt.route; if (!r || !m) return;
    var pts = r === true ? this.list : r;
    var geo = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.map(ll) }, properties: {} };
    var cs = getComputedStyle(this.el), col = cs.getPropertyValue('--map-route').trim() || cs.getPropertyValue('--map-accent').trim() || '#2563eb';
    var casing = cs.getPropertyValue('--map-route-casing').trim() || (isDark() ? '#0b0f14' : '#ffffff');
    if (m.getSource('dd-route')) { m.getSource('dd-route').setData(geo); return; }
    m.addSource('dd-route', { type: 'geojson', data: geo });
    m.addLayer({ id: 'dd-route-casing', type: 'line', source: 'dd-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': casing, 'line-width': 8 } });
    m.addLayer({ id: 'dd-route', type: 'line', source: 'dd-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': col, 'line-width': 4.5 } });
  };
  MapHandle.prototype._cluster = function () {   // screen-space grid: markers closer than one cell join into a count
    var self = this, m = this.map, cell = 56, cells = {};
    this.clusters.forEach(function (c) { c.remove(); }); this.clusters = [];
    this.list.forEach(function (p) {
      var pt = m.project(ll(p)), k = Math.floor(pt.x / cell) + ':' + Math.floor(pt.y / cell);
      (cells[k] = cells[k] || []).push(p);
    });
    Object.keys(cells).forEach(function (k) {
      var g = cells[k], solo = g.length === 1 || m.getZoom() >= (self.opt.maxZoom || 15);
      g.forEach(function (p) { self.marks[p.id].getElement().style.display = solo ? '' : 'none'; });
      if (solo) return;
      var lat = 0, lng = 0; g.forEach(function (p) { lat += +p.lat; lng += +p.lng; });
      var el = markerEl({ count: g.length, name: g.length + ' places' }, 'cluster', self.opt);
      el.addEventListener('click', function (e) {
        e.stopPropagation(); var b = new maplibregl.LngLatBounds(); g.forEach(function (p) { b.extend(ll(p)); });
        m.fitBounds(b, { padding: 64, maxZoom: (self.opt.maxZoom || 15), duration: calm() ? 0 : 500 });
      });
      self.clusters.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng / g.length, lat / g.length]).addTo(m));
    });
  };
  MapHandle.prototype._theme = function () {
    if (!this.map) return;
    var before = this._styleKey, url = this._styleUrl();
    if (before === this._styleKey) return;
    this._styled = false;
    this.map.setStyle(url, { diff: false });   // diff:false so style.load fires and the route is drawn again
  };

  /* ---------- Figma: the map as SVG layers (or one image) ---------- */
  function colour(v) {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v.r === 'number') {   // MapLibre's Color: premultiplied 0-1
      var a = v.a == null ? 1 : v.a, k = a ? 1 / a : 0;
      return 'rgba(' + Math.round(v.r * k * 255) + ',' + Math.round(v.g * k * 255) + ',' + Math.round(v.b * k * 255) + ',' + Math.round(a * 1000) / 1000 + ')';
    }
    return null;
  }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function textOf(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (v.sections) return v.sections.map(function (s) { return s.text; }).join('');
    return String(v);
  }
  function groupOf(f) {
    var id = (f.layer.id + ' ' + (f.sourceLayer || '')).toLowerCase(), t = f.layer.type;
    if (f.layer.id.indexOf('dd-route') === 0) return 'Route';
    if (t === 'symbol') return 'Labels';
    if (/water|ocean|lake|river|sea|bay/.test(id)) return 'Water';
    if (/building/.test(id)) return 'Buildings';
    if (/park|wood|forest|grass|green|landcover|cemetery|pitch|garden|scrub|wetland/.test(id)) return 'Parks';
    if (/boundary|admin|border/.test(id)) return 'Borders';
    if (t === 'line' || /road|highway|transport|street|bridge|tunnel|rail|aeroway|path|ferry/.test(id)) return 'Roads';
    return 'Land';
  }
  var MAJOR = /motorway|trunk|primary|secondary|major/;
  function keepSimple(f, g) {
    if (g === 'Buildings') return false;
    if (g === 'Roads') return MAJOR.test(f.layer.id) || MAJOR.test(String(f.properties && f.properties['class']));
    if (g === 'Labels') return /place|city|town|suburb|country|state|water/.test(f.layer.id) && !/road|highway|street|poi/.test(f.layer.id);
    return true;
  }
  /* clip a ring to the box (Sutherland-Hodgman) */
  function clipRing(pts, W, H) {
    var E = [[function (p) { return p[0] >= -2; }, function (a, b) { var t = (-2 - a[0]) / (b[0] - a[0]); return [-2, a[1] + t * (b[1] - a[1])]; }],
      [function (p) { return p[0] <= W + 2; }, function (a, b) { var t = (W + 2 - a[0]) / (b[0] - a[0]); return [W + 2, a[1] + t * (b[1] - a[1])]; }],
      [function (p) { return p[1] >= -2; }, function (a, b) { var t = (-2 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), -2]; }],
      [function (p) { return p[1] <= H + 2; }, function (a, b) { var t = (H + 2 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), H + 2]; }]];
    var out = pts;
    E.forEach(function (e) {
      var inp = out; out = []; if (!inp.length) return;
      var prev = inp[inp.length - 1];
      inp.forEach(function (cur) {
        var ci = e[0](cur), pi = e[0](prev);
        if (ci) { if (!pi) out.push(e[1](prev, cur)); out.push(cur); } else if (pi) out.push(e[1](prev, cur));
        prev = cur;
      });
    });
    return out;
  }
  /* clip a line to the box (Liang-Barsky per segment), giving the pieces inside */
  function clipLine(pts, W, H) {
    var pieces = [], cur = [];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], t0 = 0, t1 = 1, dx = b[0] - a[0], dy = b[1] - a[1], ok = true;
      [[-dx, a[0] + 2], [dx, W + 2 - a[0]], [-dy, a[1] + 2], [dy, H + 2 - a[1]]].forEach(function (pq) {
        if (!ok) return; var p = pq[0], q = pq[1];
        if (p === 0) { if (q < 0) ok = false; return; }
        var r = q / p; if (p < 0) { if (r > t1) ok = false; else if (r > t0) t0 = r; } else { if (r < t0) ok = false; else if (r < t1) t1 = r; }
      });
      if (!ok) { if (cur.length > 1) pieces.push(cur); cur = []; continue; }
      var A = [a[0] + t0 * dx, a[1] + t0 * dy], B = [a[0] + t1 * dx, a[1] + t1 * dy];
      if (!cur.length || t0 > 0) { if (cur.length > 1) pieces.push(cur); cur = [A]; }
      cur.push(B);
      if (t1 < 1) { pieces.push(cur); cur = []; }
    }
    if (cur.length > 1) pieces.push(cur);
    return pieces;
  }
  function simplify(pts, tol) {   // drop points closer than tol px to the last kept one
    if (pts.length < 3) return pts;
    var out = [pts[0]];
    for (var i = 1; i < pts.length - 1; i++) { var l = out[out.length - 1]; if (Math.abs(pts[i][0] - l[0]) + Math.abs(pts[i][1] - l[1]) >= tol) out.push(pts[i]); }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function d(pts, close) {
    return 'M' + pts.map(function (p) { return (Math.round(p[0] * 10) / 10) + ' ' + (Math.round(p[1] * 10) / 10); }).join('L') + (close ? 'Z' : '');
  }
  var ORDER = ['Land', 'Parks', 'Water', 'Buildings', 'Roads', 'Borders', 'Route', 'Labels'];
  MapHandle.prototype._layers = function (level) {
    var m = this.map, W = this.el.clientWidth, H = this.el.clientHeight;
    var proj = function (c) { var p = m.project(c); return [p.x, p.y]; };
    var feats = m.queryRenderedFeatures(), groups = {}, seenText = {}, points = 0;
    feats.forEach(function (f) {
      var g = groupOf(f); if (level === 'simple' && !keepSimple(f, g)) return;
      var t = f.layer.type, P = f.layer.paint || {}, Lo = f.layer.layout || {}, geom = f.geometry; if (!geom) return;
      var bag = groups[g] = groups[g] || { paths: {}, texts: [] };
      if (t === 'symbol') {
        var txt = textOf(Lo['text-field']).trim(); if (!txt || geom.type !== 'Point' || seenText[txt]) return;
        var xy = proj(geom.coordinates); if (xy[0] < 0 || xy[1] < 0 || xy[0] > W || xy[1] > H) return;
        seenText[txt] = 1;
        bag.texts.push({ x: xy[0], y: xy[1], t: txt, size: num(Lo['text-size'], 12), fill: colour(P['text-color']) || '#333', halo: colour(P['text-halo-color']), hw: num(P['text-halo-width'], 0) });
        return;
      }
      var fill = t === 'fill' || t === 'fill-extrusion', key, rings = [];
      if (fill) {
        var polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
        polys.forEach(function (poly) { poly.forEach(function (ring) { var r = simplify(clipRing(ring.map(proj), W, H), 0.8); if (r.length > 2) rings.push(d(r, true)); }); });
        var fc = colour(P['fill-color'] || P['fill-extrusion-color']); if (!fc) return;
        key = 'f|' + fc + '|' + num(P['fill-opacity'], 1);
      } else if (t === 'line') {
        var lines = geom.type === 'LineString' ? [geom.coordinates] : geom.type === 'MultiLineString' ? geom.coordinates : geom.type === 'Polygon' ? geom.coordinates : [];
        lines.forEach(function (ln) { clipLine(ln.map(proj), W, H).forEach(function (piece) { var r = simplify(piece, 0.8); if (r.length > 1) rings.push(d(r, false)); }); });
        var lc = colour(P['line-color']); if (!lc) return;
        key = 'l|' + lc + '|' + num(P['line-opacity'], 1) + '|' + Math.round(num(P['line-width'], 1) * 10) / 10;
      } else return;
      if (!rings.length) return;
      rings.forEach(function (r) { points += r.length / 8; });
      (bag.paths[key] = bag.paths[key] || []).push(rings.join(''));
    });
    var bg = this._bg || (isDark() ? '#0e0e0e' : '#f8f8f6'), out = [], bytes = 0;
    ORDER.forEach(function (g) {
      var bag = groups[g]; if (!bag) return;
      var body = Object.keys(bag.paths).map(function (k) {   // one path per colour and width: few layers in Figma
        var p = k.split('|');
        return p[0] === 'f' ? '<path d="' + bag.paths[k].join('') + '" fill="' + p[1] + '"' + (p[2] !== '1' ? ' fill-opacity="' + p[2] + '"' : '') + ' fill-rule="evenodd"/>'
          : '<path d="' + bag.paths[k].join('') + '" fill="none" stroke="' + p[1] + '" stroke-width="' + p[3] + '"' + (p[2] !== '1' ? ' stroke-opacity="' + p[2] + '"' : '') + ' stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('') + bag.texts.map(function (t) {
        return '<text x="' + Math.round(t.x) + '" y="' + Math.round(t.y) + '" font-size="' + t.size + '" fill="' + t.fill + '" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif">' + esc(t.t) + '</text>';
      }).join('');
      if (!body) return;
      var svg = '<svg class="' + g + '" data-layer="' + g + '" xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + body + '</svg>';
      bytes += svg.length; out.push(svg);
    });
    return { bg: bg, svgs: out, kb: Math.round(bytes / 1024), points: Math.round(points) };
  };
  MapHandle.prototype._snapshot = function () {   // the drawn map as a JPEG (read inside a render, before the buffer clears)
    var m = this.map, self = this;
    return new Promise(function (ok) {
      var done = false;
      m.once('render', function () {
        try {
          var c = m.getCanvas(), url = c.toDataURL('image/jpeg', 0.85);
          var s = document.createElement('canvas'); s.width = s.height = 1; var g = s.getContext('2d'); g.drawImage(c, 2, 2, 1, 1, 0, 0, 1, 1);
          var px = g.getImageData(0, 0, 1, 1).data; self._bg = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
          done = true; ok(url);
        } catch (e) { done = true; ok(null); }
      });
      m.triggerRepaint(); setTimeout(function () { if (!done) ok(null); }, 3000);
    });
  };
  MapHandle.prototype._toFigma = function (level) {
    var self = this; if (!this.map) return Promise.resolve();
    return this.ready.then(function () { return self._snapshot(); }).then(function (png) {
      var host = self.map.getCanvasContainer(), cv = self.map.getCanvas();
      var box = document.createElement('div'); box.className = 'dd-map__figma'; box.setAttribute('data-layer', 'Map');
      if (level === 'image' || !level) {
        if (!png) return;
        box.innerHTML = '<img class="Map" data-layer="Map image" alt="" src="' + png + '">';
      } else {
        var L = self._layers(level);
        box.style.background = L.bg;
        box.innerHTML = L.svgs.join('');
      }
      cv.style.display = 'none';
      host.insertBefore(box, host.firstChild);
    });
  };

  /* ---------- public ---------- */
  function create(target, opt) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('DDMap: no element ' + target);
    var h = new MapHandle(el, opt || {}); maps.push(h); return h;
  }
  function auto() {
    [].forEach.call(document.querySelectorAll('.dd-map[data-points]:not([data-dd-on])'), function (el) {
      el.setAttribute('data-dd-on', '');
      var o = { points: el.dataset.points };
      ['marker', 'icon'].forEach(function (k) { if (el.dataset[k]) o[k] = el.dataset[k]; });
      if (el.dataset.cluster != null) o.cluster = true;
      if (el.dataset.route != null) o.route = true;
      create(el, o);
    });
  }
  var mo = new MutationObserver(function () { maps.forEach(function (h) { h._theme(); }); });
  mo.observe(html, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { maps.forEach(function (h) { h._theme(); }); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();

  window.DDMap = {
    version: VERSION, heavyKB: 350, create: create, list: function () { return maps.slice(); },
    icons: CONTROL_ICONS.slice(),
    ready: function () { return Promise.all(maps.map(function (h) { return h.ready; })); },
    estimate: function () {   // Designer mode asks before a heavy paste
      return this.ready().then(function () {
        var full = 0, simple = 0, pts = 0;
        maps.forEach(function (h) { if (!h.map) return; var a = h._layers('full'), b = h._layers('simple'); full += a.kb; simple += b.kb; pts += a.points; });
        return { maps: maps.length, fullKB: full, simpleKB: simple, points: pts, heavy: full > (window.DDMap.heavyKB || 350) };
      });
    },
    forFigma: function (level) { return Promise.all(maps.map(function (h) { return h._toFigma(level || 'full'); })); },
    info: function () {   // dev mode's Map card
      return {
        engine: 'MapLibre GL JS ' + LIBV, engineUrl: 'https://maplibre.org', licence: 'BSD-3-Clause (free)',
        tiles: 'OpenFreeMap', tilesUrl: 'https://openfreemap.org', key: 'No API key or account', styles: TILES,
        credit: '© OpenFreeMap · © OpenStreetMap contributors (must stay visible)',
        maps: maps.map(function (h) {
          var types = {}; h.list.forEach(function (p) { types[p.type || h.opt.marker || 'pin'] = 1; });
          return { style: h._styleKey, styleUrl: TILES + (h._styleKey || 'positron'), points: h.list.length, markers: Object.keys(types),
            source: typeof h.opt.points === 'string' ? h.opt.points : 'inline', route: !!h.opt.route, cluster: !!h.opt.cluster, me: !!h.opt.me };
        })
      };
    }
  };
})();
