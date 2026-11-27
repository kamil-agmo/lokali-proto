/* iPhone Duo: automatic tablet layouts (test add-on). Include on every phone screen, with js/shared/duo.js.
   When the open Duo gives the screen tablet width (html.duo-wide), this looks at the screen and recognises what kind it is,
   then marks it so css/shared/duo.css can lay it out the way Google's canonical layouts and Apple's iPhone Duo guidance ask:
     signin   a password field: brand panel left, form right (no brand picture: one narrow centred column)
     form     two or more fields: the photo/picture block left (sticky), fields right; or one readable column
     detail   a photo grid next to other blocks (a profile): details in a left column, only the grid scrolls; the grid's title stays with it
     grid     a photo grid alone: 4 even columns
     cards    a grid of small cards with a picture and a few words (products, places): more columns as the screen widens
     feed     a list of big cards: 2 columns; when open horizontally with an <aside class="t-pane">, one column + that side panel
     hero     a big picture at the top with details under it (a product, an article): picture left, details right
     list     rows that each open another screen (orders, mail, conversations): open horizontally the list stays and a tapped row
              opens beside it (the "extra level"); open vertically it behaves like the phone (a tap opens the page)
     chat     a message box fixed at the bottom: the thread and the box line up in one readable column
     readable anything else: one centred column at a readable width
   On every kind, a row of stat tiles (short blocks with numbers, no pictures) gets more columns as the screen widens.
   Nothing in the page moves: only data attributes on <html> and the blocks, and grid rows for the detail layout.
   A screen can choose for itself: <html data-tablet="feed|detail|grid|form|signin|readable|off">. "off" shows it the way the Duo shows
   an app with no tablet layout: the phone layout at phone width in the middle of the open screen, without the side rail. */
(function () {
  'use strict';
  var html = document.documentElement, timer = 0, marked = [], pane = null, picked = '';
  var IN_PANE = /[?&]duo-pane\b/.test(location.search);
  var HEAD = '.c-appbar, .c-large, header';

  function visible(el) { if (el.hidden) return false; var s = getComputedStyle(el); return s.display !== 'none' && s.position !== 'fixed' && s.position !== 'absolute'; }
  function blocks(root) {   // the screen's content blocks in order, without overlays (floating buttons, pills, the rail, the detail pane)
    return [].filter.call(root.children, function (el) { return !/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName) && !el.classList.contains('duo-rail') && !el.classList.contains('duo-detail') && visible(el); });
  }
  function mark(el, role) { el.setAttribute('data-tl', role); marked.push(el); }
  // a block that already spans its column (stories, tabs, text) lines up with the layout; small items (a pill, a chip, a button) keep their own size
  function markCol(b) { var p = b.parentElement; if (p && b.getBoundingClientRect().width >= p.clientWidth * .6) mark(b, 'col'); }
  function clear() {
    marked.forEach(function (el) { el.removeAttribute('data-tl'); el.removeAttribute('data-tl-tiles'); el.style.gridRow = ''; });
    marked = []; html.removeAttribute('data-tl-kind'); html.removeAttribute('data-tl-wide'); var r = root(); if (r) r.style.gridTemplateRows = '';
  }
  function root() { return document.querySelector('.page') || document.body; }

  // the items a container shows right now: hidden ones (a filter tab, a collapsed section) do not count
  function kids(el) { return [].filter.call(el.children, function (c) { return !c.hidden && getComputedStyle(c).display !== 'none'; }); }
  // a photo grid: 6+ pictures that wrap onto more than one row
  function isPhotoGrid(el) {
    var k = kids(el); if (k.length < 6) return false;
    var pics = 0, tops = {};
    for (var i = 0; i < k.length; i++) {
      var c = k[i], r = c.getBoundingClientRect();
      if ((c.tagName === 'IMG' || (c.querySelector('img') && !(c.textContent || '').trim())) && r.width < el.clientWidth * .5) pics++;   // pictures only: cards with words are 'cards'
      tops[Math.round(r.top)] = 1;
    }
    return pics >= k.length * .8 && Object.keys(tops).length > 1;
  }
  // a feed: 2+ big repeated cards with a picture (stories and chips are too small to count)
  function isFeed(el) {
    var k = kids(el); if (k.length < 2) return false;
    var big = 0;
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (k[i].querySelector('img, video, picture') && r.width >= 200 && r.height >= 150) big++; }
    return big >= 2 && big >= k.length * .6;
  }
  // a card grid: 4+ repeated small cards, each with a picture and some words, over 2+ rows
  function isCardGrid(el) {
    var k = kids(el); if (k.length < 4) return false;
    var cards = 0, tops = {};
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (k[i].querySelector('img, picture') && (k[i].textContent || '').trim() && r.width < el.clientWidth * .6) cards++; tops[Math.round(r.top)] = 1; }
    return cards >= k.length * .8 && Object.keys(tops).length > 1;
  }
  // a hero: the first content block is (or holds only) a big picture, a video, or a swipeable row of them (a post's photos)
  function isMedia(el) { return /^(IMG|PICTURE|VIDEO|IFRAME)$/.test(el.tagName); }
  function isCarousel(el) {
    var k = kids(el), st = getComputedStyle(el); if (k.length < 2 || !/auto|scroll/.test(st.overflowX)) return false;
    for (var i = 0; i < k.length; i++) if (!isMedia(k[i]) && !(k[i].children.length === 1 && isMedia(k[i].children[0]))) return false;
    return true;
  }
  function heroOf(list) {
    var b = list[0]; if (!b || list.length < 2) return null;
    var img = isMedia(b) || isCarousel(b) ? b : (b.children.length === 1 && (isMedia(b.children[0]) || isCarousel(b.children[0])) ? b.children[0] : null);
    return img && b.getBoundingClientRect().width >= innerWidth * .6 && b.getBoundingClientRect().height >= 200 ? b : null;
  }
  function isHeading(el) { return /^H[1-6]$/.test(el.tagName) || (el.children.length <= 1 && el.querySelector('h1, h2, h3, h4') && (el.textContent || '').trim().length < 60); }
  // a list whose rows each open another screen of the prototype
  function rowLink(c) { var a = c.tagName === 'A' ? c : (c.querySelectorAll('a[href]').length === 1 ? c.querySelector('a[href]') : null); return a && /\.html(\?|#|$)/.test(a.getAttribute('href') || '') ? a : null; }
  function isLinkList(el) {
    var k = kids(el); if (k.length < 3) return false;
    var rows = 0, tops = {};
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (rowLink(k[i]) && r.width >= el.clientWidth * .8) rows++; tops[Math.round(r.top)] = 1; }
    return rows >= k.length * .8 && Object.keys(tops).length >= k.length * .8;
  }
  // a message box: fixed or sticky at the bottom, with a text field (not a tab bar)
  function composer() {
    var f = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
    for (var i = 0; i < f.length; i++) {
      for (var el = f[i]; el && el !== document.body; el = el.parentElement) {
        var st = getComputedStyle(el);
        if ((st.position === 'fixed' || st.position === 'sticky') && parseFloat(st.bottom) <= 120) return el;
      }
    }
    return null;
  }
  // stat tiles: 2+ short blocks with a number and no picture, wrapping over rows
  function markTiles(r) {
    [].forEach.call(r.querySelectorAll('*'), function (el) {
      var k = kids(el); if (k.length < 2 || el.closest('[data-tl-tiles], .duo-rail')) return;
      var st = getComputedStyle(el); if (!/grid|flex/.test(st.display)) return;
      var ok = 0, h = k[0].getBoundingClientRect().height, tops = {};
      for (var i = 0; i < k.length; i++) { var t = (k[i].textContent || '').trim(); tops[Math.round(k[i].getBoundingClientRect().top)] = 1; if (!k[i].querySelector('img, svg, picture, video, input') && t.length <= 40 && /\d/.test(t) && Math.abs(k[i].getBoundingClientRect().height - h) < 24) ok++; }
      // only tiles that wrap onto 2+ rows on the phone: a row that already fits (profile counts) is left as it is
      if (ok === k.length && Object.keys(tops).length > 1) { el.setAttribute('data-tl-tiles', ''); marked.push(el); }
    });
    if (r.querySelector('[data-tl-tiles]')) html.setAttribute('data-tl-wide', '');
  }
  function find(rootEl, test) {   // the first block, or a block's direct child, that passes
    var b = blocks(rootEl);
    for (var i = 0; i < b.length; i++) { if (test(b[i])) return b[i]; var k = blocks(b[i]); for (var j = 0; j < k.length; j++) if (test(k[j])) return k[j]; }
    return null;
  }
  function picture(el) { return el.querySelector('img, svg, picture') && !el.querySelector('input, textarea, select'); }

  function layout() {
    timer = 0;
    clear();
    if (pane && !html.classList.contains('duo-wide')) { pane.remove(); pane = null; }
    if (!html.classList.contains('duo-wide') || IN_PANE) return;
    var want = html.getAttribute('data-tablet'); if (want === 'off') return;
    var r = root(); if (!r) return;
    var all = blocks(r), heads = all.filter(function (b) { return b.matches(HEAD); }), body = all.filter(function (b) { return !b.matches(HEAD); });
    heads.forEach(function (h) { mark(h, 'head'); });
    markTiles(r);
    var kind = want || '';

    // sign-in: the block holding the password field, with a picture-only block beside the form (the brand panel)
    var pw = document.querySelector('input[type="password"]');
    if ((!kind && pw) || kind === 'signin') {
      var t = pw, brand = null;
      while (t && t !== document.body && !brand) { t = t.parentElement; if (t) brand = [].filter.call(t.children, function (c) { return visible(c) && picture(c); })[0] || null; }
      if (t && brand) { mark(t, 'signin'); mark(brand, 'brand'); html.setAttribute('data-tl-kind', 'signin'); return; }
      // no brand picture: the form's own block becomes one narrow centred column
      var own = pw && body.filter(function (b) { return b.contains(pw); })[0];
      if (own) { mark(own, 'signin'); html.setAttribute('data-tl-kind', 'signin-plain'); return; }
      kind = kind || 'readable';
    }
    // chat: a message box at the bottom; the thread and the box share one readable column
    var box = (!kind || kind === 'chat') ? composer() : null;
    if (box) { mark(box, 'composer'); body.forEach(function (b) { markCol(b); }); html.setAttribute('data-tl-kind', 'chat'); return; }
    // form: two or more fields; a picture block in the same form goes to the left column
    var fields = document.querySelectorAll('input:not([type="hidden"]):not([type="search"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
    if ((!kind && fields.length >= 2) || kind === 'form') {
      var f = (fields[0] && fields[0].closest('form')) || r;
      var side = [].filter.call(f.children, function (c) { return visible(c) && picture(c); })[0];
      mark(f, 'form'); if (side) { mark(side, 'side'); side.style.gridRow = '1 / span ' + Math.max(1, f.children.length); }
      html.setAttribute('data-tl-kind', side ? 'form-split' : 'form'); return;
    }
    // photo grid: alone, or beside other blocks (a profile: list-detail, only the grid scrolls)
    var grid = (!kind || kind === 'detail' || kind === 'grid') ? find(r, isPhotoGrid) : null;
    if (grid) {
      mark(grid, 'grid');
      var others = body.filter(function (b) { return b !== grid && !b.contains(grid); });
      // the grid's own title (a heading right before it) goes to the right column with it
      var gi = body.indexOf(grid), title = gi > 0 && isHeading(body[gi - 1]) ? body[gi - 1] : null;
      if (title) others = others.filter(function (o) { return o !== title; });
      if (grid.parentElement === r && others.length && kind !== 'grid') {
        var rows = [];
        heads.forEach(function (h, i) { h.style.gridRow = String(i + 1); rows.push('auto'); });
        var top = heads.length + 1, n = Math.max(others.length, title ? 2 : 1);
        others.forEach(function (o, i) { mark(o, 'side'); o.style.gridRow = i === others.length - 1 ? (top + i) + ' / ' + (top + n) : String(top + i); });
        for (var i = 0; i < n; i++) rows.push(i === n - 1 ? 'minmax(0, 1fr)' : 'auto');
        if (title) { mark(title, 'gridtitle'); title.style.gridRow = String(top); grid.style.gridRow = (top + 1) + ' / -1'; }
        else grid.style.gridRow = top + ' / -1';
        r.style.gridTemplateRows = rows.join(' ');
        mark(r, 'detail'); html.setAttribute('data-tl-kind', 'detail');
      } else html.setAttribute('data-tl-kind', 'grid');
      return;
    }
    // a card grid (products, places): before the feed, whose cards are as wide as the screen
    var cg = (!kind || kind === 'cards') ? find(r, isCardGrid) : null;
    if (cg) { mark(cg, 'cards'); body.forEach(function (b) { if (b !== cg && !b.contains(cg)) markCol(b); }); html.setAttribute('data-tl-kind', 'cards'); return; }
    // feed: big repeated cards
    var feed = (!kind || kind === 'feed') ? find(r, isFeed) : null;
    if (feed) {
      mark(feed, 'feed'); mark(r, 'feed-root');
      var side2 = r.querySelector(':scope > .t-pane'); if (side2) mark(side2, 'pane');
      body.forEach(function (b) { if (b !== feed && b !== side2 && !b.contains(feed)) markCol(b); });   // stories, tabs: as wide as the feed (floating pills are left alone)
      html.setAttribute('data-tl-kind', side2 ? 'feed-pane' : 'feed'); return;
    }
    // a hero picture with details under it
    var hero = (!kind || kind === 'hero') ? heroOf(body) : null;
    if (hero) {
      mark(r, 'hero-root'); mark(hero, 'hero');
      body.forEach(function (b) { if (b !== hero) markCol(b); });
      html.setAttribute('data-tl-kind', 'hero'); return;
    }
    // a list of rows that open other screens: list left, the tapped row's screen right (open horizontally only)
    var list = (!kind || kind === 'list') && innerWidth >= 840 ? find(r, isLinkList) : null;   // side by side when open horizontally; open vertically a tap opens the page, like the phone
    if (list && list.parentElement === r) {
      var rows2 = [], top2 = heads.length + 1;
      heads.forEach(function (h, i) { h.style.gridRow = String(i + 1); rows2.push('auto'); });
      body.forEach(function (b, i) { mark(b, b === list ? 'list' : 'side'); b.style.gridRow = String(top2 + i); rows2.push(b === list ? 'minmax(0, 1fr)' : 'auto'); });
      r.style.gridTemplateRows = rows2.join(' ');
      if (!pane) { pane = document.createElement('iframe'); pane.className = 'duo-detail'; pane.title = 'Detail'; r.appendChild(pane); }
      pane.style.gridRow = '1 / -1';   // the opened item is its own column from the top of the screen, with its own bar (Apple split view)
      var first = rowLink(kids(list)[0]), want2 = picked || (first && first.href);
      // a tab bar left at the bottom (open vertically) must not cover the opened item: keep room for it
      var bottom = 0;
      [].forEach.call(document.querySelectorAll('.c-tabbar, nav, footer, [class*="tab"]'), function (el) {
        if (el.closest('.duo-rail')) return; var st = getComputedStyle(el), rc = el.getBoundingClientRect();
        if (st.display !== 'none' && /fixed|sticky/.test(st.position) && rc.height && innerHeight - rc.bottom <= 48) bottom = Math.max(bottom, innerHeight - rc.top);
      });
      r.style.setProperty('--tl-bottom', bottom + 'px');
      mark(r, 'list-root'); html.setAttribute('data-tl-kind', 'list');
      if (want2) open(want2);   // after the columns are in place, so the item's column position (and its bar's top room) is measured right
      return;
    }
    if (pane) { pane.remove(); pane = null; }
    // anything else: one readable column
    mark(r, 'readable'); body.forEach(function (b) { markCol(b); });
    html.setAttribute('data-tl-kind', 'readable');
  }
  // the detail pane: shows the row's screen in its compact (phone) layout, without its tab bar or Back button
  function open(href) {
    picked = href;
    // the item's bar starts level with the list's: it gets the list's top room minus how far down its column already starts
    // (some pages keep that room as padding on the whole page, so the column itself is already lower)
    var sb = parseFloat(getComputedStyle(html).getPropertyValue('--sb')) || 0;
    if (pane) sb = Math.max(0, sb - (pane.getBoundingClientRect().top - (document.documentElement.getBoundingClientRect().top || 0)));
    var src = href + (href.indexOf('?') < 0 ? '?' : '&') + 'duo-pane&duo-sb=' + Math.round(sb);
    if (pane && pane.getAttribute('src') !== src) pane.setAttribute('src', src);
    var list = document.querySelector('[data-tl="list"]');
    if (list) [].forEach.call(list.children, function (c) { var a = rowLink(c); c.classList.toggle('duo-picked', !!a && a.href === href); });
  }
  document.addEventListener('click', function (e) {
    if (html.getAttribute('data-tl-kind') !== 'list') return;
    var list = document.querySelector('[data-tl="list"]'); if (!list || !list.contains(e.target)) return;
    var row = e.target; while (row && row.parentElement !== list) row = row.parentElement;
    var a = row && rowLink(row); if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation(); open(a.href);   // open beside the list instead of leaving it
  }, true);
  if (IN_PANE) {   // inside the detail pane: no tab bar and no Back button (the list is right beside it)
    html.classList.add('duo-pane');
    var psb = (location.search.match(/[?&]duo-sb=(\d+)/) || [])[1]; if (psb != null) html.style.setProperty('--sb', psb + 'px');   // same top room as the list beside it
    addEventListener('load', function () {
      // tab bars: the kit's .c-tabbar, or any bar pinned near the bottom (floating capsules sit a little above the edge)
      function hideBars() { [].forEach.call(document.querySelectorAll('.c-tabbar, nav, footer, [class*="tab"]'), function (el) { var st = getComputedStyle(el); if (el.classList.contains('c-tabbar') || (/fixed|sticky|absolute/.test(st.position) && parseFloat(st.bottom) <= 48)) el.style.display = 'none'; }); }
      hideBars(); new MutationObserver(hideBars).observe(document.body, { childList: true });   // bars added later by script
      [].forEach.call(document.querySelectorAll('header button[aria-label], header a[aria-label]'), function (b) { if (/back|close|cancel/i.test(b.getAttribute('aria-label'))) b.style.visibility = 'hidden'; });
    });
  }
  function soon() { if (!timer) timer = setTimeout(layout, 60); }

  // run when the device changes, when the screen resizes (the phone opens live) and when content arrives
  new MutationObserver(soon).observe(html, { attributes: true, attributeFilter: ['class', 'data-tablet'] });
  addEventListener('resize', soon);
  function watch() {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (!(t.closest && t.closest('.duo-rail'))) { soon(); return; } }
    }).observe(document.body, { childList: true, subtree: true });
    soon();
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
})();
