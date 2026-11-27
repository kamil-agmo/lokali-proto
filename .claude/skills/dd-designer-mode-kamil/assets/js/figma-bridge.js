/* Designer mode ↔ Sebastian's Figma engine (dd-figma-components-sebastian).
   Turns presenter pages into his layout trees, then into one native Figma paste (⌘V) with auto layout and components.
   For each page: load it off-screen at phone size, mark our c-* components (data-component / data-variant), swap
   Material Symbols glyphs for their vector icons, inline photos as data: URLs, run his serialiser (FX.nodeOf) inside the
   page, and clip the tree to the screen. Then FN.toHtml builds the paste in the shell, grouped like the page list.
   Only the off-screen copies are changed; the prototype on show is never touched.
   Needs, loaded before this file: js/shell/figma/figma-assets.js, figma-export.js, figma-native.js. */
(function () {
  'use strict';
  var S = window.SHELL || {};
  var ENGINE = new URL('js/shell/figma/figma-export.js', location.href).href;

  /* our component classes → Figma component names (sub-parts like c-btn__label are layers, not components) */
  var COMP = {
    btn: 'Button', iconbtn: 'IconButton', fab: 'FAB', chip: 'Chip', tab: 'TabBarItem', tabbar: 'TabBar', appbar: 'AppBar',
    large: 'LargeTitle', seg: 'Segmented', seg__item: 'SegmentedItem', card: 'Card', list: 'List', row: 'ListRow', field: 'Field',
    search: 'Search', switch: 'Toggle', check: 'Checkbox', radio: 'Radio', slider: 'Slider', progress: 'Progress', spinner: 'Spinner',
    skel: 'Skeleton', sheet: 'Sheet', dialog: 'Dialog', toast: 'Toast', badge: 'Badge', avatar: 'Avatar', nav: 'NavItem', rail: 'Rail'
  };
  var STYLE = { ios: 1, md3: 1, m3: 1, material: 1, fluent: 1, carbon: 1, ant: 1, apple: 1 };   // style families: same component
  var SIZE = { xs: 1, sm: 1, md: 1, lg: 1, xl: 1 };
  var CONFIG = {
    name: S.name || 'Prototype', frameWidth: 402, components: '*',
    // frames, not components: their content differs per screen, and an instance only overrides text, not sizes
    // (one shared app bar squeezed "Online Time Waster" into another screen's title box)
    frameOnly: ['AppBar', 'LargeTitle', 'Card', 'Sheet', 'Dialog', 'Field', 'List', 'Skeleton'],
    containers: ['TabBar', 'Segmented', 'Rail'],
    variantProps: {},   // filled below: every component gets Type / Size / State
    glyphFallback: 'Inter',   // text in a font with no file here (system-ui, SF Pro) is drawn with Inter, named Inter
    fontStyles: { Inter: { 200: 'Extra Light', 600: 'Semi Bold', 800: 'Extra Bold' } }   // Figma's own style names
  };
  Object.keys(COMP).forEach(function (k) { CONFIG.variantProps[COMP[k]] = ['Type', 'Size', 'State']; });
  window.FIGMA_CONFIG = Object.assign(CONFIG, window.FIGMA_CONFIG || {});

  function markComponents(doc) {
    [].forEach.call(doc.querySelectorAll('[class*="c-"]'), function (el) {
      if (el.hasAttribute('data-component')) return;   // the page marked it itself
      var cls = [].slice.call(el.classList), base = null;
      cls.forEach(function (c) { var m = /^c-([a-z0-9]+(?:__item)?)$/.exec(c); if (m && COMP[m[1]] && !base) base = m[1]; });
      if (!base) return;
      var type = [], size = '';
      cls.forEach(function (c) {
        if (c.indexOf('c-' + base + '--') !== 0) return;
        var m = c.slice(base.length + 4);
        if (STYLE[m]) return; if (SIZE[m]) size = m; else type.push(m);
      });
      var on = el.classList.contains('is-on') || el.classList.contains('is-active') || el.getAttribute('aria-current') === 'page' ||
        el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true' ||
        !!(el.querySelector && el.querySelector('input:checked') && /switch|check|radio/.test(base));
      var dis = el.disabled || el.getAttribute('aria-disabled') === 'true';
      el.setAttribute('data-component', COMP[base]);
      el.setAttribute('data-variant', [type.join('-') || 'default', size || 'default', dis ? 'disabled' : on ? 'on' : 'default'].join('/'));
    });
  }

  var iconCache = {};
  function icons(doc, win) {   // icon-font glyphs → the real Material Symbols SVG, marked data-icon (his engine makes them icon components)
    var list = [].filter.call(doc.querySelectorAll('span,i,b,em'), function (el) {
      return el.children.length === 0 && el.textContent.trim() && /Material Symbols/i.test(win.getComputedStyle(el).fontFamily);
    });
    return Promise.all(list.map(function (el) {
      var cs = win.getComputedStyle(el), name = el.textContent.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      var set = /rounded/i.test(cs.fontFamily) ? 'materialsymbolsrounded' : /sharp/i.test(cs.fontFamily) ? 'materialsymbolssharp' : 'materialsymbolsoutlined';
      var fill = /'FILL'\s*1/.test(cs.fontVariationSettings || '');
      var url = 'https://fonts.gstatic.com/s/i/short-term/release/' + set + '/' + name + '/' + (fill ? 'fill1' : 'default') + '/24px.svg';
      var got = iconCache[url] || (iconCache[url] = fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).catch(function () { return null; }));
      return got.then(function (svg) {
        if (!svg || svg.indexOf('<svg') < 0) return;
        var size = parseFloat(cs.fontSize) || 24, box = el.getBoundingClientRect();
        var holder = doc.createElement('span');
        holder.innerHTML = svg.replace(/<svg([^>]*)>/, function (m, a) { return '<svg' + a.replace(/\s(width|height|fill)="[^"]*"/g, '') + ' width="' + size + '" height="' + size + '" fill="currentColor">'; });
        var s = holder.firstElementChild; if (!s) return;
        s.setAttribute('data-icon', name); s.style.display = 'block'; s.style.flex = 'none';
        el.style.width = Math.max(box.width, size) + 'px'; el.style.height = Math.max(box.height, size) + 'px';
        el.style.display = win.getComputedStyle(el).display === 'inline' ? 'inline-flex' : el.style.display || '';
        el.style.alignItems = 'center'; el.style.justifyContent = 'center';
        el.textContent = ''; el.appendChild(s);
      });
    }));
  }

  function images(doc) {   // his engine only embeds data: images; fetch each photo and inline it (skipped when the host blocks it)
    return Promise.all([].map.call(doc.images, function (img) {
      var src = img.currentSrc || img.src;
      if (!src || /^data:/.test(src)) return null;
      return fetch(src, { mode: 'cors' }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
        return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = function () { ok(null); }; fr.readAsDataURL(b); });
      }).then(function (data) {
        if (!data) return;
        return new Promise(function (ok) {   // lazy photos below the fold never fire load off-screen: eager, and 3 s at most
          img.onload = img.onerror = ok; img.loading = 'eager'; img.removeAttribute('srcset'); img.src = data; setTimeout(ok, 3000);
        });
      }).catch(function () {});
    }));
  }

  /* his engine reads only rgb()/rgba() colours. color-mix(), oklch() and friends compute to color(srgb …) / oklab(…),
     which it drops (a glass bar loses its fill, border and active pill). Rewrite them as rgba(), inline, on the copy. */
  var cv = null, cx = null, seen = {};
  function rgba(v) {
    if (seen[v]) return seen[v];
    if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 1; cx = cv.getContext('2d', { willReadFrequently: true }); }
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = v; cx.fillRect(0, 0, 1, 1);
    var d = cx.getImageData(0, 0, 1, 1).data;
    return (seen[v] = 'rgba(' + d[0] + ', ' + d[1] + ', ' + d[2] + ', ' + Math.round(d[3] / 255 * 1000) / 1000 + ')');
  }
  var ODD = /\b(?:color|oklch|oklab|lab|lch|hwb)\([^)]*\)/g;
  var PROPS = [['backgroundColor', 'background-color'], ['color', 'color'], ['borderTopColor', 'border-top-color'], ['borderRightColor', 'border-right-color'],
    ['borderBottomColor', 'border-bottom-color'], ['borderLeftColor', 'border-left-color']];
  function colours(doc, win) {
    var blurs = [], still = doc.createElement('style');   // no transitions: they would animate the rewritten colours back
    still.textContent = '*, *::before, *::after { transition: none !important; }'; doc.head.appendChild(still);
    [].forEach.call(doc.querySelectorAll('body, body *'), function (el) {
      var cs = win.getComputedStyle(el), op = Number(cs.opacity);
      if (op === 0) { el.style.setProperty('display', 'none', 'important'); return; }   // invisible (a collapsed title waiting for scroll): not a layer
      if (op < 1 && !el.children.length && el.textContent.trim()) {   // his text layers drop opacity: fold it into the colour
        var c = /rgba?\(([^)]+)\)/.exec(rgba(cs.color));
        if (c) { var p = c[1].split(/\s*,\s*/).map(Number); el.style.setProperty('color', 'rgba(' + p[0] + ', ' + p[1] + ', ' + p[2] + ', ' + Math.round((p.length > 3 ? p[3] : 1) * op * 1000) / 1000 + ')', 'important'); el.style.setProperty('opacity', '1', 'important'); }
      }
      PROPS.forEach(function (p) { var v = cs[p[0]]; if (v && !/^rgba?\(/.test(v) && v !== 'transparent') el.style.setProperty(p[1], rgba(v), 'important'); });
      if (cs.boxShadow && cs.boxShadow !== 'none' && ODD.test(cs.boxShadow)) el.style.setProperty('box-shadow', cs.boxShadow.replace(ODD, rgba), 'important');
      ODD.lastIndex = 0;
      var bf = cs.backdropFilter || cs.webkitBackdropFilter, m = /blur\(([\d.]+)px\)/.exec(bf || '');
      if (m) { var r = el.getBoundingClientRect(); blurs.push({ x: r.left, y: r.top, w: r.width, h: r.height, blur: Number(m[1]) }); }
    });
    return blurs;
  }
  /* ::before / ::after boxes (switch knobs, list dividers, progress fills, badges) are invisible to his engine: make each a
     real <span> with the pseudo-element's computed style, then hide the pseudo-element. */
  function pseudos(doc, win) {
    var made = 0;
    [].forEach.call(doc.querySelectorAll('body *'), function (el) {
      if (/^(IMG|SVG|INPUT|TEXTAREA|SELECT|BR|HR|IFRAME|VIDEO|CANVAS)$/i.test(el.tagName)) return;
      ['before', 'after'].forEach(function (which) {
        var ps = win.getComputedStyle(el, '::' + which), content = ps.content;
        if (!content || content === 'none' || content === 'normal' || ps.display === 'none') return;
        var text = /^["']/.test(content) ? content.slice(1, -1) : '';
        var boxy = parseFloat(ps.width) > 0 || parseFloat(ps.height) > 0 || ps.position === 'absolute' || ps.position === 'fixed';
        if (!text && !boxy) return;
        var span = doc.createElement('span'), css = '';
        for (var i = 0; i < ps.length; i++) { var k = ps[i]; if (k !== 'content') css += k + ':' + ps.getPropertyValue(k) + ';'; }
        span.style.cssText = css; span.textContent = text; span.setAttribute('data-dd-pseudo', which);
        if (which === 'before') el.insertBefore(span, el.firstChild); else el.appendChild(span);
        el.setAttribute('data-dd-no-' + which, ''); made++;
      });
    });
    if (made) { var st = doc.createElement('style'); st.textContent = '[data-dd-no-before]::before,[data-dd-no-after]::after{content:none!important;display:none!important}'; doc.head.appendChild(st); }
  }

  /* Figma stacks layers in code order; the browser stacks by z-index. An out-of-flow element with a lower z-index than its
     siblings (a segmented control's sliding thumb, a background glow) moves to the front of the code, i.e. the back in Figma. */
  function stacking(doc, win) {
    // CSS paint order as a number: negative z below everything, then normal content (0), then positioned with z auto/0 (1), then z > 0
    function key(el) {
      var cs = win.getComputedStyle(el), v = parseInt(cs.zIndex, 10);
      if (cs.position === 'static') return 0;
      return isNaN(v) || v === 0 ? 1 : v > 0 ? 1 + v : v - 1;
    }
    function out(el) { var p = win.getComputedStyle(el).position; return p === 'absolute' || p === 'fixed'; }
    [].forEach.call(doc.querySelectorAll('body, body *'), function (el) {
      var kids = [].slice.call(el.children); if (kids.length < 2) return;
      var loose = kids.filter(out); if (!loose.length) return;
      var keys = new Map(kids.map(function (k) { return [k, key(k)]; })), at = new Map(kids.map(function (k, i) { return [k, i]; }));
      function above(c, k) { return keys.get(c) > keys.get(k) || (keys.get(c) === keys.get(k) && at.get(c) > at.get(k)); }   // painted after k
      // only out-of-flow layers move (moving the others would change the layout); each goes before the first in-flow layer painted above it
      if (loose.every(function (k) { return kids.every(function (c) { return out(c) || (at.get(c) > at.get(k)) === above(c, k); }); })) return;   // already in paint order
      loose.sort(function (a, b) { return keys.get(a) - keys.get(b) || at.get(a) - at.get(b); }).forEach(function (k) {
        var fixed = kids.filter(function (c) { return !out(c); }), before = null;
        for (var i = 0; i < fixed.length; i++) if (above(fixed[i], k)) { before = fixed[i]; break; }
        el.insertBefore(k, before);   // null = the end
      });
    });
  }

  /* text fields: his engine keeps only their text. Swap each for a box with the field's own look and its text (value,
     dots for a password, or the placeholder in the placeholder colour), so the grey field shape pastes too. */
  function fields(doc, win) {
    [].forEach.call(doc.querySelectorAll('input, textarea'), function (el) {
      var type = (el.getAttribute('type') || 'text').toLowerCase();
      if (/^(checkbox|radio|range|hidden|file|color|submit|button|image|reset)$/.test(type)) return;
      var cs = win.getComputedStyle(el); if (cs.display === 'none') return;
      var box = doc.createElement('div'), css = '';
      for (var i = 0; i < cs.length; i++) css += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      box.style.cssText = css;
      box.style.display = 'flex'; box.style.alignItems = el.tagName === 'TEXTAREA' ? 'flex-start' : 'center'; box.style.overflow = 'hidden'; box.style.whiteSpace = el.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
      var val = el.value, span = doc.createElement('span');
      if (val) span.textContent = type === 'password' ? val.replace(/./g, '•') : val;
      else if (el.placeholder) { span.textContent = el.placeholder; span.style.color = win.getComputedStyle(el, '::placeholder').color; }
      if (span.textContent) box.appendChild(span);
      el.parentNode.replaceChild(box, el);
    });
  }

  /* gradients: his engine has solid fills only. Each gradient background is drawn to a picture (the browser paints it) and
     placed behind the element's content, so a gradient icon, button or story ring keeps its look (as a photo layer). */
  function gradients(doc, win) {
    var jobs = [];
    [].forEach.call(doc.querySelectorAll('body *'), function (el) {
      var cs = win.getComputedStyle(el), bg = cs.backgroundImage;
      if (!bg || bg.indexOf('gradient(') < 0 || /url\(/.test(bg)) return;
      if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') {   // gradient text: its first colour
        var first = /((?:rgba?|color|oklch|oklab)\([^)]*\)|#[0-9a-f]{3,8})/i.exec(bg); if (first) el.style.setProperty('color', rgba(first[1]), 'important');
        el.style.setProperty('background-image', 'none', 'important'); return;
      }
      var r = el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height); if (w < 1 || h < 1) return;
      jobs.push(new Promise(function (ok) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px;background-image:' + bg.replace(/"/g, "'") + ';background-size:' + cs.backgroundSize + ';background-position:' + cs.backgroundPosition + ';background-repeat:' + cs.backgroundRepeat + '"></div></foreignObject></svg>';
        var im = new Image();
        im.onload = function () {
          try {
            var c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; var g = c.getContext('2d'); g.scale(2, 2); g.drawImage(im, 0, 0);
            var pic = doc.createElement('img'); pic.src = c.toDataURL('image/png'); pic.alt = ''; pic.setAttribute('data-dd-gradient', '');
            pic.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;border-radius:' + cs.borderRadius + ';pointer-events:none;margin:0;max-width:none';
            if (cs.position === 'static') el.style.position = 'relative';
            el.style.setProperty('background-image', 'none', 'important');
            [].slice.call(el.childNodes).forEach(function (t) {   // bare text next to the picture: give it its own layer
              if (t.nodeType === 3 && t.data.trim()) { var s = doc.createElement('span'); s.style.position = 'relative'; el.replaceChild(s, t); s.appendChild(t); }
            });
            el.insertBefore(pic, el.firstChild);
            pic.onload = pic.onerror = function () { ok(); }; setTimeout(ok, 1500);
          } catch (e) { ok(); }
        };
        im.onerror = function () { ok(); };
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      }));
    });
    return Promise.all(jobs);
  }

  function tidy(n) {   // an absolutely placed layer cannot grow or stretch in Figma's auto layout (a centred title got squeezed)
    if (n.abs) { delete n.grow; delete n.stretch; delete n.self; }
    (n.children || []).forEach(tidy);
  }

  function addBlurs(tree, blurs) {   // backdrop-filter: blur() → Figma background blur on the frame with the same box
    if (!blurs.length) return;
    (function walk(n, ox, oy) {
      var x = ox + n.x, y = oy + n.y;
      if (n.type === 'FRAME') blurs.forEach(function (b) {
        if (Math.abs(b.x - x) < 1 && Math.abs(b.y - y) < 1 && Math.abs(b.w - n.w) < 1 && Math.abs(b.h - n.h) < 1)
          (n.effects = n.effects || []).push({ type: 'BACKGROUND_BLUR', color: { r: 0, g: 0, b: 0, a: 0 }, x: 0, y: 0, blur: b.blur * 2, spread: 0 });   // Figma's radius ≈ 2 × CSS blur
      });
      (n.children || []).forEach(function (c) { walk(c, x, y); });
    })(tree, 0, 0);
  }

  function inject(win) {   // his serialiser, run inside the page so styles and sizes are the page's own
    if (win.__ddFX) return Promise.resolve(win.__ddFX);
    return new Promise(function (ok, no) {
      win.FIGMA_CONFIG = window.FIGMA_CONFIG;
      var s = win.document.createElement('script'); s.src = ENGINE;
      s.onload = function () { try { win.__ddFX = win.eval('FX'); ok(win.__ddFX); } catch (e) { no(e); } };
      s.onerror = function () { no(new Error('could not load ' + ENGINE)); };
      win.document.head.appendChild(s);
    });
  }

  function clip(tree, W, H) {   // the frame is the screen: phone size, clipped, nothing below the fold
    tree.x = 0; tree.y = 0; tree.w = W; tree.h = H; tree.clip = true;
    if (tree.children) tree.children = tree.children.filter(function (c) { return c.y < H && c.y + c.h > 0; });
    return tree;
  }

  /* one page (already loaded in win, settled) → his layout tree */
  function tree(win, meta) {
    var doc = win.document;
    try { doc.getAnimations().forEach(function (a) {   // entrance animations end in their final state; endless ones (spinners) stop
      try { if (a.effect && a.effect.getTiming().iterations === Infinity) a.cancel(); else a.finish(); } catch (e) {}
    }); } catch (e) {}
    var blurs;
    /* a map (dd-map-kamil) is a canvas the engine cannot read: swap it for SVG layers (Water, Parks, Roads, Labels...) or
       one image, as chosen in the panel (FigmaBridge.mapMode: full | simple | image) */
    var map = win.DDMap && win.DDMap.forFigma ? win.DDMap.forFigma(window.FigmaBridge.mapMode || 'full').catch(function () {}) : Promise.resolve();
    return map.then(function () { markComponents(doc); return Promise.all([icons(doc, win), images(doc)]); }).then(function () { pseudos(doc, win); fields(doc, win); stacking(doc, win); return gradients(doc, win); }).then(function () { blurs = colours(doc, win); return inject(win); }).then(function (FX) {
      var body = doc.body, bodyBg = win.getComputedStyle(body).backgroundColor;
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(bodyBg)) body.style.backgroundColor = win.getComputedStyle(doc.documentElement).backgroundColor;
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(win.getComputedStyle(body).backgroundColor)) body.style.backgroundColor = '#fff';
      var n = clip(FX.nodeOf(body), win.innerWidth, win.innerHeight);
      tidy(n); addBlurs(n, blurs);
      n.name = meta.title; n.screenTitle = meta.title;
      return JSON.parse(JSON.stringify(n));   // plain objects of the shell's own realm (the page is removed after)
    });
  }

  /* his engine draws text from base64 TrueType @font-face rules in this document (the installer saved the files in
     js/shell/figma/fonts/). Without them Figma gets text it cannot draw and shows it empty. Added once, before the first paste. */
  var fontsP = null;
  function fonts() {
    if (fontsP) return fontsP;
    fontsP = fetch('js/shell/figma/fonts/fonts.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
      .then(function (list) {
        return Promise.all(list.map(function (f) {
          return fetch(f.file).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (buf) {
            var u = new Uint8Array(buf), bin = '', CH = 0x8000;
            for (var i = 0; i < u.length; i += CH) bin += String.fromCharCode.apply(null, u.subarray(i, i + CH));
            return '@font-face{font-family:"' + f.family + '";font-weight:' + f.weight + ';font-style:normal;src:url(data:font/ttf;base64,' + btoa(bin) + ') format("truetype")}';
          }).catch(function () { return ''; });
        }));
      }).then(function (rules) {
        var st = document.createElement('style'); st.id = 'ddFigmaFonts'; st.textContent = rules.join('\n'); document.head.appendChild(st);
      });
    return fontsP;
  }

  /* trees grouped like the page list → { html, stats, kb } for the clipboard */
  function paste(groups, components) {
    var opts = { derived: true, derivedSym: true, hug: true, merge: true, names: true, unify: true, containers: true, identity: true, states: true, props: true, propsOnly: false, sidebarFrame: false };
    return fonts().then(function () {
    if (!components) return FN.toHtml([].concat.apply([], groups.map(function (g) { return g.screens; })), opts);
    return FN.toHtml(groups.map(function (g, i) { return { key: 'g' + i, name: g.name, screens: g.screens }; }), Object.assign({}, opts, { page: true }));
    });
  }

  /* a "Credits" frame for the paste (dd-credits-kamil): who designed the prototype and who made the skills, so the makers travel
     into Figma too. Built as a small card in this page, outside the window, and read with the same serialiser. */
  function creditsScreen() {
    var C = window.DD_CREDITS || {}, list = (C.parts && C.parts.length) ? C.parts : null;
    if (!list && window.ShellCredits && ShellCredits.text) list = ShellCredits.text().split(' · ');
    if (!list || !list.length || typeof FX === 'undefined' || !FX.nodeOf) return null;
    var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-30000px;top:0;width:402px;';
    host.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;width:402px;padding:28px;border-radius:24px;background:#ffffff;color:#0f172a;font-family:system-ui;box-sizing:border-box">' +
      '<div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#64748b">Credits</div>' +
      '<div style="font-size:22px;line-height:28px;font-weight:800;color:#0f172a">' + esc(C.name || (window.SHELL && SHELL.name) || 'Prototype') + '</div>' +
      list.map(function (p) { return '<div style="font-size:15px;line-height:22px;font-weight:500;color:#334155">' + esc(p) + '</div>'; }).join('') +
      '<div style="font-size:12px;line-height:16px;color:#94a3b8">Made with Design Department skills</div></div>';
    document.body.appendChild(host);
    var n = null;
    try { n = FX.nodeOf(host.firstElementChild); n.x = 0; n.y = 0; n.name = 'Credits'; n.screenTitle = 'Credits'; n = JSON.parse(JSON.stringify(n)); } catch (e) { n = null; }
    host.remove();
    return n;
  }

  window.FigmaBridge = { mapMode: 'full', creditsScreen: creditsScreen, tree: tree, paste: paste, copy: function (html) { return FN.copyEvent(html); }, markComponents: markComponents };
})();
