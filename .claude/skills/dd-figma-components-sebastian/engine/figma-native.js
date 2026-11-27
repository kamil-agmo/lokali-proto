/* =========================================================
   Copy to Figma — engine part 2 of 3: NATIVE clipboard (auto layout on ⌘V).
   Project-specific lists (components, variant properties, containers,
   fonts) come from figmaConfig() in figma-export.js; nothing here is
   tied to one project.
   Turns the FX layout tree (figma-export.js) into Figma's own
   clipboard format: text/html carrying a "fig-kiwi" archive
   (Kiwi schema + NODE_CHANGES message, both deflate-raw).
   The format is not a public Figma API. Field shapes were
   copied from real Figma clipboard payloads; the schema chunk
   is re-used verbatim (assets/figma/NOTICE.md).
   ========================================================= */
'use strict';

const FN = (() => {
  const VERSION = 101; // archive version that matches the bundled schema chunk
  let C = null; // figmaConfig(), refreshed at the start of every build()
  const conf = () => C || (C = figmaConfig());
  const SID = 100; // sessionID for every node we create
  const I = { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };
  const T = (x, y) => ({ m00: 1, m01: 0, m02: x, m10: 0, m11: 1, m12: y });
  const CJK = /[　-鿿＀-￯]/;

  /* ---------- bytes ---------- */
  function b64ToBytes(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function bytesToB64(u) { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
  const inflateRaw = (b) => pipe(b, new DecompressionStream('deflate-raw'));
  const deflateRaw = (b) => pipe(b, new CompressionStream('deflate-raw'));
  async function sha1(bytes) {
    if (window.crypto && crypto.subtle) return new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
    throw new Error('SHA-1 unavailable (crypto.subtle)');
  }

  /* ---------- Kiwi: binary schema reader + message encoder ---------- */
  class Writer {
    constructor() { this.a = new Uint8Array(1 << 20); this.n = 0; this.f = new Float32Array(1); this.i = new Int32Array(this.f.buffer); }
    grow(k) { if (this.n + k > this.a.length) { const b = new Uint8Array(Math.max(this.a.length * 2, this.n + k)); b.set(this.a.subarray(0, this.n)); this.a = b; } }
    byte(v) { this.grow(1); this.a[this.n++] = v & 255; }
    uint(v) {
      if (!(v >= 0 && v <= 4294967295) || !Number.isInteger(v)) throw new Error(`uint out of range: ${v}`);
      do { const b = v % 128; v = Math.floor(v / 128); this.byte(v ? b | 128 : b); } while (v);
    }
    int(v) { v = Math.round(v); if (v < -2147483648 || v > 2147483647) throw new Error(`int out of range: ${v}`); this.uint(((v << 1) ^ (v >> 31)) >>> 0); }
    float(v) {
      this.f[0] = v; let bits = this.i[0]; bits = (bits >>> 23) | (bits << 9);
      if ((bits & 255) === 0) { this.byte(0); return; }
      this.grow(4); const d = this.a, k = this.n; d[k] = bits; d[k + 1] = bits >> 8; d[k + 2] = bits >> 16; d[k + 3] = bits >> 24; this.n += 4;
    }
    str(s) { const u = new TextEncoder().encode(String(s).replace(/\0/g, '')); this.grow(u.length + 1); this.a.set(u, this.n); this.n += u.length; this.byte(0); }
    bytes(u) { this.uint(u.length); this.grow(u.length); this.a.set(u, this.n); this.n += u.length; }
    big(v, signed) {
      let x = BigInt(v); if (signed) x = x < 0n ? ~(x << 1n) : x << 1n;
      for (let i = 0; x > 127n && i < 8; i++) { this.byte(Number(x & 127n) | 128); x >>= 7n; }
      this.byte(Number(x));
    }
    out() { return this.a.slice(0, this.n); }
  }
  function readSchema(u) {
    let i = 0;
    const uint = () => { let v = 0, s = 1, b; do { b = u[i++]; v += (b & 127) * s; s *= 128; } while (b & 128); return v; };
    const int = () => { const v = uint(); return v % 2 ? -(v + 1) / 2 : v / 2; };
    const str = () => { let j = i; while (u[j]) j++; const s = new TextDecoder().decode(u.subarray(i, j)); i = j + 1; return s; };
    const n = uint(); const defs = [];
    for (let d = 0; d < n; d++) {
      const name = str(); const kind = ['ENUM', 'STRUCT', 'MESSAGE'][u[i++]]; const fc = uint(); const fields = [];
      for (let k = 0; k < fc; k++) { const fname = str(); const type = int(); const isArray = !!(u[i++] & 1); const value = uint(); fields.push({ name: fname, type, isArray, value }); }
      defs.push({ name, kind, fields });
    }
    const by = {};
    defs.forEach((d) => { by[d.name] = d; if (d.kind === 'ENUM') { d.vals = {}; d.fields.forEach((f) => { d.vals[f.name] = f.value; }); } });
    return { defs, by };
  }
  const BUILTIN = ['bool', 'byte', 'int', 'uint', 'float', 'string', 'int64', 'uint64'];
  function encValue(S, w, f, v, path) {
    if (f.type < 0) {
      switch (BUILTIN[-f.type - 1]) {
        case 'bool': w.byte(v ? 1 : 0); return;
        case 'byte': w.byte(v); return;
        case 'int': w.int(v); return;
        case 'uint': w.uint(v); return;
        case 'float': if (!Number.isFinite(v)) throw new Error(`${path} is not a finite number (${v})`); w.float(v); return;
        case 'string': w.str(v); return;
        case 'int64': w.big(v, true); return;
        case 'uint64': w.big(v, false); return;
        default: throw new Error(`${path}: unknown builtin`);
      }
    }
    const d = S.defs[f.type];
    if (d.kind === 'ENUM') { const e = d.vals[v]; if (e === undefined) throw new Error(`${path}: "${v}" is not a ${d.name}`); w.uint(e); return; }
    encDef(S, w, d, v, path);
  }
  function encDef(S, w, def, obj, path) {
    for (const f of def.fields) {
      const v = obj[f.name];
      if (v == null) { if (def.kind === 'STRUCT') throw new Error(`${path}.${f.name} missing (${def.name} needs every field)`); continue; }
      if (def.kind === 'MESSAGE') w.uint(f.value);
      if (f.isArray) {
        if (f.type === -2) w.bytes(v instanceof Uint8Array ? v : Uint8Array.from(v));
        else { w.uint(v.length); for (let k = 0; k < v.length; k++) encValue(S, w, f, v[k], `${path}.${f.name}[${k}]`); }
      } else encValue(S, w, f, v, `${path}.${f.name}`);
    }
    if (def.kind === 'MESSAGE') w.uint(0);
  }
  let schemaP = null;
  function schema() {
    if (!schemaP) schemaP = (async () => { const z = b64ToBytes(figmaAssets().figmaSchema); return { z, S: readSchema(await inflateRaw(z)) }; })();
    return schemaP;
  }

  /* ---------- TrueType reader (glyph outlines for derived text, from inline @font-face data URLs) ---------- */
  const fontP = {};
  let FACES = null; // family (lower case) → [{ lo, hi, italic, b64 }]
  const unq = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim();
  function faces() {
    if (FACES) return FACES;
    FACES = new Map();
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; } // cross-origin sheet (e.g. Google Fonts link): no bytes
      for (const r of rules) {
        if (r.type !== 5) continue;
        const m = /url\(\s*["']?data:[^;,]+;base64,([^"')]+)["']?\s*\)/.exec(r.style.getPropertyValue('src'));
        if (!m) continue;
        const fam = unq(r.style.getPropertyValue('font-family')).toLowerCase();
        const wt = String(r.style.getPropertyValue('font-weight') || '400').trim().replace(/^normal$/, '400').replace(/^bold$/, '700').split(/\s+/).map(Number);
        const italic = /italic|oblique/.test(r.style.getPropertyValue('font-style') || '');
        if (!FACES.has(fam)) FACES.set(fam, []);
        FACES.get(fam).push({ lo: wt[0] || 400, hi: wt[1] || wt[0] || 400, italic, b64: m[1] });
      }
    }
    return FACES;
  }
  function parseTTF(u) {
    const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
    const tb = {}; const nt = dv.getUint16(4);
    for (let k = 0; k < nt; k++) { const o = 12 + 16 * k; tb[String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3])] = dv.getUint32(o + 8); }
    const upm = dv.getUint16(tb.head + 18), locFmt = dv.getInt16(tb.head + 50);
    const asc = dv.getInt16(tb.hhea + 4) / upm, desc = -dv.getInt16(tb.hhea + 6) / upm, gap = dv.getInt16(tb.hhea + 8) / upm, nHM = dv.getUint16(tb.hhea + 34);
    const cmap = new Map();
    const nSub = dv.getUint16(tb.cmap + 2); let f4 = null, f12 = null;
    for (let k = 0; k < nSub; k++) {
      const pid = dv.getUint16(tb.cmap + 4 + 8 * k), eid = dv.getUint16(tb.cmap + 6 + 8 * k), off = tb.cmap + dv.getUint32(tb.cmap + 8 + 8 * k);
      const fmt = dv.getUint16(off);
      if (fmt === 12 && (pid === 0 || (pid === 3 && eid === 10))) f12 = off;
      if (fmt === 4 && (pid === 0 || (pid === 3 && eid === 1))) f4 = off;
    }
    if (f12 != null) {
      const n = dv.getUint32(f12 + 12);
      for (let k = 0; k < n; k++) { const p = f12 + 16 + 12 * k; const s = dv.getUint32(p), e = dv.getUint32(p + 4), g0 = dv.getUint32(p + 8); for (let c = s; c <= e && c - s < 70000; c++) cmap.set(c, g0 + c - s); }
    } else if (f4 != null) {
      const segX2 = dv.getUint16(f4 + 6), ends = f4 + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = dv.getUint16(ends + 2 * s), start = dv.getUint16(starts + 2 * s), delta = dv.getInt16(deltas + 2 * s), ro = dv.getUint16(ranges + 2 * s);
        if (start === 0xffff) continue;
        for (let c = start; c <= end; c++) {
          let g;
          if (ro === 0) g = (c + delta) & 0xffff;
          else { g = dv.getUint16(ranges + 2 * s + ro + 2 * (c - start)); if (g) g = (g + delta) & 0xffff; }
          if (g) cmap.set(c, g);
        }
      }
    }
    const adv = (g) => dv.getUint16(tb.hmtx + 4 * Math.min(g, nHM - 1)) / upm;
    const loca = (g) => (locFmt ? dv.getUint32(tb.loca + 4 * g) : dv.getUint16(tb.loca + 2 * g) * 2);
    function contours(g, depth) {
      const a = loca(g), b = loca(g + 1);
      if (b <= a || depth > 5) return [];
      const o = tb.glyf + a; const nc = dv.getInt16(o);
      if (nc >= 0) {
        const ends = []; for (let k = 0; k < nc; k++) ends.push(dv.getUint16(o + 10 + 2 * k));
        const np = nc ? ends[nc - 1] + 1 : 0;
        let p = o + 10 + 2 * nc; p += 2 + dv.getUint16(p);
        const flags = [];
        while (flags.length < np) { const fl = u[p++]; flags.push(fl); if (fl & 8) { let r = u[p++]; while (r--) flags.push(fl); } }
        const xs = [], ys = []; let x = 0, y = 0;
        for (const fl of flags) { if (fl & 2) { const d = u[p++]; x += fl & 16 ? d : -d; } else if (!(fl & 16)) { x += dv.getInt16(p); p += 2; } xs.push(x); }
        for (const fl of flags) { if (fl & 4) { const d = u[p++]; y += fl & 32 ? d : -d; } else if (!(fl & 32)) { y += dv.getInt16(p); p += 2; } ys.push(y); }
        const out = []; let s = 0;
        for (const e of ends) { const pts = []; for (let k = s; k <= e; k++) pts.push({ x: xs[k], y: ys[k], on: !!(flags[k] & 1) }); out.push(pts); s = e + 1; }
        return out;
      }
      const out = []; let p = o + 10; let more = true;
      while (more) {
        const fl = dv.getUint16(p), gi = dv.getUint16(p + 2); p += 4;
        let dx, dy;
        if (fl & 1) { dx = dv.getInt16(p); dy = dv.getInt16(p + 2); p += 4; } else { dx = dv.getInt8(p); dy = dv.getInt8(p + 1); p += 2; }
        if (!(fl & 2)) { dx = 0; dy = 0; }
        let m = [1, 0, 0, 1];
        if (fl & 8) { const s = dv.getInt16(p) / 16384; m = [s, 0, 0, s]; p += 2; }
        else if (fl & 0x40) { m = [dv.getInt16(p) / 16384, 0, 0, dv.getInt16(p + 2) / 16384]; p += 4; }
        else if (fl & 0x80) { m = [dv.getInt16(p) / 16384, dv.getInt16(p + 2) / 16384, dv.getInt16(p + 4) / 16384, dv.getInt16(p + 6) / 16384]; p += 8; }
        for (const c of contours(gi, depth + 1)) out.push(c.map((q) => ({ x: m[0] * q.x + m[2] * q.y + dx, y: m[1] * q.x + m[3] * q.y + dy, on: q.on })));
        more = !!(fl & 0x20);
      }
      return out;
    }
    // Glyph → Figma commands blob: u8 command + f32 LE coords, em-normalised, y up.
    function glyphBlob(g) {
      const cmds = [];
      for (const pts of contours(g, 0)) {
        if (!pts.length) continue;
        let seq; const fi = pts.findIndex((q) => q.on);
        if (fi < 0) seq = [{ x: (pts[0].x + pts[pts.length - 1].x) / 2, y: (pts[0].y + pts[pts.length - 1].y) / 2, on: true }, ...pts];
        else seq = pts.slice(fi).concat(pts.slice(0, fi));
        const st = seq[0]; cmds.push([1, st.x, st.y]); let ctrl = null;
        for (let k = 1; k <= seq.length; k++) {
          const q = k === seq.length ? st : seq[k];
          if (q.on) { if (ctrl) { cmds.push([3, ctrl.x, ctrl.y, q.x, q.y]); ctrl = null; } else if (k < seq.length) cmds.push([2, q.x, q.y]); }
          else { if (ctrl) cmds.push([3, ctrl.x, ctrl.y, (ctrl.x + q.x) / 2, (ctrl.y + q.y) / 2]); ctrl = q; }
        }
        cmds.push([0]);
      }
      let len = 0; cmds.forEach((c) => { len += 1 + 4 * (c.length - 1); });
      const out = new Uint8Array(len); const dvo = new DataView(out.buffer); let p = 0;
      for (const c of cmds) { out[p++] = c[0]; for (let k = 1; k < c.length; k++) { dvo.setFloat32(p, c[k] / upm, true); p += 4; } }
      return out;
    }
    return { upm, asc, desc, gap, lineHeight: asc + desc + gap, cmap, adv, glyphBlob };
  }
  // Glyph source for a CSS family + weight: that family's inline face (nearest weight, ties go up; italic face when
  // there is one), else config glyphFallback's face, else null (no derived text: Figma lays the text out itself).
  // The face Chrome renders for a weight: nearest available weight (ties go up), italic face when there is one
  function nearestFace(list0, weight, italic) {
    const want = Number(weight) || 400;
    const list = list0.filter((f) => f.italic === !!italic).length ? list0.filter((f) => f.italic === !!italic) : list0;
    let best = null, bd = Infinity, bw = 400;
    for (const f of list) { const w = Math.min(f.hi, Math.max(f.lo, want)); const d = Math.abs(w - want); if (d < bd || (d === bd && w > bw)) { best = f; bd = d; bw = w; } }
    return { best, bw };
  }
  // Weight for the Figma style name: the inline face that renders (config styleFromFaces), else the CSS weight
  function styleWeight(family, weight, italic) {
    if (conf().styleFromFaces) { const l = faces().get(unq(family).toLowerCase()); if (l && l.length) return snapW(nearestFace(l, weight, italic).bw); }
    return snapW(weight);
  }
  function font(family, weight, italic) {
    const F = faces(); let fam = unq(family).toLowerCase();
    if (!F.has(fam)) { const fb = conf().glyphFallback; fam = fb ? unq(fb).toLowerCase() : ''; if (!F.has(fam)) return Promise.resolve(null); }
    const { best, bw } = nearestFace(F.get(fam), weight, italic);
    const key = `${fam}|${bw}|${best.italic ? 'i' : 'n'}`;
    if (!fontP[key]) fontP[key] = (async () => { const u = b64ToBytes(best.b64); return { key, fam: unq(family) && F.has(unq(family).toLowerCase()) ? unq(family) : unq(conf().glyphFallback), w: bw, ttf: parseTTF(u), digest: await sha1(u) }; })();
    return fontP[key];
  }

  /* ---------- SVG geometry → Figma vector network ---------- */
  function parsePath(d) {
    const out = []; let i = 0; const s = d;
    const ws = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
    const num = () => { ws(); const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(s.slice(i)); if (!m) throw new Error(`bad path near "${s.slice(i, i + 12)}"`); i += m[0].length; return parseFloat(m[0]); };
    const flag = () => { ws(); const c = s[i++]; if (c !== '0' && c !== '1') throw new Error('bad arc flag'); return c === '1'; };
    const more = () => { ws(); return i < s.length && /[-+.\d]/.test(s[i]); };
    let x = 0, y = 0, sx = 0, sy = 0, cmd = '', lc = null, lq = null;
    while (true) {
      ws(); if (i >= s.length) break;
      if (/[a-zA-Z]/.test(s[i])) cmd = s[i++]; else if (!cmd) throw new Error('path must start with a command');
      do {
        const rel = cmd === cmd.toLowerCase(); const C = cmd.toUpperCase();
        const ax = (v) => (rel ? x + v : v), ay = (v) => (rel ? y + v : v);
        if (C === 'Z') { out.push({ t: 'Z' }); x = sx; y = sy; lc = lq = null; break; }
        if (C === 'M') { x = ax(num()); y = ay(num()); sx = x; sy = y; out.push({ t: 'M', x, y }); cmd = rel ? 'l' : 'L'; lc = lq = null; continue; }
        if (C === 'L') { x = ax(num()); y = ay(num()); out.push({ t: 'L', x, y }); lc = lq = null; continue; }
        if (C === 'H') { x = rel ? x + num() : num(); out.push({ t: 'L', x, y }); lc = lq = null; continue; }
        if (C === 'V') { y = rel ? y + num() : num(); out.push({ t: 'L', x, y }); lc = lq = null; continue; }
        if (C === 'C' || C === 'S') {
          let x1, y1;
          if (C === 'C') { x1 = ax(num()); y1 = ay(num()); } else { x1 = lc ? 2 * x - lc.x : x; y1 = lc ? 2 * y - lc.y : y; }
          const x2 = ax(num()), y2 = ay(num()), ex = ax(num()), ey = ay(num());
          out.push({ t: 'C', x1, y1, x2, y2, x: ex, y: ey }); lc = { x: x2, y: y2 }; lq = null; x = ex; y = ey; continue;
        }
        if (C === 'Q' || C === 'T') {
          let qx, qy;
          if (C === 'Q') { qx = ax(num()); qy = ay(num()); } else { qx = lq ? 2 * x - lq.x : x; qy = lq ? 2 * y - lq.y : y; }
          const ex = ax(num()), ey = ay(num());
          out.push({ t: 'C', x1: x + (2 / 3) * (qx - x), y1: y + (2 / 3) * (qy - y), x2: ex + (2 / 3) * (qx - ex), y2: ey + (2 / 3) * (qy - ey), x: ex, y: ey });
          lq = { x: qx, y: qy }; lc = null; x = ex; y = ey; continue;
        }
        if (C === 'A') {
          const rx = num(), ry = num(), rot = num(), fa = flag(), fs = flag(); const ex = ax(num()), ey = ay(num());
          const cs = arcToCubics(x, y, rx, ry, rot, fa, fs, ex, ey);
          if (!cs) out.push({ t: 'L', x: ex, y: ey }); else cs.forEach((c) => out.push({ t: 'C', x1: c[0], y1: c[1], x2: c[2], y2: c[3], x: c[4], y: c[5] }));
          lc = lq = null; x = ex; y = ey; continue;
        }
        throw new Error(`unsupported path command ${cmd}`);
      } while (more());
    }
    return out;
  }
  function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    if ((x1 === x2 && y1 === y2) || !rx || !ry) return null;
    rx = Math.abs(rx); ry = Math.abs(ry);
    const sp = Math.sin((phi * Math.PI) / 180), cp = Math.cos((phi * Math.PI) / 180);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { const k = Math.sqrt(lam); rx *= k; ry *= k; }
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
    const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
    const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry, vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
    const t1 = ang(1, 0, ux, uy); let dt = ang(ux, uy, vx, vy);
    if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
    const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-7)); const d = dt / n; const k = (4 / 3) * Math.tan(d / 4);
    const P = (a, b) => [cp * rx * a - sp * ry * b + cx, sp * rx * a + cp * ry * b + cy];
    const out = [];
    for (let j = 0; j < n; j++) {
      const a1 = t1 + j * d, a2 = a1 + d; const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
      out.push([...P(c1 - k * s1, s1 + k * c1), ...P(c2 + k * s2, s2 - k * c2), ...P(c2, s2)]);
    }
    return out;
  }
  // Path commands (already in frame pixels) → { blob, x, y, w, h }
  function network(cmds, filled, evenodd) {
    const V = [], S = [], loops = [];
    let start = -1, cur = -1, segs = [];
    const vert = (x, y) => { V.push({ x, y }); return V.length - 1; };
    const close = (closed) => {
      if (start < 0) return;
      if (closed) {
        const a = V[cur], b = V[start];
        if (cur !== start && Math.hypot(a.x - b.x, a.y - b.y) < 0.01 && segs.length) { const last = S[segs[segs.length - 1]]; last.b = start; V[cur].dead = true; }
        else if (cur !== start) { S.push({ a: cur, b: start, t1: [0, 0], t2: [0, 0] }); segs.push(S.length - 1); }
        if (segs.length) loops.push(segs);
      }
      start = -1; cur = -1; segs = [];
    };
    for (const c of cmds) {
      if (c.t === 'M') { close(false); start = cur = vert(c.x, c.y); continue; }
      if (c.t === 'Z') { close(true); continue; }
      if (cur < 0) { start = cur = vert(c.x, c.y); continue; }
      const p = V[cur]; const nv = vert(c.x, c.y);
      if (c.t === 'L') S.push({ a: cur, b: nv, t1: [0, 0], t2: [0, 0] });
      else S.push({ a: cur, b: nv, t1: [c.x1 - p.x, c.y1 - p.y], t2: [c.x2 - c.x, c.y2 - c.y] });
      segs.push(S.length - 1); cur = nv;
    }
    close(false);
    // drop merged (dead) vertices and remap indices
    const map = []; const VV = [];
    V.forEach((v, k) => { if (!v.dead) { map[k] = VV.length; VV.push(v); } });
    if (!VV.length || !S.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    VV.forEach((v) => { x0 = Math.min(x0, v.x); y0 = Math.min(y0, v.y); x1 = Math.max(x1, v.x); y1 = Math.max(y1, v.y); });
    const regs = filled ? [{ loops }] : [];
    let len = 12 + VV.length * 12 + S.length * 28;
    regs.forEach((r) => { len += 8; r.loops.forEach((l) => { len += 4 + 4 * l.length; }); });
    const out = new Uint8Array(len); const dv = new DataView(out.buffer); let p = 0;
    const u32 = (v) => { dv.setUint32(p, v, true); p += 4; }, f32 = (v) => { dv.setFloat32(p, v, true); p += 4; };
    u32(VV.length); u32(S.length); u32(regs.length);
    VV.forEach((v) => { u32(0); f32(v.x - x0); f32(v.y - y0); });
    S.forEach((sg) => { u32(0); u32(map[sg.a]); f32(sg.t1[0]); f32(sg.t1[1]); u32(map[sg.b]); f32(sg.t2[0]); f32(sg.t2[1]); });
    regs.forEach((r) => { u32((0 << 1) | (evenodd ? 0 : 1)); u32(r.loops.length); r.loops.forEach((l) => { u32(l.length); l.forEach(u32); }); });
    return { blob: out, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const applyM = (m, cmds) => cmds.map((c) => {
    const P = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    if (c.t === 'Z') return c;
    const [x, y] = P(c.x, c.y);
    if (c.t !== 'C') return { t: c.t, x, y };
    const [x1, y1] = P(c.x1, c.y1), [x2, y2] = P(c.x2, c.y2);
    return { t: 'C', x1, y1, x2, y2, x, y };
  });

  /* ---------- FX tree → Figma NodeChanges ---------- */
  const PNAMES = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
  const snapW = (w) => Math.min(900, Math.max(100, Math.round((w || 400) / 100) * 100));
  function fontNameOf(st, text) {
    const w = CJK.test(text || '') ? snapW(st.weight) : styleWeight(st.family, st.weight, st.italic);
    if (CJK.test(text || '')) { const s = w >= 600 ? 'Bold' : w >= 500 ? 'Medium' : 'Regular'; return { family: 'Noto Sans SC', style: s, postscript: `NotoSansSC-${s}` }; }
    const fam = conf().fontFamily(unq(st.family));
    let style = (conf().fontStyles[fam] || {})[w] || PNAMES[w]; if (st.italic) style = w === 400 ? 'Italic' : `${style} Italic`;
    return { family: fam, style, postscript: `${fam.replace(/\s+/g, '')}-${style.replace(/\s+/g, '')}` };
  }
  const paint = (c) => ({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b, a: 1 }, opacity: c.a == null ? 1 : c.a, visible: true, blendMode: 'NORMAL' });
  const sameColor = (a, b) => a && b && a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  function posKeys(n) {
    // fractional-index strings that sort in child order (printable ASCII 33..122)
    const B = 90; let w = 1; while (B ** w < n) w++;
    return Array.from({ length: n }, (_, i) => { let s = ''; let v = i; for (let k = 0; k < w; k++) { s = String.fromCharCode(33 + (v % B)) + s; v = Math.floor(v / B); } return s; });
  }

  /* ---------- components (design page) ---------- */
  // Repeated atoms + blocks become main components; containers with free content stay frames.
  // Allowlist (R6), frame-only containers and run-time frame-only (switch sidebarFrame) come from the config.
  const allowed = (c) => (conf().components === '*' ? true : conf().components.includes(c)) && !conf().frameOnly.includes(c) && !FRAME_ONLY.has(c);
  // Containers kept as plain frames for this build (R5): their children stay instances. Set per build in build().
  let FRAME_ONLY = new Set();
  const isCand = (n) => !!n && ((n.type === 'FRAME' && !!n.comp && allowed(n.comp)) || (n.type === 'SVG' && (!!n.icon || (!!n.comp && allowed(n.comp)))));
  let sigCache = new WeakMap();
  function sig(n, top) {
    const pm = !top && n.props ? `{${Object.keys(n.props).join('')}}` : ''; // a layer's data-prop-* belongs to its parent's structure
    if (!top && isCand(n)) return (n.icon ? 'Ci' : `C${n.comp}`) + pm;
    if (top && sigCache.has(n)) return sigCache.get(n);
    let s;
    if (n.type === 'TEXT') s = 'T';
    else if (n.type === 'IMAGE') s = `I${(n.src || '').length}`;
    else if (n.type === 'SVG') s = `S[${(n.shapes || []).map((sh) => (sh.kind === 'text' ? 't' : `${sh.d.length}${sh.fill ? 'f' : ''}${sh.stroke ? 's' : ''}`)).join(',')}]`;
    else {
      const L = n.layout;
      s = `F${L ? `${L.mode[0]}${L.justify}${L.align}${L.gap}/${L.pad.join(',')}` : 'N'}${n.clip ? 'c' : ''}[${(n.children || []).map((c) => `${sig(c, false)}${c.abs ? 'a' : ''}${c.grow ? 'g' : ''}${c.stretch ? 's' : ''}`).join(';')}]`;
    }
    s += pm;
    if (top) sigCache.set(n, s);
    return s;
  }
  // Identity of a container's child (R8): "Members", "Waiting for me"… Each identity gets its own component set
  // (NavItem / Members) whose variants are states only; icon and label are baked in. Set per build in build().
  let IDENT = new WeakMap();
  const keyOf = (n) => (n.icon ? `icon:${n.icon}:${Math.round(n.w)}x${Math.round(n.h)}` : `${n.comp}|${IDENT.has(n) ? `${IDENT.get(n)}|` : ''}${n.variant || ''}|${sig(n, true)}`);
  // Variant properties per component (data-variant segments, in order)
  const nice = (v) => conf().words[String(v).toLowerCase()] || String(v).split(/[-_\s]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  function propsOf(n) {
    if (n.icon) return [['Size', String(Math.round(n.w))]];
    const names = conf().variantProps[n.comp] || ['Variant'];
    const segs = String(n.variant || '').split('/').filter(Boolean);
    const out = names.map((nm, i) => [nm, nm === 'Badge' ? (segs[i] ? 'Yes' : 'No') : segs[i] != null ? nice(segs[i]) : 'Default']);
    if (segs.length > names.length) out.push(['Variant', segs.slice(names.length).map(nice).join(' ')]);
    return out;
  }
  const childTok = (c) => `${sig(c, false)}${c.abs ? 'a' : ''}${c.grow ? 'g' : ''}${c.stretch ? 's' : ''}${c.layer ? `#${c.layer}` : ''}`;
  // Map subset children B onto superset children A in order (greedy subsequence). Returns A-index per B child, or null.
  function align(A, B) {
    const ta = A.map(childTok), tb = B.map(childTok); const out = []; let i = 0;
    for (const t of tb) { while (i < ta.length && ta[i] !== t) i++; if (i >= ta.length) return null; out.push(i++); }
    return out;
  }
  const GENERIC = /^(div|span|p|label|a|b|i|em|strong|small|button|text|stack-\d+|inline-\d+|row|col|grow|tnum|t-[\w-]+|align)$/;
  const partName = (nm, fallback) => { const p = String(nm || '').split(' / ')[0].trim(); if (!p || /\s/.test(p) || GENERIC.test(p)) return fallback; const q = p.split('__').pop().replace(/--.*$/, '').replace(/[-_]+/g, ' ').trim(); return q && !GENERIC.test(q) ? nice(q) : fallback; };
  function tokenOf(c) {
    if (c.layer) return c.layer; // data-layer (R3) is the slot's name: "Leading icon", "Unread dot"
    if (c.type === 'TEXT') return partName(c.name, 'Text');
    if (c.type === 'SVG') return c.icon ? 'Icon' : 'Graphic';
    if (c.type === 'IMAGE') return 'Image';
    if (c.name === 'align' && c.children && c.children[0]) return tokenOf(c.children[0]);
    if (isCand(c)) return c.comp.replace(/([a-z])([A-Z])/g, '$1 $2');
    return partName(c.name, 'Group');
  }
  function contentOf(n) {
    const OG = conf().openGroup;
    if (n.comp === OG.container) {
      const open = (n.children || []).find((c) => c.comp === OG.item && c.variant === OG.variant);
      const t = open && (function find(x) { if (x.type === 'TEXT') return x.text; for (const k of x.children || []) { const r = find(k); if (r) return r; } return null; })(open);
      return t || 'None';
    }
    const toks = (n.children || []).filter((c) => !c.abs && !c.hidden).map(tokenOf); const out = [];
    for (let i = 0; i < toks.length;) { let j = i; while (j < toks.length && toks[j] === toks[i]) j++; out.push(j - i > 1 ? `${j - i}× ${toks[i]}` : toks[i]); i = j; }
    return out.join(' + ') || 'Empty';
  }
  function pack(items, maxW, gap) {
    let x = 0, y = 0, rowH = 0, W = 0;
    for (const it of items) {
      if (x > 0 && x + it.w > maxW) { x = 0; y += rowH + gap; rowH = 0; }
      it.x = x; it.y = y; x += it.w + gap; rowH = Math.max(rowH, it.h); W = Math.max(W, x - gap);
    }
    return { w: W, h: y + rowH };
  }

  // Stable role names for layers inside a main component (R3). Emission only: never feeds sig/keyOf/childTok.
  // Computed on the unified tree, so the same slot gets the same name in every variant of a set.
  const human = (c) => c.replace(/([a-z])([A-Z])/g, '$1 $2');
  function roleNames(root) {
    const names = new Map();
    const walk = (n) => {
      const kids = n.children || []; const used = new Map(); let seenContent = false;
      for (const c of kids) {
        let nm;
        if (c.layer) nm = c.layer;
        else if (isCand(c)) nm = c.icon ? (seenContent ? 'Trailing icon' : 'Icon') : human(c.comp);
        else if (c.type === 'TEXT') nm = !c.name || /\s/.test(c.name) || c.name === String(c.text || '').slice(0, 32) ? 'Text' : /label/i.test(c.name) ? 'Label' : partName(c.name, 'Text');
        else if (c.type === 'SVG') nm = 'Graphic';
        else if (c.type === 'IMAGE') nm = partName(c.name, 'Image');
        else nm = partName(c.name, 'Group');
        if (!(isCand(c) && c.icon)) seenContent = true;
        const k = (used.get(nm) || 0) + 1; used.set(nm, k);
        names.set(c, k > 1 ? `${nm} ${k}` : nm);
        if (c.type === 'FRAME' && !isCand(c)) walk(c);
      }
    };
    walk(root);
    return names;
  }
  // Shortest common supersequence of two child lists (tokens = childTok); nodes from A win on matches.
  function scs(A, B) {
    const ta = A.map(childTok), tb = B.map(childTok); const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = ta[i] === tb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) { if (ta[i] === tb[j]) { out.push(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push(A[i++]); else out.push(B[j++]); }
    while (i < n) out.push(A[i++]); while (j < m) out.push(B[j++]);
    return out;
  }
  const deepClone = (n) => { const c = { ...n, children: n.children ? n.children.map(deepClone) : n.children, shapes: n.shapes ? n.shapes.map((x) => ({ ...x })) : n.shapes }; if (IDENT.has(n)) IDENT.set(c, IDENT.get(n)); return c; };
  // Containers (R5) and per-table rows are left alone in v1
  let NO_UNIFY = new Set(); // config noUnify, set per build
  const UNIFY_MAX_ADDED = 3;
  // Containers (R5): one main per container (+ real variant), built from the superset of every occurrence's
  // top-level layers. Children stay instances; per-screen state (active item, open group, tab count) becomes
  // nested overrides (variant swap, text, show/hide) on the screen's instance, never a container variant.
  let CONTAINERS = new Set(); // config containers, set per build
  const CONTAINER_MAX_EXTRA = 12;
  // Missing states (R8): an item set that never shows a state on the screens borrows the *style change* from a sibling
  // item that has both states (fill, border, effects, opacity, text style, icon colour, nested variant, swapped icon such
  // as chevron down → up). Own label, icon and geometry are kept. Returns null when the donor's two states differ in structure.
  const TEXT_KEYS = ['color', 'weight', 'size', 'italic', 'underline', 'strike', 'upper', 'letterSpacing'];
  const J = (x) => JSON.stringify(x == null ? null : x);
  function restyle(o, p, v, top) {
    if (top && (p.children || []).map(childTok).join('|') !== (v.children || []).map(childTok).join('|')) return null;
    if (o.icon && p.icon && v.icon && p.icon !== v.icon && o.icon === p.icon) return { ...deepClone(v), x: o.x, y: o.y, layer: o.layer, abs: o.abs, grow: o.grow, stretch: o.stretch, self: o.self };
    const c = { ...o };
    if (IDENT.has(o)) IDENT.set(c, IDENT.get(o));
    if (o.comp && o.variant === p.variant && p.variant !== v.variant && p.comp === v.comp) c.variant = v.variant;
    if (o.type === 'TEXT' && p.type === 'TEXT' && v.type === 'TEXT') {
      const ch = TEXT_KEYS.filter((k) => J(p.style && p.style[k]) !== J(v.style && v.style[k]));
      if (ch.length) {
        const fix = (st) => { const t = { ...st }; ch.forEach((k) => { t[k] = v.style[k]; }); return t; };
        c.style = fix(o.style);
        if (o.runs) c.runs = o.runs.map((r) => ({ ...r, style: fix(r.style || o.style) }));
        if (o.lines) c.lines = o.lines.map((l) => ({ ...l, segs: (l.segs || []).map((g) => ({ ...g, style: fix(g.style || o.style) })) }));
      }
      return c;
    }
    if (o.type === 'SVG' && p.type === 'SVG' && v.type === 'SVG') {
      const map = new Map();
      (p.shapes || []).forEach((sp, k) => { const sv = (v.shapes || [])[k]; if (!sv) return; ['fill', 'stroke'].forEach((f) => { if (J(sp[f]) !== J(sv[f])) map.set(`${f}:${J(sp[f])}`, sv[f]); }); });
      if (map.size) c.shapes = (o.shapes || []).map((so) => { const t = { ...so }; ['fill', 'stroke'].forEach((f) => { const k = `${f}:${J(so[f])}`; if (map.has(k)) t[f] = map.get(k); }); return t; });
      return c;
    }
    if (o.type === 'FRAME' && p.type === 'FRAME' && v.type === 'FRAME') {
      for (const k of ['fill', 'border', 'effects', 'opacity']) if (J(p[k]) !== J(v[k])) c[k] = v[k];
      const oc = o.children || [], pc = p.children || [], vc = v.children || [];
      const same = pc.length === vc.length && pc.map(childTok).join('|') === vc.map(childTok).join('|');
      const ai = same ? (oc.length === pc.length && oc.map(childTok).join('|') === pc.map(childTok).join('|') ? oc.map((_, k) => k) : align(pc, oc)) : null;
      c.children = oc.map((x, k) => (ai && ai[k] != null ? restyle(x, pc[ai[k]], vc[ai[k]], false) : deepClone(x)));
    }
    return c;
  }

  async function build(screens, opts = {}) {
    const o = { derived: true, vectors: true, images: true, text: true, sections: true, derivedSym: true, hug: true, names: true, unify: true, containers: true, identity: true, states: true, props: true, propsOnly: false, sidebarFrame: false, ...opts };
    // R5: a Sidebar component with one variant per open group makes a swap replace every nav item. As a frame,
    // each NavItem instance keeps its own State and content.
    C = figmaConfig(); FACES = null; CONTAINERS = new Set(C.containers); NO_UNIFY = new Set(C.noUnify);
    FRAME_ONLY = new Set(o.sidebarFrame ? [C.openGroup.container] : []); sigCache = new WeakMap(); IDENT = new WeakMap();
    const { S } = await schema();
    const PK = new Map();
    const nk = (g) => { const k = `${g.sessionID}:${g.localID}`; const i = PK.get(k) || 0; PK.set(k, i + 1); return String.fromCharCode(33 + (Math.floor(i / 8100) % 90), 33 + (Math.floor(i / 90) % 90), 33 + (i % 90)); };
    const nodes = []; const blobs = []; let lid = 1;
    const guid = () => ({ sessionID: SID, localID: lid++ });
    const DOC = { sessionID: 0, localID: 0 }, PAGE = { sessionID: 0, localID: 1 }, INTERNAL = { sessionID: 20000000 + SID, localID: 2 };
    nodes.push({ guid: DOC, phase: 'CREATED', type: 'DOCUMENT', name: 'Document', visible: true, opacity: 1, transform: I });
    nodes.push({ guid: PAGE, phase: 'CREATED', parentIndex: { guid: DOC, position: '!' }, type: 'CANVAS', name: 'Page 1', visible: true, opacity: 1, transform: I, backgroundOpacity: 1, backgroundEnabled: true });
    const glyphIdx = new Map(); const imgIdx = new Map();
    const stats = { frames: 0, autoLayout: 0, hug: 0, text: 0, vectors: 0, images: 0, components: 0, sets: 0, instances: 0, merged: 0, hidden: 0, skipped: 0, unifiedSets: 0, unifiedMains: 0, unifiedLayers: 0, containerMerged: 0, containerLayers: 0, statesMade: 0, statesSkipped: 0, propDefs: 0, propBinds: 0, propAssigns: 0, propChildFill: 0 };
    const resolve = (e) => { while (e && e.into) e = e.into; return e; };
    const entryOf = (n) => resolve(reg && reg.get(keyOf(n)));
    const PLAIN = { comps: null, map: null };
    let reg = null; // component registry (design page only)

    const base = (n, type, parent, pos, x, y, w, h, ctx) => {
      const nc = {
        guid: guid(), phase: 'CREATED', parentIndex: { guid: parent, position: pos }, type,
        name: String((ctx && ctx.names && ctx.names.get(n)) || n.name || type).replace(/\s+/g, ' ').slice(0, 120), visible: !n.hidden, opacity: n.opacity != null ? n.opacity : 1,
        size: { x: Math.max(0.01, w), y: Math.max(0.01, h) }, transform: T(x, y), strokeWeight: 1, strokeAlign: 'INSIDE', strokeJoin: 'MITER',
      };
      if (ctx && ctx.map) ctx.map.set(n, nc.guid);
      return nc;
    };
    const asChild = (nc, n, al) => {
      if (!al) return;
      if (n.abs) nc.stackPositioning = 'ABSOLUTE';
      else { if (n.grow) nc.stackChildPrimaryGrow = 1; if (n.stretch) nc.stackChildAlignSelf = 'STRETCH'; }
    };
    const LINE = { lineType: 'PLAIN', styleId: 0, indentationLevel: 0, sourceDirectionality: 'AUTO', listStartOffset: 0, isFirstLineOfList: false };

    /* ----- 11.2 component properties (Text / Boolean / Instance swap) from data-prop-* markup -----
       Encoding copied from a real Figma sample (2026-11-12): the set (or a lone component) holds the defs; each
       variant holds child defs {id, parentPropDefId}; bound layers carry parameterConsumptionMap → the child def;
       instances carry componentPropAssignments → the child def of the variant they point at (nested instances:
       on their symbolOverrides entry). */
    const gk = (g) => `${g.sessionID}:${g.localID}`;
    const SYMPROPS = new Map(); // symbol guid → [{ kind, def, layer, L }]
    const SYMNEST = new Map(); // symbol guid → [{ layer, sym }] nested instances inside the main
    const PKIND = { text: ['TEXT_DATA', 'TEXT_DATA', 'TEXT'], bool: ['VISIBLE', 'BOOLEAN', 'BOOL'], swap: ['OVERRIDDEN_SYMBOL_ID', 'SYMBOL_ID', 'INSTANCE_SWAP'] };
    const tdOf = (str) => ({ characters: String(str), lines: String(str).split('\n').map(() => ({ ...LINE })) });
    const pval = (kind, v) => (kind === 'text' ? { value: { textValue: tdOf(v.characters) }, varValue: { value: { textDataValue: tdOf(v.characters) }, dataType: 'TEXT_DATA', resolvedDataType: 'TEXT_DATA' } }
      : kind === 'bool' ? { value: { boolValue: !!v }, varValue: { value: { boolValue: !!v }, dataType: 'BOOLEAN', resolvedDataType: 'BOOLEAN' } }
        : { value: { guidValue: v }, varValue: { value: { symbolIdValue: { guid: v } }, dataType: 'SYMBOL_ID', resolvedDataType: 'SYMBOL_ID' } });
    function makeDef(kind, name, L, sortIdx) {
      const v = kind === 'text' ? (L.textData || tdOf('')) : kind === 'bool' ? L.visible !== false : L.symbolData.symbolID;
      const pv = pval(kind, v); stats.propDefs++;
      return { id: guid(), name, initialValue: pv.value, sortPosition: String.fromCharCode(33 + sortIdx), type: PKIND[kind][2], preferredValues: kind === 'swap' ? { instanceSwapValues: [] } : {}, varValue: pv.varValue };
    }
    // after a main is emitted: bind its data-prop-* layers; owner = the set (variants) or the main itself
    function bindProps(e, nc, ctx, inSet, from) {
      const own = nodes.slice(from); const byG = new Map(own.map((x) => [gk(x.guid), x]));
      SYMNEST.set(gk(nc.guid), own.filter((x) => x.type === 'INSTANCE' && x !== nc).map((x) => ({ layer: x.guid, sym: x.symbolData.symbolID })));
      const found = [];
      const walk = (n, top) => {
        if (n.props && !top) ['text', 'bool', 'swap'].forEach((k) => { if (n.props[k]) found.push({ n, kind: k, name: n.props[k] }); });
        if (!top && isCand(n)) return;
        if (n.type === 'FRAME') (n.children || []).forEach((c) => walk(c, false));
      };
      walk(e.fx, true);
      if (inSet) (inSet.vars = inSet.vars || []).push(nc); // every variant gets a child def per set property (fillChildDefs)
      if (!found.length) return;
      const owner = inSet || { nc, nVar: 0 }; owner.pdefs = owner.pdefs || new Map();
      const childDefs = [], mine = new Map(), list = [];
      for (const f of found) {
        const g = ctx.map.get(f.n); const L = g && byG.get(gk(g)); if (!L) continue;
        if ((f.kind === 'text' && L.type !== 'TEXT') || (f.kind === 'swap' && !(L.type === 'INSTANCE' && L.symbolData))) { console.warn(`data-prop-${f.kind} "${f.name}" ignored on a ${L.type} layer`); continue; }
        const key = `${f.kind}:${f.name}`;
        let pd = owner.pdefs.get(key);
        if (!pd) { pd = makeDef(f.kind, f.name, L, owner.nVar + owner.pdefs.size); owner.pdefs.set(key, pd); (owner.nc.componentPropDefs = owner.nc.componentPropDefs || []).push(pd); }
        let id = pd.id;
        if (inSet) { if (!mine.has(key)) { const cid = guid(); mine.set(key, cid); childDefs.push({ id: cid, parentPropDefId: pd.id }); } id = mine.get(key); }
        const [field, rt] = PKIND[f.kind];
        (L.parameterConsumptionMap = L.parameterConsumptionMap || { entries: [] }).entries.push({ variableData: { value: { propRefValue: { defId: id } }, dataType: 'PROP_REF', resolvedDataType: rt }, variableField: field });
        list.push({ kind: f.kind, def: id, layer: g, L }); stats.propBinds++;
      }
      if (inSet && childDefs.length) nc.componentPropDefs = childDefs;
      if (list.length) SYMPROPS.set(gk(nc.guid), list);
    }
    // after an instance's overrides are known: turn bound overrides into property assignments (top + nested)
    function assignProps(nc, sym, ov) {
      const byPath = new Map(); ov.forEach((x) => byPath.set(pk(x.guidPath.guids), x));
      if (nc.__propMode === 'none') return; // test knob: no assignments at all
      const only = o.propsOnly || nc.__propMode === 'only';
      const visit = (prefix, s, depth) => {
        if (depth > 8) return;
        // nested targets first: "only" mode deletes overriddenSymbolID below
        const nest = (SYMNEST.get(gk(s)) || []).map((n) => { const path = [...prefix, n.layer]; const x = byPath.get(pk(path)); return [path, (x && x.overriddenSymbolID) || n.sym]; });
        const as = [];
        for (const p of SYMPROPS.get(gk(s)) || []) {
          const x = byPath.get(pk([...prefix, p.layer]));
          let v;
          if (p.kind === 'text') { if (x && x.textData) { v = x.textData; if (only) delete x.textData; } }
          else if (p.kind === 'bool') { v = x && x.visible !== undefined ? x.visible : p.L.visible !== false; if (only && x) delete x.visible; } // explicit on every instance
          else if (x && x.overriddenSymbolID) { v = x.overriddenSymbolID; if (only) delete x.overriddenSymbolID; }
          if (v === undefined) continue;
          const pv = pval(p.kind, v); as.push({ defID: p.def, value: pv.value, varValue: pv.varValue }); stats.propAssigns++;
        }
        if (as.length) {
          if (!prefix.length) nc.componentPropAssignments = as;
          else { let x = byPath.get(pk(prefix)); if (!x) { x = { guidPath: { guids: prefix } }; ov.push(x); byPath.set(pk(prefix), x); } x.componentPropAssignments = as; }
        }
        nest.forEach(([path, t]) => visit(path, t, depth + 1));
      };
      visit([], sym, 0);
      if (only) for (let i = ov.length - 1; i >= 0; i--) if (Object.keys(ov[i]).length === 1) ov.splice(i, 1);
    }

    // Text properties shared by TEXT nodes and instance text overrides
    function textSpec(n) {
      const chars = n.text;
      const runs = (n.runs && n.runs.length ? n.runs : [{ text: chars, style: n.style }]).filter((r) => r.text);
      const key = (s) => JSON.stringify([s.weight, s.italic, s.size, s.color, s.underline, s.strike]);
      const tally = new Map(); runs.forEach((r) => tally.set(key(r.style), (tally.get(key(r.style)) || 0) + r.text.length));
      const bk = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const bs = runs.find((r) => key(r.style) === bk).style;
      const st = { ...n.style, ...bs, lineHeight: n.style.lineHeight || bs.lineHeight };
      const one = n.lines && n.lines.length === 1 && n.lines[0].w > 0;
      const hugs = one && Math.abs(n.w - n.lines[0].w - n.lines[0].x) < 2 && n.lines[0].x < 2; // box already wraps the text
      const fixedW = n.multiline || n.stretch || n.grow || (n.align && n.align !== 'LEFT' && !hugs);
      const lh = st.lineHeight || (n.lines && n.lines[0] ? n.lines[0].bottom - n.lines[0].top : st.size * 1.5);
      const textData = { characters: chars, lines: chars.split('\n').map(() => ({ ...LINE })) };
      const ids = new Map(); const table = []; const perChar = [];
      for (const r of runs) {
        const k = key(r.style); let id = 0;
        if (k !== bk) {
          if (!ids.has(k)) {
            const s = r.style; const ov = { styleID: ids.size + 1 };
            if (s.weight !== st.weight || s.italic !== st.italic) ov.fontName = fontNameOf(s, r.text);
            if (s.size !== st.size) ov.fontSize = s.size;
            if (!sameColor(s.color, st.color)) ov.fillPaints = [paint(s.color)];
            if (s.underline !== st.underline || s.strike !== st.strike) ov.textDecoration = s.underline ? 'UNDERLINE' : s.strike ? 'STRIKETHROUGH' : 'NONE';
            ids.set(k, ov.styleID); table.push(ov);
          }
          id = ids.get(k);
        }
        for (let c = 0; c < r.text.length; c++) perChar.push({ id, s: r.style });
      }
      while (perChar.length < chars.length) perChar.push({ id: 0, s: st });
      if (table.length) { textData.characterStyleIDs = perChar.slice(0, chars.length).map((p) => p.id); textData.styleOverrideTable = table; }
      return { chars, st, fixedW, lh, textData, perChar, fontName: fontNameOf(st, chars), runsKey: runs.map((r) => key(r.style)).join('|') };
    }

    async function textNode(n, parent, pos, al, ctx) {
      const sp = textSpec(n); const { st, chars } = sp;
      const nc = base(n, 'TEXT', parent, pos, n.x, n.y, n.w, n.h, ctx);
      Object.assign(nc, {
        strokeAlign: 'OUTSIDE', fontSize: st.size, fontName: sp.fontName, fillPaints: [paint(st.color)],
        lineHeight: { value: sp.lh, units: 'PIXELS' }, letterSpacing: { value: st.letterSpacing || 0, units: 'PIXELS' },
        textAlignHorizontal: n.align || 'LEFT', textAlignVertical: 'TOP', textAutoResize: sp.fixedW ? 'HEIGHT' : 'WIDTH_AND_HEIGHT',
        textData: sp.textData,
        autoRename: false, detachOpticalSizeFromFontSize: true, textBidiVersion: 1, textUserLayoutVersion: 4, textExplicitLayoutVersion: 1,
        fontVariantCommonLigatures: true, fontVariantContextualLigatures: true, fontVariations: [], fontVersion: '1',
      });
      if (st.underline) nc.textDecoration = 'UNDERLINE'; else if (st.strike) nc.textDecoration = 'STRIKETHROUGH';
      if (st.upper) nc.textCase = 'UPPER';
      if (o.derived && !CJK.test(chars)) {
        try { nc.derivedTextData = await derived(n, chars, sp.perChar, st, sp.lh); } catch (e) { console.warn('derived text skipped', n.name, e); }
      }
      asChild(nc, n, al);
      nodes.push(nc); stats.text++;
      return nc;
    }

    async function derived(n, chars, perChar, st, lh) {
      const F0 = await font(st.family, st.weight, st.italic); if (!F0) return undefined;
      const fonts = new Map();
      const fontFor = async (s) => { const f = await font(s.family || st.family, s.weight, s.italic); if (f) fonts.set(f.key, { f, w: styleWeight(s.family || st.family, s.weight, s.italic) }); return f || F0; };
      // visual lines → character ranges (count non-space characters per measured line)
      const vis = n.lines && n.lines.length ? n.lines : [{ x: 0, top: 0, bottom: n.h, segs: [{ text: chars }] }];
      const ranges = []; let ci = 0;
      for (let L = 0; L < vis.length; L++) {
        const need = vis[L].segs.map((g) => g.text).join('').replace(/\s+/g, '').length;
        while (ci < chars.length && /\s/.test(chars[ci])) ci++;
        const start = ci; let got = 0;
        while (ci < chars.length && got < need) { if (!/\s/.test(chars[ci])) got++; ci++; }
        ranges.push({ start, end: ci, ln: vis[L] });
      }
      if (ranges.length) { ranges[0].start = 0; for (let k = 0; k < ranges.length - 1; k++) ranges[k].end = ranges[k + 1].start; ranges[ranges.length - 1].end = chars.length; }
      const glyphs = [], baselines = [], offs = new Array(chars.length).fill(0);
      for (const R of ranges) {
        const ln = R.ln; const fs = Math.max(...ln.segs.map((g) => (g.style && g.style.size) || st.size));
        const t0 = F0.ttf; const boxH = ln.bottom - ln.top;
        const by = ln.top + (boxH - (t0.asc + t0.desc) * fs) / 2 + t0.asc * fs;
        let x = ln.x;
        for (let c = R.start; c < R.end; c++) {
          const ch = chars[c]; const pc = perChar[c] || { id: 0, s: st }; const s = pc.s;
          offs[c] = x - ln.x;
          if (ch === '\n') continue;
          const F = await fontFor(s); const t = F.ttf;
          const cp = (s.upper || st.upper ? ch.toUpperCase() : ch).codePointAt(0);
          const g = t.cmap.get(cp); const a = g != null ? t.adv(g) : 0.5;
          if (g != null && !/\s/.test(ch)) {
            const k = `${F.key}:${g}`;
            if (!glyphIdx.has(k)) { blobs.push(t.glyphBlob(g)); glyphIdx.set(k, blobs.length - 1); }
            glyphs.push({ commandsBlob: glyphIdx.get(k), position: { x, y: by }, styleID: pc.id, fontSize: s.size || st.size, firstCharacter: c, advance: a, rotation: 0 });
          }
          x += a * (s.size || st.size) + (s.letterSpacing || 0);
        }
        baselines.push({ position: { x: ln.x, y: by }, width: x - ln.x, lineY: ln.top, lineHeight: lh, lineAscent: t0.asc * fs, firstCharacter: R.start, endCharacter: R.end });
      }
      fonts.set(F0.key, { f: F0, w: styleWeight(st.family, st.weight, st.italic) });
      const meta = [...fonts.values()].map(({ f, w }) => ({ key: { ...fontNameOf({ weight: w, italic: false, family: f.fam }, ''), postscript: '' }, fontLineHeight: f.ttf.lineHeight, fontDigest: f.digest, fontStyle: 'NORMAL', fontWeight: w }));
      return {
        layoutSize: { x: n.w, y: n.h }, baselines, glyphs, fontMetaData: meta, truncationStartIndex: -1, truncatedHeight: -1,
        logicalIndexToCharacterOffsetMap: offs.length ? offs : [0], derivedLines: chars.split('\n').map(() => ({ directionality: 'LTR' })),
      };
    }

    const svgText = (s) => ({ ...s, type: 'TEXT', name: s.text, runs: [{ text: s.text, style: s.style }], align: s.align || 'LEFT', multiline: false, lines: [{ x: 0, top: 0, bottom: s.h, segs: [{ text: s.text, style: s.style }] }] });
    async function svgNode(n, parent, pos, al, ctx, type = 'FRAME') {
      const fr = base(n, type, parent, pos, n.x, n.y, n.w, n.h, ctx);
      Object.assign(fr, { fillPaints: [], frameMaskDisabled: true });
      asChild(fr, n, al);
      nodes.push(fr); stats.frames++;
      const shapes = n.shapes || [];
      const keys = posKeys(shapes.length);
      for (let k = 0; k < shapes.length; k++) {
        const s = shapes[k];
        try {
          if (s.kind === 'text') {
            if (o.text) { const t = await textNode(svgText(s), fr.guid, keys[k], false, PLAIN); if (ctx && ctx.map) ctx.map.set(s, t.guid); }
            continue;
          }
          const net = network(applyM(s.m, parsePath(s.d)), !!s.fill, s.evenodd);
          if (!net) continue;
          blobs.push(net.blob);
          const v = base({ name: s.name || 'Vector', opacity: s.opacity }, 'VECTOR', fr.guid, keys[k], net.x, net.y, net.w, net.h, null);
          Object.assign(v, {
            strokeAlign: 'CENTER', strokeWeight: s.stroke ? s.sw : 0, strokeCap: { round: 'ROUND', square: 'SQUARE' }[s.cap] || 'NONE', strokeJoin: { round: 'ROUND', bevel: 'BEVEL' }[s.join] || 'MITER',
            fillPaints: s.fill ? [paint(s.fill)] : [], strokePaints: s.stroke ? [paint(s.stroke)] : [],
            vectorData: { vectorNetworkBlob: blobs.length - 1, normalizedSize: { x: Math.max(0.01, net.w), y: Math.max(0.01, net.h) } },
          });
          if (s.dash && s.dash.length) v.dashPattern = s.dash;
          if (ctx && ctx.map) ctx.map.set(s, v.guid);
          nodes.push(v); stats.vectors++;
        } catch (e) { stats.skipped++; console.warn('vector skipped', n.name, e); }
      }
      return fr;
    }

    async function imageNode(n, parent, pos, al, ctx) {
      const nc = base(n, 'ROUNDED_RECTANGLE', parent, pos, n.x, n.y, n.w, n.h, ctx);
      let p = null;
      const m = /^data:([^;,]+);base64,(.*)$/.exec(n.src || '');
      if (m) {
        if (!imgIdx.has(n.src)) { const bytes = b64ToBytes(m[2]); blobs.push(bytes); imgIdx.set(n.src, { blob: blobs.length - 1, hash: await sha1(bytes) }); }
        const im = imgIdx.get(n.src);
        p = { type: 'IMAGE', opacity: 1, visible: true, blendMode: 'NORMAL', transform: I, image: { hash: im.hash, name: n.name || 'image', dataBlob: im.blob }, animationFrame: 0, imageScaleMode: 'FIT', imageShouldColorManage: false, rotation: 0, scale: 1 };
        if (n.nat) { p.originalImageWidth = n.nat[0]; p.originalImageHeight = n.nat[1]; }
      }
      nc.fillPaints = p ? [p] : [paint({ r: 0.92, g: 0.92, b: 0.94, a: 1 })];
      radii(nc, n.radius);
      asChild(nc, n, al);
      nodes.push(nc); stats.images++;
      return nc;
    }

    function radii(nc, r) {
      if (!r || !r.some((v) => v > 0)) return;
      const [tl, tr, br, bl] = r;
      nc.cornerRadius = tl === tr && tr === br && br === bl ? tl : 0;
      Object.assign(nc, { rectangleTopLeftCornerRadius: tl, rectangleTopRightCornerRadius: tr, rectangleBottomRightCornerRadius: br, rectangleBottomLeftCornerRadius: bl, rectangleCornerRadiiIndependent: !(tl === tr && tr === br && br === bl) });
    }

    function keep(c) {
      if (c.type === 'TEXT') return o.text;
      if (c.type === 'SVG') return o.vectors;
      if (c.type === 'IMAGE') return o.images;
      return true;
    }

    // Hug when the frame's size already equals its content and nothing fills that axis (Figma: primary hug = field absent)
    function sizing(n, pmode, padP, padC) {
      const L = n.layout; if (!L || pmode === 'ROOT') return { p: false, c: false };
      const H = L.mode === 'HORIZONTAL';
      const kids = (n.children || []).filter((c) => !c.abs && !c.hidden && keep(c));
      if (!kids.length) return { p: false, c: false };
      const prim = (c) => (H ? c.w : c.h), cross = (c) => (H ? c.h : c.w);
      const sumP = kids.reduce((t, c) => t + prim(c), 0) + (L.justify === 'SPACE_BETWEEN' ? 0 : L.gap) * (kids.length - 1);
      const maxC = Math.max(...kids.map(cross));
      const fillX = (pmode === 'HORIZONTAL' && n.grow) || (pmode === 'VERTICAL' && n.stretch);
      const fillY = (pmode === 'VERTICAL' && n.grow) || (pmode === 'HORIZONTAL' && n.stretch);
      const fillP = H ? fillX : fillY, fillC = H ? fillY : fillX;
      return {
        p: !fillP && L.justify !== 'SPACE_BETWEEN' && !kids.some((c) => c.grow) && Math.abs((H ? n.w : n.h) - (padP + sumP)) < 1,
        c: !fillC && !kids.some((c) => c.stretch) && Math.abs((H ? n.h : n.w) - (padC + maxC)) < 1,
      };
    }
    function frameVisuals(nc, n, pmode) {
      nc.fillPaints = n.fill ? [paint(n.fill)] : [];
      nc.frameMaskDisabled = !n.clip;
      const bw = n.bw || (n.border ? n.border.weights : [0, 0, 0, 0]);
      if (n.border) {
        nc.strokePaints = [paint(n.border.color)];
        const [t, r, b, l] = n.border.weights; // stroke widths; bw (layout space) only feeds padding
        nc.strokeWeight = Math.max(t, r, b, l);
        if (!(t === r && r === b && b === l)) Object.assign(nc, { borderTopWeight: t, borderRightWeight: r, borderBottomWeight: b, borderLeftWeight: l, borderStrokeWeightsIndependent: true });
        if (n.border.dashed) nc.dashPattern = [4, 4];
      }
      radii(nc, n.radius);
      if (n.effects) nc.effects = n.effects.map((e) => ({ type: e.type, offset: { x: e.x, y: e.y }, radius: e.blur, spread: e.spread || 0, color: { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a }, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false }));
      const L = n.layout;
      if (L) {
        // CSS borders take layout space. Visible ones → Figma stroke included in layout (padding stays the CSS value);
        // invisible ones ≤1px are dropped (sub-pixel) so padding reads clean; anything else folds into padding.
        const sw = n.border && !n.border.ring ? n.border.weights : [0, 0, 0, 0];
        if (sw.some((v) => v > 0)) nc.bordersTakeSpace = true;
        const fold = bw.map((v, i) => { const rest = v - (sw[i] > 0 ? sw[i] : 0); return rest > 1.01 ? rest : 0; });
        Object.assign(nc, {
          stackMode: L.mode, stackSpacing: L.justify === 'SPACE_BETWEEN' ? 0 : L.gap,
          stackVerticalPadding: L.pad[0] + fold[0], stackPaddingRight: L.pad[1] + fold[1], stackPaddingBottom: L.pad[2] + fold[2], stackHorizontalPadding: L.pad[3] + fold[3],
          stackPrimaryAlignItems: L.justify, stackCounterAlignItems: L.align === 'BASELINE' && L.mode !== 'HORIZONTAL' ? 'MIN' : L.align,
        });
        const inc = nc.bordersTakeSpace ? sw : [0, 0, 0, 0];
        const pv = [nc.stackVerticalPadding + inc[0], nc.stackPaddingRight + inc[1], nc.stackPaddingBottom + inc[2], nc.stackHorizontalPadding + inc[3]];
        const H = L.mode === 'HORIZONTAL';
        const sz = o.hug ? sizing(n, pmode, H ? pv[1] + pv[3] : pv[0] + pv[2], H ? pv[0] + pv[2] : pv[1] + pv[3]) : { p: false, c: false };
        if (!sz.p) nc.stackPrimarySizing = 'FIXED'; else stats.hug++;
        nc.stackCounterSizing = sz.c ? 'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE' : 'FIXED'; if (sz.c) stats.hug++;
        stats.autoLayout++;
      }
    }

    async function emit(c, parent, pos, al, ctx) {
      if (ctx.comps && isCand(c) && reg.has(keyOf(c))) return instanceNode(c, parent, pos, al, ctx);
      if (c.type === 'TEXT') return textNode(c, parent, pos, al, ctx);
      if (c.type === 'SVG') return svgNode(c, parent, pos, al, ctx);
      if (c.type === 'IMAGE') return imageNode(c, parent, pos, al, ctx);
      return frameNode(c, parent, pos, al, false, ctx);
    }

    async function frameNode(n, parent, pos, al, isRoot, ctx, type = 'FRAME') {
      const nc = base(n, type, parent, pos, n.x, n.y, n.w, n.h, ctx);
      frameVisuals(nc, n, type === 'SYMBOL' ? null : isRoot ? 'ROOT' : al);
      if (!isRoot) asChild(nc, n, al);
      nodes.push(nc); stats.frames++;
      const kids = (n.children || []).filter(keep);
      const keys = posKeys(kids.length);
      for (let k = 0; k < kids.length; k++) {
        try { await emit(kids[k], nc.guid, keys[k], n.layout ? n.layout.mode : false, ctx); } catch (e) { stats.skipped++; console.warn('layer skipped', kids[k].name, e); }
      }
      return nc;
    }

    /* ----- instances: overrides relative to the main component ----- */
    function parallel(r, f, map) {
      const out = new Map();
      const walk = (a, b) => {
        out.set(a, map.get(b));
        if (b !== f && isCand(b)) return;
        if (a.type === 'SVG') (a.shapes || []).forEach((s, k) => { const t = (b.shapes || [])[k]; if (t) out.set(s, map.get(t)); });
        const ac = a.children || [], bc = b.children || [];
        const idx = ac.length === bc.length ? ac.map((_, k) => k) : align(bc, ac) || ac.map((_, k) => k);
        ac.forEach((c, k) => { const d = bc[idx[k]]; if (d) walk(c, d); });
      };
      walk(r, f);
      return out;
    }
    const pk = (path) => path.map((g) => `${g.sessionID}:${g.localID}`).join('/');
    async function cmp(m, y, path, ov, der) {
      const d = {};
      if (m.type === 'TEXT') {
        const sm = textSpec(m), sy = textSpec(y);
        if (m.text !== y.text || sm.runsKey !== sy.runsKey) {
          d.textData = sy.textData;
          if (o.derived && o.derivedSym && !CJK.test(y.text)) { try { const dt = await derived(y, sy.chars, sy.perChar, sy.st, sy.lh); if (dt) addDer(der, path, { derivedTextData: dt }); } catch (e) { /* layout left to Figma */ } }
        }
        if (!sameColor(sm.st.color, sy.st.color)) d.fillPaints = [paint(sy.st.color)];
        if (sm.fontName.style !== sy.fontName.style || sm.fontName.family !== sy.fontName.family) d.fontName = sy.fontName;
        if (sm.st.size !== sy.st.size) d.fontSize = sy.st.size;
      } else if (m.type === 'FRAME') {
        if (JSON.stringify(m.fill || null) !== JSON.stringify(y.fill || null)) d.fillPaints = y.fill ? [paint(y.fill)] : [];
        const bm = m.border ? JSON.stringify(m.border.color) : '', by = y.border ? JSON.stringify(y.border.color) : '';
        if (bm !== by && y.border) d.strokePaints = [paint(y.border.color)];
      }
      if ((m.opacity == null ? 1 : m.opacity) !== (y.opacity == null ? 1 : y.opacity)) d.opacity = y.opacity == null ? 1 : y.opacity;
      if (Object.keys(d).length) ov.push({ guidPath: { guids: path }, ...d });
    }
    function cmpShape(a, b, path, ov) {
      const d = {};
      if (a.kind === 'text') {
        if (a.text !== b.text) d.textData = { characters: b.text, lines: [{ ...LINE }] };
        if (!sameColor(a.style.color, b.style.color)) d.fillPaints = [paint(b.style.color)];
      } else {
        if (JSON.stringify(a.fill || null) !== JSON.stringify(b.fill || null)) d.fillPaints = b.fill ? [paint(b.fill)] : [];
        if (JSON.stringify(a.stroke || null) !== JSON.stringify(b.stroke || null)) d.strokePaints = b.stroke ? [paint(b.stroke)] : [];
      }
      if (Object.keys(d).length) ov.push({ guidPath: { guids: path }, ...d });
    }
    function addDer(der, path, fields) {
      const k = pk(path);
      if (!der.has(k)) der.set(k, { guidPath: { guids: path } });
      Object.assign(der.get(k), fields);
    }
    function geo(a, b, path, der) {
      if (Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5 || Math.abs(a.w - b.w) > 0.5 || Math.abs(a.h - b.h) > 0.5) addDer(der, path, { size: { x: Math.max(0.01, b.w), y: Math.max(0.01, b.h) }, transform: T(b.x, b.y) });
    }
    // r: node as rendered inside the symbol (parallel to e.fx); x: the instance's own node
    async function diffCtx(r, x, e, prefix, ov, der, top) {
      // optional slots: if this instance lacks layers the main has, diff against the main itself and hide/show explicitly
      const sameShape = (a, b) => (a.children || []).map(childTok).join('|') === (b.children || []).map(childTok).join('|');
      let explicit = false;
      if (r !== e.fx && !sameShape(r, x)) { r = e.fx; explicit = true; }
      const G = r === e.fx ? e.map : parallel(r, e.fx, e.map);
      await cmp(r, x, top ? [e.guid] : prefix, ov, der);
      const kids = async (m, y) => {
        if (m.type === 'SVG') {
          (m.shapes || []).forEach((sm, k) => { const sy = (y.shapes || [])[k]; const g = G.get(sm); if (sy && g) cmpShape(sm, sy, [...prefix, g], ov); });
          return;
        }
        const mc = m.children || [], yc = y.children || [];
        const diffShape = mc.length !== yc.length || !sameShape(m, y);
        const ai = diffShape ? align(mc, yc) : null; // main index per instance child
        const pair = new Map(); if (ai) ai.forEach((mi, yi) => pair.set(mi, yi));
        for (let k = 0; k < mc.length; k++) {
          const a = mc[k]; const b = diffShape ? (ai ? yc[pair.get(k)] : null) : yc[k];
          const g = G.get(a); if (!g) continue;
          const path = [...prefix, g];
          if (!b) { if (diffShape && ai && !a.hidden) { ov.push({ guidPath: { guids: path }, visible: false }); stats.hidden++; } continue; }
          if ((explicit && diffShape) || a.hidden) ov.push({ guidPath: { guids: path }, visible: true });
          geo(a, b, path, der);
          if (isCand(a)) {
            const ae = entryOf(a), be = entryOf(b);
            if (be && ae !== be) { ov.push({ guidPath: { guids: path }, overriddenSymbolID: be.guid }); await diffCtx(be.fx, b, be, path, ov, der, false); }
            else if (ae) await diffCtx(a, b, ae, path, ov, der, false);
            continue;
          }
          await cmp(a, b, path, ov, der);
          if (a.type === 'FRAME' || a.type === 'SVG') await kids(a, b);
        }
      };
      await kids(r, x);
    }
    async function instanceNode(x, parent, pos, al, ctx) {
      const e = entryOf(x);
      if (!e || !e.map) return x.type === 'SVG' ? svgNode(x, parent, pos, al, ctx) : frameNode(x, parent, pos, al, false, ctx);
      const nc = base(x, 'INSTANCE', parent, pos, x.x, x.y, x.w, x.h, ctx);
      if (x.type === 'FRAME') frameVisuals(nc, x, al); else Object.assign(nc, { fillPaints: [], frameMaskDisabled: true });
      const ov = [], der = new Map();
      addDer(der, [e.guid], { size: { x: Math.max(0.01, x.w), y: Math.max(0.01, x.h) } });
      await diffCtx(e.fx, x, e, [], ov, der, true);
      if (o.props && SYMPROPS.size) { nc.__propMode = x.propMode; assignProps(nc, e.guid, ov); delete nc.__propMode; }
      nc.symbolData = { symbolID: e.guid, symbolOverrides: ov, uniformScaleFactor: 1 };
      if (o.derivedSym) { nc.derivedSymbolData = [...der.values()]; nc.derivedSymbolDataLayoutVersion = 1; } else nc.derivedSymbolData = [];
      asChild(nc, x, al);
      nodes.push(nc); stats.instances++;
      return nc;
    }
    async function symbolNode(e, parent, pos, x, y, inSet) {
      const ctx = { comps: reg, map: new Map(), names: o.names ? roleNames(e.fx) : null };
      const n = { ...e.fx, x, y }; const from = nodes.length;
      const nc = e.fx.type === 'SVG' ? await svgNode(n, parent, pos, false, ctx, 'SYMBOL') : await frameNode(n, parent, pos, false, true, ctx, 'SYMBOL');
      ctx.map.set(e.fx, nc.guid);
      nc.name = inSet ? e.props.map(([k, v]) => `${k}=${v}`).join(', ') : e.set;
      nc.isSymbolPublishable = true;
      if (inSet) nc.variantPropSpecs = e.props.map(([k, v]) => ({ propDefId: inSet.ids[k], value: v }));
      e.guid = nc.guid; e.map = ctx.map; stats.components++;
      if (o.props) bindProps(e, nc, ctx, inSet, from);
      return nc;
    }
    function sectionNode(name, parent, pos, x, y, w, h) {
      const nc = base({ name }, 'SECTION', parent, pos, x, y, w, h, null);
      Object.assign(nc, { fillPaints: [paint({ r: 1, g: 1, b: 1, a: 1 })], strokePaints: [paint({ r: 0.85, g: 0.85, b: 0.85, a: 1 })], frameMaskDisabled: true });
      radii(nc, [8, 8, 8, 8]);
      nodes.push(nc);
      return nc;
    }
    function setNode(set, parent, pos) {
      const nc = base({ name: set.name }, 'FRAME', parent, pos, set.x, set.y, set.w, set.h, null);
      const names = set.entries[0].props.map(([k]) => k); const ids = {};
      names.forEach((k) => { ids[k] = guid(); });
      Object.assign(nc, {
        isPublishable: true, isStateGroup: true,
        stateGroupPropertyValueOrders: names.map((k, i) => ({ property: k, values: [...new Set(set.entries.map((e) => e.props[i][1]))] })),
        componentPropDefs: names.map((k, i) => ({ id: ids[k], name: k, initialValue: {}, sortPosition: String.fromCharCode(33 + i), type: 'VARIANT', preferredValues: {}, varValue: { value: { textValue: '' }, dataType: 'STRING', resolvedDataType: 'STRING' } })),
        dashPattern: [10, 5], cornerRadius: 5, strokePaints: [paint({ r: 0.592, g: 0.278, b: 1, a: 1 })], fillPaints: [], frameMaskDisabled: false,
      });
      nodes.push(nc); stats.sets++;
      return { nc, ids, nVar: names.length };
    }

    const tops = [];
    if (!o.page) {
      let x = 0;
      const keys = posKeys(screens.length);
      for (let k = 0; k < screens.length; k++) {
        const sc = { ...screens[k], x, y: 0, fill: screens[k].fill || { r: 1, g: 1, b: 1, a: 1 }, clip: true };
        const nc = await frameNode(sc, PAGE, keys[k], false, true, PLAIN);
        tops.push(nc.guid); x += sc.w + 120;
      }
    } else {
      /* ----- design page: Universal Components + one section per flow ----- */
      const flows = screens; // [{ key, name, screens: [fx] }]
      reg = new Map(); const all = [];
      const visit = (n, fk, title) => {
        if (isCand(n)) {
          const k = keyOf(n); let e = reg.get(k);
          if (!e) {
            const set = n.icon ? `icon / ${n.icon}` : n.comp === conf().tableRow ? `Table row / ${title}` : IDENT.has(n) ? `${n.comp} / ${IDENT.get(n)}` : n.comp;
            e = { key: k, fx: n, flows: new Set(), uses: 0, set, group: `${set}|${n.variant || ''}` }; reg.set(k, e); all.push(e);
          }
          e.flows.add(fk); e.uses++;
        }
        if (n.type === 'FRAME') (n.children || []).forEach((c) => visit(c, fk, title));
      };
      // R8: every component directly inside a container (or inside a plain frame within it, e.g. a sub-menu) gets an
      // identity from data-layer or its label, so "Members" and "Overview" become separate sets with state variants.
      if (o.identity) {
        const textOf = (n) => { if (n.type === 'TEXT') return n.text; for (const c of n.children || []) { const t = textOf(c); if (t) return t; } return ''; };
        const clean = (t) => String(t || '').replace(/[=,/|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
        const mark = (n, inC) => {
          if (inC && isCand(n) && !n.icon && !CONTAINERS.has(n.comp)) { const id = clean(n.layer || textOf(n)); if (id) { IDENT.set(n, id); return; } }
          const now = inC || (isCand(n) && CONTAINERS.has(n.comp));
          if (n.type === 'FRAME') (n.children || []).forEach((c) => mark(c, now));
        };
        flows.forEach((f) => f.screens.forEach((s) => mark(s, false)));
      }
      flows.forEach((f) => f.screens.forEach((s) => visit(s, f.key, s.screenTitle || String(s.name || '').split(' · ').slice(1).join(' · ') || f.name)));
      // merge optional slots: same component + variant, children a subsequence of a bigger version → one main, hidden layers
      if (o.merge !== false) {
        const groups = new Map();
        all.forEach((e) => { if (e.fx.type === 'FRAME') { if (!groups.has(e.group)) groups.set(e.group, []); groups.get(e.group).push(e); } });
        const head = (e) => sig(e.fx, true).split('[')[0];
        for (const g of groups.values()) {
          if (g.length < 2) continue;
          g.sort((a, b) => (b.fx.children || []).length - (a.fx.children || []).length);
          for (const sm of g) {
            if (sm.into) continue;
            const big = g.filter((L) => L !== sm && !L.into && (L.fx.children || []).length > (sm.fx.children || []).length && head(L) === head(sm) && align(L.fx.children || [], sm.fx.children || []));
            if (!big.length) continue;
            const L = big.sort((a, b) => a.fx.children.length - b.fx.children.length)[0];
            sm.into = L; sm.flows.forEach((f) => L.flows.add(f)); L.uses += sm.uses; stats.merged++;
          }
        }
      }
      if (o.containers) {
        const cg = new Map();
        all.forEach((e) => { if (e.into || e.fx.type !== 'FRAME' || !e.fx.layout || !CONTAINERS.has(e.fx.comp)) return; const k = `${e.set}|${e.fx.variant || ''}|${e.fx.layout.mode}`; if (!cg.has(k)) cg.set(k, []); cg.get(k).push(e); });
        for (const g of cg.values()) {
          if (g.length < 2) continue;
          g.sort((a, b) => (b.fx.children || []).length - (a.fx.children || []).length || b.uses - a.uses);
          const M = g[0]; const own = new Set(M.fx.children || []); const base = (M.fx.children || []).length;
          let sup = M.fx.children || []; const joined = [];
          for (const e of g.slice(1)) {
            const next = scs(sup, e.fx.children || []);
            if (next.length - base > CONTAINER_MAX_EXTRA) continue;
            sup = next; joined.push(e);
          }
          if (!joined.length) continue;
          const add = sup.filter((c) => !own.has(c)).length;
          M.fx = { ...M.fx, children: sup.map((c) => (own.has(c) ? c : { ...deepClone(c), hidden: true })) };
          joined.forEach((e) => { e.into = M; e.flows.forEach((f) => M.flows.add(f)); M.uses += e.uses; stats.containerMerged++; });
          stats.containerLayers += add;
        }
      }
      if (o.identity && o.states) {
        const byComp = new Map();
        all.forEach((e) => {
          if (e.into || e.fx.type !== 'FRAME' || !IDENT.has(e.fx)) return;
          const c = e.fx.comp; if (!byComp.has(c)) byComp.set(c, new Map());
          const m = byComp.get(c); if (!m.has(e.set)) m.set(e.set, new Map());
          const vm = m.get(e.set); const vk = e.fx.variant || ''; if (!vm.has(vk)) vm.set(vk, e);
        });
        for (const sets of byComp.values()) {
          const want = new Map();
          for (const [name, have] of sets) {
            const w = new Set();
            for (const dv of sets.values()) if (dv !== have) for (const P of have.keys()) if (dv.has(P)) for (const V of dv.keys()) if (!have.has(V)) w.add(V);
            if (w.size) want.set(name, w);
          }
          for (const [name, w] of want) {
            const have = sets.get(name); const src = [...have.values()][0];
            for (const V of w) {
              let made = null;
              for (const dv of sets.values()) {
                if (dv === have || !dv.has(V) || dv.get(V).synthetic) continue;
                for (const [P, own] of have) { if (own.synthetic || !dv.has(P)) continue; made = restyle(own.fx, dv.get(P).fx, dv.get(V).fx, true); if (made) break; }
                if (made) break;
              }
              if (!made) { stats.statesSkipped++; continue; }
              made.variant = V; IDENT.set(made, IDENT.get(src.fx));
              const e = { key: keyOf(made), fx: made, flows: new Set(src.flows), uses: 0, set: name, group: `${name}|${V}`, synthetic: true };
              if (reg.has(e.key)) continue;
              reg.set(e.key, e); all.push(e); have.set(V, e); stats.statesMade++;
            }
          }
        }
      }
      const mains = all.filter((e) => !e.into);
      // one layer tree per variant set (R2): every variant main gets the superset of the set's top-level layers,
      // the ones it doesn't show as hidden clones, so Figma can keep instance overrides across variant swaps.
      // e.fx is a live screen node: replace it, never mutate it.
      if (o.unify) {
        // grouped by layout direction only: hidden layers take no auto-layout space, so padding/gap may differ
        const groups = new Map();
        mains.forEach((e) => { if (e.fx.type !== 'FRAME' || !e.fx.layout || NO_UNIFY.has(e.fx.comp)) return; const k = `${e.set}|${e.fx.layout.mode}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); });
        for (const g of groups.values()) {
          if (g.length < 2) continue;
          let sup = g[0].fx.children || [];
          for (let i = 1; i < g.length; i++) sup = scs(sup, g[i].fx.children || []);
          const supTok = sup.map(childTok); let touched = false;
          for (const e of g) {
            const own = e.fx.children || []; const add = sup.length - own.length;
            if (!add || add > UNIFY_MAX_ADDED) continue;
            const ownTok = own.map(childTok); const slot = []; let i = 0;
            for (const t of ownTok) { while (i < supTok.length && supTok[i] !== t) i++; if (i >= supTok.length) break; slot.push(i++); }
            if (slot.length !== own.length) continue;
            const at = new Map(slot.map((si, k) => [si, own[k]]));
            e.fx = { ...e.fx, children: sup.map((c, si) => (at.has(si) ? at.get(si) : { ...deepClone(c), hidden: true })) };
            stats.unifiedMains++; stats.unifiedLayers += add; touched = true;
          }
          if (touched) stats.unifiedSets++;
        }
      }
      // sets, unique variant values, placement (universal if the set is used in 2+ flows; icons always universal)
      const sets = new Map();
      for (const e of mains) { if (!sets.has(e.set)) sets.set(e.set, { name: e.set, entries: [], flows: new Set() }); const st = sets.get(e.set); st.entries.push(e); e.flows.forEach((f) => st.flows.add(f)); }
      for (const st of sets.values()) {
        // named variant properties; structural alternates get a readable Content property; every combination unique
        st.entries.forEach((e) => { e.props = propsOf(e.fx); });
        const allNames = []; st.entries.forEach((e) => e.props.forEach(([k]) => { if (!allNames.includes(k)) allNames.push(k); }));
        st.entries.forEach((e) => { const m = new Map(e.props); e.props = allNames.map((k) => [k, m.get(k) || 'Default']); });
        const tuple = (e) => e.props.map(([, v]) => v).join('|');
        const counts = new Map(); st.entries.forEach((e) => counts.set(tuple(e), (counts.get(tuple(e)) || 0) + 1));
        if ([...counts.values()].some((c) => c > 1)) {
          const pname = st.entries[0].fx.comp === conf().openGroup.container ? conf().openGroup.property : 'Content';
          let lay = 0;
          st.entries.forEach((e) => { let c = contentOf(e.fx); if (c.length > 36) c = `Layout ${++lay}`; e.props.push([pname, c]); });
        }
        st.entries.forEach((e) => { e.props = e.props.map(([k, v]) => [k, String(v).replace(/[=,]/g, ' ').replace(/\s+/g, ' ').trim() || 'Default']); });
        if (st.entries.length > 1) {
          const fixed = st.entries[0].props.map(([k], i) => st.entries.every((e) => e.props[i][1] === st.entries[0].props[i][1]));
          if (fixed.some((f) => !f)) st.entries.forEach((e) => { e.props = e.props.filter((_, i) => !fixed[i]); });
        }
        const seen = new Map();
        st.entries.forEach((e) => { const t = tuple(e); const n = (seen.get(t) || 0) + 1; seen.set(t, n); if (n > 1) e.props[e.props.length - 1][1] += ` ${n}`; });
        st.home = st.name.startsWith('icon / ') || st.flows.size > 1 ? 'universal' : [...st.flows][0];
        if (st.entries.length > 1) {
          const L = pack(st.entries.map((e) => ({ e, w: e.fx.w, h: e.fx.h })), 1400, 24);
          st.items = L; st.w = L.w + 48; st.h = L.h + 48;
          // positions inside the set frame
          let i = 0; const its = st.entries.map((e) => ({ e, w: e.fx.w, h: e.fx.h })); pack(its, 1400, 24); its.forEach((it) => { it.e.px = it.x + 24; it.e.py = it.y + 24; i++; });
        } else { st.w = st.entries[0].fx.w; st.h = st.entries[0].fx.h; }
      }
      // emission order for symbols: nested-first (depth)
      const depth = (e) => {
        if (e.depth != null) return e.depth;
        let d = 0;
        const walk = (n, top) => { if (!top && isCand(n)) { const ne = entryOf(n); if (ne && ne !== e) d = Math.max(d, depth(ne) + 1); return; } if (n.type === 'FRAME') (n.children || []).forEach((c) => walk(c, false)); };
        e.depth = 0; walk(e.fx, true); e.depth = d; return d;
      };
      mains.forEach(depth);
      // layout: universal section, then flow sections stacked vertically
      const PAD = 120, GAP = 400;
      const placeSets = (list, maxW) => pack(list.sort((a, b) => (a.name.startsWith('icon / ') - b.name.startsWith('icon / ')) || a.name.localeCompare(b.name)), maxW, 64);
      const uni = [...sets.values()].filter((s) => s.home === 'universal');
      const U = placeSets(uni, 3600);
      const secs = uni.length ? [{ name: conf().universalSection, w: U.w + PAD * 2, h: U.h + PAD * 2, sets: uni, ox: PAD, oy: PAD }] : [];
      for (const f of flows) {
        let sx = PAD; const scr = f.screens.map((s) => { const it = { s, x: sx, y: PAD }; sx += s.w + 120; return it; });
        const sw = sx - 120 - PAD; const sh = Math.max(...f.screens.map((s) => s.h));
        const own = [...sets.values()].filter((s) => s.home === f.key);
        const C = own.length ? placeSets(own, 1800) : { w: 0, h: 0 };
        const cx = PAD + sw + (own.length ? 240 : 0);
        secs.push({ name: f.name, w: cx + C.w + PAD, h: Math.max(sh, C.h) + PAD * 2, sets: own, ox: cx, oy: PAD, screens: scr });
      }
      let y = 0;
      secs.forEach((s) => {
        if (o.sections) { s.node = sectionNode(s.name, PAGE, nk(PAGE), 0, y, s.w, s.h); s.pg = s.node.guid; s.dy = 0; tops.push(s.node.guid); }
        else { s.pg = PAGE; s.dy = y; }
        y += s.h + GAP;
      });
      // set frames + symbol slots
      const slots = [];
      for (const s of secs) {
        s.sets.forEach((st) => {
          const sx = s.ox + st.x, sy = s.dy + s.oy + st.y;
          if (st.entries.length > 1) {
            const sn = setNode({ ...st, x: sx, y: sy }, s.pg, nk(s.pg));
            if (!o.sections) tops.push(sn.nc.guid);
            st.entries.forEach((e) => slots.push({ e, parent: sn.nc.guid, pos: nk(sn.nc.guid), x: e.px, y: e.py, inSet: sn }));
          } else slots.push({ e: st.entries[0], parent: s.pg, pos: nk(s.pg), x: sx, y: sy, inSet: null, top: !o.sections });
        });
      }
      slots.sort((a, b) => a.e.depth - b.e.depth);
      for (const sl of slots) { try { const sn = await symbolNode(sl.e, sl.parent, sl.pos, sl.x, sl.y, sl.inSet); if (sl.top) tops.push(sn.guid); } catch (err) { stats.skipped++; console.warn('component skipped', sl.e.set, err); } }
      // Figma writes a child def on EVERY variant for every set-level property, bound or not (designer sample, 2026-11-12).
      // Variants without the layer (e.g. a text-only Button) would otherwise miss Icon / Show icon. Order = set order.
      if (o.props) for (const s of new Set(slots.map((sl) => sl.inSet).filter((s) => s && s.pdefs && s.vars))) {
        const order = [...s.pdefs.values()];
        for (const v of s.vars) {
          const have = new Map((v.componentPropDefs || []).filter((d) => d.parentPropDefId).map((d) => [gk(d.parentPropDefId), d]));
          v.componentPropDefs = order.map((pd) => have.get(gk(pd.id)) || (stats.propChildFill++, { id: guid(), parentPropDefId: pd.id }));
        }
      }
      // screens (instances everywhere)
      const ctx = { comps: reg, map: null };
      for (const s of secs) {
        if (!s.screens) continue;
        for (let i = 0; i < s.screens.length; i++) {
          const it = s.screens[i];
          const sc = { ...it.s, x: it.x, y: s.dy + it.y, fill: it.s.fill || { r: 1, g: 1, b: 1, a: 1 }, clip: true };
          const fr = await frameNode(sc, s.pg, nk(s.pg), false, true, ctx);
          if (!o.sections) tops.push(fr.guid);
        }
      }
    }
    nodes.push({ guid: INTERNAL, phase: 'CREATED', parentIndex: { guid: DOC, position: '"' }, type: 'CANVAS', name: 'Internal Only Canvas', visible: false, opacity: 1, transform: I, backgroundOpacity: 1, backgroundEnabled: true, internalOnly: true });
    const pasteID = Math.floor(Math.random() * 2000000000);
    const msg = {
      type: 'NODE_CHANGES', sessionID: 0, ackID: 0, pasteID, pasteFileKey: conf().fileKey, pasteIsPartiallyOutsideEnclosingFrame: false, pastePageId: PAGE,
      isCut: false, pasteEditorType: 'DESIGN', publishedAssetGuids: [],
      clipboardSelectionRegions: [{ parent: PAGE, nodes: tops, pasteIsPartiallyOutsideEnclosingFrame: false, focusType: 'NONE' }],
      pasteAssetType: 'UNKNOWN', nodeChanges: nodes, blobs: blobs.map((b) => ({ bytes: b })),
    };
    return { msg, pasteID, stats, S };
  }

  async function toHtml(screens, opts) {
    const { msg, pasteID, stats, S } = await build(screens, opts);
    const w = new Writer(); encDef(S, w, S.by.Message, msg, 'Message');
    const data = await deflateRaw(w.out());
    const { z } = await schema();
    const arc = new Uint8Array(12 + 4 + z.length + 4 + data.length); const dv = new DataView(arc.buffer);
    arc.set(new TextEncoder().encode('fig-kiwi'), 0); dv.setUint32(8, VERSION, true);
    dv.setUint32(12, z.length, true); arc.set(z, 16);
    dv.setUint32(16 + z.length, data.length, true); arc.set(data, 20 + z.length);
    const meta = btoa(`${JSON.stringify({ fileKey: conf().fileKey, pasteID, dataType: 'scene' })}\n`);
    const html = `<meta charset="utf-8" /><span data-metadata="<!--(figmeta)${meta}(/figmeta)-->"></span><span data-buffer="<!--(figma)${bytesToB64(arc)}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
    return { html, stats, kb: Math.round(html.length / 1024) };
  }

  // Test "0": a real Figma clipboard payload, rebuilt byte for byte (known-good control).
  async function controlHtml() {
    const { z } = await schema(); const data = b64ToBytes(figmaAssets().figmaControl);
    const arc = new Uint8Array(20 + z.length + data.length); const dv = new DataView(arc.buffer);
    arc.set(new TextEncoder().encode('fig-kiwi'), 0); dv.setUint32(8, VERSION, true);
    dv.setUint32(12, z.length, true); arc.set(z, 16); dv.setUint32(16 + z.length, data.length, true); arc.set(data, 20 + z.length);
    const meta = btoa(`${JSON.stringify({ fileKey: 'BrJ3xTkG13Gbf5z1dSfAMY', pasteID: 1906639377, dataType: 'scene' })}\n`);
    const html = `<meta charset="utf-8" /><span data-metadata="<!--(figmeta)${meta}(/figmeta)-->"></span><span data-buffer="<!--(figma)${bytesToB64(arc)}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
    return { html, stats: {}, kb: Math.round(html.length / 1024) };
  }

  // Real Figma clipboard samples (component + instance, variant set), rebuilt byte for byte.
  function sampleHtml(which) {
    const A = figmaAssets(); const arc = A[`figma${which}`], meta = A[`figma${which}Meta`];
    const html = `<meta charset="utf-8" /><span data-metadata="<!--(figmeta)${meta}(/figmeta)-->"></span><span data-buffer="<!--(figma)${arc}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
    return { html, stats: {}, kb: Math.round(html.length / 1024) };
  }

  // Figma looks for the literal "<!--(figma)" markers. The async Clipboard API sanitises text/html
  // (Chrome escapes "<" inside attribute values), so write through a copy event, which keeps the
  // bytes exactly as Figma's own copy does. Needs the click's user activation (≈5 s in Chrome).
  function copyEvent(html) {
    let ok = false;
    const onCopy = (ev) => { ev.clipboardData.setData('text/html', html); ev.preventDefault(); ok = true; };
    document.addEventListener('copy', onCopy, true);
    try { document.execCommand('copy'); } catch (e) { ok = false; } finally { document.removeEventListener('copy', onCopy, true); }
    return ok;
  }
  async function write(htmlPromise) { const r = await htmlPromise; return copyEvent(r.html) ? 'copy-event' : null; }

  return { debug: { isCand, sig, keyOf }, toHtml, controlHtml, sampleHtml, write, copyEvent, build, parsePath, network, font };
})();
