/* dd-design-system-kamil: the Design System button and the Rules check, for the presenter shell.
   - Design System (beside Dev mode): opens pages/design-system.html, the rulebook from design-system.config.js, in a wide panel.
     DESIGN_SYSTEM.show = 'everyone' (presenters can read it) or 'dev' (only with dev mode on). Downloading the skill is always dev mode only.
   - Rules (beside Sections, dev mode only): outlines where the screen differs from the design system in amber, with the allowed values,
     and approved exceptions (bent on purpose, with a reason) in dashed blue. It is information for the designer, never shown as an error.
   Reads the screen only; nothing in the prototype is changed. */
(function () {
  'use strict';
  var S = window.DESIGN_SYSTEM || window.UI_STANDARD; if (!S) return;
  var C = S.check || {}, frame = document.getElementById('screen'), devBtn = document.getElementById('devmode');
  var top = document.querySelector('.side--right .side__top'), aside = document.querySelector('.side--right');
  if (!frame || !devBtn || !top) return;
  var RED = '#d97706',   /* amber: a difference to look at, not an error */
      on = false, doc = null, layer = null, issues = [], focus = null, raf = 0, mo = null, timer = 0;

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  var btn = el('button', 'devbtn devbtn--sec uirules__btn', '<span class="mi" style="font-size:16px" aria-hidden="true">rule</span><span class="devbtn__label">Rules</span>');
  btn.type = 'button'; btn.hidden = true; btn.title = 'Show where a screen differs from the design system'; btn.setAttribute('aria-pressed', 'false');
  var sec = document.getElementById('secbtn'); top.insertBefore(btn, sec ? sec.nextSibling : top.firstChild);
  var panel = el('div', 'uirules'); panel.hidden = true; top.parentNode.insertBefore(panel, top.nextSibling);
  var css = el('style', null, '.uirules__btn{margin-right:0}.uirules__btn.is-on{background:rgba(217,119,6,.12);color:#b45309;border-color:rgba(217,119,6,.4)}' +
    '.uirules{margin:0 0 12px;padding:12px;border-radius:16px;background:#fff;border:1px solid #e5e7eb;font-size:12px;line-height:16px;color:#1f2937;max-height:42vh;overflow:auto}' +
    '.uirules h3{margin:0 0 8px;font-size:13px;line-height:16px}.uirules h3 span{display:block;margin-top:2px;color:#6b7280;font-weight:400;font-size:12px}' +
    '.uirules ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}.uirules li button{all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;padding:8px;border-radius:10px;background:#fffbeb}' +
    '.uirules li button:hover,.uirules li button.is-on{background:#fef3c7}.uirules b{color:#92400e}.uirules small{display:block;color:#6b7280;margin-top:2px}.uirules .ok{color:#15803d;font-weight:700;margin:0}.uirules__xh{margin:12px 0 6px;font-weight:700;color:#1d4ed8}.uirules li button.uirules__x{background:#eff6ff;outline:1px dashed rgba(37,99,235,.45);outline-offset:-1px}.uirules li button.uirules__x:hover,.uirules li button.uirules__x.is-on{background:#dbeafe}.uirules .uirules__x b{color:#1d4ed8}');
  document.head.appendChild(css);

  /* ---------- checking ---------- */
  function px(v) { return Math.round(parseFloat(v) * 10) / 10; }
  function hasText(n) { for (var c = n.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) return true; return false; }
  function isIcon(n, cs) { return /Material Symbols|Material Icons|Font Awesome|Phosphor|bootstrap-icons|remixicon|tabler|uicons/i.test(cs.fontFamily) || /(^|\s|-)(ms|mi|ico|icon|ic|fa|ph|bi|ri|ti|fi)(\s|-|$)/.test(n.getAttribute('class') || ''); }   // icons are glyphs, not text: never checked for text size or weight
  function name(n) { var t = n.tagName.toLowerCase(); if (n.id) return t + '#' + n.id; var c = (n.getAttribute('class') || '').trim().split(/\s+/)[0]; return c ? t + '.' + c : t; }
  function allowed(list, v) { return list.indexOf(v) >= 0; }
  function nearest(list, v) { var nums = list.filter(function (x) { return typeof x === 'number'; }).sort(function (a, b) { return a - b; }), lo = null, hi = null;
    nums.forEach(function (x) { if (x <= v) lo = x; if (x >= v && hi === null) hi = x; }); return [lo, hi].filter(function (x, i, a) { return x !== null && a.indexOf(x) === i; }).join(' or '); }

  /* the tap area, not just the visible box: a control may look small if an invisible ::before / ::after (position: absolute, negative
     inset) makes its tap zone bigger, which is how iOS-style small controls keep a 44 pt target */
  function hitSize(n, r, w) {
    var L = r.left, T = r.top, R = r.right, B = r.bottom;
    ['::before', '::after'].forEach(function (p) {
      var s = w.getComputedStyle(n, p); if (!s || s.content === 'none' || s.position !== 'absolute') return;
      var t = parseFloat(s.top), l = parseFloat(s.left), rt = parseFloat(s.right), b = parseFloat(s.bottom);
      if (t < 0) T = Math.min(T, r.top + t); if (l < 0) L = Math.min(L, r.left + l); if (rt < 0) R = Math.max(R, r.right - rt); if (b < 0) B = Math.max(B, r.bottom - b);
    });
    return { w: R - L, h: B - T };
  }
  var MAXSP = Math.max.apply(null, S.spacing), IGN = S.ignoreBelow == null ? 3 : S.ignoreBelow;
  function spaceOk(v) { return isNaN(v) || v <= 0 || v < IGN || v > MAXSP; }   // hairline nudges and layout offsets (status bar, tab bar room) are not spacing choices
  var excepts = [], BLUE = '#2563eb';
  function approved(it) {   // an approved exception: data-rule-ok="reason" on the element (or a parent), or UI_STANDARD.exceptions
    var host = it.el.closest('[data-rule-ok]'); if (host) return host.getAttribute('data-rule-ok') || 'Approved exception';
    var X = S.exceptions || [];
    for (var i = 0; i < X.length; i++) { try { if ((!X[i].rule || X[i].rule === it.key) && it.el.closest(X[i].where)) return X[i].reason || 'Approved exception'; } catch (e) {} }
    return null;
  }
  function scan() { scanAll(); var all = issues; issues = []; excepts = [];
    all.forEach(function (it) { var why = approved(it); if (why) { it.reason = why; excepts.push(it); } else issues.push(it); }); }
  function scanAll() {
    issues = []; if (!doc || !doc.body) return;
    var w = doc.defaultView, nodes = doc.body.querySelectorAll('*'), n, cs, r, add;
    for (var i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (layer && layer.contains(n)) continue;
      if (/^(SCRIPT|STYLE|BR|svg|path|LINK|META)$/i.test(n.tagName)) continue;
      r = n.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      cs = w.getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      add = function (rule, value, fix, prop, key) { issues.push({ el: n, rule: rule, value: value, fix: fix, prop: prop, key: key }); };
      if (C.spacing !== false) {
        var uaPad = /^(BUTTON|INPUT|SELECT)$/.test(n.tagName) && px(cs.paddingTop) === 1 && px(cs.paddingLeft) === 6;   // the browser's own button padding, never set by the design
        if (!uaPad) ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom'].forEach(function (p) {
          var v = px(cs[p]); if (spaceOk(v)) return; if (!allowed(S.spacing, v)) add('Spacing not on the scale', v + ' px', 'use ' + nearest(S.spacing, v), p, 'spacing');
        });
        if (/flex|grid/.test(cs.display)) ['rowGap', 'columnGap'].forEach(function (p) {
          var v = px(cs[p]); if (spaceOk(v)) return; if (!allowed(S.spacing, v)) add('Gap not on the scale', v + ' px', 'use ' + nearest(S.spacing, v), p, 'spacing');
        });
      }
      if (C.radius !== false) {
        var rv = cs.borderTopLeftRadius, rn = px(rv);
        if (rn > 0) { var full = /%/.test(rv) || rn >= Math.min(r.width, r.height) / 2 - 1 || rn >= 99;
          if (!(full && allowed(S.radius, 'full')) && !allowed(S.radius, rn)) add('Rounding not on the scale', rn + ' px', 'use ' + nearest(S.radius, rn) + (allowed(S.radius, 'full') ? ' or full' : ''), null, 'radius'); }
      }
      if (hasText(n) && !isIcon(n, cs)) {
        var fs = px(cs.fontSize), fw = parseInt(cs.fontWeight, 10);
        if (C.fontSize !== false && !allowed(S.fontSizes, fs)) add('Text size not on the scale', fs + ' px', 'use ' + nearest(S.fontSizes, fs), null, 'fontSize');
        if (C.fontWeight !== false && !allowed(S.fontWeights, fw)) add('Font weight not in the system', String(fw), 'use ' + S.fontWeights.join(', '), null, 'fontWeight');
        if (C.pureBlack !== false && /^rgba?\(0, 0, 0(, 1)?\)$/.test(cs.color)) add('Black text instead of the Text colour', '#000', 'use the Text colour token', null, 'pureBlack');
      }
      if (C.tap !== false && n.matches('button, a[href], [role=button], [role=tab], input[type=checkbox], input[type=radio], select') && !n.closest('p')) {
        var MIN = doc.documentElement.classList.contains('in-desktop') ? (S.minTapDesktop || S.minTap) : S.minTap, hs = hitSize(n, r, w);   // mouse screens (admin) use the desktop minimum
        if (hs.w < MIN - 0.5 || hs.h < MIN - 0.5) add('Tap area under ' + MIN + ' px', Math.round(hs.w) + ' × ' + Math.round(hs.h), 'make the tap area at least ' + MIN + ' × ' + MIN + ' (an invisible ::before can enlarge it without changing the look)', null, 'tap');
      }
    }
  }

  /* ---------- drawing ---------- */
  function groups(list) {
    var g = {}, order = [];
    (list || issues).forEach(function (it) { var k = it.rule + '|' + it.value; if (!g[k]) { g[k] = { key: k, rule: it.rule, value: it.value, fix: it.fix, els: [] }; order.push(k); } if (g[k].els.indexOf(it.el) < 0) g[k].els.push(it.el); });
    return order.map(function (k) { return g[k]; }).sort(function (a, b) { return b.els.length - a.els.length; });
  }
  function draw() {
    raf = 0; if (!on || !doc || !layer) return;
    var seen = [], h = '';
    function box(it, x) {
      if (seen.indexOf(it.el) >= 0) return; seen.push(it.el);
      var r = it.el.getBoundingClientRect(); if (r.bottom < 0 || r.top > doc.defaultView.innerHeight) return;
      h += '<div style="position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;outline:2px ' + (x ? 'dashed ' + BLUE : 'solid ' + RED) + ';outline-offset:-1px;background:' + (x ? 'rgba(37,99,235,.05)' : 'rgba(217,119,6,.06)') + '"></div>';
    }
    issues.forEach(function (it) { if (!focus || it.rule + '|' + it.value === focus) box(it, false); });
    excepts.forEach(function (it) { if (!focus || 'x|' + it.reason === focus) box(it, true); });
    layer.innerHTML = h;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
  function render() {
    var gs = groups(issues), count = 0; gs.forEach(function (g) { count += g.els.length; });
    var xs = {}, xo = []; excepts.forEach(function (it) { if (!xs[it.reason]) { xs[it.reason] = { reason: it.reason, rule: it.rule, els: [] }; xo.push(it.reason); } if (xs[it.reason].els.indexOf(it.el) < 0) xs[it.reason].els.push(it.el); });
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var h = '<h3>Rules check <span>' + (count ? count + ' difference' + (count > 1 ? 's' : '') + ' from the design system' : '') + (count && xo.length ? ' · ' : '') + (xo.length ? xo.length + ' approved exception' + (xo.length > 1 ? 's' : '') : '') + '</span></h3>';
    h += count ? '<ul>' + gs.map(function (g) {
      return '<li><button type="button" data-k="' + esc(g.key) + '" class="' + (focus === g.key ? 'is-on' : '') + '"><b>' + g.rule + ': ' + g.value + '</b> · ' + g.els.length + '×<small>' + g.fix + '. e.g. ' + g.els.slice(0, 2).map(name).join(', ') + '</small></button></li>';
    }).join('') + '</ul>' : '<p class="ok">This screen follows the design system.</p>';
    if (xo.length) h += '<p class="uirules__xh">Approved exceptions (bent on purpose)</p><ul>' + xo.map(function (k) { var x = xs[k];
      return '<li><button type="button" class="uirules__x' + (focus === 'x|' + k ? ' is-on' : '') + '" data-k="' + esc('x|' + k) + '"><b>' + x.rule + '</b> · ' + x.els.length + '×<small>' + esc(k) + '</small></button></li>'; }).join('') + '</ul>';
    panel.innerHTML = h;
  }
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]'); if (!b) return;
    var k = b.getAttribute('data-k'); focus = focus === k ? null : k; render(); draw();
    if (focus) { var first = issues.filter(function (it) { return it.rule + '|' + it.value === k; }).concat(excepts.filter(function (it) { return 'x|' + it.reason === k; }))[0]; if (first) first.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  });

  function run() { if (!on) return; attach(); scan(); render(); draw(); }
  function attach() {
    try { doc = frame.contentDocument; } catch (e) { doc = null; } if (!doc || !doc.body) return;
    if (!layer || layer.ownerDocument !== doc || !doc.contains(layer)) {
      layer = doc.createElement('div'); layer.setAttribute('data-uicheck', ''); layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646';
      doc.body.appendChild(layer);
      doc.defaultView.addEventListener('scroll', schedule, true); doc.defaultView.addEventListener('resize', schedule);
      if (mo) mo.disconnect();
      mo = new MutationObserver(function (m) { if (m.every(function (x) { return layer.contains(x.target); })) return; clearTimeout(timer); timer = setTimeout(run, 500); });
      mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
  }
  function stop() { if (mo) mo.disconnect(); mo = null; if (layer && layer.parentNode) layer.parentNode.removeChild(layer); layer = null; issues = []; focus = null; panel.hidden = true; }
  function set(v) { on = v; btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) { panel.hidden = false; run(); } else stop(); }

  btn.addEventListener('click', function () { set(!on); });
  frame.addEventListener('load', function () { layer = null; focus = null; if (on) setTimeout(run, 700); });
  function sync() { var dev = devBtn.classList.contains('is-on'); btn.hidden = !dev; if (!dev && on) set(false);
    var sb = document.getElementById('stdbtn'), sp = document.getElementById('stdpanel'); if (sb) { sb.hidden = !(dev || S.show === 'everyone'); if (sb.hidden && sp) sp.hidden = true; }
    var dl = document.getElementById('stddl'); if (dl) dl.hidden = !dev; }
  new MutationObserver(sync).observe(devBtn, { attributes: true, attributeFilter: ['class'] }); sync();

  /* the Design System button (beside Dev mode) and its panel. DESIGN_SYSTEM.show: 'dev' shows it only in dev mode, 'everyone' always */
  var stdBtn = document.getElementById('stdbtn'), stdPanel = document.getElementById('stdpanel'), stdFrame = document.getElementById('stdframe');
  if (stdBtn && stdPanel) {
    var openStd = function () { if (stdFrame.getAttribute('src') === 'about:blank') stdFrame.setAttribute('src', (S.page || 'pages/design-system.html') + '?panel'); stdPanel.hidden = false; document.getElementById('stdclose').focus(); };
    var closeStd = function () { stdPanel.hidden = true; stdBtn.focus(); };
    stdBtn.addEventListener('click', openStd);
    document.getElementById('stdclose').addEventListener('click', closeStd);
    stdPanel.addEventListener('click', function (e) { if (e.target === stdPanel) closeStd(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !stdPanel.hidden) closeStd(); });
  }
  window.DSCheck = window.UICheck = { run: function () { set(true); return groups().map(function (g) { return g.rule + ': ' + g.value + ' ×' + g.els.length; }); },
    exceptions: function () { set(true); return excepts.map(function (i) { return name(i.el) + ' ' + i.rule + ' ' + i.value + ' — ' + i.reason; }); },
    list: function () { set(true); return issues.map(function (i) { return name(i.el) + ' [' + (i.el.getAttribute('class') || '') + '] ' + i.rule + ' ' + i.value + (i.prop ? ' (' + i.prop + ')' : ''); }); } };   // for testing: every issue with its element
})();
