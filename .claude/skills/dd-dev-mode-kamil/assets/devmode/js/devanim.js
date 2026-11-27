/* Dev mode: "Download animation".
   Reads every animation running inside the chosen element (the pinned element, or the isolated section) with the Web Animations
   API, writes it as a neutral spec, and turns that spec into a download:
     JSON spec · CSS · standalone HTML · Flutter (Dart).
   What it cannot see: motion driven by JavaScript timers (numbers counting up, charts drawing). Those are listed in the notes. */
(function () {
  'use strict';
  function boot() {
    var D = window.DevMode; if (!D || D.__anim) return; D.__anim = true;
    var esc = D.esc, r1 = D.r1, insp = document.getElementById('inspector');
    var open = false, fmtOpen = false, busy = '', note = '', noteT = 0;

    /* ---------- the element to export ---------- */
    function target() { var p = D.pinned && D.pinned(); if (p && D.doc() && D.doc().contains(p)) return p; return D.sectionTarget ? D.sectionTarget() : null; }
    function selOf(el, root) {
      var parts = [], n = el;
      while (n && n !== root.parentElement && n.nodeType === 1 && parts.length < 5) {
        var cls = (n.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && !/^(is-|rise|tap$)/.test(c); }).slice(0, 2);
        parts.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + cls.map(function (c) { return '.' + c; }).join(''));
        if (n === root) break; n = n.parentElement;
      }
      return parts.join(' > ');
    }
    function nameOf(el) {
      var h = el.matches && el.matches('h1,h2,h3') ? el : el.querySelector && el.querySelector('h1,h2,h3,[class*="title"]');
      var t = h && h.textContent.replace(/\s+/g, ' ').trim();
      if (!t) { var c = (el.getAttribute('class') || '').split(/\s+/).filter(function (x) { return x && !/^(is-|rise|tap$|section$)/.test(x); })[0]; t = c ? c.replace(/__.*/, '') : el.tagName.toLowerCase(); }
      return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'animation';
    }
    function pascal(s) { return s.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('') || 'Animation'; }
    function camel(s) { var p = pascal(s); return p.charAt(0).toLowerCase() + p.slice(1); }

    /* ---------- reading the animations ---------- */
    function typeOf(a, w) { return w.CSSAnimation && a instanceof w.CSSAnimation ? 'css-animation' : w.CSSTransition && a instanceof w.CSSTransition ? 'css-transition' : 'script'; }
    function readAnimations(t) {
      var w = D.win(), out = [];
      if (!t || !t.getAnimations) return out;
      t.getAnimations({ subtree: true }).forEach(function (a) {
        var e = a.effect; if (!e || !e.target || !t.contains(e.target) || (e.target.closest && e.target.closest('[data-devui]'))) return;
        var tm = e.getComputedTiming(); if (!tm.duration) return;
        var kfs = e.getKeyframes ? e.getKeyframes() : [];
        out.push({ anim: a, el: e.target, pseudo: e.pseudoElement || '', type: typeOf(a, w), name: a.animationName || a.transitionProperty || a.id || 'script-animation', timing: tm, kfs: kfs });
      });
      return out;
    }
    function dur(tm) { return Math.round(tm.duration) + 'ms'; }
    function loopTxt(tm) { return tm.iterations === Infinity ? 'loops' : tm.iterations + '×'; }

    /* ---------- values ---------- */
    function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
    function lenPx(v, base) { v = String(v).trim(); if (/%$/.test(v)) return num(v) / 100 * base; if (/rem$/.test(v)) return num(v) * 16; return num(v); }
    function parseTransform(str, rect) {
      var o = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 };
      if (!str || str === 'none') return o;
      var m, re = /(\w+)\(([^)]*)\)/g;
      while ((m = re.exec(str))) {
        var f = m[1], a = m[2].split(',').map(function (x) { return x.trim(); });
        if (f === 'translate' || f === 'translate3d') { o.tx += lenPx(a[0], rect.w); o.ty += lenPx(a[1] || '0', rect.h); }
        else if (f === 'translateX') o.tx += lenPx(a[0], rect.w);
        else if (f === 'translateY') o.ty += lenPx(a[0], rect.h);
        else if (f === 'scale') { o.sx *= num(a[0]); o.sy *= num(a[1] !== undefined ? a[1] : a[0]); }
        else if (f === 'scaleX') o.sx *= num(a[0]);
        else if (f === 'scaleY') o.sy *= num(a[0]);
        else if (f === 'rotate' || f === 'rotateZ') { var v = a[0], r = num(v); if (/turn/.test(v)) r *= 360; else if (/rad/.test(v)) r = r * 180 / Math.PI; o.rot += r; }
        else if (f === 'matrix') { var n = a.map(num); o.tx += n[4]; o.ty += n[5]; o.sx *= Math.hypot(n[0], n[1]); o.sy *= Math.hypot(n[2], n[3]); o.rot += Math.atan2(n[1], n[0]) * 180 / Math.PI; }
      }
      return o;
    }
    function baseValue(el, prop, rect) {
      var cs = D.win().getComputedStyle(el);
      if (prop === 'opacity') return num(cs.opacity);
      if (prop === 'transform') return parseTransform(cs.transform, rect);
      return cs.getPropertyValue(prop.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }));
    }
    function rectOf(el, root) {
      var r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
      return { x: r1(r.left - rr.left), y: r1(r.top - rr.top), w: r1(r.width), h: r1(r.height) };
    }
    var SKIP = { offset: 1, computedOffset: 1, easing: 1, composite: 1 };

    /* ---------- the neutral spec ---------- */
    function buildSpec(t) {
      var items = readAnimations(t), w = D.win(), byEl = [], elems = [], notes = [];
      var troot = t.getBoundingClientRect();
      items.forEach(function (it) {
        var idx = byEl.indexOf(it.el);
        if (idx < 0) {
          byEl.push(it.el); var rect = rectOf(it.el, t), cs = w.getComputedStyle(it.el), bg = cs.backgroundColor, tn = D.tokName;
          var origin = (cs.transformOrigin || '').split(' ').map(function (x, i) { return rect.w && rect.h ? num(x) / (i ? rect.h : rect.w) : 0.5; });
          elems.push({
            id: camel((it.el.getAttribute('class') || it.el.tagName).split(/\s+/)[0] + (byEl.length)), selector: selOf(it.el, t), tag: it.el.tagName.toLowerCase(), rect: rect,
            style: { background: bg, backgroundToken: tn ? tn('color', bg) : '', color: cs.color, borderRadius: cs.borderTopLeftRadius, opacity: cs.opacity, transformOrigin: [r1(origin[0] || 0.5), r1(origin[1] || 0.5)] },
            animations: []
          });
          idx = byEl.length - 1;
        }
        var rect2 = elems[idx].rect, tm = it.timing, frames = it.kfs.map(function (k) {
          var props = {}; Object.keys(k).forEach(function (p) { if (!SKIP[p]) props[p] = String(k[p]); });
          return { offset: r1(k.computedOffset != null ? k.computedOffset : k.offset || 0), easing: k.easing || 'linear', props: props };
        });
        elems[idx].animations.push({
          name: it.name, type: it.type, pseudoElement: it.pseudo || undefined, durationMs: Math.round(tm.duration), delayMs: Math.round(tm.delay), endDelayMs: Math.round(tm.endDelay || 0),
          iterations: tm.iterations === Infinity ? 'infinite' : tm.iterations, direction: tm.direction, fill: tm.fill, easing: tm.easing, keyframes: frames
        });
        if (it.type === 'script') notes.push('"' + it.name + '" on ' + elems[idx].selector + ' is a script-driven animation: keyframes are the browser\'s view of it.');
        if (it.pseudo) notes.push('Animation on ' + it.pseudo + ' of ' + elems[idx].selector + ': apply it to a child widget in your app.');
      });
      var unsupported = {};
      elems.forEach(function (e) { e.animations.forEach(function (a) { a.keyframes.forEach(function (k) { Object.keys(k.props).forEach(function (p) { if (p !== 'transform' && p !== 'opacity') unsupported[p] = 1; }); }); }); });
      Object.keys(unsupported).forEach(function (p) { notes.push('Property "' + p + '" is animated: match it by hand (the Flutter file lists the values as a TODO).'); });
      notes.push('Numbers counting up and charts drawing are driven by JavaScript and are not part of this spec.');
      return {
        name: nameOf(t), generatedFrom: { page: (function () { try { return D.doc().location.pathname.split('/').pop(); } catch (e) { return ''; } })(), element: selOf(t, t) },
        generatedAt: new Date().toISOString(), size: { width: r1(troot.width), height: r1(troot.height) }, elements: elems, notes: notes
      };
    }

    /* ---------- CSS ---------- */
    function usedElements(t) { return [t].concat([].slice.call(t.querySelectorAll('*'))); }
    function stripPseudo(sel) { return sel.replace(/::?(before|after|first-line|first-letter|placeholder|selection|backdrop|marker)/g, '').replace(/:(hover|active|focus|focus-visible|focus-within|visited)/g, '').trim() || '*'; }
    function selMatches(sel, els, w) {
      return sel.split(/,(?![^(]*\))/).some(function (one) {
        var s = stripPseudo(one.trim()); if (!s) return false;
        try { return els.some(function (e) { return e.matches(s); }); } catch (e) { return false; }
      });
    }
    function collectCss(t) {
      var d = D.doc(), w = D.win(), els = usedElements(t), rules = [], keyframes = {}, usedNames = {}, fontFaces = [];
      function walk(list) {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          if (r.type === 1) { if (r.selectorText && selMatches(r.selectorText, els, w)) rules.push(r.cssText); }
          else if (r.type === 7) keyframes[r.name] = r.cssText;
          else if (r.type === 4) { try { if (w.matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules); } catch (e) {} }
          else if (r.type === 5) fontFaces.push(r.cssText);
        }
      }
      for (var i = 0; i < d.styleSheets.length; i++) { try { walk(d.styleSheets[i].cssRules); } catch (e) {} }
      var inline = els.map(function (e) { return e.getAttribute('style') || ''; }).join(' ');
      var text = rules.join('\n') + ' ' + inline;
      Object.keys(keyframes).forEach(function (n) { if (new RegExp('(^|[^\\w-])' + n.replace(/[-]/g, '\\-') + '([^\\w-]|$)').test(text)) usedNames[n] = 1; });
      // custom properties the rules (and keyframes) read
      var vars = {}, rootCs = w.getComputedStyle(d.documentElement), scan = text + Object.keys(usedNames).map(function (n) { return keyframes[n]; }).join(' ');
      var guard = 0, found = true;
      while (found && guard++ < 4) {
        found = false;
        (scan.match(/var\((--[\w-]+)/g) || []).forEach(function (m) {
          var n = m.slice(4); if (vars[n] !== undefined) return;
          var v = rootCs.getPropertyValue(n).trim(); vars[n] = v; if (v) { scan += ' ' + v; found = true; }
        });
      }
      var root = ':root {\n' + Object.keys(vars).filter(function (n) { return vars[n]; }).map(function (n) { return '  ' + n + ': ' + vars[n] + ';'; }).join('\n') + '\n}';
      return { root: root, rules: rules, keyframes: Object.keys(usedNames).map(function (n) { return keyframes[n]; }), vars: vars };
    }
    function pretty(css) { return css.replace(/\{\s*/g, ' {\n  ').replace(/;\s*(?!\})/g, ';\n  ').replace(/\s*\}/g, '\n}').replace(/\n  \n/g, '\n'); }
    function cssFile(t) {
      var c = collectCss(t);
      return '/* ' + nameOf(t) + ': CSS for the animated card, read from the prototype.\n   Selectors are the ones used in the prototype; rename them to fit your project. */\n' +
        c.root + '\n\n' + c.keyframes.map(pretty).join('\n\n') + '\n\n' + c.rules.map(pretty).join('\n\n') + '\n';
    }

    /* ---------- HTML ---------- */
    function dataUri(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error('x'); return r.blob(); }).then(function (b) {
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); });
      });
    }
    function inlineAssets(html, css, base) {
      var urls = {}, re = /url\((["']?)(?!data:)([^"')]+)\1\)|(?:src|href)=(["'])(?!data:|#|http)([^"']+\.(?:png|jpe?g|webp|gif|svg))\3/g, m;
      var all = html + ' ' + css;
      while ((m = re.exec(all))) { var u = m[2] || m[4]; if (u) urls[u] = 1; }
      var list = Object.keys(urls), map = {};
      return Promise.all(list.map(function (u) {
        var abs; try { abs = new URL(u, base).href; } catch (e) { return null; }
        return dataUri(abs).then(function (d) { map[u] = d; }).catch(function () {});
      })).then(function () {
        function sub(s) { Object.keys(map).forEach(function (u) { s = s.split(u).join(map[u]); }); return s; }
        return { html: sub(html), css: sub(css) };
      });
    }
    function htmlFile(t) {
      var d = D.doc(), w = D.win(), c = collectCss(t), clone = t.cloneNode(true);
      clone.querySelectorAll('[data-devui], #__dev, #__dev_sec').forEach(function (n) { n.remove(); });
      var r = t.getBoundingClientRect(); clone.setAttribute('style', (clone.getAttribute('style') || '') + ';width:' + r1(r.width) + 'px;');
      var inner = clone.outerHTML;
      var chain = []; var p = t.parentElement;
      while (p && p !== d.body && p !== d.documentElement) { chain.unshift(p); p = p.parentElement; }
      chain.forEach(function (a) { var at = ''; ['class', 'id'].forEach(function (k) { if (a.getAttribute(k)) at += ' ' + k + '="' + esc(a.getAttribute(k)) + '"'; }); var tag = a.tagName.toLowerCase(); inner = '<' + tag + at + '>' + inner + '</' + tag + '>'; });
      var fonts = [].slice.call(d.querySelectorAll('link[rel="stylesheet"][href^="http"], link[rel="preconnect"]')).map(function (l) { return l.outerHTML; }).join('\n  ');
      var bg = w.getComputedStyle(d.body).backgroundColor, htmlCls = d.documentElement.className.replace(/\bin-phone\b/, '').trim();
      var css = c.root + '\n' + c.keyframes.join('\n') + '\n' + c.rules.join('\n');
      return inlineAssets(inner, css, d.baseURI).then(function (x) {
        return '<!doctype html>\n<html lang="en" class="' + esc(htmlCls) + '">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + esc(nameOf(t)) + ' · animation</title>\n  ' + fonts + '\n  <style>\n  *,*::before,*::after{box-sizing:border-box}\n  html,body{margin:0}\n  body{display:flex;justify-content:center;padding:32px 16px;background:' + (bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#f8fafc') + ';font-family:"Manrope",system-ui,sans-serif}\n  button{font:inherit;color:inherit;background:none;border:0;padding:0;text-align:left}\n  ul{list-style:none;margin:0;padding:0}h1,h2,h3,h4,p{margin:0}\n' + x.css.replace(/^/gm, '  ') + '\n  </style>\n</head>\n<body class="' + esc(d.body.className) + '">\n' + x.html + '\n</body>\n</html>\n';
      });
    }

    /* ---------- Flutter (Dart) ---------- */
    function curveOf(e) {
      e = (e || 'linear').trim();
      var m = e.match(/cubic-bezier\(([^)]+)\)/);
      if (m) return 'Cubic(' + m[1].split(',').map(function (x) { return num(x); }).join(', ') + ')';
      return { linear: 'Curves.linear', ease: 'Curves.ease', 'ease-in': 'Curves.easeIn', 'ease-out': 'Curves.easeOut', 'ease-in-out': 'Curves.easeInOut' }[e] || (/^steps/.test(e) ? 'const Threshold(0.5)' : 'Curves.linear');
    }
    function dbl(n) { n = Math.round(n * 1000) / 1000; return (n % 1 === 0 ? n.toFixed(1) : String(n)); }
    function tracks(el, a) {
      // channels: opacity, tx, ty, sx, sy, rot  -> [{offset, v, easing}]
      var ch = { opacity: [], tx: [], ty: [], sx: [], sy: [], rot: [] }, rect = el.rect, node = null;
      var frames = a.keyframes.slice().sort(function (p, q) { return p.offset - q.offset; });
      function push(c, off, v, ease) { ch[c].push({ offset: off, v: v, easing: ease }); }
      frames.forEach(function (k) {
        if (k.props.opacity !== undefined) push('opacity', k.offset, num(k.props.opacity), k.easing);
        if (k.props.transform !== undefined) { var t = parseTransform(k.props.transform, rect); push('tx', k.offset, t.tx, k.easing); push('ty', k.offset, t.ty, k.easing); push('sx', k.offset, t.sx, k.easing); push('sy', k.offset, t.sy, k.easing); push('rot', k.offset, t.rot * Math.PI / 180, k.easing); }
      });
      var base = { opacity: 1, tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 };     // what a keyframe without a value falls back to
      Object.keys(ch).forEach(function (c) {
        var list = ch[c]; if (!list.length) return;
        if (list[0].offset > 0) list.unshift({ offset: 0, v: base[c], easing: 'linear' });
        if (list[list.length - 1].offset < 1) list.push({ offset: 1, v: base[c], easing: 'linear' });
        var same = list.every(function (p) { return Math.abs(p.v - list[0].v) < 1e-9; });
        if (same) ch[c] = [];
      });
      return ch;
    }
    function flutterFile(spec) {
      var cls = pascal(spec.name) + 'Animations', L = [], used = {};
      L.push('// ' + cls + ': generated from the prototype (' + spec.generatedFrom.page + ', "' + spec.name + '").');
      L.push('//');
      L.push('// Usage');
      L.push('//   class _CardState extends State<Card> with TickerProviderStateMixin {');
      L.push('//     late final ' + cls + ' anim = ' + cls + '(this)..start();');
      L.push('//     @override void dispose() { anim.dispose(); super.dispose(); }');
      L.push('//     // wrap the widget that should move:  anim.' + (spec.elements[0] ? spec.elements[0].id : 'part') + '(child: MyWidget())');
      L.push('//   }');
      L.push('//');
      L.push('// Sizes below are logical pixels from a 402 pt wide phone. Percent translations are already converted to pixels.');
      spec.notes.forEach(function (n) { L.push('// NOTE: ' + n); });
      L.push('');
      L.push("import 'package:flutter/material.dart';");
      L.push('');
      L.push('class ' + cls + ' {');
      L.push('  ' + cls + '(this.vsync);');
      L.push('  final TickerProvider vsync;');
      L.push('  bool _alive = true;');
      L.push('  final List<Future<void> Function()> _starters = [];');
      L.push('');
      var elemCode = [], ctorLines = [];
      spec.elements.forEach(function (el, ei) {
        var id = el.id; while (used[id]) id += 'X'; used[id] = 1;
        var elLines = [], merge = [], chan = {}, origin = el.style.transformOrigin || [0.5, 0.5], todo = [];
        el.animations.forEach(function (a, ai) {
          var v = id + 'C' + ai, ch = tracks(el, a);
          L.push('  // ' + (a.name || 'animation') + ' on ' + el.selector + ': ' + (a.durationMs / 1000) + 's, ' + a.iterations + (a.iterations === 'infinite' ? ' loop' : 'x') + (a.direction !== 'normal' ? ', ' + a.direction : '') + (a.delayMs ? ', delay ' + a.delayMs + 'ms' : ''));
          L.push('  late final AnimationController ' + v + ' = AnimationController(vsync: vsync, duration: const Duration(milliseconds: ' + a.durationMs + '));');
          merge.push(v);
          Object.keys(ch).forEach(function (c) {
            var list = ch[c]; if (!list.length) return;
            var items = [];
            for (var i = 0; i < list.length - 1; i++) {
              var w = Math.max(0.01, (list[i + 1].offset - list[i].offset) * 100);
              items.push('    TweenSequenceItem(tween: Tween<double>(begin: ' + dbl(list[i].v) + ', end: ' + dbl(list[i + 1].v) + ').chain(CurveTween(curve: ' + curveOf(list[i].easing) + ')), weight: ' + dbl(w) + ')');
            }
            var name = v + c.charAt(0).toUpperCase() + c.slice(1);
            L.push('  late final Animation<double> ' + name + ' = TweenSequence<double>([\n' + items.join(',\n') + ',\n  ]).animate(' + v + ');');
            chan[c] = name;
          });
          a.keyframes.forEach(function (k) { Object.keys(k.props).forEach(function (p) { if (p !== 'transform' && p !== 'opacity') todo.push('//   ' + p + ' at ' + Math.round(k.offset * 100) + '%: ' + k.props[p]); }); });
          var its = a.iterations === 'infinite' ? 'double.infinity' : dbl(a.iterations);
          ctorLines.push('    _starters.add(() => _play(' + v + ', delayMs: ' + a.delayMs + ', iterations: ' + its + ', alternate: ' + (/alternate/.test(a.direction) ? 'true' : 'false') + '));');
          L.push('');
        });
        var hasT = chan.tx || chan.ty || chan.sx || chan.sy || chan.rot;
        var inner = 'child!';
        if (hasT) inner = 'Transform(alignment: Alignment(' + dbl(origin[0] * 2 - 1) + ', ' + dbl(origin[1] * 2 - 1) + '), transform: Matrix4.identity()' +
          '..translate(' + (chan.tx ? chan.tx + '.value' : '0.0') + ', ' + (chan.ty ? chan.ty + '.value' : '0.0') + ')' +
          (chan.rot ? '..rotateZ(' + chan.rot + '.value)' : '') + (chan.sx || chan.sy ? '..scale(' + (chan.sx ? chan.sx + '.value' : '1.0') + ', ' + (chan.sy ? chan.sy + '.value' : '1.0') + ')' : '') + ', child: ' + inner + ')';
        if (chan.opacity) inner = 'Opacity(opacity: ' + chan.opacity + '.value.clamp(0.0, 1.0), child: ' + inner + ')';
        elLines.push('  /// ' + el.selector + '  (' + el.rect.w + ' × ' + el.rect.h + ' at ' + el.rect.x + ', ' + el.rect.y + ')' + (el.style.backgroundToken ? '  background ' + el.style.backgroundToken : ''));
        todo.forEach(function (t) { elLines.push(t.replace('//', '  // TODO match by hand:')); });
        elLines.push('  Widget ' + id + '({required Widget child}) => AnimatedBuilder(');
        elLines.push('        animation: Listenable.merge([' + merge.join(', ') + ']),');
        elLines.push('        child: child,');
        elLines.push('        builder: (context, child) => ' + inner + ',');
        elLines.push('      );');
        elemCode.push(elLines.join('\n'));
      });
      L.push('  Future<void> _play(AnimationController c, {int delayMs = 0, double iterations = double.infinity, bool alternate = false}) async {');
      L.push('    final total = c.duration!.inMilliseconds;');
      L.push('    if (delayMs < 0) c.value = ((-delayMs) % total) / total;   // a negative delay starts part-way through the loop');
      L.push('    if (delayMs > 0) await Future<void>.delayed(Duration(milliseconds: delayMs));');
      L.push('    if (!_alive) return;');
      L.push('    if (iterations == double.infinity) {');
      L.push('      c.repeat(reverse: alternate);');
      L.push('    } else {');
      L.push('      for (var i = 0; i < iterations.ceil() && _alive; i++) {');
      L.push('        await c.forward(from: 0);');
      L.push('        if (alternate && _alive) await c.reverse();');
      L.push('      }');
      L.push('    }');
      L.push('  }');
      L.push('');
      L.push('  void start() {');
      L.push('    if (_starters.isEmpty) {');
      ctorLines.forEach(function (l) { L.push(l.replace(/^ {4}/, '      ')); });
      L.push('    }');
      L.push('    for (final s in _starters) { s(); }');
      L.push('  }');
      L.push('');
      L.push('  void dispose() {');
      L.push('    _alive = false;');
      L.push('    for (final c in _controllers) { c.dispose(); }');
      L.push('  }');
      var names = []; (L.join('\n').match(/late final AnimationController (\w+)/g) || []).forEach(function (m) { names.push(m.split(' ').pop()); });
      L.push('');
      L.push('  List<AnimationController> get _controllers => [' + names.join(', ') + '];');
      L.push('');
      L.push(elemCode.join('\n\n'));
      L.push('}');
      return L.join('\n') + '\n';
    }

    /* ---------- downloads ---------- */
    function save(text, name, type) {
      var b = new Blob([text], { type: type || 'text/plain' }), a = document.createElement('a'), u = URL.createObjectURL(b);
      a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500);
    }
    function flash(t) { note = t; D.renderTop(); clearTimeout(noteT); noteT = setTimeout(function () { note = ''; D.renderTop(); }, 2800); }
    var FORMATS = [], RUN = {};
    function addFormat(f, fn) { FORMATS.push(f); RUN[f.k] = fn; }
    function guard(fn) {
      return function (t) {
        try { fn(t); } catch (e) { flash('Could not export: ' + (e && e.message || e)); }
      };
    }
    addFormat({ k: 'flutter', title: 'Flutter', sub: 'Dart · controllers + tweens', needs: true }, guard(function (t) {
      var spec = buildSpec(t); if (!spec.elements.length) { flash('No animations found in this element'); return; }
      save(D.anim.gen.flutter(spec), nameOf(t).replace(/-/g, '_') + '_animations.dart', 'text/x-dart');
    }));
    addFormat({ k: 'css', title: 'CSS', sub: '@keyframes + rules' }, guard(function (t) { save(cssFile(t), nameOf(t) + '.animation.css', 'text/css'); }));
    addFormat({ k: 'html', title: 'HTML', sub: 'plays on its own', async: true }, function (t) {
      busy = 'html'; D.renderTop();
      htmlFile(t).then(function (h) { save(h, nameOf(t) + '.animation.html', 'text/html'); }).catch(function () { flash('Could not build the HTML file'); }).then(function () { busy = ''; D.renderTop(); });
    });
    addFormat({ k: 'json', title: 'JSON spec', sub: 'any language', needs: true }, guard(function (t) { save(JSON.stringify(buildSpec(t), null, 2), nameOf(t) + '.animation.json', 'application/json'); }));
    function run(kind) { var t = target(); if (t && RUN[kind]) RUN[kind](t); }

    // the second-pass formats (devanim2.js) register themselves here
    D.anim = {
      formats: FORMATS, run: RUN, gen: {}, addFormat: addFormat, buildSpec: buildSpec, tracks: tracks, selOf: selOf, nameOf: nameOf, pascal: pascal, camel: camel, num: num, r1: r1, esc: esc,
      curveOf: curveOf, dbl: dbl, save: save, flash: flash, target: target, setBusy: function (v) { busy = v; D.renderTop(); }, getBusy: function () { return busy; }, parseTransform: parseTransform
    };
    D.anim.gen.flutter = flutterFile;
    window.dispatchEvent(new Event('devmode:animready'));

    /* ---------- the panel block ---------- */
    D.parts.splice(1, 0, function () {
      var t = target(), found = t ? readAnimations(t) : [], n = found.length;
      var h = '<div class="dvimg dvanim"><button type="button" class="dvimg__toggle" data-act="anim" aria-expanded="' + open + '"><span class="mi" style="font-size:16px" aria-hidden="true">animation</span><span>Download animation</span>' +
        (t ? '<span class="dvimg__n">' + n + '</span>' : '') + '<span class="mi dvimg__chev" style="font-size:18px" aria-hidden="true">' + (open ? 'keyboard_arrow_up' : 'keyboard_arrow_down') + '</span></button>';
      if (open) {
        if (!t) h += '<p class="dvimg__empty">Choose what to export: <b>Shift + click</b> an element in the phone to pin it, or isolate a part with <b>Sections</b>.</p>';
        else {
          var sel = selOf(t, t), r = t.getBoundingClientRect();
          h += '<div class="dvanim__target"><span>Exporting</span><code>' + esc(sel) + '</code><small>' + r1(r.width) + ' × ' + r1(r.height) + '</small></div>';
          if (!n) h += '<p class="dvimg__empty">No running animations found in this element. Pin the card that moves (or its section), then try again. Motion that only starts on tap or scroll must be playing when you export.</p>';
          else {
            h += '<ul class="dvanim__list">' + found.slice(0, 8).map(function (f) {
              var props = {}; f.kfs.forEach(function (k) { Object.keys(k).forEach(function (p) { if (!SKIP[p]) props[p] = 1; }); });
              return '<li><b>' + esc(f.name) + '</b><span>' + esc(Object.keys(props).join(', ') || '…') + ' · ' + dur(f.timing) + ' · ' + loopTxt(f.timing) + '</span></li>';
            }).join('') + (n > 8 ? '<li><span>… and ' + (n - 8) + ' more</span></li>' : '') + '</ul>';
          }
          var GROUPS = [['Code', ['flutter', 'swift', 'kotlin', 'rn']], ['Motion data', ['lottie', 'json']], ['Web', ['css', 'html']], ['Clip (records this tab)', ['webm', 'gif']]];
          h += '<div class="dvdrop"><button type="button" class="dvdrop__btn" data-act="anim-menu" aria-haspopup="menu" aria-expanded="' + fmtOpen + '"><span class="mi" style="font-size:16px" aria-hidden="true">download</span><span>Download as…</span><span class="mi dvimg__chev" style="font-size:18px" aria-hidden="true">' + (fmtOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down') + '</span></button>';
          if (fmtOpen) {
            h += '<div class="dvdrop__menu" role="menu">' + GROUPS.map(function (g) {
              var items = g[1].map(function (k) { return FORMATS.filter(function (f) { return f.k === k; })[0]; }).filter(Boolean);
              if (!items.length) return '';
              return '<div class="dvdrop__group">' + g[0] + '</div>' + items.map(function (f) {
                var dis = (f.needs && !n) || (f.async && busy === f.k) || (busy === 'rec' && f.rec);
                return '<button type="button" role="menuitem" class="dvdrop__item" data-act="anim-dl" data-k="' + f.k + '"' + (dis ? ' disabled' : '') + '><b>' + (busy === f.k ? 'Working…' : f.title) + '</b><small>' + f.sub + '</small></button>';
              }).join('');
            }).join('') + '</div>';
          }
          h += '</div>';
          h += '<p class="dvimg__hint">Reads the animations running right now. Numbers counting up and charts drawing are script-driven and are not included. Properties other than movement, scale, rotation and opacity are listed for a manual match. Clips record the screen, so choose “This tab” when the browser asks.</p>';
        }
        if (note) h += '<p class="dvimg__err">' + esc(note) + '</p>';
      }
      return h + '</div>';
    });
    insp.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act^="anim"]'); if (!b) return;
      if (b.dataset.act === 'anim') { open = !open; fmtOpen = false; D.renderTop(); }
      else if (b.dataset.act === 'anim-menu') { fmtOpen = !fmtOpen; D.renderTop(); }
      else if (b.dataset.act === 'anim-dl' && !b.disabled) { fmtOpen = false; run(b.dataset.k); D.renderTop(); }
    });
    document.addEventListener('mousedown', function (e) { if (fmtOpen && !e.target.closest('.dvdrop')) { fmtOpen = false; D.renderTop(); } });
    D.on('pin', function () { fmtOpen = false; D.renderTop(); });
    D.on('off', function () { open = false; fmtOpen = false; busy = ''; });
  }
  if (window.DevMode) boot(); else window.addEventListener('devmode:ready', boot);
})();
