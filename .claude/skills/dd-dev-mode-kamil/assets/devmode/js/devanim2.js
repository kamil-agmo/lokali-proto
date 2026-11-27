/* Dev mode, "Download animation": second pass.
   Adds SwiftUI, Jetpack Compose, React Native (Reanimated), Lottie JSON, and a recorded WebM / GIF clip.
   Everything is generated from the same spec devanim.js reads (D.anim.buildSpec), except the clips, which record the screen. */
(function () {
  'use strict';
  function boot() {
    var D = window.DevMode; if (!D || !D.anim || D.anim.__two) return;
    var A = D.anim; A.__two = true;
    var pascal = A.pascal, camel = A.camel, num = A.num, r1 = A.r1, dbl = A.dbl, save = A.save, flash = A.flash, tracks = A.tracks;

    /* ---------- shared helpers ---------- */
    var KEY = { linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
    function bez(e) {
      e = (e || 'linear').trim(); var m = e.match(/cubic-bezier\(([^)]+)\)/);
      if (m) return m[1].split(',').map(function (x) { return num(x); });
      return KEY[e] || KEY.linear;
    }
    function f2(n) { n = Math.round(n * 10000) / 10000; return String(n); }
    function kt(n) { n = Math.round(n * 1000) / 1000; return n % 1 === 0 ? n.toFixed(1) : String(n); }
    function ktFloat(n) { return f2(n) + 'f'; }
    function uniqueIds(spec) { var used = {}; return spec.elements.map(function (e) { var id = camel(e.id), k = id; while (used[k]) k += 'X'; used[k] = 1; return k; }); }
    function chanOf(el, a) {   // channels with values -> { name: keys } (empty ones dropped)
      var ch = tracks(el, a), out = {}; Object.keys(ch).forEach(function (c) { if (ch[c].length) out[c] = ch[c]; }); return out;
    }
    function nonStandard(a) {
      var o = {}; a.keyframes.forEach(function (k) { Object.keys(k.props).forEach(function (p) { if (p !== 'transform' && p !== 'opacity') o[p] = 1; }); }); return Object.keys(o);
    }
    function header(lines) { return lines.map(function (l) { return '// ' + l; }).join('\n'); }
    function altOf(a) { return /alternate/.test(a.direction); }
    function iterOf(a) { return a.iterations === 'infinite' ? Infinity : a.iterations; }
    function commonNotes(spec) { return spec.notes.map(function (n) { return 'NOTE: ' + n; }); }

    /* ======================= SwiftUI ======================= */
    var SWIFT_RUNTIME = [
      '/// One keyframe: progress 0...1, the value, and the cubic-bezier easing of the segment that starts here.',
      'struct MotionKey { let t: Double; let v: Double; let b: (Double, Double, Double, Double) }',
      '',
      'func motionBezier(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double, _ x: Double) -> Double {',
      '    if x1 == y1 && x2 == y2 { return x }',
      '    func sample(_ a: Double, _ b: Double, _ t: Double) -> Double {',
      '        3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t',
      '    }',
      '    var lo = 0.0, hi = 1.0, t = x',
      '    for _ in 0..<20 {',
      '        let cx = sample(x1, x2, t)',
      '        if abs(cx - x) < 0.0005 { break }',
      '        if cx < x { lo = t } else { hi = t }',
      '        t = (lo + hi) / 2',
      '    }',
      '    return sample(y1, y2, t)',
      '}',
      '',
      'func motionValue(_ keys: [MotionKey], _ p: Double) -> Double {',
      '    guard let first = keys.first, let last = keys.last else { return 0 }',
      '    if p <= first.t { return first.v }',
      '    if p >= last.t { return last.v }',
      '    for i in 0..<(keys.count - 1) where p >= keys[i].t && p <= keys[i + 1].t {',
      '        let a = keys[i], c = keys[i + 1]',
      '        let span = max(c.t - a.t, 0.0001)',
      '        let e = motionBezier(a.b.0, a.b.1, a.b.2, a.b.3, (p - a.t) / span)',
      '        return a.v + (c.v - a.v) * e',
      '    }',
      '    return last.v',
      '}',
      '',
      '/// Progress 0...1 inside the current iteration. A negative delay starts part-way through the loop.',
      'func motionProgress(_ ms: Double, duration: Double, delay: Double, iterations: Double, alternate: Bool) -> Double {',
      '    let t = ms - delay',
      '    if t < 0 { return 0 }',
      '    let it = t / duration',
      '    if it >= iterations { return alternate && Int(iterations) % 2 == 0 ? 0 : 1 }',
      '    let whole = floor(it), frac = it - whole',
      '    return alternate && Int(whole) % 2 == 1 ? 1 - frac : frac',
      '}'
    ];
    function swiftFile(spec) {
      var L = [], ids = uniqueIds(spec), cls = pascal(spec.name);
      L.push(header([
        cls + 'Animations: generated from the prototype (' + spec.generatedFrom.page + ', "' + spec.name + '").',
        '',
        'Usage: put the modifier on the view that should move, e.g.  MyView().' + (ids[0] || 'part') + 'Animated()',
        'Each modifier restarts when its view appears. Sizes are points from a 402 pt wide phone; percent translations are already in points.'
      ].concat(commonNotes(spec))));
      L.push('');
      L.push('import SwiftUI');
      L.push('');
      L.push(SWIFT_RUNTIME.join('\n'));
      spec.elements.forEach(function (el, ei) {
        var id = ids[ei], Id = pascal(id), anims = el.animations, origin = el.style.transformOrigin || [0.5, 0.5], decl = [], body = [], chan = {};
        anims.forEach(function (a, ai) {
          var ch = chanOf(el, a);
          Object.keys(ch).forEach(function (c) {
            var name = 'k' + ai + c.charAt(0).toUpperCase() + c.slice(1);
            decl.push('    private static let ' + name + ': [MotionKey] = [' + ch[c].map(function (p) {
              var b = bez(p.easing); return 'MotionKey(t: ' + kt(p.offset) + ', v: ' + kt(p.v) + ', b: (' + b.map(kt).join(', ') + '))';
            }).join(', ') + ']');
            chan[c] = { name: name, p: 'p' + ai };
          });
          if (Object.keys(ch).length) body.push('            let p' + ai + ' = motionProgress(ms, duration: ' + a.durationMs + ', delay: ' + a.delayMs + ', iterations: ' + (a.iterations === 'infinite' ? '.infinity' : kt(a.iterations)) + ', alternate: ' + altOf(a) + ')   // ' + (a.name || 'animation'));
        });
        function val(c, dflt) { return chan[c] ? 'motionValue(Self.' + chan[c].name + ', ' + chan[c].p + ')' : dflt; }
        var mods = [];
        if (chan.opacity) mods.push('.opacity(' + val('opacity') + ')');
        if (chan.sx || chan.sy) mods.push('.scaleEffect(x: CGFloat(' + val('sx', '1.0') + '), y: CGFloat(' + val('sy', '1.0') + '), anchor: UnitPoint(x: ' + kt(origin[0]) + ', y: ' + kt(origin[1]) + '))');
        if (chan.rot) mods.push('.rotationEffect(.radians(' + val('rot') + '), anchor: UnitPoint(x: ' + kt(origin[0]) + ', y: ' + kt(origin[1]) + '))');
        if (chan.tx || chan.ty) mods.push('.offset(x: CGFloat(' + val('tx', '0.0') + '), y: CGFloat(' + val('ty', '0.0') + '))');
        var todo = []; anims.forEach(function (a) { nonStandard(a).forEach(function (p) { if (todo.indexOf(p) < 0) todo.push(p); }); });
        L.push('');
        L.push('/// ' + el.selector + '  (' + el.rect.w + ' × ' + el.rect.h + ')' + (todo.length ? '\n/// TODO match by hand: ' + todo.join(', ') + ' (see the JSON spec for the values)' : ''));
        L.push('struct ' + Id + 'Motion: ViewModifier {');
        L.push('    @State private var start = Date()');
        decl.forEach(function (d) { L.push(d); });
        L.push('');
        L.push('    func body(content: Content) -> some View {');
        L.push('        TimelineView(.animation) { ctx in');
        L.push('            let ms = ctx.date.timeIntervalSince(start) * 1000');
        body.forEach(function (b) { L.push(b); });
        L.push('            content');
        mods.forEach(function (m) { L.push('                ' + m); });
        L.push('        }');
        L.push('    }');
        L.push('}');
        L.push('');
        L.push('extension View {');
        L.push('    func ' + id + 'Animated() -> some View { modifier(' + Id + 'Motion()) }');
        L.push('}');
      });
      return L.join('\n') + '\n';
    }

    /* ======================= Jetpack Compose ======================= */
    function kotlinFile(spec) {
      var L = [], ids = uniqueIds(spec), cls = pascal(spec.name);
      L.push(header([
        cls + 'Animations: generated from the prototype (' + spec.generatedFrom.page + ', "' + spec.name + '").',
        '',
        'Usage: Box(modifier = Modifier.' + (ids[0] || 'part') + 'Animated()) { ... }',
        'Translations are in dp (multiplied by the screen density), rotation in degrees. Easing is attached to the keyframe where each segment starts:',
        'check one animation in the Compose preview against the web version before using the rest.'
      ].concat(commonNotes(spec))));
      L.push('');
      L.push('import androidx.compose.animation.core.*');
      L.push('import androidx.compose.runtime.*');
      L.push('import androidx.compose.ui.Modifier');
      L.push('import androidx.compose.ui.graphics.TransformOrigin');
      L.push('import androidx.compose.ui.graphics.graphicsLayer');
      L.push('import androidx.compose.ui.platform.LocalDensity');
      L.push('import kotlinx.coroutines.delay');
      spec.elements.forEach(function (el, ei) {
        var id = ids[ei], origin = el.style.transformOrigin || [0.5, 0.5], lines = [], chan = {}, todo = [], needsInfinite = false;
        el.animations.forEach(function (a, ai) {
          var ch = chanOf(el, a), inf = a.iterations === 'infinite', mode = altOf(a) ? 'RepeatMode.Reverse' : 'RepeatMode.Restart';
          nonStandard(a).forEach(function (p) { if (todo.indexOf(p) < 0) todo.push(p); });
          if (inf) needsInfinite = true;
          Object.keys(ch).forEach(function (c) {
            var list = ch[c], name = 'a' + ai + c.charAt(0).toUpperCase() + c.slice(1);
            function kfs() {
              var out = ['                durationMillis = ' + a.durationMs];
              list.forEach(function (p, i) {
                var b = bez(p.easing), last = i === list.length - 1;
                out.push('                ' + ktFloat(p.v) + ' at ' + Math.round(p.offset * a.durationMs) + (last ? '' : ' using CubicBezierEasing(' + b.map(ktFloat).join(', ') + ')'));
              });
              return out.join('\n');
            }
            if (inf) {
              var off = a.delayMs < 0 ? 'StartOffset(' + (-a.delayMs) + ', StartOffsetType.FastForward)' : 'StartOffset(' + a.delayMs + ')';
              lines.push('    val ' + name + ' by infinite.animateFloat(\n        initialValue = ' + ktFloat(list[0].v) + ', targetValue = ' + ktFloat(list[list.length - 1].v) + ',\n        animationSpec = infiniteRepeatable(\n            animation = keyframes {\n' + kfs() + '\n            },\n            repeatMode = ' + mode + ',\n            initialStartOffset = ' + off + '\n        ),\n        label = "' + name + '"\n    )');
              chan[c] = name;
            } else {
              var spec2 = 'keyframes {\n' + kfs() + '\n            }', n = a.iterations;
              if (n > 1) spec2 = 'repeatable(iterations = ' + n + ', animation = ' + spec2 + ', repeatMode = ' + mode + ')';
              lines.push('    val ' + name + ' = remember { Animatable(' + ktFloat(list[0].v) + ') }\n    LaunchedEffect(Unit) {\n        delay(' + Math.max(0, a.delayMs) + 'L)\n        ' + name + '.animateTo(' + ktFloat(list[list.length - 1].v) + ', animationSpec = ' + spec2 + ')\n    }');
              chan[c] = name + '.value';
            }
          });
        });
        function g(c, d) { return chan[c] || d; }
        var layer = [];
        if (chan.opacity) layer.push('alpha = (' + chan.opacity + ').coerceIn(0f, 1f)');
        if (chan.tx) layer.push('translationX = ' + chan.tx + ' * density');
        if (chan.ty) layer.push('translationY = ' + chan.ty + ' * density');
        if (chan.sx) layer.push('scaleX = ' + chan.sx);
        if (chan.sy) layer.push('scaleY = ' + chan.sy);
        if (chan.rot) layer.push('rotationZ = (' + chan.rot + ') * 57.29578f');
        layer.push('transformOrigin = TransformOrigin(' + ktFloat(origin[0]) + ', ' + ktFloat(origin[1]) + ')');
        L.push('');
        L.push('/** ' + el.selector + '  (' + el.rect.w + ' × ' + el.rect.h + ')' + (todo.length ? '\n *  TODO match by hand: ' + todo.join(', ') + ' (see the JSON spec for the values) */' : ' */'));
        L.push('@Composable');
        L.push('fun Modifier.' + id + 'Animated(): Modifier {');
        L.push('    val density = LocalDensity.current.density');
        if (needsInfinite) L.push('    val infinite = rememberInfiniteTransition(label = "' + id + '")');
        lines.forEach(function (l) { L.push(l); });
        L.push('    return this.graphicsLayer {');
        layer.forEach(function (l) { L.push('        ' + l); });
        L.push('    }');
        L.push('}');
      });
      return L.join('\n') + '\n';
    }

    /* ======================= React Native (Reanimated 3) ======================= */
    function rnFile(spec) {
      var L = [], ids = uniqueIds(spec), cls = pascal(spec.name);
      L.push(header([
        cls + 'Animations: generated from the prototype (' + spec.generatedFrom.page + ', "' + spec.name + '").',
        '',
        'Needs react-native-reanimated 3. Usage:',
        '  const style = use' + pascal(ids[0] || 'part') + 'Animated();',
        '  <Animated.View style={[styles.box, style]} />',
        'Sizes are density-independent pixels from a 402 wide phone. Negative delays are treated as 0 (Reanimated cannot start part-way through a loop).'
      ].concat(commonNotes(spec))));
      L.push('');
      L.push("import { useEffect } from 'react';");
      L.push("import { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';");
      spec.elements.forEach(function (el, ei) {
        var id = ids[ei], origin = el.style.transformOrigin || [0.5, 0.5], decl = [], starts = [], chan = {}, todo = [];
        el.animations.forEach(function (a, ai) {
          var ch = chanOf(el, a), rep = a.iterations === 'infinite' ? -1 : a.iterations, rev = altOf(a);
          nonStandard(a).forEach(function (p) { if (todo.indexOf(p) < 0) todo.push(p); });
          Object.keys(ch).forEach(function (c) {
            var list = ch[c], name = 'a' + ai + c.charAt(0).toUpperCase() + c.slice(1);
            decl.push('  const ' + name + ' = useSharedValue(' + kt(list[0].v) + ');');
            var steps = [];
            for (var i = 0; i < list.length - 1; i++) {
              var b = bez(list[i].easing), d = Math.max(1, Math.round((list[i + 1].offset - list[i].offset) * a.durationMs));
              steps.push('withTiming(' + kt(list[i + 1].v) + ', { duration: ' + d + ', easing: ' + (b.join() === '0,0,1,1' ? 'Easing.linear' : 'Easing.bezier(' + b.map(kt).join(', ') + ')') + ' })');
            }
            var seq = steps.length === 1 ? steps[0] : 'withSequence(' + steps.join(', ') + ')';
            var core = 'withRepeat(' + seq + ', ' + rep + ', ' + rev + ')';
            starts.push('    ' + name + '.value = ' + (a.delayMs > 0 ? 'withDelay(' + a.delayMs + ', ' + core + ')' : core) + ';');
            chan[c] = name;
          });
        });
        var tr = [];
        if (chan.tx) tr.push('{ translateX: ' + chan.tx + '.value }');
        if (chan.ty) tr.push('{ translateY: ' + chan.ty + '.value }');
        if (chan.sx) tr.push('{ scaleX: ' + chan.sx + '.value }');
        if (chan.sy) tr.push('{ scaleY: ' + chan.sy + '.value }');
        if (chan.rot) tr.push('{ rotate: `${' + chan.rot + '.value}rad` }');
        var st = [];
        if (chan.opacity) st.push('opacity: ' + chan.opacity + '.value');
        if (tr.length) st.push('transform: [' + tr.join(', ') + ']');
        st.push("transformOrigin: '" + Math.round(origin[0] * 100) + "% " + Math.round(origin[1] * 100) + "%'");
        L.push('');
        L.push('/** ' + el.selector + '  (' + el.rect.w + ' × ' + el.rect.h + ')' + (todo.length ? '\n *  TODO match by hand: ' + todo.join(', ') + ' (see the JSON spec for the values) */' : ' */'));
        L.push('export function use' + pascal(id) + 'Animated() {');
        decl.forEach(function (d) { L.push(d); });
        L.push('  useEffect(() => {');
        starts.forEach(function (s) { L.push(s); });
        L.push('  }, []);');
        L.push('  return useAnimatedStyle(() => ({ ' + st.join(', ') + ' }));');
        L.push('}');
      });
      return L.join('\n') + '\n';
    }

    /* ======================= Lottie ======================= */
    function evalTrack(list, off) {
      if (off <= list[0].offset) return list[0].v;
      for (var i = 0; i < list.length - 1; i++) {
        if (off <= list[i + 1].offset) {
          var a = list[i], b = list[i + 1], span = Math.max(1e-6, b.offset - a.offset), x = (off - a.offset) / span, e = bez(a.easing);
          return a.v + (b.v - a.v) * bezierY(e, x);
        }
      }
      return list[list.length - 1].v;
    }
    function bezierY(e, x) {
      if (e[0] === e[1] && e[2] === e[3]) return x;
      function s(p1, p2, t) { return 3 * p1 * (1 - t) * (1 - t) * t + 3 * p2 * (1 - t) * t * t + t * t * t; }
      var lo = 0, hi = 1, t = x; for (var i = 0; i < 24; i++) { var cx = s(e[0], e[2], t); if (Math.abs(cx - x) < 0.0003) break; if (cx < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return s(e[1], e[3], t);
    }
    function parseRgb(c) { var m = c && c.match(/[\d.]+/g); return m ? { r: +m[0] / 255, g: +m[1] / 255, b: +m[2] / 255, a: m[3] === undefined ? 1 : +m[3] } : { r: 0.5, g: 0.55, b: 0.96, a: 0 }; }
    function lottieFile(spec) {
      var FR = 60, maxMs = 0;
      spec.elements.forEach(function (el) { el.animations.forEach(function (a) { var total = a.iterations === 'infinite' ? a.durationMs : a.durationMs * a.iterations + Math.max(0, a.delayMs); maxMs = Math.max(maxMs, total); }); });
      maxMs = Math.min(Math.max(maxMs, 1000), 30000);
      var frames = Math.round(maxMs / 1000 * FR), W = Math.round(spec.size.width), H = Math.round(spec.size.height);
      // keyframes for one channel, repeating the loop to fill the composition
      function unroll(list, a, scale, tf) {
        var out = [], dur = a.durationMs, iters = a.iterations === 'infinite' ? Infinity : a.iterations, alt = altOf(a), base = a.delayMs;
        for (var c = 0; c < iters; c++) {
          var start = base + c * dur; if (start > maxMs) break;
          var segs = alt && c % 2 === 1 ? list.slice().reverse().map(function (p) { return { offset: 1 - p.offset, v: p.v, easing: p.easing }; }) : list;
          segs.forEach(function (p, i) {
            var t = (start + p.offset * dur) / 1000 * FR, k = { t: Math.round(t * 100) / 100, s: [tf ? tf(p.v) : p.v * scale] };
            if (i < segs.length - 1) { var e = bez(p.easing); k.o = { x: [e[0]], y: [e[1]] }; k.i = { x: [e[2]], y: [e[3]] }; }
            else { k.h = 1; }
            out.push(k);
          });
        }
        return out;
      }
      function prop(keys, staticVal) {
        if (!keys || keys.length < 2) return { a: 0, k: staticVal };
        var same = keys.every(function (k) { return JSON.stringify(k.s) === JSON.stringify(keys[0].s); });
        return same ? { a: 0, k: keys[0].s.length === 1 && !Array.isArray(staticVal) ? keys[0].s[0] : keys[0].s } : { a: 1, k: keys };
      }
      var layers = [];
      spec.elements.forEach(function (el, idx) {
        var rect = el.rect, origin = el.style.transformOrigin || [0.5, 0.5], rgb = parseRgb(el.style.background), placeholder = rgb.a === 0;
        var ax = (origin[0] - 0.5) * rect.w, ay = (origin[1] - 0.5) * rect.h, cx = rect.x + rect.w / 2 + ax, cy = rect.y + rect.h / 2 + ay;
        var chan = {}; el.animations.forEach(function (a) { var ch = chanOf(el, a); Object.keys(ch).forEach(function (c) { chan[c] = { list: ch[c], a: a }; }); });
        var scaleKeys = null;
        if (chan.sx || chan.sy) {
          var a0 = (chan.sx || chan.sy).a, offs = {}; [chan.sx, chan.sy].forEach(function (c) { if (c) c.list.forEach(function (p) { offs[p.offset] = 1; }); });
          var lst = Object.keys(offs).map(Number).sort(function (p, q) { return p - q; });
          var combo = lst.map(function (o, i) { return { offset: o, v: [chan.sx ? evalTrack(chan.sx.list, o) : 1, chan.sy ? evalTrack(chan.sy.list, o) : 1], easing: (chan.sx || chan.sy).list[0].easing }; });
          var keys = [], dur = a0.durationMs, iters = a0.iterations === 'infinite' ? Infinity : a0.iterations, alt = altOf(a0);
          for (var c = 0; c < iters; c++) {
            var start = a0.delayMs + c * dur; if (start > maxMs) break;
            var segs = alt && c % 2 === 1 ? combo.slice().reverse().map(function (p) { return { offset: 1 - p.offset, v: p.v, easing: p.easing }; }) : combo;
            segs.forEach(function (p, i) {
              var k = { t: Math.round((start + p.offset * dur) / 1000 * FR * 100) / 100, s: [p.v[0] * 100, p.v[1] * 100] };
              if (i < segs.length - 1) { var e = bez(p.easing); k.o = { x: [e[0]], y: [e[1]] }; k.i = { x: [e[2]], y: [e[3]] }; } else k.h = 1;
              keys.push(k);
            });
          }
          scaleKeys = keys;
        }
        var opKeys = chan.opacity ? unroll(chan.opacity.list, chan.opacity.a, 100) : null;
        var rotKeys = chan.rot ? unroll(chan.rot.list, chan.rot.a, 1, function (v) { return v * 180 / Math.PI; }) : null;
        var xKeys = chan.tx ? unroll(chan.tx.list, chan.tx.a, 1, function (v) { return cx + v; }) : null;
        var yKeys = chan.ty ? unroll(chan.ty.list, chan.ty.a, 1, function (v) { return cy + v; }) : null;
        var radius = num(el.style.borderRadius);
        layers.push({
          ddd: 0, ind: idx + 1, ty: 4, nm: el.id + ' · ' + el.selector.split(' > ').pop(), sr: 1,
          ks: {
            o: prop(opKeys, 100), r: prop(rotKeys, 0),
            p: { s: true, x: prop(xKeys, cx), y: prop(yKeys, cy) },
            a: { a: 0, k: [ax, ay, 0] }, s: prop(scaleKeys, [100, 100, 100])
          },
          ao: 0,
          shapes: [{ ty: 'gr', nm: 'box', it: [
            { ty: 'rc', d: 1, nm: 'rect', s: { a: 0, k: [Math.max(1, rect.w), Math.max(1, rect.h)] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: radius } },
            { ty: 'fl', nm: 'fill', c: { a: 0, k: [rgb.r, rgb.g, rgb.b, 1] }, o: { a: 0, k: (placeholder ? 0.18 : rgb.a) * 100 }, r: 1 },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } }
          ] }],
          ip: 0, op: frames, st: 0, bm: 0
        });
      });
      // scale keyframes need 3 values in some players: pad them
      layers.forEach(function (l) { var s = l.ks.s; if (s.a === 1) s.k.forEach(function (k) { if (k.s.length === 2) k.s.push(100); }); });
      return JSON.stringify({
        v: '5.7.4', fr: FR, ip: 0, op: frames, w: W, h: H, nm: spec.name, ddd: 0, assets: [],
        meta: { generator: 'dd-dev-mode-kamil skill', note: 'Layers are coloured boxes that carry each element\'s motion (position, scale, rotation, opacity). Replace them with your artwork. Loops of different lengths are repeated to fill the longest one, so the composition may not loop seamlessly.' },
        layers: layers.reverse()
      });
    }

    /* ======================= clips: WebM and GIF ======================= */
    function lzw(px) {
      var clear = 256, eoi = 257, next = 258, size = 9, dict = new Map(), out = [], cur = 0, bits = 0;
      function emit(code) { cur |= code << bits; bits += size; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } }
      emit(clear);
      var prefix = px[0];
      for (var i = 1; i < px.length; i++) {
        var k = px[i], key = prefix * 256 + k, code = dict.get(key);
        if (code !== undefined) { prefix = code; continue; }
        emit(prefix);
        dict.set(key, next++);
        if (next > (1 << size) && size < 12) size++;
        if (next >= 4095) { emit(clear); dict = new Map(); next = 258; size = 9; }
        prefix = k;
      }
      emit(prefix); emit(eoi);
      if (bits > 0) out.push(cur & 255);
      return out;
    }
    function quantize(rgba, w, h) {
      var idx = new Uint8Array(w * h), bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var i = y * w + x, o = i * 4, th = (bayer[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 51;
        var r = Math.max(0, Math.min(5, Math.round((rgba[o] + th) / 51))), g = Math.max(0, Math.min(5, Math.round((rgba[o + 1] + th) / 51))), b = Math.max(0, Math.min(5, Math.round((rgba[o + 2] + th) / 51)));
        idx[i] = r * 36 + g * 6 + b;
      }
      return idx;
    }
    function gifEncode(frames, w, h, delayCs) {
      var out = [];
      function w16(n) { out.push(n & 255, (n >> 8) & 255); }
      'GIF89a'.split('').forEach(function (c) { out.push(c.charCodeAt(0)); });
      w16(w); w16(h); out.push(0xF7, 0, 0);
      for (var r = 0; r < 6; r++) for (var g = 0; g < 6; g++) for (var b = 0; b < 6; b++) out.push(r * 51, g * 51, b * 51);
      for (var p = 216; p < 256; p++) out.push(0, 0, 0);
      out.push(0x21, 0xFF, 11); 'NETSCAPE2.0'.split('').forEach(function (c) { out.push(c.charCodeAt(0)); }); out.push(3, 1, 0, 0, 0);
      frames.forEach(function (fr) {
        out.push(0x21, 0xF9, 4, 0x04, delayCs & 255, (delayCs >> 8) & 255, 0, 0);
        out.push(0x2C); w16(0); w16(0); w16(w); w16(h); out.push(0);
        out.push(8);
        var data = lzw(quantize(fr, w, h));
        for (var i = 0; i < data.length; i += 255) { var n = Math.min(255, data.length - i); out.push(n); for (var j = 0; j < n; j++) out.push(data[i + j]); }
        out.push(0);
      });
      out.push(0x3B);
      return new Uint8Array(out);
    }
    function clipSeconds(t) {
      var found = (t && t.getAnimations) ? t.getAnimations({ subtree: true }) : [], ms = 0;
      found.forEach(function (an) { try { var tm = an.effect.getComputedTiming(); if (tm.iterations !== Infinity) ms = Math.max(ms, tm.endTime); else ms = Math.max(ms, tm.duration); } catch (e) {} });
      return Math.min(10, Math.max(3, Math.ceil(ms / 1000)));
    }
    function record(kind) {
      var t = A.target(); if (!t) return;
      var doc = D.doc(), frame = document.getElementById('screen');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { flash('Screen capture is not available in this browser'); return; }
      var secs = clipSeconds(t), isGif = kind === 'gif', video = document.createElement('video'), stream, hidden = [];
      try { t.scrollIntoView({ block: 'center' }); } catch (e) {}
      A.setBusy('rec');
      navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' }).then(function (s) {
        stream = s; video.srcObject = s; video.muted = true;
        return video.play();
      }).then(function () {
        return new Promise(function (res) { if (video.videoWidth) res(); else video.onloadedmetadata = res; });
      }).then(function () {
        doc.querySelectorAll('[data-devui]').forEach(function (n) { hidden.push([n, n.style.display]); n.style.display = 'none'; });
        var cvs = document.createElement('canvas'), ctx = cvs.getContext('2d', { willReadFrequently: true });
        function region() {
          var fr = frame.getBoundingClientRect(), k = fr.width / frame.clientWidth, r = t.getBoundingClientRect();
          var x0 = Math.max(fr.left, fr.left + r.left * k), y0 = Math.max(fr.top, fr.top + r.top * k), x1 = Math.min(fr.right, fr.left + r.right * k), y1 = Math.min(fr.bottom, fr.top + r.bottom * k);
          var sx = video.videoWidth / window.innerWidth, sy = video.videoHeight / window.innerHeight;
          return { x: x0 * sx, y: y0 * sy, w: Math.max(2, (x1 - x0) * sx), h: Math.max(2, (y1 - y0) * sy) };
        }
        var r0 = region(), scale = Math.min(1, (isGif ? 420 : 960) / r0.w);
        cvs.width = Math.round(r0.w * scale) & ~1; cvs.height = Math.round(r0.h * scale) & ~1;
        function paint() { var r = region(); ctx.drawImage(video, r.x, r.y, r.w, r.h, 0, 0, cvs.width, cvs.height); }
        var stop = false; (function loop() { if (stop) return; paint(); requestAnimationFrame(loop); })();
        function finish() {
          stop = true; stream.getTracks().forEach(function (tr) { tr.stop(); });
          hidden.forEach(function (h) { h[0].style.display = h[1]; });
        }
        var base = A.nameOf(t);
        if (!isGif) {
          var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(function (m) { return window.MediaRecorder && MediaRecorder.isTypeSupported(m); })[0];
          var rec = new MediaRecorder(cvs.captureStream(30), { mimeType: mime, videoBitsPerSecond: 4000000 }), parts = [];
          rec.ondataavailable = function (e) { if (e.data.size) parts.push(e.data); };
          rec.onstop = function () { finish(); var b = new Blob(parts, { type: 'video/webm' }), a = document.createElement('a'), u = URL.createObjectURL(b); a.href = u; a.download = base + '.animation.webm'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); A.setBusy(''); };
          rec.start(); setTimeout(function () { rec.stop(); }, secs * 1000);
        } else {
          var fps = 12, frames = [], timer = setInterval(function () { frames.push(ctx.getImageData(0, 0, cvs.width, cvs.height).data); }, 1000 / fps);
          setTimeout(function () {
            clearInterval(timer); finish();
            setTimeout(function () {
              var bytes = gifEncode(frames, cvs.width, cvs.height, Math.round(100 / fps)), b = new Blob([bytes], { type: 'image/gif' }), a = document.createElement('a'), u = URL.createObjectURL(b);
              a.href = u; a.download = base + '.animation.gif'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); A.setBusy('');
            }, 30);
          }, secs * 1000);
        }
      }).catch(function (e) {
        hidden.forEach(function (h) { h[0].style.display = h[1]; });
        if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
        A.setBusy(''); flash(e && e.name === 'NotAllowedError' ? 'Screen capture was cancelled' : 'Could not record: ' + (e && e.message || e));
      });
    }

    /* ---------- register the formats ---------- */
    A.gen.swift = swiftFile; A.gen.kotlin = kotlinFile; A.gen.rn = rnFile; A.gen.lottie = lottieFile; A.gen.gif = gifEncode;
    function wrap(fn) { return function (t) { try { fn(t); } catch (e) { flash('Could not export: ' + (e && e.message || e)); } }; }
    function withSpec(fn) { return wrap(function (t) { var spec = A.buildSpec(t); if (!spec.elements.length) { flash('No animations found in this element'); return; } fn(spec, t); }); }
    A.addFormat({ k: 'swift', title: 'SwiftUI', sub: 'Swift · TimelineView', needs: true }, withSpec(function (spec) { save(swiftFile(spec), pascal(spec.name) + 'Animations.swift', 'text/x-swift'); }));
    A.addFormat({ k: 'kotlin', title: 'Jetpack Compose', sub: 'Kotlin · keyframes', needs: true }, withSpec(function (spec) { save(kotlinFile(spec), pascal(spec.name) + 'Animations.kt', 'text/x-kotlin'); }));
    A.addFormat({ k: 'rn', title: 'React Native', sub: 'Reanimated 3 hooks', needs: true }, withSpec(function (spec) { save(rnFile(spec), spec.name + '-animations.js', 'text/javascript'); }));
    A.addFormat({ k: 'lottie', title: 'Lottie', sub: 'JSON · boxes with motion', needs: true }, withSpec(function (spec) { save(lottieFile(spec), spec.name + '.lottie.json', 'application/json'); }));
    A.addFormat({ k: 'webm', title: 'Video (WebM)', sub: 'records this tab', rec: true }, function () { record('webm'); });
    A.addFormat({ k: 'gif', title: 'GIF', sub: 'records this tab', rec: true }, function () { record('gif'); });
    // reading order in the panel: code first, then motion data, web, clips
    var order = ['flutter', 'swift', 'kotlin', 'rn', 'lottie', 'json', 'css', 'html', 'webm', 'gif'];
    A.formats.sort(function (p, q) { return order.indexOf(p.k) - order.indexOf(q.k); });
    D.renderTop();
  }
  if (window.DevMode && window.DevMode.anim) boot(); else window.addEventListener('devmode:animready', boot);
})();
