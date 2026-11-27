/* iPhone Duo preview for the presenter shell (test add-on, based on Apple HIG "Designing for iPhone Duo").
   The status rail follows Apple's reference: Dynamic Island (a circle) at the top, the time, then one round status icon.
   A picker in the left card (tabs above the phone: iPhone | iPhone Duo; in the left card for Duo: Pose: Closed | Open; when open, Turn: Horizontal (default) | Vertical, and a Half-open tick)
   switches the phone frame between iPhone and four iPhone Duo poses, and tells the screen
   which one is showing by putting classes on the screen's <html>:
     duo + duo-side   controls move to a side rail (outer display, and inner display in landscape)
     duo-wide         inner display: room for one extra level (two columns, even grids)
     duo-half         partly folded: the fold in the middle is a reserved region content stays clear of
   Sizes follow the proportions in Apple's photos (open: about 1.41 : 1; corner radius about 8% of the height), not official numbers: replace them with the
   sizes in Apple Design Resources. Desktop (admin) pages ignore the picker. */
(function () {
  'use strict';
  var DEVICES = [
    { id: 'iphone',  label: 'iPhone',            w: 402, h: 874, cls: [] },
    { id: 'iphone-l', label: 'iPhone sideways',   w: 874, h: 402, cls: ['duo-wide', 'phone-land'], note: 'iPhone turned sideways: wider than tall, the Dynamic Island on the left, bars stay at the bottom' },
    { id: 'outer-l', label: 'Duo closed sideways', w: 650, h: 451, cls: ['duo', 'duo-side', 'duo-wide', 'duo-outer', 'duo-land'], note: 'Outer display turned sideways: wide enough for the medium (tablet) layouts' },
    { id: 'outer',   label: 'Duo closed',        w: 451, h: 650, cls: ['duo', 'duo-side', 'duo-outer'], note: 'Outer display: wider and shorter; controls on the side; camera in the corner' },
    { id: 'open-p',  label: 'Duo open',          w: 650, h: 920, cls: ['duo', 'duo-wide', 'duo-open-p'], note: 'Open, vertical: standard top and bottom bars, room for one extra level' },
    { id: 'open-l',  label: 'Duo open ⟷',        w: 920, h: 650, cls: ['duo', 'duo-side', 'duo-wide', 'duo-open-l'], note: 'Open, horizontal: controls move to the side rail' },
    { id: 'half',    label: 'Duo half-open',   w: 920, h: 650, cls: ['duo', 'duo-side', 'duo-wide', 'duo-half'], note: 'Half-open like a book: content stays clear of the fold' }
  ];
  /* HALF-OPEN is switched OFF for now (decided 2026-10-22: not needed yet). Everything for it is kept and works:
     the 'half' device, the fold band in css/shell/duo.css, the fold-aware layouts in css/shared/duo.css (html.duo-half) and the
     open/close animation. Set HALF_OPEN = true to bring back the Half-open tick in the bar. See the dd-iphone-duo-kamil skill, references/hig-study.md. */
  var HALF_OPEN = false;
  /* Which devices show: SHELL.devices (filled by the installers). With 'iphone' (dd-iphone-david) the iPhone | iPhone Duo tabs switch
     between them; without it the prototype is iPhone Duo only (no device tabs, it opens closed). Older projects without the setting
     keep the iPhone. */
  var DEVS = window.SHELL && SHELL.devices, HAS_IPHONE = !DEVS || DEVS.indexOf('iphone') > -1;
  if (!HAS_IPHONE) DEVICES = DEVICES.filter(function (d) { return d.id !== 'iphone' && d.id !== 'iphone-l'; });
  function isPhone(id) { return id === 'iphone' || id === 'iphone-l'; }
  var ROT = false;   // true while the fold plays turned 90 deg right: the sideways closed Duo opens upward into the open vertical Duo
  /* SHELL.duo.sideways: 'notice' (default) = a phone turned sideways (iPhone, closed Duo) shows a styled "turn it upright" screen,
     because the app is made for portrait; 'layout' = it shows the app's own wide layout. The open Duo always shows its layout. */
  /* It can also differ per device: SHELL.duo.sideways = { iphone: 'notice', closed: 'layout' }. */
  var SW = (window.SHELL && SHELL.duo && SHELL.duo.sideways) || 'notice';
  function sidewaysMode(id) { var v = typeof SW === 'string' ? SW : SW[id === 'iphone-l' ? 'iphone' : 'closed']; return v === 'layout' ? 'layout' : 'notice'; }
  function sidewaysPhone(id) { return id === 'iphone-l' || id === 'outer-l'; }
  var FOLD = 28, KEY = ((window.SHELL && SHELL.prefix) || 'proto') + '-device';
  var frame = document.getElementById('screen'), phone = document.getElementById('phone'), shellEl = document.querySelector('.shell');
  var left = document.querySelector('.side--left .side__actions'); if (!frame || !phone || !left) return;
  var cur = DEVICES.filter(function (d) { return d.id === (HAS_IPHONE ? 'iphone' : 'outer'); })[0] || DEVICES[0]; try { cur = DEVICES.filter(function (d) { return d.id === sessionStorage.getItem(KEY); })[0] || cur; } catch (e) {}
  var q = (location.search.match(/[?&]device=([\w-]+)/) || [])[1];   // ?device=outer|open-p|open-l|half: a link straight to one pose
  if (q) cur = DEVICES.filter(function (d) { return d.id === q; })[0] || cur;
  if (!HALF_OPEN && cur.id === 'half') cur = DEVICES.filter(function (d) { return d.id === 'open-l'; })[0];   // half-open is off: show open horizontal instead

  // the picker: one line per decision. Device, then (Duo only) Pose, then (open only) Landscape and Half-folded.
  // Half-folded is a variation of open in landscape (the book pose), so turning it on turns Landscape on too.
  // One bar above the phone frame: Device, then (Duo) Closed | Open, then (open) Horizontal | Vertical and Half-open.
  var stage = document.getElementById('stage'), TABS_H = 56, GAP = 16;
  var tabs = document.createElement('div'); tabs.className = 'duo-tabs';
  if (HAS_IPHONE) tabs.innerHTML = '<div class="duo-pick__seg" role="radiogroup" aria-label="Device"><button type="button" role="radio" data-k="dev" data-v="iphone">iPhone</button><button type="button" role="radio" data-k="dev" data-v="duo">iPhone Duo</button></div>';
  else tabs.classList.add('is-duo-only');
  // rotate: one icon button beside the device tabs, for the iPhone and the open Duo (a closed Duo is not turned)
  var rot = document.createElement('button'); rot.type = 'button'; rot.className = 'duo-rot'; rot.setAttribute('aria-label', 'Rotate phone'); rot.title = 'Rotate phone';
  rot.innerHTML = '<span class="mi" aria-hidden="true">screen_rotation</span>';   // Google Material Symbols, like the rest of the shell
  tabs.appendChild(rot);
  // Closed / Open sits under the phone frame (only for the iPhone Duo)
  var bottom = document.createElement('div'); bottom.className = 'duo-tabs duo-bottom';
  var box = document.createElement('div'); box.className = 'duo-pick duo-bar';
  box.innerHTML =
    '<div class="duo-pick__seg" data-show="duo" role="radiogroup" aria-label="Pose"><button type="button" role="radio" data-k="pose" data-v="closed">Closed</button><button type="button" role="radio" data-k="pose" data-v="open">Open</button></div>' +
    (HALF_OPEN ? '<label class="duo-half" data-show="open"><input type="checkbox" data-k="half"> Half-open</label>' : '<input type="checkbox" data-k="half" hidden>') +
    '<span id="duoNote" hidden></span>';
  bottom.appendChild(box);
  if (stage) { stage.insertBefore(tabs, stage.firstChild); stage.appendChild(bottom); }
  var BOTTOM_H = 56;
  /* Sizing: the phone is scaled by the window HEIGHT only (never squeezed to fit the width), so a wide open Duo pushes the page list
     and the summary / dev card outward. When the window is not wide enough for all three, those cards become slide-in drawers
     behind the edge tabs (the presenter's side-card drawers, js/shell/drawers.js). */
  var baseFit = window.Shell && Shell.fit, tabNav = document.getElementById('tabNav'), tabSum = document.getElementById('tabSum'), drawerBg = document.getElementById('drawerBg');
  /* Side cards ride along with the frame: the page list sits CARD_GAP px left of the frame and the summary / dev card CARD_GAP px
     right of it, so a wider frame (Duo opening) pushes them outward, and they glide off-screen when there is no room. Off-screen
     cards come back as slide-in drawers behind the edge tabs. During the fold animation they move with the same timing. */
  var CARD_GAP = 40, sideL = document.querySelector('.side--left'), sideR = document.querySelector('.side--right'), lastPlace = '', placeTimer = 0, forceW = null;
  function drop() { for (var i = 0; i < arguments.length; i++) if (shellEl.classList.contains(arguments[i])) shellEl.classList.remove(arguments[i]); }   // only touch the class list when something changes: the shell watches it
  function placeCards(visW, phoneTopPx) {
    if (!sideL || !sideR) return;
    var sideW = sideL.offsetWidth || 420, cx = innerWidth / 2, top = 20 + phoneTopPx;
    var L = cx - visW / 2 - CARD_GAP - sideW, Rx = cx + visW / 2 + CARD_GAP;
    var leftFits = L >= 12, rightFits = Rx + sideW <= innerWidth - 12, moving = shellEl.classList.contains('is-sizing');
    if (leftFits) drop('nav-open'); if (rightFits) drop('sum-open');
    var navOpen = shellEl.classList.contains('nav-open'), sumOpen = shellEl.classList.contains('sum-open');
    if (!leftFits && !moving) L = navOpen ? 0 : -sideW - 60;              // at rest: fully off-screen, or slid in as a drawer (while resizing they ride along)
    if (!rightFits && !moving) Rx = sumOpen ? innerWidth - sideW : innerWidth + 60;
    sideL.style.left = L + 'px'; sideR.style.left = Rx + 'px';
    sideL.style.top = (navOpen ? 0 : top) + 'px'; sideR.style.top = (sumOpen ? 0 : top) + 'px';
    sideL.classList.toggle('is-drawer', navOpen); sideR.classList.toggle('is-drawer', sumOpen);
    if (tabNav && tabNav.hidden !== leftFits) tabNav.hidden = leftFits;
    if (tabSum && tabSum.hidden !== rightFits) tabSum.hidden = rightFits;
    if (drawerBg && !navOpen && !sumOpen && !drawerBg.hidden) drawerBg.hidden = true;
    var key = [L, Rx, top, navOpen, sumOpen].join();
    if (key !== lastPlace) { lastPlace = key; if (!placeTimer) placeTimer = setTimeout(function () { placeTimer = 0; window.dispatchEvent(new Event('resize')); }, 1300); }   // things placed beside the cards (Credits) follow, once things settle
  }
  function fit() {
    if (baseFit) baseFit();
    if (!stage || !shellEl) return;
    if (fullWindow()) {
      stage.style.paddingTop = ''; drop('duo-cards');
      [sideL, sideR].forEach(function (x) { if (x) { x.style.left = x.style.top = ''; x.classList.remove('is-drawer'); } });
      return;
    }
    if (!shellEl.classList.contains('duo-cards')) shellEl.classList.add('duo-cards');
    // one scale for every iPhone Duo pose, set by the tallest one (vertical), so opening, closing and rotating never change its size
    var DUO_TALL = Math.max.apply(null, DEVICES.filter(function (d) { return !isPhone(d.id); }).map(function (d) { return d.h; })) + 18;
    var basisH = isPhone(cur.id) ? 874 + 21 : DUO_TALL;   // the iPhone keeps its upright scale when turned sideways
    var visW = ROT ? phone.offsetHeight : phone.offsetWidth, visH = ROT ? phone.offsetWidth : phone.offsetHeight;   // on-screen size (swapped while the fold plays turned)
    var s = Math.max(0.3, Math.min(1, (innerHeight - 40 - 32 - TABS_H - BOTTOM_H) / basisH, (innerWidth - 40 - 96) / visW));   // by height; width only if the phone alone is wider than the window
    phone.style.transform = 'scale(' + s + ')'; stage.style.width = Math.round(visW * s) + 'px'; stage.style.paddingTop = TABS_H + 'px'; stage.style.paddingBottom = BOTTOM_H + 'px';
    shellEl.style.setProperty('--phone-top', Math.max(0, TABS_H + (innerHeight - 40 - TABS_H - BOTTOM_H - visH * s) / 2) + 'px');
    var sr = stage.getBoundingClientRect(), phoneTop = (sr.height + TABS_H - BOTTOM_H - visH * s) / 2;   // the phone is centred in the room below the bar
    tabs.style.top = Math.max(8, phoneTop - tabs.offsetHeight - GAP) + 'px';                              // the bar always sits GAP px above the frame
    bottom.style.top = (phoneTop + visH * s + GAP) + 'px';
    if (!bottom.classList.contains('is-placed')) setTimeout(function () { bottom.classList.add('is-placed'); tabs.classList.add('is-placed'); }, 60);   // placed without sliding on load; it slides only when the phone changes                                 // and Closed / Open GAP px below it
    thumbs();
    placeCards((forceW || visW) * s, phoneTop);
  }
  if (window.Shell) Shell.fit = fit;
  window.addEventListener('resize', fit);
  function idFrom(st) { return st.dev === 'iphone' ? (st.orient === 'h' ? 'iphone-l' : 'iphone') : st.pose === 'closed' ? (st.orient === 'h' ? 'outer-l' : 'outer') : st.half ? 'half' : st.orient === 'v' ? 'open-p' : 'open-l'; }
  function stateOf(id) { return { dev: isPhone(id) ? 'iphone' : 'duo', pose: id === 'outer' || id === 'outer-l' || isPhone(id) ? 'closed' : 'open', orient: id === 'open-p' || id === 'iphone' || id === 'outer' ? 'v' : 'h', half: id === 'half' }; }   // opening defaults to Horizontal
  var st = stateOf(cur.id);
  // extras drawn on the frame: corner camera (outer) and the fold (inner)
  var scr = phone.querySelector('.phone__screen');
  var cam = document.createElement('span'); cam.className = 'duo-cam'; cam.setAttribute('aria-hidden', 'true'); scr.appendChild(cam);
  var fold = document.createElement('span'); fold.className = 'duo-fold'; fold.setAttribute('aria-hidden', 'true'); scr.appendChild(fold);
  // the frame parts (status bar with its icons, Dynamic Island, home indicator) and the status bar's colour come from js/shell/phone-frame.js,
  // which must load before this file
  if (!phone.querySelector('.statusbar')) console.warn('iPhone Duo: js/shell/phone-frame.js is not loaded before js/shell/duo.js; run install_duo.py again');
  // the status rail's round status icon (Apple's reference: Wi-Fi inside a dotted ring), shown instead of the iPhone's icon row in side layouts
  var sb = phone.querySelector('.statusbar');
  if (sb) { var ring = document.createElement('span'); ring.className = 'duo-ring'; ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<svg viewBox="0 0 32 32" width="30" height="30"><path d="M 4.81 23.55 A 13.5 13.5 0 1 1 27.19 23.55" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="23.55" cy="27.19" r="1.2" fill="currentColor"/><circle cx="19.95" cy="28.91" r="1.2" fill="currentColor"/><circle cx="16.00" cy="29.50" r="1.2" fill="currentColor"/><circle cx="12.05" cy="28.91" r="1.2" fill="currentColor"/><circle cx="8.45" cy="27.19" r="1.2" fill="currentColor"/><path d="M 11.1 14.9 A 7 7 0 0 1 20.9 14.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M 13.3 17.2 A 3.9 3.9 0 0 1 18.7 17.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="16" cy="19.8" r="1.4" fill="currentColor"/></svg>';   // solid ring open at the bottom, five dots in the gap, Wi-Fi in the middle (as in Apple's picture)
    sb.appendChild(ring); }

  var upright = document.createElement('div'); upright.className = 'duo-upright'; upright.hidden = true;
  upright.innerHTML = '<span class="mi" aria-hidden="true">screen_rotation</span><b>Turn your phone upright</b><p>' + ((window.SHELL && SHELL.name) || 'This app') + ' is designed for portrait use.</p>';
  scr.appendChild(upright);
  var screenAs = null;   // a device whose layout the page uses instead of cur's (only while a turned fold plays)
  function applyToScreen() {
    var d; try { d = frame.contentDocument; } catch (e) { return; } if (!d || !d.documentElement) return;
    var h = d.documentElement; if (h.classList.contains('in-desktop')) return;   // admin pages: full-window desktop, no device
    DEVICES.forEach(function (x) { x.cls.forEach(function (c) { h.classList.remove(c); }); });
    if (fullWindow()) return;
    (screenAs || cur).cls.forEach(function (c) { h.classList.add(c); });   // during a turned fold the page is laid out as the pose it is becoming
    h.style.setProperty('--duo-fold', FOLD + 'px');
    try { var w = d.defaultView; w.requestAnimationFrame(function () { w.dispatchEvent(new Event('resize')); }); } catch (e) {}   // let measured parts (segmented control thumb) re-measure
  }
  function fullWindow() { return shellEl && shellEl.classList.contains('is-fullwindow'); }
  /* ---------- the fold animation (studied from Apple's iPhone Duo opening clip) ----------
     Opening: the closed phone is the right half of the open one. Its front half swings left around the hinge like a book cover:
     edge-on halfway, then it lands flat as the left half of the inner display. The device drifts left while it widens, so the open
     phone ends centred. About 1.2 s, slow at both ends. Closing plays it backwards. Skipped when the viewer prefers reduced motion. */
  var DUR = 1200, EASE = 'cubic-bezier(.45, 0, .2, 1)', busy = false;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CLOSED = DEVICES.filter(function (d) { return d.id === 'outer'; })[0];   // the closed frame is exactly half of the open one: (920 + 18) / 2 = 469 px outside = 451 + 18
  /* Continuity: the swinging front half shows the screen the user is on, in its closed layout. It is a frozen copy of the
     current page (same DOM, styles and scroll; scripts left out), so opening goes from exactly what was on the closed display. */
  function snapshot(closedLayout, cb) {
    var d; try { d = frame.contentDocument; } catch (e) { cb(null); return; }
    if (!d || !d.documentElement) { cb(null); return; }
    var clone = d.documentElement.cloneNode(true);
    [].forEach.call(clone.querySelectorAll('script'), function (x) { x.remove(); });
    if (closedLayout) { clone.classList.remove('duo-wide', 'duo-open-l', 'duo-open-p', 'duo-half'); clone.classList.add('duo', 'duo-side', 'duo-outer'); }
    var head = clone.querySelector('head'); if (head) { var b = d.createElement('base'); b.href = d.baseURI; head.insertBefore(b, head.firstChild); }
    var f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:absolute;left:0;top:0;border:0;width:' + CLOSED.w + 'px;height:' + CLOSED.h + 'px;transform-origin:0 0;pointer-events:none;background:#fff';
    var sy = d.scrollingElement ? d.scrollingElement.scrollTop : 0, done = false;
    function ready() { if (done) return; done = true; try { f.contentDocument.scrollingElement.scrollTop = sy; } catch (e) {} cb(f); }
    f.onload = function () { setTimeout(ready, 30); }; setTimeout(ready, 700);   // never wait long
    f.srcdoc = '<!doctype html>' + clone.outerHTML;
    var park = document.createElement('div'); park.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + CLOSED.w + 'px;height:' + CLOSED.h + 'px;overflow:hidden';
    park.appendChild(f); document.body.appendChild(park); f._park = park;
  }
  /* The fold animation (studied from Apple's iPhone Duo opening clip). Opening: the closed phone is the right half of the open one;
     its front half swings left around the hinge like a book cover, edge-on halfway, and the open screen is revealed as it lands.
     The device drifts left while it widens, so the open phone ends centred. About 1.2 s, slow at both ends. Closing plays it backwards.
     The cover uses the frame's own bezel and corner radius (closed: square hinge corners, the same round corners as the open frame). */
  /* Live resize: the real screen width follows the fold every frame, so the page reflows like a responsive window being dragged wider.
     Until the half is edge-on the screen is the closed width (the right half); after that it grows by exactly as much as the landing
     half covers, drawn in the same perspective. The cover and its mask stay on the hinge; the frame stays centred and the cards follow. */
  function bez(x1, y1, x2, y2) { return function (t) { var u = t; for (var i = 0; i < 8; i++) { var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t, dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2); if (Math.abs(dx) < 1e-6) break; u = Math.max(0, Math.min(1, u - x / dx)); } return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u; }; }
  var ease = bez(.45, 0, .2, 1), OPEN = DEVICES.filter(function (d) { return d.id === 'open-l'; })[0];
  function sizing(on) { if (shellEl.classList.contains('is-sizing') !== on) { shellEl.classList.toggle('is-sizing', on); if (!on) requestAnimationFrame(fit); } }   // when the motion ends, cards that no longer fit tuck away (with their normal glide)   // cards and bar follow every frame: no CSS transitions while sizing
  function setW(w, h) { var r = document.documentElement.style; r.setProperty('--phone-w', w.toFixed(1) + 'px'); if (h) r.setProperty('--phone-h', h.toFixed(1) + 'px'); fit(); }
  // the phone's box as drawn upright (while the fold plays turned, getBoundingClientRect gives the turned box)
  function uprightBox() {
    var r = phone.getBoundingClientRect(); if (!ROT) return r;
    var sc = parseFloat((/scale\(([\d.]+)/.exec(phone.style.transform) || [0, 1])[1]), w = phone.offsetWidth * sc, h = phone.offsetHeight * sc, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2, width: w, height: h, cx: cx, cy: cy };
  }
  function turn(el, x0, y0, b) { if (!ROT) { el.style.rotate = ''; return; } el.style.transformOrigin = (b.cx - x0) + 'px ' + (b.cy - y0) + 'px'; el.style.rotate = '90deg'; }
  function foldAnim(opening, snap, done, stillAt) {
    if (reduced && stillAt == null) { done(); return; }
    sizing(true);
    setW(CLOSED.w);
    var r0 = uprightBox(), k = r0.width / phone.offsetWidth, halfS = (CLOSED.w + 18) * k, H = r0.height, P = halfS * 8;
    var bez9 = 9 * k, R = 60 * k, Ri = 52 * k, hinge = 12 * k, hingeI = 6 * k;
    var layer = document.createElement('div'); layer.className = 'duo-fold-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;perspective:' + P + 'px';
    var cover = document.createElement('div'); cover.className = 'duo-cover';
    cover.style.cssText = 'position:absolute;width:' + halfS + 'px;height:' + H + 'px;transform-origin:left center;transform-style:preserve-3d';
    // FRONT: the frozen closed screen in the phone's own bezel, with a titanium rim
    var face = document.createElement('div'); face.className = 'duo-cover__front';
    // FRONT: a see-through panel: the bezel ring and titanium rim are drawn, the screen area shows the LIVE phone underneath
    // (no screenshot), so opening starts and closing ends on exactly what is on screen: status bar, camera and content never pop
    face.style.cssText = 'position:absolute;inset:0;padding:' + bez9 + 'px;border-radius:' + hinge + 'px ' + R + 'px ' + R + 'px ' + hinge + 'px;background:transparent;' +
      'box-shadow:inset 0 0 0 ' + (2.5 * k) + 'px #c3c4c9, inset 0 0 0 ' + (3.5 * k) + 'px #6c6d72, inset 0 0 0 ' + (bez9 + 1.5 * k) + 'px #000;backface-visibility:hidden;-webkit-backface-visibility:hidden';
    var scr = document.createElement('div');
    scr.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;border-radius:' + hingeI + 'px ' + Ri + 'px ' + Ri + 'px ' + hingeI + 'px;background:transparent';
    // progressive blur from the right + black gradient, growing as the half turns away (the frozen content itself never moves)
    var veil = document.createElement('div');
    veil.style.cssText = 'position:absolute;inset:0;opacity:0;-webkit-backdrop-filter:blur(' + (6 * k) + 'px);backdrop-filter:blur(' + (6 * k) + 'px);' +
      '-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 65%);mask-image:linear-gradient(90deg,transparent 0%,#000 65%);background:linear-gradient(90deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.45) 55%,rgba(0,0,0,.9) 100%)';
    var sheen = document.createElement('div');
    sheen.style.cssText = 'position:absolute;inset:0;opacity:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.12) 45%,transparent 60%);background-size:250% 100%;background-position:100% 0';
    // the outer display's camera sits on this half: draw it here so it turns with the half and never pops in or out
    // (same place and size as on the closed frame: 36 px; offsets include the frame's 1.5 px outer edge, which the cover does not have)
    var cam = document.createElement('span');
    cam.style.cssText = 'position:absolute;z-index:3;top:' + (16.5 * k) + 'px;right:' + (16.5 * k) + 'px;width:' + (36 * k) + 'px;height:' + (36 * k) + 'px;border-radius:50%;background:#000';
    scr.appendChild(veil); scr.appendChild(sheen); scr.appendChild(cam); face.appendChild(scr); cover.appendChild(face);
    // BACK (after 90°): a blur + dark mask over the live, growing screen underneath
    var back = document.createElement('div');
    back.style.cssText = 'position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;opacity:0;' +
      'border-radius:' + R + 'px ' + hinge + 'px ' + hinge + 'px ' + R + 'px;-webkit-backdrop-filter:blur(' + (12 * k) + 'px);backdrop-filter:blur(' + (12 * k) + 'px);' +
      'background:linear-gradient(90deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.55) 70%,rgba(0,0,0,.85) 100%)';
    cover.appendChild(back);
    // SLAB: titanium sides along the top, bottom and free edge, so the half has thickness while it turns
    var T = 11 * k, TI = 'linear-gradient(90deg,#55565b,#e4e5e8 30%,#a9aaaf 55%,#d2d3d7 75%,#5c5d62)';
    function side(css) { var el = document.createElement('div'); el.style.cssText = 'position:absolute;background:' + TI + ';' + css; cover.appendChild(el); }
    side('left:' + hinge + 'px;width:' + (halfS - hinge - R) + 'px;top:0;height:' + T + 'px;transform-origin:top center;transform:rotateX(-90deg);background:' + TI.replace('90deg', '0deg'));
    side('left:' + hinge + 'px;width:' + (halfS - hinge - R) + 'px;bottom:0;height:' + T + 'px;transform-origin:bottom center;transform:rotateX(90deg);background:' + TI.replace('90deg', '180deg'));
    side('left:100%;width:' + T + 'px;top:' + R + 'px;bottom:' + R + 'px;transform-origin:left center;transform:rotateY(90deg)');
    var shade = document.createElement('div');
    shade.style.cssText = 'position:absolute;opacity:0;border-radius:0 ' + R + 'px ' + R + 'px 0;background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,0) 70%)';
    layer.appendChild(shade); layer.appendChild(cover); document.body.appendChild(layer);
    // BLUR: browsers drop backdrop blur on a panel that is rotating in 3D, so the blur is drawn by two flat layers on the page,
    // matched every frame to where the swinging half appears: blurA over the half turning away (stronger toward its far edge),
    // blurB over the landing half (it clears as the half lies flat). The dark gradients stay on the half itself.
    function blurLayer(dir) { var el = document.createElement('div'); el.className = 'duo-fold-blur';
      el.style.cssText = 'position:fixed;pointer-events:none;z-index:49;opacity:0;-webkit-mask-image:linear-gradient(' + dir + ',rgba(0,0,0,.35) 0%,#000 45%);mask-image:linear-gradient(' + dir + ',rgba(0,0,0,.35) 0%,#000 45%)';   // blur reaches full strength sooner and never fully clears near the hinge
      document.body.appendChild(el); return el; }
    var blurA = blurLayer('90deg'), blurB = blurLayer('270deg'), BLUR = 28 * k;   // peak blur (was 14)
    function setBlur(el, x0, x1, top, h, px, radius) {
      if (px < .3 || x1 - x0 < 1) { el.style.opacity = 0; return; }
      el.style.left = x0 + 'px'; el.style.width = (x1 - x0) + 'px'; el.style.top = top + 'px'; el.style.height = h + 'px'; el.style.opacity = 1;
      if (ROT && el._b) turn(el, x0, top, el._b);
      el.style.borderRadius = radius || '0';   // the blur follows the frame's corners (no square corners outside the phone)
      el.style.webkitBackdropFilter = el.style.backdropFilter = 'blur(' + px.toFixed(1) + 'px)';
    }
    var sbar = phone.querySelector('.statusbar'), SB_CLOSED = 72, SB_OPEN = 20;   // status bar top on the rail: below the camera when closed, at the top when open
    var pscr = phone.querySelector('.phone__screen'), RAIL_CLOSED = 144, RAIL_OPEN = 92;   // where the rail's buttons start (below the status bar)
    function screenHtml() { try { return frame.contentDocument.documentElement; } catch (e) { return null; } }
    function frameAt(p) {
      var a = 180 * p, rad = a * Math.PI / 180, w = CLOSED.w;
      if (sbar) sbar.style.top = (SB_CLOSED + (SB_OPEN - SB_CLOSED) * p).toFixed(1) + 'px';
      var sh = screenHtml(); if (sh) sh.style.setProperty('--rail-top', (RAIL_CLOSED + (RAIL_OPEN - RAIL_CLOSED) * p).toFixed(1) + 'px');   // the whole rail slides with it
      // the phone's own corners follow the fold: hinge-side corners almost square while closed (like the swinging half), round once open
      var hc = a <= 90 ? 12 : 12 + 48 * (a - 90) / 90, hs = a <= 90 ? 6 : 6 + 46 * (a - 90) / 90;
      phone.style.borderRadius = hc + 'px 60px 60px ' + hc + 'px'; if (pscr) pscr.style.borderRadius = hs + 'px 52px 52px ' + hs + 'px';
      fold.style.opacity = a < 150 ? 0 : ((a - 150) / 30).toFixed(3);   // the fold line belongs to the open screen: it only fades in as the phone reaches fully open
      if (a > 90) { var f = P / (P - halfS * Math.sin(rad)), landing = halfS * -Math.cos(rad) * f; w = Math.max(CLOSED.w, Math.min(OPEN.w, (halfS + landing) / k - 18)); }
      setW(w);                                                              // the real screen grows: the page reflows live
      var r = uprightBox(), hx = a <= 90 ? r.left : r.right - halfS;
      if (ROT) { turn(layer, 0, 0, r); blurA._b = blurB._b = r; }
      layer.style.perspectiveOrigin = hx + 'px ' + (r.top + r.height / 2) + 'px';
      layer.style.clipPath = a > 90 ? 'inset(' + r.top + 'px 0px ' + (innerHeight - r.bottom) + 'px 0px)' : 'none';   // past 90°, nothing shows above or below the frame
      cover.style.left = hx + 'px'; cover.style.top = r.top + 'px'; cover.style.transform = 'rotateY(' + (-a) + 'deg)';
      veil.style.opacity = Math.min(1, a / 90);
      sheen.style.opacity = a <= 90 ? Math.sin(rad) : 0; sheen.style.backgroundPosition = (100 - Math.min(1, a / 90) * 100) + '% 0';
      back.style.opacity = a < 90 ? 1 : 1 - (a - 90) / 90;
      shade.style.left = r.left + 'px'; shade.style.top = r.top + 'px'; shade.style.width = Math.min(r.width, halfS) + 'px'; shade.style.height = r.height + 'px';
      shade.style.opacity = a <= 90 ? Math.sin(rad) * .9 : 0;
      // where the swinging half appears on screen: from the hinge to its free edge, in the same perspective as the cover
      var fz = P / (P - halfS * Math.sin(rad)), xFree = hx + halfS * Math.cos(rad) * fz;
      var rOut = (60 * k) + 'px', rHinge = (hc * k) + 'px';
      if (a <= 90) { setBlur(blurA, hx, xFree, r.top, r.height, BLUR * Math.sin(rad), rHinge + ' ' + rOut + ' ' + rOut + ' ' + rHinge); setBlur(blurB, 0, 0, 0, 0, 0); }
      else { setBlur(blurA, 0, 0, 0, 0, 0); setBlur(blurB, Math.max(r.left, xFree), hx, r.top, r.height, BLUR * (1 - (a - 90) / 90), rHinge + ' 0 0 ' + rHinge); }
    }
    if (stillAt != null) { frameAt(ease(stillAt)); return layer; }   // (Duo.still leaves its blur layers in place for checking)   // checking only: one moment, e.g. Duo.still(0.6)
    frameAt(opening ? 0 : 1);
    var t0 = null;
    function tick(now) {
      if (t0 == null) t0 = now;
      var t = Math.min(1, (now - t0) / DUR), p = ease(t);
      frameAt(opening ? p : 1 - p);
      if (t < 1) { requestAnimationFrame(tick); return; }
      layer.remove(); blurA.remove(); blurB.remove(); fold.style.opacity = ''; if (sbar) sbar.style.top = ''; phone.style.borderRadius = ''; if (pscr) pscr.style.borderRadius = ''; var sh = screenHtml(); if (sh) sh.style.removeProperty('--rail-top'); done(); sizing(false); busy = false;
    }
    requestAnimationFrame(tick);
  }
  /* Duo to Duo without a fold (horizontal / vertical, vertical to closed): width and height animate together, the page reflows live */
  function sizeAnim(w0, h0, w1, h1, ms) {
    if (reduced) return;
    sizing(true); busy = true; var t0 = null, e2 = bez(.22, 1, .36, 1);
    setW(w0, h0);
    requestAnimationFrame(function tick(now) {
      if (t0 == null) t0 = now;
      var t = Math.min(1, (now - t0) / ms), q = e2(t);
      setW(w0 + (w1 - w0) * q, h0 + (h1 - h0) * q);
      if (t < 1) requestAnimationFrame(tick); else { sizing(false); busy = false; }
    });
  }
  function gone(el, off) { if (el.classList.contains('is-gone') !== off) el.classList.toggle('is-gone', off); el.setAttribute('aria-hidden', off ? 'true' : 'false'); [].forEach.call(el.querySelectorAll('button, input'), function (b) { b.tabIndex = off ? -1 : 0; }); }
  function thumbs() {   // one sliding highlight per group, under the chosen option
    [].forEach.call(document.querySelectorAll('.duo-tabs .duo-pick__seg'), function (seg) {
      var th = seg.querySelector('.seg-thumb'); if (!th) { th = document.createElement('span'); th.className = 'seg-thumb'; th.setAttribute('aria-hidden', 'true'); seg.insertBefore(th, seg.firstChild); }
      var on = seg.querySelector('button.is-on'); if (!on) { th.style.opacity = 0; return; }
      th.style.opacity = 1; th.style.left = on.offsetLeft + 'px'; th.style.width = on.offsetWidth + 'px';
    });
  }
  function folding(on) { shellEl.classList.toggle('is-folding', on); }
  function set(id) {
    if (busy) return;
    if (!reduced && ((cur.id === 'outer-l' && id === 'open-p') || (cur.id === 'open-p' && id === 'outer-l'))) { turnedFold(id); return; }
    var prev = cur, opens = prev.id === 'outer' && (id === 'open-l' || id === 'half'), closes = (prev.id === 'open-l' || prev.id === 'half') && id === 'outer';
    if ((opens || closes) && !reduced) {
      busy = true; sizing(true);                                        // cards and bar follow the frame from the very first frame
      if (opens) { apply(id); foldAnim(true, null, function () { apply(id); }); }
      else foldAnim(false, null, function () { apply(id); });
      return;
    }
    // turning: a quarter turn to the right (clockwise) to go sideways - iPhone, closed Duo, open Duo to vertical - and back to the left
    // to undo it; the open phone is turned (clockwise to vertical, back again), then the page
    // re-lays itself out upright for the new shape, like a real phone rotating
    var turns = (prev.id === 'open-l' && id === 'open-p') || (prev.id === 'open-p' && id === 'open-l') || (prev.id === 'iphone' && id === 'iphone-l') || (prev.id === 'iphone-l' && id === 'iphone') || (prev.id === 'outer' && id === 'outer-l') || (prev.id === 'outer-l' && id === 'outer');
    if (turns && !reduced && phone.animate) { rotateTo(id, id === 'iphone-l' || id === 'outer-l' || id === 'open-p' ? 90 : -90); return; }
    var sameFamily = !isPhone(prev.id) && !isPhone(id) && prev.id !== id;   // Duo to Duo: the screen resizes live; to or from the iPhone: a short fade
    if (prev.id !== id && !sameFamily && !reduced && phone.animate) phone.animate([{ opacity: 0, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 260, easing: 'ease-out' });
    apply(id);
    if (sameFamily) { var nx = cur; sizeAnim(prev.w, prev.h, nx.w, nx.h, 450); }
  }
  /* The sideways closed Duo (hinge on top) opens upward into the open vertical Duo, and closes back down into it: the same fold
     as the upright phone, played in a frame turned 90 deg right. The app stays upright on the screen the whole time and grows
     (or shrinks) with it, like the real screen re-laying out as it unfolds. */
  function turnedFold(id) {
    busy = true; ROT = true; phone.classList.add('is-turned-fold');
    var opening = id === 'open-p';
    phone.style.rotate = '90deg';
    sizing(true);
    apply('open-l');                                          // the upright open pose, drawn turned (opening grows into it, closing starts from it)
    // the screen keeps the app upright while the phone turns: the page is counter-turned inside the frame (CSS .is-turned-fold)
    // and laid out as the open vertical Duo it is becoming, so it grows taller as the phone opens instead of showing sideways
    screenAs = DEVICES.filter(function (d) { return d.id === 'open-p'; })[0]; applyToScreen();
    foldAnim(opening, null, function () {
      ROT = false; screenAs = null; phone.style.rotate = ''; phone.classList.remove('is-turned-fold');
      apply(id);                                               // the turned pose it lands on, upright, with its own layout
    });
  }
  function rotateTo(id, deg) {
    busy = true;
    var scr = phone.querySelector('.phone__screen'), T = 600;
    var spin = phone.animate([{ rotate: '0deg' }, { rotate: deg + 'deg' }], { duration: T, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'forwards' });
    scr.animate([{ opacity: 1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: T, fill: 'forwards' });   // the sideways content fades just before it lands
    spin.onfinish = function () {
      sizing(true); apply(id);                                            // the new, upright, responsive layout in the turned frame
      spin.cancel(); scr.getAnimations().forEach(function (x) { x.cancel(); });
      scr.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      requestAnimationFrame(function () { sizing(false); busy = false; });
    };
  }
  function apply(id) {
    cur = DEVICES.filter(function (d) { return d.id === id; })[0] || DEVICES[0];
    try { sessionStorage.setItem(KEY, cur.id); } catch (e) {}
    st = stateOf(cur.id);
    [].forEach.call(document.querySelectorAll('.duo-pick button[data-k], .duo-tabs button[data-k]'), function (b) { var on = st[b.getAttribute('data-k')] === b.getAttribute('data-v'); b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    box.querySelector('[data-k="half"]').checked = st.half;
    // groups slide in and out (width + fade) instead of popping; the highlight slides to the chosen option
    [].forEach.call(box.querySelectorAll('[data-show="duo"]'), function (r) { gone(r, st.dev !== 'duo'); }); gone(box, fullWindow() || st.dev !== 'duo'); tabs.hidden = fullWindow(); bottom.classList.toggle('is-off', fullWindow() || st.dev !== 'duo');
    var canTurn = true; rot.disabled = !canTurn; rot.title = canTurn ? (st.orient === 'h' ? 'Rotate phone upright' : 'Rotate phone sideways') : 'Open the iPhone Duo to rotate it'; rot.classList.toggle('is-side', st.orient === 'h' && canTurn); rot.hidden = fullWindow();
    [].forEach.call(box.querySelectorAll('[data-show="open"]'), function (r) { gone(r, !(st.dev === 'duo' && st.pose === 'open')); });
    thumbs();
    document.getElementById('duoNote').textContent = cur.note || ''; tabs.title = cur.note || '';
    var r = document.documentElement.style; r.setProperty('--phone-w', cur.w + 'px'); r.setProperty('--phone-h', cur.h + 'px');
    phone.classList.toggle('is-duo', !isPhone(cur.id)); phone.classList.toggle('is-duo-side', cur.cls.indexOf('duo-side') >= 0);
    phone.setAttribute('data-duo', cur.id);
    upright.hidden = !((sidewaysPhone(cur.id) && sidewaysMode(cur.id) === 'notice') || upright.classList.contains('is-blank'));   // the notice, or the plain fill while a turned fold plays
    applyToScreen();
    fit();
  }
  function onPick(e) {
    var b = e.target.closest('button[data-k]'); if (!b) return;
    var n = { dev: st.dev, pose: st.pose, orient: st.orient, half: st.half }; n[b.getAttribute('data-k')] = b.getAttribute('data-v');
    if (n.dev === 'duo' && st.dev === 'iphone') n.pose = 'closed';
    if (n.dev !== st.dev) n.orient = 'v';                                                    // a device starts upright
    if (b.getAttribute('data-k') === 'pose' && n.pose === 'closed' && st.pose !== 'closed') n.orient = st.orient === 'v' ? 'h' : 'v';   // closing too: open horizontal closes upright, open vertical closes sideways
    if (b.getAttribute('data-k') === 'pose' && n.pose === 'open' && st.pose !== 'open') { n.orient = st.orient === 'h' ? 'v' : 'h'; n.half = false; }   // opening keeps the hinge where it is: upright closed opens horizontal, sideways closed opens vertical
    if (b.getAttribute('data-k') === 'orient' && n.orient === 'v') n.half = false;           // half-open is the horizontal book pose
    set(idFrom(n));
  }
  box.addEventListener('click', onPick); tabs.addEventListener('click', onPick);
  rot.addEventListener('click', function (e) { e.stopPropagation(); if (rot.disabled) return; set(idFrom({ dev: st.dev, pose: st.pose, orient: st.orient === 'h' ? 'v' : 'h', half: false })); });
  box.addEventListener('change', function (e) {
    var k = e.target.getAttribute('data-k'); if (!k) return;
    var n = { dev: 'duo', pose: 'open', orient: st.orient, half: st.half }; n[k] = e.target.checked;
    if (k === 'half' && n.half) n.orient = 'h';         // half-open is the horizontal book pose
    set(idFrom(n));
  });
  /* the status bar's colour (white over a dark screen) is js/shell/phone-frame.js's job; it watches the frame's poses too */
  function syncSoon() { if (window.PhoneFrame) PhoneFrame.sync(); }
  frame.addEventListener('load', function () { applyToScreen(); });
  // the admin add-on switches to full-window desktop pages: hide the picker there
  if (shellEl) new MutationObserver(function () { gone(box, fullWindow() || st.dev !== 'duo'); tabs.hidden = fullWindow(); applyToScreen(); fit(); }).observe(shellEl, { attributes: true, attributeFilter: ['class'] });
  apply(cur.id);
  // checking only: show the opening frozen at progress p (0..1) as plain styles, from the closed pose: Duo.still(0.4)
  function still(p) { set('outer'); setTimeout(function () { sizing(true); apply('open-l'); foldAnim(true, null, function () {}, p); }, 300); }
  // checking only: the turned fold (sideways closed -> open vertical) frozen at one moment, e.g. Duo.stillTurned(0.5)
  function stillTurned(p) { set('outer-l'); setTimeout(function () { ROT = true; phone.classList.add('is-turned-fold'); phone.style.rotate = '90deg'; sizing(true); apply('open-l'); screenAs = DEVICES.filter(function (d) { return d.id === 'open-p'; })[0]; applyToScreen(); foldAnim(true, null, function () {}, p); }, 900); }
  window.Duo = { still: still, stillTurned: stillTurned, set: set, devices: DEVICES, idFrom: idFrom };
})();
