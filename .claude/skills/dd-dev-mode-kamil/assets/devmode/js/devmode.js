/* Dev mode for the presenter shell.
   - A toggle in the left navigation, behind a password. Turning it off drops the unlock: it asks for the password again.
   - While on, the right panel becomes an inspector. Hovering anything inside the phone outlines it (margin, border, padding,
     content) and the panel shows size, position, spacing, layout, type, colour, border, radius and effects, each with the
     design token it matches, if the project has any (custom properties on :root; any naming). Shift + click pins an element; Esc or Shift + click again releases it. */
(function () {
  'use strict';

  var CFG = window.DEV_MODE || {}, PREFIX = CFG.prefix || (window.SHELL && window.SHELL.prefix) || 'proto';
  var PASS = CFG.password, KEY = PREFIX + '-dev';   // set in devmode.config.js; the password is a soft gate (it is in a JS file)
  var LATER = !PASS && CFG.passwordLater === true;   // "set the password after deploying": dev mode opens without asking until a password is set
  if (!PASS && window.console) console.warn(LATER ? 'dev-mode: no password yet (passwordLater): dev mode opens without asking. Set DEV_MODE.password before sharing.' : 'dev-mode: DEV_MODE.password is not set (devmode.config.js), so dev mode cannot be switched on.');   // no default password: a guessable one would be worse than none
  var frame = document.getElementById('screen');
  var btn = document.getElementById('devmode'), label = document.getElementById('devmodeLabel');
  if (label && label.textContent.trim() === 'Dev mode') label.textContent = 'Inspect';   // prototypes set up before v1.0.2 still have the old label in index.html
  if (btn && btn.title === 'Developer mode') btn.title = 'Developer inspector: spacing, type, colour and tokens';
  var aside = document.querySelector('.side--right'), summary = document.getElementById('summary'), insp = document.getElementById('inspector');
  var gate = document.getElementById('devgate'), gateForm = gate.querySelector('form'), gatePass = document.getElementById('dg-pass'), gateErr = document.getElementById('dg-err');

  var secBtn = document.getElementById('secbtn');

  /* ---------- credits: now drawn by the presenter shell (js/shell/credits.js); kept here switched off for older shells ----------
     A small text button under the right-hand card. `always: true` shows it in presenter mode too; without it, only while dev mode is on. The note slides down from behind the card.
     Built here, so the page needs no extra markup; it follows the card's position and size. Leave `credits` out for no button. */
  var credits = null, creditsDrop = null, creditsBtn = null, CRED_ALWAYS = !!(CFG.credits && CFG.credits.always);
  (function () {
    var C = null;   // credits moved to the presenter shell (js/shell/credits.js, SHELL.credits); an old devmode.config.js `credits` is ignored
    if (!C || (!C.title && !(C.lines && C.lines.length))) return;
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    credits = el('div', 'dvcredits'); credits.hidden = !CRED_ALWAYS;
    creditsDrop = el('div', 'dvcredits__drop'); creditsDrop.id = 'dvCreditsDrop'; creditsDrop.setAttribute('aria-hidden', 'true');
    var clip = el('div', 'dvcredits__clip'), note = el('div', 'dvcredits__note'); note.setAttribute('role', 'note');
    if (C.title) note.appendChild(el('h3', '', C.title));
    (C.lines || []).forEach(function (l) { note.appendChild(el('p', '', l)); });
    clip.appendChild(note); creditsDrop.appendChild(clip);
    creditsBtn = el('button', 'dvcredits__btn', C.button || 'Credits'); creditsBtn.type = 'button'; creditsBtn.setAttribute('aria-expanded', 'false'); creditsBtn.setAttribute('aria-controls', 'dvCreditsDrop');
    credits.appendChild(creditsDrop); credits.appendChild(creditsBtn); document.body.appendChild(credits);
    creditsBtn.addEventListener('click', function () { setCredits(!creditsDrop.classList.contains('is-open')); });
    document.addEventListener('mousedown', function (e) { if (creditsDrop.classList.contains('is-open') && !e.target.closest('.dvcredits')) setCredits(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && creditsDrop.classList.contains('is-open')) setCredits(false); });
    window.addEventListener('resize', placeCredits);
    if (window.ResizeObserver) new ResizeObserver(placeCredits).observe(aside);
    aside.addEventListener('transitionend', function (e) { if (e.target === aside) placeCredits(); });   // the card slid in or out (drawers)
    if (CRED_ALWAYS) setTimeout(placeCredits, 0);
  })();
  function setCredits(open) {
    if (!credits) return;
    creditsDrop.classList.toggle('is-open', open); creditsDrop.setAttribute('aria-hidden', open ? 'false' : 'true'); creditsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function placeCredits() {   // 18 px of the box sit behind the card, so the note appears to come out from under it
    if (!credits) return;
    var r = aside.getBoundingClientRect();
    if ((!on && !CRED_ALWAYS) || !r.width) { credits.style.display = 'none'; return; }
    credits.style.display = ''; credits.style.left = r.left + 'px'; credits.style.width = r.width + 'px';
    // A card that reaches the bottom of the window (full-height panels, dd-desktop-kamil) has no room below it:
    // pin the button inside the card's bottom edge and let the note open upwards instead.
    var full = r.bottom >= innerHeight - 24;
    credits.classList.toggle('is-up', full);
    if (full) { credits.style.top = 'auto'; credits.style.bottom = Math.max(0, innerHeight - r.bottom) + 12 + 'px'; }
    else { credits.style.bottom = ''; credits.style.top = (r.bottom - 18) + 'px'; }
  }
  // The accent comes from the shell's own theme (--accent / --accent-strong on the shell page), never from the prototype's design system.
  function theme() { var cs = getComputedStyle(document.documentElement); return { a: cs.getPropertyValue('--accent').trim() || '#2563eb', s: cs.getPropertyValue('--accent-strong').trim() || '#1d4ed8' }; }
  function mix(c, pct) { return 'color-mix(in srgb, ' + c + ' ' + pct + '%, transparent)'; }
  var on = false, doc = null, win = null, overlay = null, pinned = null, hovered = null, raf = 0, tokens = null, shown = null;

  /* ---------- turning it on and off ---------- */
  function setUI() {
    btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    label.textContent = on ? 'Inspecting' : 'Inspect';
    aside.classList.toggle('is-dev', on); insp.hidden = !on;
    if (on && !document.getElementById('dvTop')) insp.innerHTML = '<div id="dvTop"></div><div id="dvHover"></div>';
    if (on) renderTop();
    if (secBtn) secBtn.hidden = !on;
    if (credits) { credits.hidden = !(on || CRED_ALWAYS); if (on || CRED_ALWAYS) placeCredits(); if (!on) setCredits(false); }
    hook(on ? 'on' : 'off');
  }
  function enable() {
    on = true; try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    setUI(); renderEmpty(); attach();
  }
  function disable() {
    on = false; try { sessionStorage.removeItem(KEY); } catch (e) {}
    detach(); pinned = null; hovered = null; shown = null; setUI();
  }
  function openGate() {
    gate.hidden = false; gateErr.hidden = true; gatePass.value = ''; setTimeout(function () { gatePass.focus(); }, 30);
  }
  function closeGate() { gate.hidden = true; btn.focus(); }

  btn.addEventListener('click', function () { if (on) disable(); else if (LATER) enable(); else openGate(); });
  document.getElementById('dg-cancel').addEventListener('click', closeGate);
  gate.addEventListener('mousedown', function (e) { if (e.target === gate) closeGate(); });
  gate.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGate(); });
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (PASS && gatePass.value === PASS) { gate.hidden = true; enable(); return; }
    gateErr.hidden = false; gatePass.select();
    gateForm.classList.remove('is-shake'); void gateForm.offsetWidth; gateForm.classList.add('is-shake');
  });
  window.addEventListener(PREFIX + ':relock', function () { gate.hidden = true; disable(); });   // the shell's "back to lock screen" switches dev mode off

  /* ---------- hooking into the page inside the phone ---------- */
  frame.addEventListener('load', function () { pinned = null; hovered = null; shown = null; if (on) { attach(); renderEmpty(); hook('load'); renderTop(); } });

  function attach() {
    detach();
    var d, w;
    try { d = frame.contentDocument; w = frame.contentWindow; } catch (e) { return; }
    if (!d || !d.documentElement || !d.body || /^about:/.test(d.location.href)) return;
    doc = d; win = w;
    buildTokens();
    overlay = doc.createElement('div'); overlay.id = '__dev'; overlay.setAttribute('aria-hidden', 'true'); overlay.setAttribute('data-devui', '');
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
    doc.documentElement.appendChild(overlay);
    doc.addEventListener('mousemove', onMove, true);
    doc.addEventListener('mouseout', onOut, true);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('keydown', onKey, true);
    doc.addEventListener('scroll', redraw, true);
    win.addEventListener('resize', redraw);
    hook('attach');
  }
  function detach() {
    if (!doc) return;
    hook('detach');
    try {
      doc.removeEventListener('mousemove', onMove, true); doc.removeEventListener('mouseout', onOut, true); doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('keydown', onKey, true); doc.removeEventListener('scroll', redraw, true); win.removeEventListener('resize', redraw);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (e) {}
    doc = win = overlay = null;
  }

  function isInspectable(el) { return el && el.nodeType === 1 && el !== doc.documentElement && !(overlay && overlay.contains(el)) && !(el.closest && el.closest('[data-devui]')); }
  // nothing under the pointer: stop highlighting (a pinned element stays)
  function clearHover() {
    hovered = null; shown = null;
    if (pinned) return;
    if (overlay) overlay.innerHTML = '';
    renderEmpty();
  }
  function onOut(e) { if (!e.relatedTarget) clearHover(); }   // the pointer left the phone
  function onMove(e) {
    var el = e.target;
    if (!isInspectable(el)) { if (hovered) clearHover(); return; }
    hovered = el;
    if (pinned) return;
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; if (hovered) inspect(hovered); });
  }
  function onClick(e) {
    if (!e.shiftKey) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    if (pinned && (pinned === el)) { pinned = null; inspect(hovered || el); hook('pin'); return; }
    pinned = el; inspect(el); hook('pin');
  }
  function onKey(e) { if (e.key === 'Escape' && pinned) { pinned = null; if (hovered) inspect(hovered); hook('pin'); } }
  function redraw() { var t = pinned || hovered; if (t && doc && doc.contains(t)) drawBoxes(t); hook('redraw'); }

  /* ---------- design tokens (optional, any naming) ---------- */
  // Nothing here assumes a particular design system. Every custom property declared on :root / html in a same-origin stylesheet is read and sorted by what
  // its VALUE is: a colour, a length or a shadow. A chip is shown wherever a value on screen is exactly equal to one of them.
  // Lengths are told apart (spacing, radius, font size, line height, size) by name hints; when none of a project's length tokens fit any hint, they are
  // offered for every kind of length instead. Settings in DEV_MODE: tokens (false = no chips), tokenFiles (regex on the stylesheet URL, default all),
  // tokenHints ({ sp, r, fs, lh, h, fw }: regex strings that replace the default hints), paletteTokens / legacyTokens (regexes that sort raw palette steps and
  // old aliases after the semantic names for colours).
  var HINTS = {
    sp: '(^--|-)(sp|space|spacing|gap|gutter|pad|padding|margin|inset)(-|\\d|$)',
    r: '(^--|-)(r|rad|radius|radii|round|rounded|corner|corners)(-|\\d|$)',
    fs: '(^--|-)(fs|font-size|fontsize|text-size|type|text|size)(-|\\d|$)',
    lh: '(^--|-)(lh|line-height|lineheight|leading)(-|\\d|$)',
    h: '(^--|-)(h|height|control|size)(-|\\d|$)',
    fw: '(^--|-)(fw|font-weight|weight)(-|\\d|$)'
  };
  var HINT_RX = {}; Object.keys(HINTS).forEach(function (k) { HINT_RX[k] = new RegExp((CFG.tokenHints && CFG.tokenHints[k]) || HINTS[k], 'i'); });
  var PALETTE = new RegExp(CFG.paletteTokens || '^--[a-z]+(-[a-z]+)*-\\d{2,3}$|^--(white|black)$'), LEGACY = CFG.legacyTokens ? new RegExp(CFG.legacyTokens) : null;
  function isLegacy(n) { return !!LEGACY && LEGACY.test(n); }
  var COLOUR = /^(#|rgba?\(|hsla?\(|hwb\(|color\(|oklch\(|oklab\(|lab\(|lch\()/i, LENGTH = /^-?[\d.]+(px|rem|em)$|^calc\(/;
  function buildTokens() {
    tokens = { color: {}, sp: {}, r: {}, fs: {}, lh: {}, h: {}, shadow: {}, fw: {}, count: 0 };
    if (CFG.tokens === false) return;
    var names = {}, only = CFG.tokenFiles ? new RegExp(CFG.tokenFiles) : null, ROOT = /(^|,)\s*(:root|html)\s*(,|$)/;
    for (var i = 0; i < doc.styleSheets.length; i++) {
      var sh = doc.styleSheets[i], rules;
      if (only && !(sh.href && only.test(sh.href))) continue;
      try { rules = sh.cssRules; } catch (e) { continue; }       // another origin: its rules cannot be read
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        if (!rule.selectorText || !ROOT.test(rule.selectorText)) continue;
        for (var k = 0; k < rule.style.length; k++) if (rule.style[k].indexOf('--') === 0) names[rule.style[k]] = 1;
      }
    }
    var root = win.getComputedStyle(doc.documentElement), tmp = doc.createElement('i'), lens = [];
    tmp.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0'; doc.body.appendChild(tmp);
    Object.keys(names).forEach(function (n) {
      var v = root.getPropertyValue(n).trim(); if (!v) return;
      if (COLOUR.test(v)) {
        tmp.style.color = ''; tmp.style.color = v; var c = win.getComputedStyle(tmp).color; if (!c) return;
        var list = tokens.color[c] = tokens.color[c] || [];
        if (isLegacy(n)) list.push(n);                            // old aliases last
        else if (PALETTE.test(n)) list.splice(list.filter(function (x) { return !isLegacy(x) && !PALETTE.test(x); }).length, 0, n);   // then raw palette steps
        else list.unshift(n);                                     // semantic names first
        tokens.count++; return;
      }
      if (/(rgba?\(|hsla?\(|#[0-9a-f]{3,8})/i.test(v) && /-?[\d.]+(px)?\s+-?[\d.]+(px)?\s+[\d.]+(px)?/.test(v)) {      // a box-shadow value
        tmp.style.boxShadow = ''; tmp.style.boxShadow = v; var bs = win.getComputedStyle(tmp).boxShadow;
        if (bs && bs !== 'none') { (tokens.shadow[bs] = tokens.shadow[bs] || []).push(n); tokens.count++; } return;
      }
      if (LENGTH.test(v)) {
        tmp.style.width = ''; tmp.style.width = v; var w = parseFloat(win.getComputedStyle(tmp).width);
        if (!isNaN(w)) lens.push([n, Math.round(w * 100) / 100]);
        return;
      }
      if (/^[1-9]00$/.test(v) && HINT_RX.fw.test(n)) { (tokens.fw[+v] = tokens.fw[+v] || []).push(n); tokens.count++; }
    });
    tmp.parentNode.removeChild(tmp);
    var kinds = ['sp', 'r', 'fs', 'lh', 'h'], anyHint = lens.some(function (l) { return kinds.some(function (k) { return HINT_RX[k].test(l[0]); }); });
    kinds.forEach(function (k) {
      var hit = lens.filter(function (l) { return HINT_RX[k].test(l[0]); });
      if (!anyHint) hit = lens;                                   // unhinted names: offer every length token for every kind
      hit.forEach(function (l) { (tokens[k][l[1]] = tokens[k][l[1]] || []).push(l[0]); });
    });
    tokens.count += lens.length;
  }
  function tok(kind, key) {
    var list = tokens && tokens[kind] && tokens[kind][key];
    if (!list || !list.length) return '';
    return list.slice(0, 2).map(function (n) { return '<span class="dv__tok">' + n + '</span>'; }).join('');
  }
  function tokName(kind, key) { var l = tokens && tokens[kind] && tokens[kind][key]; return l && l.length ? l[0] : ''; }
  function lenTok(kind, px) { return tok(kind, Math.round(px * 100) / 100); }

  /* ---------- values ---------- */
  function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function fmt(n) { return r1(n) + 'px'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rgbaOf(c) { var m = c && c.match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null; }
  function hex(c) {
    var o = rgbaOf(c); if (!o) return c;
    var h = function (n) { return ('0' + Math.round(n).toString(16)).slice(-2); };
    return '#' + h(o.r) + h(o.g) + h(o.b) + (o.a < 1 ? h(o.a * 255) : '');
  }
  function colorRow(name, c) {
    var o = rgbaOf(c); if (!o || o.a === 0) return '';
    return row(name, '<span class="dv__sw"><i style="background:' + esc(c) + '"></i></span><span class="dv__mono">' + esc(hex(c)) + (o.a < 1 ? ' · ' + Math.round(o.a * 100) + '%' : '') + '</span>' + tok('color', c));
  }
  function row(name, html) { return '<div class="dv__row"><span>' + name + '</span><span class="dv__val">' + html + '</span></div>'; }
  function section(title, rows) { rows = rows.filter(Boolean).join(''); return rows ? '<section><h3>' + title + '</h3><div class="dv__rows">' + rows + '</div></section>' : ''; }
  function four(t, r, b, l) {
    if (t === r && r === b && b === l) return fmt(t);
    if (t === b && r === l) return fmt(t) + ' ' + fmt(r);
    return fmt(t) + ' ' + fmt(r) + ' ' + fmt(b) + ' ' + fmt(l);
  }
  function weightName(w) { return { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold' }[w] || ''; }

  function selectorOf(el) {
    var cls = (el.getAttribute && el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).filter(function (c) { return !/^(is-|rise|tap$)/.test(c); });
    return { tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''), cls: cls.map(function (c) { return '.' + c; }).join('') };
  }

  /* ---------- the overlay: margin, border, padding, content ---------- */
  function drawBoxes(el) {
    if (!overlay) return;
    var r = el.getBoundingClientRect(), cs = win.getComputedStyle(el);
    var m = [px(cs.marginTop), px(cs.marginRight), px(cs.marginBottom), px(cs.marginLeft)];
    var b = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    var p = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    function box(l, t, w, h, bg) { return '<div style="position:absolute;left:' + l + 'px;top:' + t + 'px;width:' + Math.max(0, w) + 'px;height:' + Math.max(0, h) + 'px;background:' + bg + '"></div>'; }
    var html = '';
    html += box(r.left - m[3], r.top - m[0], r.width + m[1] + m[3], r.height + m[0] + m[2], 'rgba(246,178,107,.25)');
    html += box(r.left, r.top, r.width, r.height, 'rgba(255,229,153,.25)');
    html += box(r.left + b[3], r.top + b[0], r.width - b[1] - b[3], r.height - b[0] - b[2], 'rgba(147,196,125,.25)');
    html += box(r.left + b[3] + p[3], r.top + b[0] + p[0], r.width - b[1] - b[3] - p[1] - p[3], r.height - b[0] - b[2] - p[0] - p[2], 'rgba(111,168,220,.25)');
    html += '<div style="position:absolute;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;outline:1.5px solid ' + (pinned === el ? theme().a : '#f97316') + ';outline-offset:-1px"></div>';
    var s = selectorOf(el), tag = s.tag + s.cls.split('.').slice(0, 2).join('.') + '  ' + r1(r.width) + ' × ' + r1(r.height);
    var top = r.top > 26 ? r.top - 22 : r.bottom + 4, left = Math.min(Math.max(4, r.left), win.innerWidth - 8);
    html += '<div style="position:absolute;left:' + left + 'px;top:' + top + 'px;max-width:' + (win.innerWidth - left - 4) + 'px;padding:2px 6px;border-radius:4px;background:#1e293b;color:#fff;font:600 10px/14px ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(tag) + '</div>';
    overlay.innerHTML = html;
  }

  /* ---------- the inspector panel ---------- */
  // Tips shown at the top of the panel. Add a line here and it appears in the tips container.
  var TIPS = [
    ['<kbd>Shift</kbd> + click', 'pins an element so it stays while you read.'],
    ['<kbd>Esc</kbd>', 'releases a pinned element.'],
    ['Path chips', 'select a parent of the element.'],
    ['<kbd>Copy CSS</kbd>', 'copies its styles (with var(--token) where a design token matches).'],
    ['<span class="dv__tok">--token</span>', 'chips name the design token a value matches.', 'tokens'],
    ['<kbd>Sections</kbd>', '(top left) outlines every part of the screen. Click a numbered label to isolate one.'],
    ['<kbd>Download images</kbd>', 'lists every image on the screen and downloads it in several sizes.']
  ];
  function tipsHtml() {
    return '<div class="dvtips"><div class="dvtips__title"><span class="mi" style="font-size:14px" aria-hidden="true">lightbulb</span>Tips</div><ul>' +
      TIPS.filter(function (t) { return t[2] !== 'tokens' || (tokens && tokens.count); }).map(function (t) { return '<li>' + t[0] + ' ' + t[1] + '</li>'; }).join('') + '</ul></div>';
  }
  // Other tools (sections, images) add blocks under the tips: window.DevMode.parts.push(function () { return '<div>…</div>'; })
  var hooks = {}, parts = [];
  function hook(name) { (hooks[name] || []).forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function renderTop() {
    var top = document.getElementById('dvTop'); if (!top || !on) return;
    top.innerHTML = tipsHtml() + parts.map(function (p) { try { return p(); } catch (e) { return ''; } }).join('');
  }
  function hoverBox() { return document.getElementById('dvHover'); }
  function renderEmpty() {
    if (!hoverBox()) return;
    hoverBox().innerHTML = '<div class="dv__top"><span class="dv__title">Inspector</span></div><div class="dv__empty"><b>Hover anything in the phone</b>You will see its size, spacing, type, colour, radius and the design token each one uses.</div>';
  }
  function inspect(el) {
    if (!doc || !doc.contains(el)) return;
    if (shown === el && !pinned) { drawBoxes(el); return; }
    shown = el; drawBoxes(el);
    var cs = win.getComputedStyle(el), r = el.getBoundingClientRect(), parent = el.parentElement;
    var pad = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    var mar = [px(cs.marginTop), px(cs.marginRight), px(cs.marginBottom), px(cs.marginLeft)];
    var bor = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    var sx = win.pageXOffset || 0, sy = win.pageYOffset || 0;
    var s = selectorOf(el), html = '';

    html += '<div class="dv__top"><span class="dv__title">Inspector</span>' + (pinned === el ? '<span class="dv__pin"><span class="mi" style="font-size:13px">push_pin</span>Pinned</span>' : '') + '</div>';
    html += '<div class="dv__el"><span class="dv__tag">&lt;' + esc(s.tag) + '&gt;</span>' + (s.cls ? '<span class="dv__cls">' + esc(s.cls) + '</span>' : '') + '</div>';

    // ancestors (click to select)
    var chain = [], a = el.parentElement;
    while (a && a !== doc.documentElement && chain.length < 4) { chain.push(a); a = a.parentElement; }
    if (chain.length) {
      html += '<div class="dv__crumb" id="dvCrumb">' + chain.map(function (n, i) { var q = selectorOf(n); return '<button type="button" data-up="' + (i + 1) + '">' + esc(q.tag + (q.cls ? q.cls.split('.').slice(0, 2).join('.') : '')) + '</button>'; }).join('<span>‹</span>') + '</div>';
    }

    // size and position
    var posParts = cs.position !== 'static' ? cs.position : '';
    html += section('Size and position', [
      row('Width × height', r1(r.width) + ' × ' + r1(r.height) + ' px' + (cs.boxSizing === 'border-box' ? '' : ' <span class="dv__tok">content-box</span>')),
      cs.minHeight !== '0px' && cs.minHeight !== 'auto' ? row('Min height', fmt(px(cs.minHeight)) + lenTok('h', px(cs.minHeight))) : '',
      row('Position on page', 'x ' + r1(r.left + sx) + ', y ' + r1(r.top + sy)),
      parent ? row('From parent edges', (function () { var pr = parent.getBoundingClientRect(); return r1(r.top - pr.top) + ' top · ' + r1(r.left - pr.left) + ' left'; })()) : '',
      posParts ? row('Positioning', posParts + (cs.zIndex !== 'auto' ? ' · z ' + cs.zIndex : '')) : ''
    ]);

    // box model
    function n(v) { return v === 0 ? '–' : r1(v); }
    html += '<section><h3>Box model</h3><div class="bm"><div class="bm__box bm__margin"><span class="bm__l">margin</span><span class="t">' + n(mar[0]) + '</span><span class="l">' + n(mar[3]) + '</span><span class="r">' + n(mar[1]) + '</span><span class="b">' + n(mar[2]) + '</span>' +
      '<div class="c"><div class="bm__box bm__border"><span class="bm__l">border</span><span class="t">' + n(bor[0]) + '</span><span class="l">' + n(bor[3]) + '</span><span class="r">' + n(bor[1]) + '</span><span class="b">' + n(bor[2]) + '</span>' +
      '<div class="c"><div class="bm__box bm__padding"><span class="bm__l">padding</span><span class="t">' + n(pad[0]) + '</span><span class="l">' + n(pad[3]) + '</span><span class="r">' + n(pad[1]) + '</span><span class="b">' + n(pad[2]) + '</span>' +
      '<div class="c"><div class="bm__content">' + r1(r.width - bor[1] - bor[3] - pad[1] - pad[3]) + ' × ' + r1(r.height - bor[0] - bor[2] - pad[0] - pad[2]) + '</div></div></div></div></div></div></div></div></section>';

    // spacing with tokens
    var spRows = [];
    if (pad.some(Boolean)) spRows.push(row('Padding', four(pad[0], pad[1], pad[2], pad[3]) + (pad.every(function (v) { return v === pad[0]; }) ? lenTok('sp', pad[0]) : '')));
    if (mar.some(Boolean)) spRows.push(row('Margin', four(mar[0], mar[1], mar[2], mar[3]) + (mar.every(function (v) { return v === mar[0]; }) ? lenTok('sp', mar[0]) : '')));
    var gap = px(cs.rowGap), cgap = px(cs.columnGap);
    if ((cs.display.indexOf('flex') > -1 || cs.display.indexOf('grid') > -1) && (gap || cgap)) spRows.push(row('Gap', gap === cgap ? fmt(gap) + lenTok('sp', gap) : fmt(gap) + ' / ' + fmt(cgap)));
    var sibs = siblingGaps(el, r);
    sibs.forEach(function (g) { spRows.push(row(g.label, fmt(g.v) + lenTok('sp', g.v))); });
    html += section('Spacing', spRows);

    // layout
    var lay = [];
    if (cs.display !== 'block' && cs.display !== 'inline') lay.push(row('Display', cs.display));
    if (cs.display.indexOf('flex') > -1) {
      lay.push(row('Direction', cs.flexDirection + (cs.flexWrap !== 'nowrap' ? ' · ' + cs.flexWrap : '')));
      lay.push(row('Align / justify', cs.alignItems + ' / ' + cs.justifyContent));
    }
    if (cs.display.indexOf('grid') > -1) lay.push(row('Columns', '<span class="dv__mono">' + esc(cs.gridTemplateColumns.split(' ').slice(0, 6).join(' ')) + '</span>'));
    if (cs.flexGrow !== '0' && parent && /flex/.test(win.getComputedStyle(parent).display)) lay.push(row('Flex grow', cs.flexGrow));
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') lay.push(row('Overflow', cs.overflowX === cs.overflowY ? cs.overflowX : cs.overflowX + ' / ' + cs.overflowY));
    html += section('Layout', lay);

    // type
    var ownText = Array.prototype.some.call(el.childNodes, function (c) { return c.nodeType === 3 && c.textContent.trim(); }) || /^(input|textarea|select|button)$/i.test(el.tagName);
    if (ownText) {
      var fs = px(cs.fontSize), lhv = cs.lineHeight === 'normal' ? fs * 1.2 : px(cs.lineHeight), w = +cs.fontWeight, ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
      html += section('Type', [
        row('Font', esc(cs.fontFamily.split(',')[0].replace(/["']/g, ''))),
        row('Size / line', fmt(fs) + ' / ' + fmt(lhv) + tok('fs', r1(fs)) + tok('lh', r1(lhv))),
        row('Weight', w + (weightName(w) ? ' · ' + weightName(w) : '')),
        ls ? row('Letter spacing', r1(ls) + 'px') : '',
        cs.textTransform !== 'none' ? row('Transform', cs.textTransform) : '',
        cs.textAlign !== 'start' && cs.textAlign !== 'left' ? row('Align', cs.textAlign) : '',
        colorRow('Colour', cs.color)
      ]);
    }

    // fill and colour
    var fills = [];
    if (rgbaOf(cs.backgroundColor) && rgbaOf(cs.backgroundColor).a > 0) fills.push(colorRow('Fill', cs.backgroundColor));
    if (cs.backgroundImage !== 'none') fills.push(row('Image', '<span class="dv__mono">' + esc(cs.backgroundImage.length > 60 ? cs.backgroundImage.slice(0, 60) + '…' : cs.backgroundImage) + '</span>'));
    if (!ownText && /^(svg|path|use)$/i.test(el.tagName)) { fills.push(colorRow('Icon colour', cs.color)); }
    html += section('Colour', fills);

    // border and radius
    var bd = [];
    if (bor.some(Boolean)) {
      var sameB = bor.every(function (v) { return v === bor[0]; });
      bd.push(row('Border', (sameB ? fmt(bor[0]) : four(bor[0], bor[1], bor[2], bor[3])) + ' ' + cs.borderTopStyle));
      bd.push(colorRow('Border colour', cs.borderTopColor));
    }
    var rad = [px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius), px(cs.borderBottomRightRadius), px(cs.borderBottomLeftRadius)];
    if (rad.some(Boolean)) {
      var allSame = rad.every(function (v) { return v === rad[0]; });
      var full = allSame && rad[0] >= Math.min(r.width, r.height) / 2 - 0.5 && r.width > 0;
      bd.push(row('Radius', (allSame ? fmt(rad[0]) : four(rad[0], rad[1], rad[2], rad[3])) + (allSame ? (tok('r', r1(rad[0])) || (full ? '<span class="dv__tok">pill / round</span>' : '')) : '')));
    }
    html += section('Border and radius', bd);

    // effects
    var fx = [];
    if (cs.boxShadow !== 'none') fx.push(row('Shadow', '<span class="dv__mono">' + esc(cs.boxShadow.length > 70 ? cs.boxShadow.slice(0, 70) + '…' : cs.boxShadow) + '</span>' + tok('shadow', cs.boxShadow)));
    if (cs.opacity !== '1') fx.push(row('Opacity', r1(+cs.opacity * 100) + '%'));
    if (cs.backdropFilter && cs.backdropFilter !== 'none') fx.push(row('Backdrop', '<span class="dv__mono">' + esc(cs.backdropFilter) + '</span>'));
    if (cs.filter !== 'none') fx.push(row('Filter', '<span class="dv__mono">' + esc(cs.filter.slice(0, 50)) + '</span>'));
    if (cs.transform !== 'none') fx.push(row('Transform', '<span class="dv__mono">' + esc(cs.transform.slice(0, 50)) + '</span>'));
    if (cs.animationName !== 'none') fx.push(row('Animation', esc(cs.animationName) + ' · ' + cs.animationDuration));
    else if (cs.transitionDuration !== '0s') fx.push(row('Transition', esc(cs.transitionProperty.split(',')[0]) + ' · ' + cs.transitionDuration));
    html += section('Effects', fx);

    html += '<div class="dv__copy"><button type="button" class="dv__btn" id="dvCopy"><span class="mi" style="font-size:14px">content_copy</span>Copy CSS</button></div>';
    hoverBox().innerHTML = html;

    var crumb = document.getElementById('dvCrumb');
    if (crumb) crumb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-up]'); if (!b) return;
      var up = +b.dataset.up, t = el; while (up-- > 0 && t.parentElement) t = t.parentElement;
      pinned = t; shown = null; inspect(t); hook('pin');
    });
    document.getElementById('dvCopy').addEventListener('click', function () { copyCss(el, cs, r, pad, mar, bor, rad); });
  }

  function siblingGaps(el, r) {
    var out = [], p = el.previousElementSibling, nx = el.nextElementSibling;
    function vis(n) { while (n && (n.offsetParent === null && win.getComputedStyle(n).position !== 'fixed')) n = null; return n; }
    function gapTo(n, before) {
      n = vis(n); if (!n) return;
      var q = n.getBoundingClientRect(); if (!q.width && !q.height) return;
      var dy = before ? r.top - q.bottom : q.top - r.bottom, dx = before ? r.left - q.right : q.left - r.right;
      if (dy >= 0 && (dy > 0 || dx < 0)) out.push({ label: before ? 'Above' : 'Below', v: dy });
      else if (dx > 0) out.push({ label: before ? 'Left sibling' : 'Right sibling', v: dx });
    }
    gapTo(p, true); gapTo(nx, false);
    return out.filter(function (g) { return g.v >= 0 && g.v < 400; });
  }

  function copyCss(el, cs, r, pad, mar, bor, rad) {
    var s = selectorOf(el), lines = [];
    function v(kind, num, raw) { var t = tokName(kind, r1(num)); return t ? 'var(' + t + ')' : raw; }
    lines.push('width: ' + r1(r.width) + 'px;', 'height: ' + r1(r.height) + 'px;');
    if (pad.some(Boolean)) lines.push('padding: ' + pad.map(function (x) { return v('sp', x, r1(x) + 'px'); }).join(' ') + ';');
    if (mar.some(Boolean)) lines.push('margin: ' + mar.map(function (x) { return v('sp', x, r1(x) + 'px'); }).join(' ') + ';');
    if (bor.some(Boolean)) lines.push('border: ' + r1(bor[0]) + 'px ' + cs.borderTopStyle + ' ' + hex(cs.borderTopColor) + ';');
    if (rad.some(Boolean)) lines.push('border-radius: ' + (rad.every(function (x) { return x === rad[0]; }) ? v('r', rad[0], r1(rad[0]) + 'px') : rad.map(function (x) { return r1(x) + 'px'; }).join(' ')) + ';');
    if (rgbaOf(cs.backgroundColor) && rgbaOf(cs.backgroundColor).a > 0) { var bt = tokName('color', cs.backgroundColor); lines.push('background: ' + (bt ? 'var(' + bt + ')' : hex(cs.backgroundColor)) + ';'); }
    var own = Array.prototype.some.call(el.childNodes, function (c) { return c.nodeType === 3 && c.textContent.trim(); });
    if (own) {
      var ct = tokName('color', cs.color);
      lines.push('color: ' + (ct ? 'var(' + ct + ')' : hex(cs.color)) + ';', 'font: ' + cs.fontWeight + ' ' + r1(px(cs.fontSize)) + 'px/' + (cs.lineHeight === 'normal' ? 'normal' : r1(px(cs.lineHeight)) + 'px') + ' ' + cs.fontFamily.split(',')[0] + ';');
      if (cs.letterSpacing !== 'normal') lines.push('letter-spacing: ' + cs.letterSpacing + ';');
    }
    if (cs.boxShadow !== 'none') { var st = tokName('shadow', cs.boxShadow); lines.push('box-shadow: ' + (st ? 'var(' + st + ')' : cs.boxShadow) + ';'); }
    if (cs.display.indexOf('flex') > -1 || cs.display.indexOf('grid') > -1) { lines.push('display: ' + cs.display + ';'); if (px(cs.rowGap)) lines.push('gap: ' + v('sp', px(cs.rowGap), cs.rowGap) + ';'); }
    var text = (s.tag.split('#')[0] + s.cls) + ' {\n  ' + lines.join('\n  ') + '\n}';
    var done = function () { var b = document.getElementById('dvCopy'); if (b) { b.lastChild.textContent = 'Copied'; setTimeout(function () { if (b) b.lastChild.textContent = 'Copy CSS'; }, 1400); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  }

  window.DevMode = {
    isOn: function () { return on; }, doc: function () { return doc; }, win: function () { return win; },
    pinned: function () { return pinned; }, theme: theme, mix: mix, tokName: tokName, tokens: function () { return tokens; },
    on: function (name, fn) { (hooks[name] = hooks[name] || []).push(fn); }, parts: parts, renderTop: renderTop, esc: esc, px: px, r1: r1
  };
  window.dispatchEvent(new Event('devmode:ready'));

  /* ---------- a reload keeps dev mode on while the session lasts ---------- */
  try { if (sessionStorage.getItem(KEY)) { on = true; setUI(); renderEmpty(); try { if (frame.contentDocument && frame.contentDocument.readyState === 'complete') { attach(); hook('load'); renderTop(); } } catch (e) {} } } catch (e) {}   // the phone may already be loaded
})();
