/* iPhone Duo: side rail for screens (test add-on). Include on every phone screen, after the screen's own scripts.
   When the presenter shell puts html.duo-side on the screen (outer display, or inner display in landscape), the HIG moves the
   tab bar and the icon buttons of the navigation bar to the side. This moves those same elements (so their click handlers keep
   working) into a rail on the right edge (the iPhone Duo default), and puts them back when the device changes.
   - Navigation and actions at the top of the rail (Back/Close first), the tab bar below.
   - Symbols only, as in Apple's picture; each keeps its name for screen readers and as a tooltip.
   - Bars with text buttons (Cancel / Save) stay horizontal: the HIG keeps text labels in a horizontal bar.
   Works with the kit's components (.c-appbar, .c-large, .c-tabbar) and with plain markup: a tab bar is any bar fixed to the bottom
   with 2-6 links or buttons; header buttons are icon-only buttons (an aria-label, no visible words) in the top bar.
   Following Apple's "Raise the bar with iPhone Duo":
   - Order, top to bottom: going back or closing, then the main action (Done / Save as an icon, or data-prominent), then the rest.
   - Where they came from: top bar buttons at the top of the column, bottom toolbar buttons at its bottom (just above the tab bar,
     which stays bottom-aligned). Wide items (text buttons) stay in their horizontal bar.
   - Groups stay groups: a .c-appbar__group (or [data-duo-group]) becomes one capsule in the rail.
   - Counts are badges: data-badge="3" on a button or tab shows a badge on its symbol.
   - Overflow: when the rail runs out of room (a short screen, the keyboard), items move into one "more" menu, from the bottom up,
     lowest data-priority first (high | low; badged items count as high). The tab bar keeps its place unless the page says
     <html data-rail-compress="tabs"> (a task-focused screen): then the tab bar shrinks to its current tab first.
   - A screen can keep its own horizontal bars with <html data-rail="off"> (bottom-heavy single-page screens). */
(function () {
  'use strict';
  var html = document.documentElement, rail = null, moved = [];
  function make() {
    rail = document.createElement('aside'); rail.className = 'duo-rail'; rail.setAttribute('aria-label', 'Controls');
    rail.innerHTML = '<div class="duo-rail__nav"></div><div class="duo-rail__bottom"></div><div class="duo-rail__tabs"></div>';   // top bar items, bottom toolbar items, tab bar
    document.body.appendChild(rail);
  }
  function move(el, into) { moved.push({ el: el, parent: el.parentNode, next: el.nextSibling }); into.appendChild(el); }
  function railOff() { return html.getAttribute('data-tablet') === 'off' || html.getAttribute('data-rail') === 'off'; }
  // where an item belongs in the rail: going back / closing first, then the main action, then the rest (DOM order)
  function rank(el) {
    var b = el.matches && el.matches('button, a') ? el : el.querySelector('button, a'), n = ((b && (b.getAttribute('aria-label') || b.title)) || '').toLowerCase();
    if (/^(back|close|cancel|dismiss)\b/.test(n)) return 0;
    if (el.hasAttribute('data-prominent') || (b && b.hasAttribute('data-prominent')) || /^(done|save|send|post|confirm)\b/.test(n)) return 1;
    return 2;
  }
  function order(nav) {
    var items = [].slice.call(nav.children).filter(function (c) { return !c.classList.contains('duo-more'); });
    items.map(function (c, i) { return { c: c, r: rank(c), i: i }; }).sort(function (a, b) { return a.r - b.r || a.i - b.i; })
      .forEach(function (o) { nav.insertBefore(o.c, nav.querySelector('.duo-more')); if (o.r === 1) o.c.classList.add('duo-prominent'); });
  }
  // a plain tab bar: fixed to the bottom, full width, with 2-6 links or buttons
  function findTabbar() {
    var c = document.querySelectorAll('nav, footer, [role="tablist"], [class*="tab"]');
    for (var i = 0; i < c.length; i++) {
      var el = c[i]; if (rail && rail.contains(el)) continue;
      var st = getComputedStyle(el), n = el.querySelectorAll(':scope > a, :scope > button').length;
      if (st.position === 'fixed' && parseFloat(st.bottom) <= 1 && el.offsetWidth >= innerWidth * .6 && n >= 2 && n <= 6) return el;
    }
    return null;
  }
  /* Tabs with words only get a symbol in the rail, picked from the tab's name (Orders -> a receipt); no match -> its first letter.
     The name stays as the tooltip and for screen readers. Outside the rail nothing changes: the symbol is hidden there.
     The symbols come from Google's Material Symbols, loaded with only the names used. */
  var ICONS = [[/home|start/, 'home'], [/shop|store|market|browse/, 'storefront'], [/explore|discover/, 'explore'], [/search|find/, 'search'],
    [/journal|blog|article|news|read|stor(y|ies)/, 'article'], [/order|purchase|receipt/, 'receipt_long'], [/cart|bag|basket|checkout/, 'shopping_bag'],
    [/account|profile|\bme\b|you/, 'person'], [/setting|prefer/, 'settings'], [/activit|notif|alert|update/, 'notifications'],
    [/message|chat|inbox|mail|dm/, 'chat'], [/favou?rite|saved|wish|like/, 'favorite'], [/calendar|booking|schedule|event/, 'calendar_month'],
    [/wallet|pay|card|bill/, 'account_balance_wallet'], [/map|near|place|location/, 'map'], [/librar|collection/, 'library_books'],
    [/dashboard|stat|insight|report|analytic/, 'insights'], [/help|support|faq/, 'help'], [/team|people|friend|contact|communit/, 'group'],
    [/plant|garden|leaf/, 'potted_plant'], [/video|watch|reel/, 'smart_display'], [/music|listen|podcast/, 'music_note'], [/learn|course|class/, 'school']];
  var fontNames = {};
  function iconize(tb) {
    [].forEach.call(tb.querySelectorAll(':scope > a, :scope > button'), function (t) {
      if (t.querySelector('.duo-tabico, svg, img, .ms, .c-ico, [class*="icon"], [class*="material"]')) return;   // already has a symbol
      var name = (t.textContent || '').trim(), key = name.toLowerCase(), icon = null;
      for (var i = 0; i < ICONS.length && !icon; i++) if (ICONS[i][0].test(key)) icon = ICONS[i][1];
      var ico = document.createElement('span'); ico.className = 'duo-tabico' + (icon ? '' : ' duo-tabico--letter'); ico.setAttribute('aria-hidden', 'true');
      ico.textContent = icon || name.charAt(0).toUpperCase();
      var label = document.createElement('span'); label.className = 'duo-tabname';
      while (t.firstChild) label.appendChild(t.firstChild);
      t.appendChild(ico); t.appendChild(label);
      if (!t.title) t.title = name; if (!t.getAttribute('aria-label')) t.setAttribute('aria-label', name);
      if (icon) fontNames[icon] = 1;
    });
    var names = Object.keys(fontNames).sort(); if (!names.length) return;
    // the page already loads Material Symbols Rounded with its own icon list: add ours to that list (a second copy of the same font
    // with only our icons would replace the page's, and its icons would show as words)
    var own = [].filter.call(document.querySelectorAll('link[href*="Material+Symbols+Rounded"]'), function (l) { return l.id !== 'duoIcons' && /icon_names=/.test(l.href); })[0];
    if (own) {
      var m = own.href.match(/icon_names=([a-z0-9_,]+)/), list = m[1].split(','), add = names.filter(function (n) { return list.indexOf(n) < 0; });
      if (add.length) own.href = own.href.replace(m[0], 'icon_names=' + list.concat(add).sort().join(','));
      return;
    }
    var href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=' + names.join(',') + '&display=block';
    var link = document.getElementById('duoIcons');
    if (!link) { link = document.createElement('link'); link.id = 'duoIcons'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    if (link.href !== href) link.href = href;
  }
  function on() {
    if (!document.body) return;
    if (!rail) make();
    var nav = rail.firstChild, low = rail.children[1], tabs = rail.lastChild;
    [].forEach.call(document.querySelectorAll('.c-appbar, .c-large__bar, body > header, .page > header'), function (bar) {
      if (bar.querySelector('.c-appbar__text')) return;   // text buttons keep their horizontal bar
      [].forEach.call(bar.querySelectorAll('.c-appbar__group, [data-duo-group]'), function (g) { if (!rail.contains(g)) { g.classList.add('duo-group'); move(g, nav); } });
      [].forEach.call(bar.querySelectorAll('.c-iconbtn, button[aria-label], a[aria-label]'), function (b) {
        if (!b.classList.contains('c-iconbtn') && (b.textContent || '').trim().length > 2) return;   // a word, not a symbol: stays
        if (rail.contains(b)) return;
        if (!b.querySelector('.duo-label')) { var l = document.createElement('span'); l.className = 'duo-label'; l.textContent = b.getAttribute('aria-label') || ''; b.appendChild(l); }
        if (!b.title) b.title = b.getAttribute('aria-label') || '';   // the name shows as a tooltip; the rail itself shows symbols only
        move(b, nav);
      });
    });
    // a bottom toolbar (icon buttons fixed near the bottom, not the tab bar, no text field): its buttons go to the bottom of the column,
    // where they were, so they stay near the content they act on; the emptied bar hides while the rail is on
    var tbar = document.querySelector('.c-tabbar') || findTabbar();
    [].forEach.call(document.querySelectorAll('.c-toolbar, [data-duo-toolbar], footer, nav, [class*="toolbar"]'), function (bar) {
      if (bar === tbar || rail.contains(bar) || bar.contains(rail) || bar.querySelector('input, textarea, select')) return;
      var st = getComputedStyle(bar); if (!bar.hasAttribute('data-duo-toolbar') && !(/fixed|sticky/.test(st.position) && parseFloat(st.bottom) <= 48)) return;
      var btns = [].filter.call(bar.querySelectorAll('.c-iconbtn, button[aria-label], a[aria-label]'), function (b) { return b.classList.contains('c-iconbtn') || (b.textContent || '').trim().length <= 2; });
      if (!btns.length) return;
      btns.forEach(function (b) { if (!b.title) b.title = b.getAttribute('aria-label') || ''; move(b, low); });
      if (![].some.call(bar.querySelectorAll('button, a'), function (b) { return !low.contains(b); })) bar.classList.add('duo-emptied');
    });
    var tb = tbar; if (tb && !rail.contains(tb)) { tb.classList.add('duo-tabbar'); if (!tb.classList.contains('c-tabbar')) iconize(tb); move(tb, tabs); }
    order(nav); order(low);
    rail.hidden = false;
    fitSoon();
  }

  /* ---------- overflow: one "more" menu when the rail runs out of room ---------- */
  var moreBtn = null, menu = null, fitTimer = 0;
  function needIcon(name) { fontNames[name] = 1; iconize(document.createElement('div')); }
  function prio(el) { var b = el.matches && el.matches('button, a') ? el : el.querySelector('button, a'), v = el.getAttribute('data-priority') || (b && b.getAttribute('data-priority')); return v === 'high' || el.querySelector('[data-badge]') || el.hasAttribute('data-badge') ? 2 : v === 'low' ? 0 : 1; }
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu() {
    if (menu) { closeMenu(); return; }
    menu = document.createElement('div'); menu.className = 'duo-menu'; menu.setAttribute('role', 'menu');
    [].forEach.call(rail.querySelectorAll('.duo-overflowed'), function (el) {
      [].forEach.call(el.matches('button, a') ? [el] : el.querySelectorAll('button, a'), function (b) {
        var row = document.createElement('button'); row.type = 'button'; row.setAttribute('role', 'menuitem'); row.className = 'duo-menu__item';
        var ico = b.querySelector('.c-ico, .ms, .duo-tabico, .material-symbols-rounded, .material-symbols-outlined');
        row.innerHTML = (ico ? '<span class="duo-menu__ico">' + ico.textContent + '</span>' : '') + '<span>' + (b.getAttribute('aria-label') || b.title || b.textContent.trim()) + '</span>';
        row.addEventListener('click', function () { closeMenu(); b.click(); });
        menu.appendChild(row);
      });
    });
    var mr = moreBtn.getBoundingClientRect();
    menu.style.right = (innerWidth - mr.left + 8) + 'px'; menu.style.top = Math.min(mr.top, innerHeight - 16 - menu.children.length * 44 - 16) + 'px';
    rail.appendChild(menu);   // inside the rail: adding it does not re-run the rail set-up (that watches the page body)
  }
  document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target) && !(moreBtn && moreBtn.contains(e.target))) closeMenu(); });
  function fit() {
    fitTimer = 0; if (!rail || rail.hidden) return;
    var nav = rail.firstChild, low = rail.children[1], tabs = rail.lastChild, tb = tabs.firstElementChild;
    [].forEach.call(rail.querySelectorAll('.duo-overflowed'), function (el) { el.classList.remove('duo-overflowed'); });
    rail.classList.remove('duo-tight');
    if (tb) { tb.classList.remove('duo-min', 'duo-min-open'); tb.style.transform = tb.style.position = tb.style.zIndex = ''; }
    if (moreBtn) moreBtn.hidden = true;
    var cs = getComputedStyle(rail), room = rail.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), gap = parseFloat(cs.rowGap) || 12;
    function used() { var h = 0, n = 0; [].forEach.call([].slice.call(nav.children).concat([].slice.call(low.children)), function (c) { if (!c.hidden && !c.classList.contains('duo-overflowed')) { h += c.offsetHeight; n++; } }); if (tb) { h += tb.offsetHeight; n++; } return h + Math.max(0, n - 1) * (parseFloat(getComputedStyle(rail).rowGap) || gap); }   // re-read: a tight rail has a smaller gap
    if (used() <= room) return;
    function minimiseTabs() { if (tb && tb.querySelectorAll('a, button').length > 1) tb.classList.add('duo-min'); }
    var tabsFirst = html.getAttribute('data-rail-compress') === 'tabs';
    if (tabsFirst) { minimiseTabs(); if (used() <= room) return; }
    if (!moreBtn) {
      moreBtn = document.createElement('button'); moreBtn.type = 'button'; moreBtn.className = 'duo-more c-iconbtn'; moreBtn.setAttribute('aria-label', 'More'); moreBtn.title = 'More';
      moreBtn.innerHTML = '<span class="duo-tabico duo-more__ico" aria-hidden="true">more_horiz</span>'; needIcon('more_horiz');
      moreBtn.addEventListener('click', function (e) { e.stopPropagation(); openMenu(); });
    }
    nav.appendChild(moreBtn); moreBtn.hidden = false;
    // overflow from the bottom up, lowest priority first; going back / closing never leaves
    var cand = [].slice.call(nav.children).concat([].slice.call(low.children)).filter(function (c) { return c !== moreBtn && rank(c) > 0; })
      .map(function (c, i) { return { c: c, p: prio(c), i: i }; }).sort(function (a, b) { return a.p - b.p || b.i - a.i; });
    for (var k = 0; k < cand.length && used() > room; k++) cand[k].c.classList.add('duo-overflowed');
    if (!rail.querySelector('.duo-overflowed')) moreBtn.hidden = true;
    // a navigation screen keeps its whole tab bar (Apple): first a tighter rail (44 px tabs, Apple's smallest tap size),
    // and only if even that cannot fit, the tab bar shrinks to its current tab as a last resort
    if (used() > room && !tabsFirst) { rail.classList.add('duo-tight'); if (used() > room) minimiseTabs(); }
  }
  function fitSoon() { if (!fitTimer) fitTimer = setTimeout(fit, 80); }
  addEventListener('resize', fitSoon);
  if (window.visualViewport) visualViewport.addEventListener('resize', fitSoon);   // the keyboard takes room too
  // a shrunk tab bar shows only the current tab; tapping it shows them all again
  document.addEventListener('click', function (e) {
    var tb = e.target.closest && e.target.closest('.duo-rail .duo-min'); if (!tb) return;
    var on = e.target.closest('.is-on, [aria-current], .on, .active');
    if (on && !tb.classList.contains('duo-min-open')) { e.preventDefault(); e.stopPropagation(); openTabs(tb); }
  }, true);
  /* The full tab bar opens UPWARD from where the shrunk one sits, floating over the buttons above it, so it never reaches into the
     space kept clear at the rail's end (the closed Duo's camera when turned sideways is a reserved region: nothing goes under it). */
  function openTabs(tb) {
    tb.classList.add('duo-min-open');
    var cs = getComputedStyle(rail), limit = rail.getBoundingClientRect().bottom - parseFloat(cs.paddingBottom), over = tb.getBoundingClientRect().bottom - limit;
    if (over > 0) { tb.style.transform = 'translateY(' + (-over) + 'px)'; tb.style.position = 'relative'; tb.style.zIndex = '2'; }
  }
  function closeTabs() { if (!rail) return; [].forEach.call(rail.querySelectorAll('.duo-min-open'), function (tb) { tb.classList.remove('duo-min-open'); tb.style.transform = tb.style.position = tb.style.zIndex = ''; }); }
  document.addEventListener('click', function (e) { if (!(e.target.closest && e.target.closest('.duo-rail .duo-min'))) closeTabs(); });   // tapping elsewhere folds it back
  function off() {
    closeMenu();
    if (rail) [].forEach.call(rail.querySelectorAll('.duo-overflowed, .duo-prominent, .duo-min, .duo-min-open, .duo-group'), function (el) { el.classList.remove('duo-overflowed', 'duo-prominent', 'duo-min', 'duo-min-open', 'duo-group'); });
    for (var i = moved.length - 1; i >= 0; i--) { var m = moved[i]; if (m.parent) m.parent.insertBefore(m.el, m.next && m.next.parentNode === m.parent ? m.next : null); }
    moved = []; if (rail) rail.hidden = true; if (moreBtn) moreBtn.hidden = true;
    [].forEach.call(document.querySelectorAll('.duo-emptied'), function (b) { b.classList.remove('duo-emptied'); });
  }
  function sync() { if (html.classList.contains('duo-side') && !railOff()) on(); else off(); }   // an app with no tablet layout, or a screen that opts out, keeps its own bars
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['class', 'data-tablet', 'data-rail', 'data-rail-compress'] });
  // the tab bar and some buttons are added by script after load: pick them up when they appear
  function watchBody() { new MutationObserver(function () { if (html.classList.contains('duo-side') && !railOff()) on(); }).observe(document.body, { childList: true }); sync(); }
  if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody);
})();
