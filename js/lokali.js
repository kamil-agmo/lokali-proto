/* Lokali shared behaviour. Load in <head> (after lock-guard.js) so shared behaviour applies before paint.
   Declarative hooks (no per-page JS needed):
     data-go="page-id"            navigate (through the shell when embedded, else page-id.html)
     data-tabs="guest|host" data-active="page-id"   on an empty <nav class="tabbar">: renders the tab bar
     data-admin-nav="page-id"     on an empty <aside class="a-side">: renders the admin sidebar
     data-group                   on a container: its .chip / button children toggle .active (single choice); add data-multi for multi
     data-panel="#id"             inside a data-group: shows #id and hides the other panels of that group
     data-open="#sheet" / data-close   bottom sheets (.sheet + .scrim) and admin drawers/modals
     data-toast="text"            shows a toast on click
     data-show="#id" / data-hide="#id" / data-toggle="#id"  show/hide elements
     .switch, .check, .radio-card (inside [data-radio]), [data-stepper] (min/max)  toggle themselves */
(function () {
  'use strict';
  var html = document.documentElement;
  try { localStorage.removeItem('lokali-notes'); } catch (e) {} /* the reviewer-notes switch was removed (27 Nov); clear its old setting */

  var L = window.L = window.L || {};
  /* Lokali logo (27 Nov): every .wordmark becomes the wordmark SVG from assets/brand; white on dark backgrounds, green elsewhere */
  var BRAND = (function () { try { return new URL('../assets/brand/', document.currentScript.src).href; } catch (e) { return '../assets/brand/'; } })();
  L.wordmarkStyle = 'humanist'; /* 'geometric' is the other option in assets/brand */
  L.applyWordmark = function () {
    document.querySelectorAll('.wordmark').forEach(function (w) {
      var c = getComputedStyle(w).color.replace(/\s/g, ''), light = /^rgba?\(255,255,255/.test(c);
      w.innerHTML = '<img class="wordmark__img" src="' + BRAND + 'wordmark-' + L.wordmarkStyle + '-' + (light ? 'white' : 'green') + '.svg" alt="Lokali">';
    });
  };
  document.addEventListener('DOMContentLoaded', function () { L.applyWordmark(); });
  L.go = function (id) {
    if (!id) return;
    var embedded = false; try { embedded = window.parent !== window && !!window.parent.SHELL; } catch (e) {}
    if (embedded && !window.parent.SHELL.pages[id]) { window.open(new URL((id.indexOf('a-') === 0 ? 'admin.html' : 'index.html') + '#' + id, window.parent.location.href).href, '_blank', 'noopener'); return; }   // the page lives in the other link (index.html / admin.html)
    try { sessionStorage.setItem('lk-nav-intent', id); } catch (e) {}   /* marks an in-app move, so the next page joins the back history */
    if (embedded) window.parent.location.hash = id; else location.href = id + '.html';
  };

  /* Back follows the path actually taken (27 Nov, flow-logic rule): each screen reached inside the app is added to a history;
     a Back / Close with data-go returns to the previous screen in it, and only falls back to its data-go when there is none
     (opened from the presenter menu or directly). Tab bar taps start a new history at that tab. */
  (function () {
    var me = (location.pathname.split('/').pop() || '').replace(/\.html$/, ''); if (!me) return;
    function get() { try { return JSON.parse(sessionStorage.getItem('lk-nav') || '[]'); } catch (e) { return []; } }
    function put(a) { try { sessionStorage.setItem('lk-nav', JSON.stringify(a.slice(-30))); } catch (e) {} }
    var intent = null; try { intent = sessionStorage.getItem('lk-nav-intent'); sessionStorage.removeItem('lk-nav-intent'); } catch (e) {}
    var ref = (document.referrer.split('#')[0].split('?')[0].split('/').pop() || '').replace(/\.html$/, '');
    var fromPage = /^[gha]-/.test(ref) && document.referrer.indexOf('/pages/') > -1;
    var st = get();
    if (intent === 'back:' + me) { while (st.length && st[st.length - 1] !== me) st.pop(); if (!st.length) st = [me]; }
    else if (intent === 'root:' + me) st = [me];
    else if (intent === me || fromPage) { if (st[st.length - 1] !== me) st.push(me); }
    else st = [me];                                   /* presenter menu, reload or direct open */
    /* one-off steps leave the history once passed: Back from Checkout goes to Choose date, not Sign in;
       a finished booking or application never leads Back into its form */
    var DONE = { 'g-checkout': ['g-signin'], 'g-confirmed': ['g-book', 'g-signin', 'g-checkout'], 'h-status': ['h-intro', 'h-signup'] };
    if (DONE[me]) st = st.filter(function (x, i) { return i === st.length - 1 || DONE[me].indexOf(x) < 0; });
    put(st);
    L.navPrev = function () { var a = get(); return a.length > 1 ? a[a.length - 2] : null; };
    L.back = function (fallback) {                    /* go to the previous screen in the history, else to fallback */
      var prev = L.navPrev(); if (!prev) { if (fallback) L.go(fallback); return; }
      var a = get(); a.pop(); put(a);
      try { sessionStorage.setItem('lk-nav-intent', 'back:' + prev); } catch (e2) {}
      var embedded = false; try { embedded = window.parent !== window && !!window.parent.SHELL; } catch (e3) {}
      if (embedded) window.parent.location.hash = prev; else location.href = prev + '.html';
    };
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[aria-label="Back"], [aria-label="Close"]'); if (!b) return;
      var fixed = b.getAttribute('data-go') || ((b.getAttribute('onclick') || '').indexOf('L.go(') > -1 ? '*' : null); if (!fixed) return;
      if (!L.navPrev()) return;                       /* no history: the button's own target runs */
      e.preventDefault(); e.stopPropagation(); L.back();
    }, true);
    document.addEventListener('click', function (e) {   /* tab bar: a new history starts at that tab */
      var t = e.target.closest && e.target.closest('.tabbar [data-go]'); if (!t) return;
      setTimeout(function () { try { sessionStorage.setItem('lk-nav-intent', 'root:' + t.getAttribute('data-go')); } catch (e2) {} }, 0);
    }, true);
  })();
  /* Host mode switch (27 Nov, suggestion extending Q13): a one-second "Switching to …" moment, then the other mode's first screen.
     Switching to guest marks the account as an approved host, so guest Home shows the Hosting pill. */
  L.switchMode = function (to, page) {   /* page: the screen to open in the new mode (default its first tab) */
    var host = to === 'host', ov = document.createElement('div');
    ov.className = 'mode-switch'; ov.setAttribute('role', 'status');
    ov.innerHTML = '<span class="mode-switch__me"><img src="' + L.img('1545266241-3516e2a6e016', 200) + '" alt=""><i class="ph-fill ph-seal-check" aria-hidden="true"></i></span><b>' + (host ? 'Switching to hosting' : 'Switching to guest') + '</b><small>' + (host ? 'Listings, bookings and earnings' : 'Trips and bookings') + '</small><span class="mode-switch__bar"><i></i></span>';
    if (!host) L.state.set('hostStatus', 'approved');
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('is-in'); });
    setTimeout(function () { var dest = page || (host ? 'h-home' : 'g-home'); L.go(dest); try { sessionStorage.setItem('lk-nav-intent', 'root:' + dest); } catch (e) {} }, 1000);
  };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-switch]'); if (!b) return; e.preventDefault(); e.stopPropagation(); L.switchMode(b.getAttribute('data-switch'), b.getAttribute('data-switch-to')); }, true);
  L.img = function (id, w) { return 'https://images.unsplash.com/photo-' + id + '?w=' + (w || 800) + '&q=70&auto=format&fit=crop'; };
  L.rm = function (n, dp) { var d = dp === undefined ? (n % 1 ? 2 : 0) : dp; return 'RM ' + Number(n).toLocaleString('en-MY', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  L.toast = function (msg, icon) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = '<i class="ph-fill ' + (icon || 'ph-check-circle') + '" aria-hidden="true"></i><span></span>';
    t.lastChild.textContent = msg; t.classList.add('show');
    clearTimeout(L._tt); L._tt = setTimeout(function () { t.classList.remove('show'); }, 2400);
  };
  L.state = {
    get: function (k, d) { try { var v = sessionStorage.getItem('lokali:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { sessionStorage.setItem('lokali:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* guest chat read-state (session): unread threads become read when opened */
  L.UNREAD = ['rahim', 'jenny'];
  /* host inbox (Aina hosting): Nur Aisyah's thread starts unread; h-chat marks it read in lk-h-read */
  L.hunread = function () { var r = []; try { r = JSON.parse(sessionStorage.getItem('lk-h-read') || '[]'); } catch (e) {} return ['aisyah'].filter(function (k) { return r.indexOf(k) < 0; }).length; };
  L.readSet = function () { try { return JSON.parse(sessionStorage.getItem('lk-read') || '[]'); } catch (e) { return []; } };
  L.markRead = function (k) { var r = L.readSet(); if (r.indexOf(k) < 0) { r.push(k); try { sessionStorage.setItem('lk-read', JSON.stringify(r)); } catch (e) {} } };
  L.isUnread = function (k) { return L.UNREAD.indexOf(k) > -1 && L.readSet().indexOf(k) < 0; };
  L.unread = function () { return L.UNREAD.filter(L.isUnread).length; };
  var TABS = {
    guest: [
      ['g-home', 'Explore', 'ph-magnifying-glass'], ['g-bookings', 'Bookings', 'ph-ticket'],
      ['g-inbox', 'Inbox', 'ph-chat-circle-dots', 'GUNREAD'], ['g-account', 'Account', 'ph-user-circle']
    ],
    host: [
      ['h-home', 'Today', 'ph-sun-horizon'], ['h-calendar', 'Calendar', 'ph-calendar-blank'], ['h-listings', 'Listings', 'ph-squares-four'],
      ['h-inbox', 'Inbox', 'ph-chat-circle-dots', 'HUNREAD'], ['h-menu', 'Menu', 'ph-list']
    ]
  };
  var ADMIN = [
    ['', 'Overview'],
    ['a-dashboard', 'Dashboard', 'ph-chart-pie-slice'],
    ['a-approvals', 'Approvals', 'ph-seal-check', 6],
    ['', 'Operations'],
    ['a-bookings', 'Bookings', 'ph-ticket'],
    ['a-hosts', 'Hosts', 'ph-users-three'],
    ['a-listings', 'Listings', 'ph-squares-four'],
    ['a-payouts', 'Payouts', 'ph-bank'],
    ['a-moderation', 'Moderation', 'ph-shield-warning', 4],
    ['a-enquiries', 'Corporate enquiries', 'ph-buildings', 5],
    ['', 'Site'],
    ['a-content', 'Content', 'ph-layout'],
    ['a-reports', 'Reports', 'ph-chart-line-up'],
    ['', 'Settings'],
    ['a-fees', 'Fees & policies', 'ph-percent'],
    ['a-team', 'Team & roles', 'ph-user-gear']
  ];
  // which sidebar item a detail page belongs to
  var ADMIN_PARENT = { 'a-review': 'a-approvals', 'a-host': 'a-hosts', 'a-listing': 'a-listings', 'a-booking': 'a-bookings' };

  function renderTabs(nav) {
    var set = TABS[nav.getAttribute('data-tabs')] || [], act = nav.getAttribute('data-active');
    nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = set.map(function (t) {
      var on = t[0] === act;
      return '<a href="' + t[0] + '.html" data-go="' + t[0] + '" aria-label="' + t[1] + '"' + (on ? ' class="active" aria-current="page"' : '') + '><i class="' + (on ? 'ph-fill ' : 'ph ') + t[2] + '" aria-hidden="true"></i><span class="lbl">' + t[1] + '</span>' + (function (n) { n = n === 'GUNREAD' ? L.unread() : n === 'HUNREAD' ? L.hunread() : n; return n ? '<span class="count" aria-label="' + n + ' unread">' + n + '</span>' : ''; })(t[3]) + '</a>';
    }).join('');
    document.body.classList.add('has-tabbar');
    /* sliding pill: an indicator travels from the previous tab's spot to the new one */
    var ind = document.createElement('span'); ind.className = 'tab-ind'; ind.setAttribute('aria-hidden', 'true'); nav.prepend(ind);
    var cur = nav.querySelector('a.active');
    function place(r, anim) { ind.style.transition = anim ? '' : 'none'; ind.style.left = r.left + 'px'; ind.style.width = r.width + 'px'; }
    function rectOf(a) { var nb = nav.getBoundingClientRect(), b = a.getBoundingClientRect(); return { left: b.left - nb.left, width: b.width }; }
    if (cur) requestAnimationFrame(function () {
      var to = rectOf(cur), from = null;
      try { from = JSON.parse(sessionStorage.getItem('lk-tab-from') || 'null'); sessionStorage.removeItem('lk-tab-from'); } catch (e) {}
      var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (from && from.set === nav.getAttribute('data-tabs') && !calm) { place(from, false); nav.classList.add('sliding'); ind.getBoundingClientRect(); place(to, true); setTimeout(function () { nav.classList.remove('sliding'); }, 380); }
      else place(to, false);
      ind.classList.add('on');
    });
    nav.addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a || a.classList.contains('active') || !cur) return; var r = rectOf(cur); r.set = nav.getAttribute('data-tabs'); try { sessionStorage.setItem('lk-tab-from', JSON.stringify(r)); } catch (x) {} }, true);
  }
  function renderAdmin(aside) {
    var act = aside.getAttribute('data-admin-nav'); act = ADMIN_PARENT[act] || act;
    var h = '<div class="a-brand"><span class="wordmark"><i class="ph-fill ph-leaf" aria-hidden="true"></i>lokali</span><span class="a-brand__tag">Admin</span></div><nav class="a-nav" aria-label="Admin">';
    ADMIN.forEach(function (t) {
      if (!t[0]) { h += '<div class="a-nav__label">' + t[1] + '</div>'; return; }
      var on = t[0] === act;
      h += '<a href="' + t[0] + '.html" data-go="' + t[0] + '"' + (on ? ' class="active" aria-current="page"' : '') + '><i class="' + (on ? 'ph-fill ' : 'ph ') + t[2] + '" aria-hidden="true"></i><span>' + t[1] + '</span>' + (t[3] ? '<em>' + t[3] + '</em>' : '') + '</a>';
    });
    h += '</nav><div class="a-user"><img class="avatar sm" src="' + L.img('1600481176431-47ad2ab2745d', 120) + '" alt=""><div><b>Nurul Huda</b><small>Operations</small></div><button class="icon-btn" data-go="a-login" aria-label="Sign out"><i class="ph ph-sign-out" aria-hidden="true"></i></button></div>';
    aside.innerHTML = h;
    if (L.applyWordmark) L.applyWordmark();   /* new Lokali logo in the admin sidebar too */
  }

  function closest(el, sel) { while (el && el !== document) { if (el.matches && el.matches(sel)) return el; el = el.parentNode; } return null; }
  function openLayer(sel) {
    var s = document.querySelector(sel); if (!s) return;
    var scrim = document.querySelector('.scrim');
    if (!scrim) { scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.setAttribute('data-close', ''); document.body.appendChild(scrim); }
    s.removeAttribute('hidden'); s.getBoundingClientRect(); scrim.getBoundingClientRect(); /* reflow first so the slide-up runs on the first open too */
    s.classList.add('open'); scrim.classList.add('open');
  }
  function closeLayers() { document.querySelectorAll('.sheet.open, .scrim.open, .a-drawer.open, .a-modal.open').forEach(function (x) { x.classList.remove('open'); }); }
  L.open = openLayer; L.close = closeLayers;

  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = closest(t, '[data-open]'))) { e.preventDefault(); openLayer(el.getAttribute('data-open')); }
    if ((el = closest(t, '[data-close]'))) { e.preventDefault(); closeLayers(); }
    if ((el = closest(t, '[data-show]'))) { document.querySelectorAll(el.getAttribute('data-show')).forEach(function (x) { x.hidden = false; }); }
    if ((el = closest(t, '[data-hide]'))) { document.querySelectorAll(el.getAttribute('data-hide')).forEach(function (x) { x.hidden = true; }); }
    if ((el = closest(t, '[data-toggle]'))) { document.querySelectorAll(el.getAttribute('data-toggle')).forEach(function (x) { x.hidden = !x.hidden; }); }
    if ((el = closest(t, '.switch'))) { el.setAttribute('aria-checked', el.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); el.dispatchEvent(new Event('change', { bubbles: true })); }
    if ((el = closest(t, '.check'))) { el.classList.toggle('on'); el.setAttribute('aria-checked', el.classList.contains('on')); el.dispatchEvent(new Event('change', { bubbles: true })); }
    if ((el = closest(t, '[data-radio] .radio-card, [data-radio] [data-value]'))) {
      var g = closest(el, '[data-radio]'); g.querySelectorAll('.active').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-checked', 'false'); });
      el.classList.add('active'); el.setAttribute('aria-checked', 'true'); g.dispatchEvent(new CustomEvent('pick', { bubbles: true, detail: el.getAttribute('data-value') }));
    }
    var grp = closest(t, '[data-group]');
    if (grp && !closest(t, '[data-go]')) {
      var item = t; while (item && item.parentNode !== grp) item = item.parentNode;
      if (item && item.nodeType === 1 && (item.tagName === 'BUTTON' || item.classList.contains('chip') || item.hasAttribute('data-panel'))) {
        if (grp.hasAttribute('data-multi')) { item.classList.toggle('active'); item.setAttribute('aria-pressed', item.classList.contains('active')); }
        else {
          grp.querySelectorAll('.active').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
          item.classList.add('active'); item.setAttribute('aria-pressed', 'true');
          grp.querySelectorAll('[data-panel]').forEach(function (b) { var p = document.querySelector(b.getAttribute('data-panel')); if (p) p.hidden = b !== item; });
        }
        grp.dispatchEvent(new CustomEvent('pick', { bubbles: true, detail: item.getAttribute('data-value') || item.textContent.trim() }));
      }
    }
    if ((el = closest(t, '[data-stepper] button'))) {
      var st = closest(el, '[data-stepper]'), out = st.querySelector('output'), v = +out.textContent, mn = +(st.getAttribute('data-min') || 0), mx = +(st.getAttribute('data-max') || 99);
      v = Math.max(mn, Math.min(mx, v + (el.hasAttribute('data-inc') ? 1 : -1))); out.textContent = v;
      st.querySelector('[data-dec]').disabled = v <= mn; st.querySelector('[data-inc]').disabled = v >= mx;
      st.dispatchEvent(new CustomEvent('step', { bubbles: true, detail: v }));
    }
    if ((el = closest(t, '[data-toast]'))) { e.preventDefault(); L.toast(el.getAttribute('data-toast'), el.getAttribute('data-toast-icon')); }
    if ((el = closest(t, '[data-go]'))) { e.preventDefault(); L.go(el.getAttribute('data-go')); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLayers(); });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('nav[data-tabs]').forEach(renderTabs);
    document.querySelectorAll('[data-admin-nav]').forEach(renderAdmin);
    document.querySelectorAll('[data-stepper]').forEach(function (st) {
      var v = +st.querySelector('output').textContent, mn = +(st.getAttribute('data-min') || 0), mx = +(st.getAttribute('data-max') || 99);
      st.querySelector('[data-dec]').disabled = v <= mn; st.querySelector('[data-inc]').disabled = v >= mx;
    });
    document.querySelectorAll('img[data-img]').forEach(function (im) { im.src = L.img(im.getAttribute('data-img'), +(im.getAttribute('data-w') || 800)); if (!im.hasAttribute('alt')) im.alt = ''; im.loading = 'lazy'; });
    if (document.querySelector('.cta-bar')) document.body.classList.add('has-cta');
    // spot art (js/art.js): <div data-art="name"></div>
    if (L.art) document.querySelectorAll('[data-art]').forEach(function (el) { var f = L.art[el.getAttribute('data-art')]; if (f) el.innerHTML = f(); });
    // motion (25 Nov): auto-reveal cards and sections on phone screens, staggered within each group; fade images in once loaded; pulse values that change
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.body.classList.contains('m') && !calm) {
      var auto = document.querySelectorAll('.card, .card-row, .q-card, .exp-card, .list, .lst, .bcard, .cat2, .wte figure, .it, .qs-i, .wb-t, .et-c, .gt-w, .fd-i, .inc-card, .s-trend, .s-place, .money-card');
      auto.forEach(function (el) {
        if (el.closest('.sheet, .reveal, .cta-bar, .tabbar') || el.classList.contains('reveal')) return;
        var sib = [].indexOf.call(el.parentNode.children, el);
        el.classList.add('reveal'); el.style.setProperty('--d', Math.min(sib, 6) * 60 + 'ms');
      });
      document.querySelectorAll('img').forEach(function (im) {
        if (im.complete && im.naturalWidth) return;
        im.classList.add('img-in'); im.addEventListener('load', function () { im.classList.add('loaded'); }, { once: true });
      });
      var live = document.querySelectorAll('.q-val, .card-val, .f-head span, #show-t, #f-show, #p-out, #fv-price, .refund-big, #total, #sumdate');
      if ('MutationObserver' in window) live.forEach(function (el) {
        new MutationObserver(function () { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }
    // scroll reveal: add .reveal to any block
    var rv = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
      rv.forEach(function (el) { io.observe(el); });
    } else rv.forEach(function (el) { el.classList.add('in'); });
    // count-up numbers: <b data-count="412000" data-prefix="RM " data-k></b>
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var end = +el.getAttribute('data-count'), pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '', t0 = null, dur = 1400;
      function fmt(v) { return pre + Math.round(v).toLocaleString('en-MY') + suf; }
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(end); return; }
      function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur); el.textContent = fmt(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
      el.textContent = fmt(0); requestAnimationFrame(step);
    });
  });

  /* Celebrations (25 Nov): <div data-celebrate="full|medium|small"></div>
     full = check + ripples + leaves + confetti + haptic · medium = check + ripple + leaves · small = check pop only.
     Plays when the element becomes visible (works for hidden "done" states). Tap to replay. Numbers inside the same block
     with data-cel-count="404.25" (data-prefix="RM ") count up. Reduced motion shows the end state. */
  L.celebrate = function (host) {
    var lvl = host.getAttribute('data-celebrate') || 'medium', calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var leaves = lvl === 'small' ? [] : [[40, 40, -30], [160, 36, 30], [24, 96, -60], [176, 92, 60], [100, 18, 0], [70, 120, -15], [132, 122, 15]];
    host.classList.add('cel', 'cel--' + lvl); host.setAttribute('aria-hidden', 'true');
    host.innerHTML = '<svg viewBox="0 0 200 140" class="cel-svg">' + (lvl !== 'small' ? '<circle class="c-wave" cx="100" cy="72" r="26"/>' + (lvl === 'full' ? '<circle class="c-wave w2" cx="100" cy="72" r="26"/>' : '') : '') +
      '<circle class="c-halo" cx="100" cy="72" r="40"/><circle class="c-dot" cx="100" cy="72" r="26"/><path class="c-check" d="M88 72 l8 8 l16 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      leaves.map(function (l, i) { return '<g class="c-leaf" style="--fx:' + (100 - l[0]) + 'px;--fy:' + (72 - l[1]) + 'px;--i:' + i + '"><path transform="translate(' + l[0] + ' ' + l[1] + ') rotate(' + l[2] + ')" d="M0 -10 C7 -6 7 6 0 10 C-7 6 -7 -6 0 -10Z" style="fill:var(' + (i % 2 ? '--accent' : '--olive') + ')"/></g>'; }).join('') +
      '</svg><div class="cel-burst"></div>';
    function confetti() {
      if (calm || lvl !== 'full') return;
      var burst = host.querySelector('.cel-burst'), cols = ['var(--primary)', 'var(--accent)', 'var(--olive)', 'var(--glow)', 'var(--primary-tint)'];
      for (var k = 0; k < 42; k++) {
        var p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 150, leaf = k % 3 === 0;
        p.style.cssText = 'width:' + (leaf ? 7 : 4 + Math.random() * 4) + 'px;height:' + (leaf ? 12 : 6 + Math.random() * 6) + 'px;background:' + cols[k % 5] + ';' + (leaf ? 'border-radius:50% 0 50% 0;' : k % 4 === 1 ? 'border-radius:50%;' : '');
        burst.appendChild(p);
        var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 40, rot = Math.random() * 720 - 360;
        p.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(' + dx * .8 + 'px,' + dy * .8 + 'px) rotate(' + rot * .6 + 'deg)', opacity: 1, offset: .45 }, { transform: 'translate(' + dx + 'px,' + (dy + 160) + 'px) rotate(' + rot + 'deg)', opacity: 0 }],
          { duration: 1400 + Math.random() * 700, delay: 380 + Math.random() * 120, easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
      }
      if (navigator.vibrate) try { navigator.vibrate([12, 40, 18]); } catch (e) {}
    }
    function counts() {
      var scope = host.closest('section, main, .done-hero, .card') || document;
      scope.querySelectorAll('[data-cel-count]').forEach(function (el) {
        var end = +el.getAttribute('data-cel-count'), pre = el.getAttribute('data-prefix') || '', dp = String(el.getAttribute('data-cel-count')).indexOf('.') > -1 ? 2 : 0, t0 = null;
        var fmt = function (v) { return pre + v.toLocaleString('en-MY', { minimumFractionDigits: dp, maximumFractionDigits: dp }); };
        if (calm) { el.textContent = fmt(end); return; }
        el.textContent = fmt(0);
        setTimeout(function () { requestAnimationFrame(function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 900); el.textContent = fmt(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }); }, lvl === 'small' ? 250 : 650);
      });
    }
    function play() { host.querySelectorAll('.c-halo,.c-dot,.c-check,.c-wave,.c-leaf').forEach(function (n) { n.style.animation = 'none'; n.getBoundingClientRect(); n.style.animation = ''; }); confetti(); }
    confetti(); counts();
    host.addEventListener('click', play);
  };

  /* iOS action sheet for leaving the app (maps, camera) — replaces "Opening…" toasts */
  var SHEETS = {
    maps: { title: 'Get directions', items: [['Google Maps', '', 'https://www.google.com/maps/search/?api=1&query=Kampung+Kuantan+Kuala+Selangor', '<svg class="gt-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#EA4335"/><path d="M5 9c0 1.6.6 3.4 1.5 5.1L12 9V2C8.1 2 5 5.1 5 9z" fill="#4285F4" opacity=".9"/><path d="M12 2v7l5.6 5C18.5 12.4 19 10.6 19 9c0-3.9-3.1-7-7-7z" fill="#FBBC04"/><path d="M6.5 14.1C8.5 17.9 12 22 12 22l5.6-8L12 9z" fill="#34A853"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>'], ['Waze', '', 'https://waze.com/ul?q=Kampung%20Kuantan%20Kuala%20Selangor', '<svg class="gt-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C7 3 3.5 6.4 3.5 10.6c0 1.6-.6 2.7-1.5 3.4.8.9 2.1 1.5 3.4 1.6.9 1.6 3.4 3.1 6.6 3.1 4.9 0 8.5-3.4 8.5-7.9S16.9 3 12 3z" fill="#33CCFF" stroke="#1d1d1d" stroke-width="1.3"/><circle cx="9.3" cy="9.5" r="1.1" fill="#1d1d1d"/><circle cx="14.7" cy="9.5" r="1.1" fill="#1d1d1d"/><path d="M8.8 12.5c1.6 1.8 4.8 1.8 6.4 0" fill="none" stroke="#1d1d1d" stroke-width="1.3" stroke-linecap="round"/><circle cx="7.5" cy="19.5" r="1.8" fill="#1d1d1d"/><circle cx="16" cy="19.5" r="1.8" fill="#1d1d1d"/></svg>']] },
    camera: { title: 'Add a photo', items: [['Take photo', 'ph-camera'], ['Choose from library', 'ph-images']] },
    video: { title: 'Add a video', items: [['Record video (up to 60 s)', 'ph-video-camera'], ['Choose from library', 'ph-film-strip']] }
  };
  L.actionSheet = function (kind, only) {
    var d = SHEETS[kind]; if (!d) return;
    var items = only ? d.items.filter(function (i) { return i[0] === only; }) : d.items;
    var sh = document.getElementById('as-' + kind);
    if (!sh) {
      sh = document.createElement('div'); sh.className = 'sheet act-sheet'; sh.id = 'as-' + kind; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', d.title); sh.hidden = true;
      document.body.appendChild(sh);
    }
    sh.innerHTML = '<div class="sh-top"><h3 class="story-h">' + d.title + '</h3></div><div class="act-list">' + items.map(function (i) {
      var ic = i[3] ? '<span class="act-logo">' + i[3] + '</span>' : '<i class="ph ' + i[1] + '" aria-hidden="true"></i>';
      return i[2] ? '<a class="act-row" href="' + i[2] + '" target="_blank" rel="noopener" data-close>' + ic + '<span>' + i[0] + '</span><i class="ph ph-arrow-up-right act-go" aria-hidden="true"></i></a>'
        : '<button class="act-row" data-close data-toast="' + i[0] + '" data-toast-icon="' + i[1] + '">' + ic + '<span>' + i[0] + '</span></button>';
    }).join('') + '</div><div class="sh-bot"><button class="btn btn--block story-close" data-close>Close</button></div>';
    openLayer('#as-' + kind);
  };
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-sheet]'); if (!t) return; e.preventDefault(); e.stopPropagation(); L.actionSheet(t.getAttribute('data-sheet'), t.getAttribute('data-sheet-only')); }, true);
  function playVisibleCelebrations() { document.querySelectorAll('[data-celebrate]:not(.cel)').forEach(function (el) { if (el.offsetParent !== null) L.celebrate(el); }); }
  document.addEventListener('DOMContentLoaded', function () {
    playVisibleCelebrations();
    if ('MutationObserver' in window && document.querySelector('[data-celebrate]')) new MutationObserver(playVisibleCelebrations).observe(document.body, { attributes: true, attributeFilter: ['hidden', 'class', 'style'], subtree: true });
  });
})();
