/* Designer mode (presenter shell): a toggle beside Dev mode that opens a panel for bringing the screens into Figma.
   · Copy this screen / Copy all screens: a native Figma paste (⌘V), built by Sebastian's engine through figma-bridge.js:
     auto layout, text, photos, vector icons; all screens also brings the components as variant sets with linked instances.
   The copy only reads the screens (off-screen copies); nothing in the prototype changes. */
(function () {
  'use strict';
  var S = window.SHELL || {}, FB = window.FigmaBridge;
  var top = document.querySelector('#sideRight .side__top'), devBtn = document.getElementById('devmode'), frame = document.getElementById('screen');
  if (!top || !FB || !frame) return;
  var KEY = (S.prefix || 'proto') + ':designer';

  var btn = document.createElement('button');
  btn.id = 'dsgbtn'; btn.type = 'button'; btn.className = 'devbtn dsgbtn'; btn.setAttribute('aria-pressed', 'false');
  btn.title = 'Copy to Figma: paste these screens into Figma';
  btn.innerHTML = '<span class="mi" style="font-size:16px" aria-hidden="true">palette</span><span class="devbtn__label">Figma</span>';
  top.insertBefore(btn, devBtn);

  var panel = document.createElement('section');
  panel.className = 'dsg'; panel.id = 'dsgPanel'; panel.hidden = true; panel.setAttribute('aria-label', 'Copy to Figma');
  panel.innerHTML =
    '<div class="dsg__head"><span class="mi" aria-hidden="true">palette</span><div><h2>Copy to Figma</h2><p>Bring these screens into Figma as editable layers: frames, auto layout, text, colours.</p></div></div>' +
    '<div class="dsg__acts">' +
      '<button type="button" class="dsg__btn dsg__btn--main" data-act="copy"><span class="mi" aria-hidden="true">content_copy</span><span>Copy this screen</span></button>' +
      '<button type="button" class="dsg__btn" data-act="copyall"><span class="mi" aria-hidden="true">dashboard</span><span>Copy all screens</span></button>' +
      '<p class="dsg__hint">Then click the Figma canvas and paste (⌘V). Auto layout, text, photos and icons; all screens also brings the components.</p>' +
    '</div>' +
    '<div class="dsg__bar" id="dsgBar" hidden role="progressbar" aria-label="Copy progress" aria-valuemin="0" aria-valuemax="100"><span></span></div>' +
    '<p class="dsg__note" id="dsgNote" aria-live="polite"></p><button type="button" class="dsg__btn dsg__now" id="dsgNow" hidden>Copy now</button>';
  top.parentNode.insertBefore(panel, top.nextSibling);

  function setOn(on) {
    btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', String(on)); panel.hidden = !on;
    try { if (on) sessionStorage.setItem(KEY, '1'); else sessionStorage.removeItem(KEY); } catch (e) {}
  }
  btn.addEventListener('click', function () { setOn(panel.hidden); });
  try { if (sessionStorage.getItem(KEY)) setOn(true); } catch (e) {}

  var note = document.getElementById('dsgNote'), now = document.getElementById('dsgNow'), busy = false;
  now.addEventListener('click', function () { if (pending && FB.copy(pending.html)) { pending = null; now.hidden = true; say('Copied. Click the Figma canvas and paste (⌘V).'); } });
  function say(t) { note.textContent = t; }
  var bar = document.getElementById('dsgBar'), fill = bar.firstElementChild;
  function progress(p) {   // 0–1 fills the bar; 'build' = the last stage, a moving stripe; null hides it
    bar.hidden = p == null; bar.classList.toggle('is-build', p === 'build');
    if (typeof p === 'number') { fill.style.width = Math.round(p * 100) + '%'; bar.setAttribute('aria-valuenow', Math.round(p * 100)); }
    else bar.removeAttribute('aria-valuenow');
  }
  function pageMeta(id) { var p = (S.pages || {})[id] || {}; return { id: id, title: p.title || id, name: (p.group ? p.group + ' / ' : '') + (p.title || id), group: p.group || 'Screens' }; }
  function currentId() { return (location.hash || '').replace('#', '') || S.startPage; }
  function settle(win, ms) {   // fonts loaded, images done (or 4 s), then a pause for intros
    var doc = win.document;
    var imgs = [].slice.call(doc.images).filter(function (i) { return !i.complete; }).map(function (i) { return new Promise(function (ok) { i.addEventListener('load', ok); i.addEventListener('error', ok); }); });
    return Promise.race([Promise.all([doc.fonts ? doc.fonts.ready : null].concat(imgs)), new Promise(function (ok) { setTimeout(ok, 4000); })])
      .then(function () { return new Promise(function (ok) { setTimeout(ok, ms); }); });
  }

  /* native Figma paste through Sebastian's engine (figma-bridge.js): frames, auto layout, components */
  var pending = null;   // a paste that finished after the click's permission ran out: the next click copies it
  function done(r, what) {
    var st = r.stats || {}, sum = what + ' (' + r.kb + ' KB' + (st.components ? ', ' + st.components + ' components' : '') + ').';
    if (FB.copy(r.html)) { pending = null; say(sum + ' Click the Figma canvas and paste (⌘V).'); return; }
    pending = r; say(sum + ' The browser needs one more click: press Copy now.'); now.hidden = false;
  }
  /* maps (dd-map-kamil): a light map pastes as full SVG; a detailed one asks first, once per copy */
  var mapMode = null;
  function mapChoice(win) {
    if (!win.DDMap || !win.DDMap.estimate) return Promise.resolve();
    if (mapMode) { FB.mapMode = mapMode; return Promise.resolve(); }
    return win.DDMap.estimate().then(function (e) {
      if (!e.heavy) { FB.mapMode = 'full'; return; }
      return new Promise(function (ok) {
        var box = document.createElement('div'); box.className = 'dsg__ask'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Map in Figma');
        var kb = function (n) { return n >= 1024 ? (Math.round(n / 102.4) / 10) + ' MB' : n + ' KB'; };
        box.innerHTML = '<p class="dsg__asktitle">Detailed map · how should it paste?</p>' +
          [['full', 'Full SVG', 'Every road, building and name, editable · ' + kb(e.fullKB) + ' · slow paste'],
           ['simple', 'Simple SVG', 'Water, parks, main roads and names, editable · ' + kb(e.simpleKB)],
           ['image', 'Image', 'One flat picture, not editable · quick paste']].map(function (o) {
            return '<button type="button" class="dsg__btn" data-map="' + o[0] + '"><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span></button>';
          }).join('');
        note.parentNode.insertBefore(box, note);
        say('');
        box.addEventListener('click', function (ev) {
          var b = ev.target.closest('[data-map]'); if (!b) return;
          mapMode = FB.mapMode = b.dataset.map; box.remove(); ok();
        });
      });
    }).catch(function () { FB.mapMode = 'full'; });
  }
  function trees(ids, onEach) {   // each page loaded off-screen at its real size, serialised, removed
    var out = [], i = 0; mapMode = null;
    function next() {
      if (i >= ids.length) return Promise.resolve(out);
      var id = ids[i++], p = S.pages[id], desk = !!p.url;
      if (onEach) onEach(i, ids.length, p.title || id);
      return loadOff(p.src, desk ? 1440 : 402, desk ? 900 : 874).then(function (f) {
        return settle(f.contentWindow, 1200).then(function () { return mapChoice(f.contentWindow); }).then(function () { return FB.tree(f.contentWindow, pageMeta(id)); })
          .then(function (t) { out.push({ id: id, t: t }); f.remove(); }, function (e) { f.remove(); console.warn('Designer mode: skipped ' + id, e); });
      }).then(next);
    }
    return next();
  }
  function copyScreen() {
    var id = currentId(); say('Copying ' + pageMeta(id).title + '…');
    return trees([id]).then(function (got) {
      if (!got.length) throw new Error('this screen could not be read');
      return FB.paste([{ name: pageMeta(id).group, screens: [got[0].t] }], false);
    }).then(function (r) { done(r, 'Copied ' + pageMeta(id).title); });
  }
  function copyAll() {   // every screen, one section per page group, components on their own page section
    var ids = Object.keys(S.pages || {});
    progress(0);
    return trees(ids, function (i, n, t) { progress((i - 1) / n); say('Reading ' + i + ' of ' + n + ': ' + t + '…'); }).then(function (got) {
      var groups = [], by = {};
      got.forEach(function (g) { var k = pageMeta(g.id).group; if (!by[k]) groups.push(by[k] = { name: k, screens: [] }); by[k].screens.push(g.t); });
      var cr = FB.creditsScreen && FB.creditsScreen(); if (cr) groups.push({ name: 'Credits', screens: [cr] });   // the makers travel into Figma too
      progress('build'); say('Building the Figma paste…');
      return FB.paste(groups, true).then(function (r) { done(r, 'Copied ' + got.length + ' screens with components'); });
    });
  }
  function loadOff(src, w, h) {   // one screen in a hidden frame of its real size
    return new Promise(function (ok) {
      var f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      f.style.cssText = 'position:fixed;left:0;top:0;width:' + w + 'px;height:' + h + 'px;border:0;opacity:0;pointer-events:none;z-index:-1';   // inside the window (invisible): off-screen frames are paused by Chrome and never "scroll into view"
      f.onload = function () { ok(f); };
      f.src = src; document.body.appendChild(f);
    });
  }
  panel.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || busy) return;
    now.hidden = true;
    var run = { copy: copyScreen, copyall: copyAll }[t.dataset.act]; if (!run) return;
    busy = true; panel.classList.add('is-busy');
    run().then(function () { progress(null); }, function (err) { progress(null); say('That did not work: ' + (err && err.message ? err.message : err)); })
      .then(function () { busy = false; panel.classList.remove('is-busy'); });
  });
})();
