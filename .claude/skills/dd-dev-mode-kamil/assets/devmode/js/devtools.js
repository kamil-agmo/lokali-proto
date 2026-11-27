/* Dev mode tools that sit on top of the inspector (devmode.js):
   1. Sections (button, top left of the right card): outlines every part of the screen with a numbered label; click a label
      (or a row in the list) to isolate one part and dim the rest.
   2. Images (button under the tips): lists every image on the screen and downloads each one as the original file and as
      1x / 2x / 3x PNGs, or everything at once as a .zip. */
(function () {
  'use strict';
  function boot() {
    var D = window.DevMode; if (!D) return;
    var esc = D.esc, r1 = D.r1;
    var SC = (window.DEV_MODE && window.DEV_MODE.sections) || {};   // selectors that tell the Sections tool where the parts of a screen are
    var SEL = { bar: SC.bar || '.appbar, header.bar, header', content: SC.content || 'main, .main, .app, .content', nav: SC.nav || 'nav.tabbar, nav.nav, nav', sub: SC.sub || '.segnav, .subnav' };
    var SKIP = ['[aria-hidden="true"]', '[hidden]'].concat(SC.skip == null ? ['.toast'] : SC.skip ? [SC.skip] : []).join(', ');   // transient overlays (toasts, intros, gradient fades) are not parts of the screen
    var secBtn = document.getElementById('secbtn'), insp = document.getElementById('inspector');

    var secOn = false, secSel = null, secs = [], secLayer = null, secListOpen = true;
    var imgsOpen = false, images = [], busy = '', progress = 0;

    /* ======================= sections ======================= */
    var KNOWN = { appbar: 'App bar', bar: 'App bar', tabbar: 'Tab bar', nav: 'Tab bar', segnav: 'Sub-nav', subnav: 'Sub-nav' };   // class name -> label; DEV_MODE.sections.names adds to it
    for (var kn in (SC.names || {})) KNOWN[kn] = SC.names[kn];
    function visible(el, win) {
      var r = el.getBoundingClientRect(), cs = win.getComputedStyle(el);
      return r.width > 20 && r.height > 8 && cs.display !== 'none' && cs.visibility !== 'hidden';
    }
    function nameOf(el) {
      var cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
      for (var i = 0; i < cls.length; i++) if (KNOWN[cls[i]]) return KNOWN[cls[i]];
      var al = el.getAttribute('aria-label'); if (al) return al.length > 30 ? al.slice(0, 29) + '…' : al;
      var lb = el.getAttribute('aria-labelledby'), t = lb && el.ownerDocument.getElementById(lb.split(' ')[0]);
      if (!t) t = el.matches('h1,h2,h3') ? el : el.querySelector('h1, h2, h3, [class*="title"], [class*="__name"]');
      var txt = t && t.textContent.replace(/\s+/g, ' ').trim();
      if (txt) return txt.length > 30 ? txt.slice(0, 29) + '…' : txt;
      var c = cls.filter(function (x) { return !/^(rise|tap|is-|section$|ripple)/.test(x); })[0] || el.tagName.toLowerCase();
      c = c.replace(/__.*/, '').replace(/[-_]+/g, ' ');
      return c.charAt(0).toUpperCase() + c.slice(1);
    }
    function findSections() {
      var d = D.doc(), w = D.win(); if (!d) return [];
      var out = [], seen = [];
      function add(el) { if (el && seen.indexOf(el) < 0 && visible(el, w)) { seen.push(el); out.push({ el: el, name: nameOf(el) }); } }
      function expand(k, depth) {
        if (!k || k.nodeType !== 1 || /^(script|style|link|template)$/i.test(k.tagName)) return;
        if (k.matches(SKIP) && !k.matches(SEL.bar + ', ' + SEL.nav)) return;
        if (!visible(k, w)) return;
        if (!k.getAttribute('class') && depth < 2 && k.children.length > 1) { [].slice.call(k.children).forEach(function (c) { expand(c, depth + 1); }); return; }
        add(k);
      }
      function pick(list) { var p = list.split(','); for (var i = 0; i < p.length; i++) { var e = d.querySelector(p[i].trim()); if (e) return e; } return null; }   // first selector that matches wins (priority order)
      add(pick(SEL.bar));
      var cont = pick(SEL.content);
      var seg = pick(SEL.sub); if (seg && (!cont || !cont.contains(seg))) add(seg);
      if (cont) [].slice.call(cont.children).forEach(function (c) { expand(c, 0); });
      add(pick(SEL.nav));
      return out;
    }
    function box(l, t, w, h, bg) { return '<div style="position:absolute;left:' + l + 'px;top:' + t + 'px;width:' + Math.max(0, w) + 'px;height:' + Math.max(0, h) + 'px;background:' + bg + '"></div>'; }
    function chip(l, t, txt, i, strong) {
      return '<div data-sec="' + i + '" style="position:absolute;left:' + l + 'px;top:' + t + 'px;max-width:230px;padding:2px 7px 2px 3px;border-radius:99px;background:' + (strong ? D.theme().s : D.theme().a) +
        ';color:#fff;font:700 10px/16px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;pointer-events:auto;box-shadow:0 1px 4px rgba(15,23,42,.35)">' +
        '<span style="display:inline-block;min-width:16px;height:16px;margin-right:5px;border-radius:50%;background:#fff;color:' + D.theme().s + ';text-align:center">' + (i + 1) + '</span>' + esc(txt) + '</div>';
    }
    function drawSections() {
      var d = D.doc(), w = D.win();
      if (!d) return;
      if (!secLayer || !secLayer.parentNode) {
        secLayer = d.createElement('div'); secLayer.id = '__dev_sec'; secLayer.setAttribute('data-devui', ''); secLayer.setAttribute('aria-hidden', 'true');
        secLayer.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none';
        secLayer.addEventListener('click', function (e) {
          var c = e.target.closest('[data-sec]'); if (!c) return;
          e.preventDefault(); e.stopPropagation();
          choose(c.dataset.sec === 'all' ? null : +c.dataset.sec, false);
        }, true);
        d.documentElement.appendChild(secLayer);
      }
      if (!secOn) { secLayer.innerHTML = ''; return; }
      secs = findSections();
      var W = w.innerWidth, H = w.innerHeight, html = '';
      if (secSel !== null && secs[secSel]) {
        var r = secs[secSel].el.getBoundingClientRect(), dim = 'rgba(15,23,42,.58)';
        html += box(0, 0, W, r.top, dim) + box(0, r.bottom, W, H - r.bottom, dim) + box(0, r.top, r.left, r.height, dim) + box(r.right, r.top, W - r.right, r.height, dim);
        html += '<div style="position:absolute;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;outline:2px solid ' + D.theme().a + ';outline-offset:-1px"></div>';
        html += chip(Math.max(4, r.left + 4), r.top > 24 ? r.top - 22 : r.top + 4, secs[secSel].name + '  ' + r1(r.width) + ' × ' + r1(r.height), secSel, true);
        html += '<div data-sec="all" style="position:absolute;right:6px;top:6px;padding:3px 10px;border-radius:99px;background:#fff;color:' + D.theme().s + ';font:700 11px/16px system-ui,sans-serif;cursor:pointer;pointer-events:auto;box-shadow:0 1px 6px rgba(15,23,42,.3)">Show all sections</div>';
      } else {
        secs.forEach(function (s, i) {
          var r = s.el.getBoundingClientRect();
          html += '<div style="position:absolute;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;outline:1.5px dashed ' + D.theme().a + ';outline-offset:-1px;background:' + D.mix(D.theme().a, 6) + '"></div>';
        });
        secs.forEach(function (s, i) {
          var r = s.el.getBoundingClientRect();
          html += chip(Math.max(3, r.left + 3), r.top + 3, s.name, i, false);
        });
      }
      secLayer.innerHTML = html;
    }
    function choose(i, scroll) {
      secSel = i;
      if (i !== null && scroll !== false && secs[i]) { try { secs[i].el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (e) {} }
      drawSections(); D.renderTop();
    }
    function setSections(v) {
      secOn = v; secSel = null; secBtn.classList.toggle('is-on', v); secBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
      secBtn.querySelector('.devbtn__label').textContent = v ? 'Sections on' : 'Sections';
      drawSections(); D.renderTop();
    }
    D.sectionTarget = function () { return secOn && secSel !== null && secs[secSel] ? secs[secSel].el : null; };
    secBtn.addEventListener('click', function () { setSections(!secOn); });
    D.parts.push(function () {
      if (!secOn) return '';
      var list = secs.length ? secs : findSections();
      var head = '<button type="button" class="dvsec__head" data-act="seclist" aria-expanded="' + secListOpen + '"><span>Sections</span><span class="dvsec__count">' + list.length + ' parts</span><span class="mi dvsec__chev" style="font-size:18px" aria-hidden="true">' + (secListOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down') + '</span></button>';
      if (!secListOpen) return '<div class="dvsec is-collapsed">' + head + '</div>';
      return '<div class="dvsec">' + head +
        list.map(function (s, i) {
          var r = s.el.getBoundingClientRect();
          return '<button type="button" class="dvsec__row' + (secSel === i ? ' is-on' : '') + '" data-pick="' + i + '"><span class="dvsec__n">' + (i + 1) + '</span><span class="dvsec__name">' + esc(s.name) + '</span><span class="dvsec__size">' + r1(r.width) + ' × ' + r1(r.height) + '</span></button>';
        }).join('') + (secSel !== null ? '<button type="button" class="dvsec__all" data-pick="all">Show all sections</button>' : '') + '</div>';
    });
    D.on('attach', function () { secLayer = null; if (secOn) drawSections(); });
    D.on('detach', function () { try { if (secLayer && secLayer.parentNode) secLayer.parentNode.removeChild(secLayer); } catch (e) {} secLayer = null; });
    D.on('redraw', function () { if (secOn) drawSections(); });
    D.on('load', function () { secSel = null; if (secOn) setTimeout(function () { drawSections(); D.renderTop(); }, 700); });
    D.on('off', function () { secOn = false; secSel = null; imgsOpen = false; images = []; secBtn.classList.remove('is-on'); secBtn.setAttribute('aria-pressed', 'false'); secBtn.querySelector('.devbtn__label').textContent = 'Sections'; });

    /* ======================= images ======================= */
    function fileName(u, i) {
      if (/^data:/.test(u)) { var m = u.match(/^data:image\/([a-z+.-]+)/i); return 'inline-image-' + (i + 1) + '.' + (m ? m[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg') : 'png'); }
      var n = u.split('?')[0].split('#')[0].split('/').pop() || ('image-' + (i + 1)); try { n = decodeURIComponent(n); } catch (e) {}
      return n;
    }
    function typeOf(name, blobType) {
      var m = name.match(/\.([a-z0-9]+)$/i), e = m ? m[1].toLowerCase() : '';
      if (!e && blobType) e = blobType.split('/')[1] || '';
      return e === 'jpeg' ? 'jpg' : e.replace('svg+xml', 'svg');
    }
    function scanImages() {
      var d = D.doc(), w = D.win(); if (!d) { images = []; return; }
      var map = {}, order = [];
      function note(url, dw, dh, nw, nh) {
        if (!url || /^about:/.test(url)) return;
        var abs; try { abs = new URL(url, d.baseURI).href; } catch (e) { return; }
        var o = map[abs];
        if (!o) { o = map[abs] = { url: abs, dw: 0, dh: 0, nw: nw || 0, nh: nh || 0 }; order.push(abs); }
        if (dw > o.dw) { o.dw = dw; o.dh = dh; }
        if (nw && !o.nw) { o.nw = nw; o.nh = nh; }
      }
      d.querySelectorAll('img').forEach(function (im) {
        var r = im.getBoundingClientRect(), vis = r.width > 0 && w.getComputedStyle(im).display !== 'none';
        note(im.currentSrc || im.src, vis ? r.width : 0, vis ? r.height : 0, im.naturalWidth, im.naturalHeight);
      });
      d.querySelectorAll('*').forEach(function (el) {
        if (el.closest('[data-devui]')) return;
        var bg = w.getComputedStyle(el).backgroundImage; if (!bg || bg === 'none') return;
        var re = /url\((["']?)(.*?)\1\)/g, m, r = el.getBoundingClientRect();
        while ((m = re.exec(bg))) note(m[2], r.width, r.height, 0, 0);
      });
      var prev = {}; images.forEach(function (i) { prev[i.url] = i; });
      order = order.filter(function (u) { return map[u].dw > 0; });   // only images that are actually showing on the screen
      images = order.map(function (u, i) {
        var o = map[u], p = prev[u]; if (p) { o.nw = o.nw || p.nw; o.nh = o.nh || p.nh; }
        o.name = fileName(u, i); o.type = typeOf(o.name, ''); return o;
      });
      images.forEach(function (o) {                            // natural size of background images
        if (o.nw) return;
        var im = new Image(); im.onload = function () { o.nw = im.naturalWidth; o.nh = im.naturalHeight; if (imgsOpen) D.renderTop(); }; im.src = o.url;
      });
    }
    function sizesOf(o) {
      var base = Math.round(o.dw || o.nw || 0), out = [];
      if (!base) return out;
      [1, 2, 3].forEach(function (s) {
        var w = base * s, ok = o.type === 'svg' || !o.nw || w <= o.nw * 1.02;
        if (ok) out.push({ s: s, w: w, h: Math.round(w * (o.nw && o.nh ? o.nh / o.nw : (o.dh || base) / (o.dw || base))) });   // keeps the file's own proportions, even when the screen crops it
      });
      return out;
    }
    function fetchBlob(o) { return within(fetch(o.url).then(function (r) { if (!r.ok) throw new Error('fetch'); return r.blob(); }), 8000); }
    function within(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
    function raster(o, blob, w, h) {
      return within(new Promise(function (res, rej) {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () {
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
          c.toBlob(function (b) { URL.revokeObjectURL(u); b ? res(b) : rej(new Error('encode')); }, 'image/png');
        };
        im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('load')); };
        im.src = u;
      }), 8000);
    }
    function save(blob, name) {
      var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500);
    }
    function stem(n) { return n.replace(/\.[a-z0-9]+$/i, ''); }
    function download(i, kind) {
      var o = images[i]; if (!o) return;
      busy = i + ':' + kind; D.renderTop();
      fetchBlob(o).then(function (blob) {
        if (kind === 'orig') { save(blob, o.name.indexOf('.') > -1 ? o.name : o.name + '.' + (blob.type.split('/')[1] || 'png')); return; }
        var sz = sizesOf(o).filter(function (z) { return z.s === +kind; })[0];
        return raster(o, blob, sz.w, sz.h).then(function (b) { save(b, stem(o.name) + '@' + sz.s + 'x.png'); });
      }).catch(function () { flash('Could not read that image'); }).then(function () { busy = ''; D.renderTop(); });
    }
    /* a store-only zip (no compression), enough for images that are already compressed */
    var crcT = null;
    function crc32(u8) {
      if (!crcT) { crcT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
      var crc = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) crc = crcT[(crc ^ u8[i]) & 255] ^ (crc >>> 8); return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    function zip(files) {
      var enc = new TextEncoder(), chunks = [], central = [], offset = 0, now = new Date();
      var dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF, dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
      files.forEach(function (f) {
        var nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
        h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
        chunks.push(new Uint8Array(h.buffer), nm, f.data);
        var c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
        c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, offset, true);
        central.push(new Uint8Array(c.buffer), nm);
        offset += 30 + nm.length + f.data.length;
      });
      var cs = 0; central.forEach(function (p) { cs += p.length; });
      var e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, offset, true);
      return new Blob(chunks.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
    }
    function u8(blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
    function downloadAll() {
      if (!images.length) return;
      busy = 'all'; D.renderTop();
      var files = [], used = {}, done = 0;
      function uniq(n) { var base = n, k = 1; while (used[n]) { n = stem(base) + '-' + (k++) + (base.match(/\.[a-z0-9]+$/i) || [''])[0]; } used[n] = 1; return n; }
      var chain = Promise.resolve();
      images.forEach(function (o, idx) {
        chain = chain.then(function () {
          busy = 'all'; done = idx; progress = idx + 1; D.renderTop();
          return fetchBlob(o).then(function (blob) {
            var oname = o.name.indexOf('.') > -1 ? o.name : o.name + '.' + (blob.type.split('/')[1] || 'png');
            return u8(blob).then(function (d) { files.push({ name: uniq(oname), data: d }); })
              .then(function () {
                var p = Promise.resolve();
                sizesOf(o).forEach(function (z) { p = p.then(function () { return raster(o, blob, z.w, z.h).then(u8).then(function (d) { files.push({ name: uniq(stem(o.name) + '@' + z.s + 'x.png'), data: d }); }); }).catch(function () {}); });
                return p;
              });
          }).catch(function () {});
        });
      });
      chain.then(function () {
        if (!files.length) { flash('Nothing could be downloaded'); return; }
        var page = ''; try { page = (D.doc().location.pathname.split('/').pop() || 'page').replace(/\.html$/, ''); } catch (e) {}
        save(zip(files), (((window.DEV_MODE && window.DEV_MODE.prefix) || (window.SHELL && window.SHELL.prefix) || 'proto') + '-') + page + '-images.zip');
      }).then(function () { busy = ''; D.renderTop(); });
    }
    var note = '', noteT = 0;
    function flash(t) { note = t; D.renderTop(); clearTimeout(noteT); noteT = setTimeout(function () { note = ''; D.renderTop(); }, 2600); }

    /* ======================= live state ======================= */
    // What the screen reports while it is used (ProtoEmbed.report: "Posts loaded 6", "Liked 0"). State for checking the prototype,
    // so it lives here and not in the presenter's card. The shell passes it on with the <prefix>:facts event.
    var PFX = (window.DEV_MODE && window.DEV_MODE.prefix) || (window.SHELL && window.SHELL.prefix) || 'proto';
    var live = (window.Shell && window.Shell.facts && window.Shell.facts()) || [];
    window.addEventListener(PFX + ':facts', function (e) { live = (e.detail && e.detail.facts) || []; if (D.isOn()) D.renderTop(); });
    D.parts.push(function () {
      if (!live.length) return '';
      return '<section class="dvlive"><h3>Live state</h3><p class="dvlive__note">Values this screen reports as it is used.</p><div class="dv__rows">' +
        live.map(function (f) { return '<div class="dv__row"><span>' + esc(f[0]) + '</span><span class="dv__val">' + esc(f[1]) + '</span></div>'; }).join('') + '</div></section>';
    });

    D.parts.push(function () {
      var n = images.length;
      var h = '<div class="dvimg"><button type="button" class="dvimg__toggle" data-act="imgs" aria-expanded="' + imgsOpen + '"><span class="mi" style="font-size:16px" aria-hidden="true">image</span><span>Download images</span><span class="dvimg__n">' + n + '</span><span class="mi dvimg__chev" style="font-size:18px" aria-hidden="true">' + (imgsOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down') + '</span></button>';
      if (imgsOpen) {
        if (!n) h += '<p class="dvimg__empty">No downloadable images on this screen.</p>';
        else {
          h += '<ul class="dvimg__list">' + images.map(function (o, i) {
            var szs = sizesOf(o), meta = (o.type || 'image').toUpperCase() + (o.nw ? ' · ' + o.nw + '×' + o.nh + ' file' : '') + (o.dw ? ' · shown ' + Math.round(o.dw) + '×' + Math.round(o.dh) : '');
            return '<li class="dvimg__item"><span class="dvimg__thumb"><img src="' + esc(o.url) + '" alt=""></span><span class="dvimg__info"><b title="' + esc(o.name) + '">' + esc(o.name) + '</b><small>' + esc(meta) + '</small>' +
              '<span class="dvimg__sizes"><button type="button" data-act="dl" data-i="' + i + '" data-k="orig">' + (busy === i + ':orig' ? '…' : 'Original') + '</button>' +
              szs.map(function (z) { return '<button type="button" data-act="dl" data-i="' + i + '" data-k="' + z.s + '" title="' + z.w + ' × ' + z.h + ' px PNG">' + (busy === i + ':' + z.s ? '…' : z.s + '×') + '</button>'; }).join('') + '</span></span></li>';
          }).join('') + '</ul><button type="button" class="dvimg__all" data-act="zip">' + (busy === 'all' ? 'Preparing… ' + progress + ' of ' + images.length : 'Download all sizes (.zip)') + '</button>' +
            '<p class="dvimg__hint">1×, 2× and 3× are PNGs at the size shown in the phone. Larger sizes are only offered when the file is big enough (SVGs scale freely).</p>';
        }
        if (note) h += '<p class="dvimg__err">' + esc(note) + '</p>';
      }
      return h + '</div>';
    });

    D.parts.unshift(D.parts.pop());                         // the images button sits right under the tips, above the sections list

    insp.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act],[data-pick]'); if (!t) return;
      if (t.dataset.pick !== undefined) { choose(t.dataset.pick === 'all' ? null : +t.dataset.pick, true); return; }
      var a = t.dataset.act;
      if (a === 'imgs') { imgsOpen = !imgsOpen; if (imgsOpen) scanImages(); D.renderTop(); }
      else if (a === 'seclist') { secListOpen = !secListOpen; D.renderTop(); }
      else if (a === 'dl') download(+t.dataset.i, t.dataset.k);
      else if (a === 'zip') downloadAll();
    });
    function refreshImages() { [900, 2800].forEach(function (ms) { setTimeout(function () { scanImages(); D.renderTop(); }, ms); }); }   // screens fill in their images a moment after loading
    D.on('attach', refreshImages);
    D.on('load', refreshImages);
    if (D.isOn() && D.doc()) refreshImages();
  }
  if (window.DevMode) boot(); else window.addEventListener('devmode:ready', boot);
})();
