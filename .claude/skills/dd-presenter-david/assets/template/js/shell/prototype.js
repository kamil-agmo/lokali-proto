/* Presenter shell, driven by shell.config.js.
   - left card: accordion of pages, a Reset icon beside the logo, and "Replay"
   - centre: the screen (the page runs in an iframe, scaled to fit the window); device skills frame it
   - right card: summary of the page on screen (pages report which screen they are via ProtoEmbed.report)
   - lock screen: a full-page iframe over an inert shell; nothing can be reached until the password is in
   - reset: the Reset button (by the logo) clears what the screens stored and reopens the start page, still unlocked; Undo for 5 s
   - relock: from a screen (ProtoEmbed.relock): wipes sessionStorage and shows the lock screen
   Messages (names are prefixed with SHELL.prefix): page, unlocked, reset, relock, replay, nudge. */
(function () {
  'use strict';
  var S = window.SHELL, P = S.prefix, UNLOCK = P + '-unlocked';

  // Theme: SHELL.theme.accent re-colours the highlights. Everything else is neutral unless you opt in with the optional keys:
  // font (+ fontUrl to load it), radius (side cards, px) and pageBg. The prototype's own screens are never touched.
  (function () {
    var t = S.theme || {}, r = document.documentElement.style;
    if (t.accent) {
      r.setProperty('--accent', t.accent);
      r.setProperty('--accent-strong', t.accentStrong || 'color-mix(in srgb, ' + t.accent + ' 78%, black)');
    }
    if (t.font) r.setProperty('--font', t.font);
    if (t.radius != null) r.setProperty('--card-r', t.radius + 'px');
    if (t.pageBg) r.setProperty('--bg', t.pageBg);
    if (t.fontUrl) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = t.fontUrl; document.head.appendChild(l); }
  })();

  /* ---------- config check: say what is wrong instead of failing silently ---------- */
  (function () {
    var problems = [], listed = {};
    if (!S.pages || !Object.keys(S.pages).length) { console.error('[dd-presenter-david] shell.config.js has no pages.'); return; }
    if (!S.pages[S.startPage]) { problems.push('startPage "' + S.startPage + '" is not in pages (using "' + Object.keys(S.pages)[0] + '")'); S.startPage = Object.keys(S.pages)[0]; }
    (S.tree || []).forEach(function (n) { n.children.forEach(function (id) { listed[id] = 1; if (!S.pages[id]) problems.push('tree lists "' + id + '" but pages has no such id'); }); });
    Object.keys(S.pages).forEach(function (id) { if (!listed[id]) problems.push('page "' + id + '" is not in tree, so it will not appear in the left list'); });
    if (S.replay && !S.pages[S.replay.page]) { problems.push('replay.page "' + S.replay.page + '" is not in pages (Replay hidden)'); S.replay = null; }
    if (problems.length) console.error('[dd-presenter-david] shell.config.js: ' + problems.join('; ') + '.');
  })();
  var navEl = document.getElementById('pagenav'), summaryEl = document.getElementById('summary'), frame = document.getElementById('screen');
  var lockEl = document.getElementById('lockscreen'), shellEl = document.querySelector('.shell');
  // No lock password yet (password: null, the "set it after deploying" option): the shell opens straight away. Set one before sharing.
  if (!S.password) { try { sessionStorage.setItem(UNLOCK, '1'); } catch (e) {} if (window.console) console.warn('shell: no lock password set yet (shell.config.js). Anyone with the link can open this prototype.'); }
  var locked = true; try { locked = !sessionStorage.getItem(UNLOCK); } catch (e) {}
  var current = S.startPage, lastShown = null, openGroup = -1, built = false;

  // Brand block: the logo when there is one (the name stays as its accessible text), otherwise the name; the subtitle sits underneath either way.
  (function () {
    var logo = document.getElementById('brandLogo'), name = document.getElementById('brandName');
    document.getElementById('brandTag').textContent = S.tag || '';
    // The prototype's version (shell.config.js `version`), linking to its CHANGELOG.md; bumped on every deploy.
    if (S.version) {
      var ver = document.createElement('a'); ver.className = 'brand__ver'; ver.href = 'CHANGELOG.md'; ver.target = '_blank'; ver.rel = 'noopener';
      ver.textContent = 'v' + S.version; ver.title = 'Version ' + S.version + ': what changed';
      document.getElementById('brandTag').insertAdjacentElement('afterend', ver);
    }
    if (S.logo) { logo.src = S.logo; logo.alt = S.name; logo.hidden = false; name.hidden = true; } else name.textContent = S.name;
  })();
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- lock cover ---------- */
  function lockUI(on, first) {
    shellEl.inert = on; shellEl.setAttribute('aria-hidden', on ? 'true' : 'false');
    if (on) { lockEl.classList.remove('is-gone'); lockEl.hidden = false; if (!first) lockEl.setAttribute('src', 'pages/lock.html?' + Date.now()); }
    else { lockEl.classList.add('is-gone'); setTimeout(function () { if (!locked) { lockEl.hidden = true; lockEl.setAttribute('src', 'about:blank'); } }, 900); }
  }

  /* ---------- left card ---------- */
  var CHEV = '<span class="mi navgroup__chev" aria-hidden="true">chevron_right</span>';
  function buildNav() {
    navEl.innerHTML = (S.tree || []).map(function (n, i) {
      return '<section class="navgroup" data-group="' + i + '"><button class="navgroup__head" type="button" aria-expanded="false" aria-controls="ng-' + i + '"><span class="navgroup__label">' + esc(n.label) + '</span>' + CHEV + '</button>' +
        '<div class="navgroup__panel" id="ng-' + i + '"><div><ul class="navgroup__list">' +
        n.children.filter(function (id) { return S.pages[id]; }).map(function (id) { var p = S.pages[id]; return '<li><a class="navlink" href="#' + id + '" data-page="' + id + '"><span class="navlink__label">' + esc(p.title) + '</span></a></li>'; }).join('') +
        '</ul></div></div></section>';
    }).join('');
    built = true;
  }
  function groupOf(id) { for (var i = 0; i < (S.tree || []).length; i++) if (S.tree[i].children.indexOf(id) > -1) return i; return -1; }
  function updateNav() {
    navEl.querySelectorAll('.navgroup').forEach(function (g, i) {
      var on = i === openGroup; g.classList.toggle('is-open', on); g.classList.toggle('has-current', S.tree[i].children.indexOf(current) > -1);
      g.querySelector('.navgroup__head').setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    navEl.querySelectorAll('[data-page]').forEach(function (a) {
      var on = a.dataset.page === current; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- right card ---------- */
  function renderSummary(facts, animate) {
    var p = S.pages[current], html = '<div><p class="summary__crumb">' + esc(p.group === p.title ? 'Screen' : p.group) + '</p><h2 class="summary__title">' + esc(p.title) + '</h2></div><p class="summary__desc">' + esc(p.desc || '') + '</p>';
    if (p.parts && p.parts.length) html += '<section class="block"><h3>On this screen</h3><ul class="parts">' + p.parts.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    // the live values a screen reports (ProtoEmbed.report) are state for checking the prototype, not for viewers:
    // they are not shown here; add-ons get them through the <prefix>:facts event and Shell.facts() (dev mode shows them as Live state)
    summaryEl.innerHTML = html;
    if (animate) { summaryEl.classList.remove('is-in'); void summaryEl.offsetWidth; summaryEl.classList.add('is-in'); }
  }
  var lastFacts = [];
  function show(id, facts) {
    var changed = id !== lastShown; current = id; lastShown = id;
    window.dispatchEvent(new CustomEvent(P + ':show', { detail: { id: id, changed: changed } }));   // add-ons (dd-desktop-kamil) react before the page loads
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    if (!built) buildNav(); if (changed) openGroup = groupOf(id);
    updateNav(); renderSummary(facts, changed);
    lastFacts = facts || []; window.dispatchEvent(new CustomEvent(P + ':facts', { detail: { id: id, facts: lastFacts } }));
  }
  function go(id) { if (locked || !S.pages[id]) return; show(id); frame.setAttribute('src', S.pages[id].src); }

  navEl.addEventListener('click', function (e) {
    var h = e.target.closest('.navgroup__head'); if (h) { var g = +h.parentNode.dataset.group; openGroup = openGroup === g ? -1 : g; updateNav(); return; }
    var a = e.target.closest('[data-page]'); if (!a) return; e.preventDefault(); go(a.dataset.page);
  });

  /* ---------- replay ---------- */
  var replayBtn = document.getElementById('replay');
  function replay() { if (locked || !S.replay) return; var p = S.pages[S.replay.page]; frame.setAttribute('src', p.src + (S.replay.query || '')); show(S.replay.page); }
  if (S.replay) { document.getElementById('replayLabel').textContent = S.replay.label || 'Replay'; replayBtn.addEventListener('click', replay); } else replayBtn.hidden = true;

  /* ---------- reset: start the prototype again, staying unlocked ----------
     Clears what the screens stored (sessionStorage keys that do not start with the shell's prefix), so likes, sign-in and edits
     are gone, and reopens the start page. The shell's and add-ons' own keys (<prefix>-unlocked, <prefix>-dev, <prefix>-device,
     <prefix>:designer) stay. A toast offers Undo for a few seconds. Closing the tab is what locks the prototype again. */
  var toastEl = null, toastT = 0;
  function toast(text, action, fn) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'shelltoast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(text) + '</span>' + (action ? '<button type="button">' + esc(action) + '</button>' : '');
    if (action) toastEl.querySelector('button').addEventListener('click', function () { hideToast(); fn(); });
    toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(hideToast, 5000);
  }
  function hideToast() { if (toastEl) toastEl.classList.remove('is-on'); }
  function open(id) {   // always a fresh load: pages that share one document (home.html#/a, home.html#/b) would otherwise keep their in-memory state
    var p = S.pages[id]; if (!p) return;
    var same = false; try { same = frame.contentWindow.location.pathname === new URL(p.src, location.href).pathname; } catch (e) {}
    frame.setAttribute('src', p.src); if (same) { try { frame.contentWindow.location.reload(); } catch (e) {} }
    show(id);
  }
  function reset() {
    if (locked) return;
    var saved = {}, before = current;
    try {
      for (var i = sessionStorage.length - 1; i >= 0; i--) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(S.prefix) !== 0) { saved[k] = sessionStorage.getItem(k); sessionStorage.removeItem(k); }
      }
    } catch (e) {}
    window.dispatchEvent(new Event(P + ':reset'));             // add-ons can clear their own per-run state
    openGroup = -1; lastShown = null; open(S.startPage);
    toast('Prototype reset', 'Undo', function () {
      try { for (var k in saved) sessionStorage.setItem(k, saved[k]); } catch (e) {}
      lastShown = null; open(before);
    });
  }
  var resetBtn = document.getElementById('reset');
  if (resetBtn) resetBtn.addEventListener('click', reset);
  // a screen's own "lock" control (ProtoEmbed.relock) still locks: it clears everything and shows the lock screen
  function relock() {
    try { sessionStorage.clear(); } catch (e) {}
    window.dispatchEvent(new Event(P + ':relock'));            // other tools (dev mode) switch themselves off
    locked = true; current = S.startPage; lastShown = null; openGroup = -1;
    frame.setAttribute('src', 'about:blank'); lockUI(true); show(current); history.replaceState(null, '', location.pathname);
  }

  /* ---------- messages from the pages and the lock screen ---------- */
  // Only our own two iframes (the lock screen and the phone) may talk to the shell, and only from the same origin.
  window.addEventListener('message', function (e) {
    if (location.origin !== 'null' && e.origin !== location.origin) return;
    var m = e.data; if (!m || typeof m.type !== 'string' || m.type.indexOf(P + ':') !== 0) return;
    var t = m.type.slice(P.length + 1), fromLock = e.source === lockEl.contentWindow, fromScreen = e.source === frame.contentWindow;
    if (t === 'unlocked' && fromLock) { locked = false; lockUI(false); frame.setAttribute('src', S.pages[S.startPage].src); show(S.startPage); return; }
    if (locked || !fromScreen) return;
    if (t === 'relock') relock();
    else if (t === 'reset') reset();
    else if (t === 'replay') replay();
    else if (t === 'page' && S.pages[m.id]) show(m.id, m.facts);
  });

  /* ---------- fit the screen (and its frame, if a device skill added one) to the window ---------- */
  var phone = document.getElementById('phone'), stage = document.getElementById('stage');
  function fit() {
    if (shellEl.classList.contains('is-fullwindow')) { phone.style.transform = ''; stage.style.width = ''; shellEl.style.setProperty('--phone-top', '0px'); return; }   // an add-on shows the page full-window
    var shown = function (sel) { var el = document.querySelector(sel); return el && getComputedStyle(el).display !== 'none'; };
    var sideW = parseFloat(getComputedStyle(shellEl).getPropertyValue('--side-w')) || 420;
    var room = innerWidth - 40 - (shown('.side--left') ? sideW + 40 : 0) - (shown('.side--right') ? sideW + 40 : 0);
    var s = Math.max(0.3, Math.min(1, (innerHeight - 40 - 32) / phone.offsetHeight, (room - 12) / phone.offsetWidth));
    phone.style.transform = 'scale(' + s + ')'; stage.style.width = Math.round(phone.offsetWidth * s) + 'px';
    shellEl.style.setProperty('--phone-top', Math.max(0, (innerHeight - 40 - phone.offsetHeight * s) / 2) + 'px');
  }
  window.addEventListener('resize', fit); fit();
  // For add-ons: the shell element, the screen iframe, fit(), the tree group of a page and the page on show
  window.Shell = { el: shellEl, frame: frame, fit: fit, groupOf: groupOf, current: function () { return current; }, facts: function () { return lastFacts; } };

  /* ---------- links by address: #page-id opens that page ---------- */
  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1); if (locked) { history.replaceState(null, '', location.pathname); return; }
    if (S.pages[id] && id !== current) go(id);
  });
  var start = location.hash.slice(1);
  if (locked) { lockUI(true, true); frame.setAttribute('src', 'about:blank'); show(current); history.replaceState(null, '', location.pathname); }
  else { lockEl.hidden = true; lockEl.setAttribute('src', 'about:blank'); if (S.pages[start]) current = start; frame.setAttribute('src', S.pages[current].src); show(current); }
})();
