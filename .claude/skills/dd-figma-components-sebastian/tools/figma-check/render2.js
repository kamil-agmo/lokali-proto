// Re-render a decoded Figma clipboard payload to SVG (test only) + simulate auto layout.
const dec = require('./decode.js'); const fs = require('fs');
const r = dec(process.argv[2]); const out = process.argv[3];
const N = r.msg.nodeChanges; const B = r.msg.blobs || [];
const id = (g) => `${g.sessionID}:${g.localID}`;
const kids = new Map(); const byId = new Map();
N.forEach((n) => { byId.set(id(n.guid), n); if (n.parentIndex) { const p = id(n.parentIndex.guid); if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); } });
kids.forEach((a) => a.sort((x, y) => (x.parentIndex.position < y.parentIndex.position ? -1 : 1)));
const col = (p) => `rgba(${Math.round(p.color.r * 255)},${Math.round(p.color.g * 255)},${Math.round(p.color.b * 255)},${(p.color.a * (p.opacity == null ? 1 : p.opacity)).toFixed(3)})`;
const f32 = (b, o) => new DataView(b.buffer, b.byteOffset).getFloat32(o, true), u32 = (b, o) => new DataView(b.buffer, b.byteOffset).getUint32(o, true);
function cmdPath(b) { let o = 0, d = ''; while (o < b.length) { const t = b[o++]; const n = { 0: 0, 1: 2, 2: 2, 3: 4, 4: 6 }[t]; const a = []; for (let i = 0; i < n; i++) { a.push(f32(b, o).toFixed(4)); o += 4; } d += 'ZMLQC'[t] + a.join(' ') + ' '; } return d; }
function netPath(b, fill) {
  const nv = u32(b, 0), ns = u32(b, 4), nr = u32(b, 8); let o = 12; const V = [];
  for (let i = 0; i < nv; i++) { V.push([f32(b, o + 4), f32(b, o + 8)]); o += 12; }
  const S = []; for (let i = 0; i < ns; i++) { S.push({ a: u32(b, o + 4), t1: [f32(b, o + 8), f32(b, o + 12)], b: u32(b, o + 16), t2: [f32(b, o + 20), f32(b, o + 24)] }); o += 28; }
  const seg = (s, move) => { const A = V[s.a], Z = V[s.b]; return `${move ? `M${A[0]} ${A[1]} ` : ''}C${A[0] + s.t1[0]} ${A[1] + s.t1[1]} ${Z[0] + s.t2[0]} ${Z[1] + s.t2[1]} ${Z[0]} ${Z[1]} `; };
  let strokeD = S.map((s) => seg(s, true)).join('');
  let fillD = '';
  for (let i = 0; i < nr; i++) { o += 4; const nl = u32(b, o); o += 4; for (let l = 0; l < nl; l++) { const c = u32(b, o); o += 4; const idx = []; for (let k = 0; k < c; k++) { idx.push(u32(b, o)); o += 4; } fillD += idx.map((k, j) => seg(S[k], j === 0)).join('') + 'Z '; } }
  return { strokeD, fillD };
}
// --- auto layout simulation ---
let alChecked = 0, hugChecked = 0; const alBad = [];
function simulate(n) {
  const ch = (kids.get(id(n.guid)) || []).filter((c) => c.stackPositioning !== 'ABSOLUTE' && c.visible !== false);
  if (n.stackMode === 'HORIZONTAL' || n.stackMode === 'VERTICAL') {
    const H = n.stackMode === 'HORIZONTAL';
    const pt = n.stackVerticalPadding || 0, pr = n.stackPaddingRight || 0, pb = n.stackPaddingBottom || 0, pl = n.stackHorizontalPadding || 0;
    const sw4 = n.bordersTakeSpace ? (n.borderStrokeWeightsIndependent ? [n.borderTopWeight, n.borderRightWeight, n.borderBottomWeight, n.borderLeftWeight] : [n.strokeWeight, n.strokeWeight, n.strokeWeight, n.strokeWeight]) : [0, 0, 0, 0];
    const [ptS, prS, pbS, plS] = [pt + sw4[0], pr + sw4[1], pb + sw4[2], pl + sw4[3]];
    const W = n.size.x, Hh = n.size.y; const gap = n.stackSpacing || 0;
    const prim = (c) => (H ? c.size.x : c.size.y), cross = (c) => (H ? c.size.y : c.size.x);
    const inner = H ? W - plS - prS : Hh - ptS - pbS, innerC = H ? Hh - ptS - pbS : W - plS - prS;
    const total = ch.reduce((s, c) => s + prim(c), 0) + gap * Math.max(0, ch.length - 1);
    const growers = ch.filter((c) => c.stackChildPrimaryGrow > 0);
    const free = inner - total;
    let cur = H ? plS : ptS; let g2 = gap;
    const j = n.stackPrimaryAlignItems || 'MIN';
    if (!growers.length) { if (j === 'CENTER') cur += free / 2; else if (j === 'MAX') cur += free; else if (j === 'SPACE_BETWEEN' && ch.length > 1) g2 = gap + free / (ch.length - 1); }
    for (const c of ch) {
      let p = prim(c); if (growers.includes(c)) p += free / growers.length;
      let cs = cross(c); const a = c.stackChildAlignSelf === 'STRETCH' ? 'STRETCH' : (n.stackCounterAlignItems || 'MIN');
      const c0 = H ? ptS : plS; let cc = c0;
      if (a === 'CENTER') cc = c0 + (innerC - cs) / 2; else if (a === 'MAX') cc = c0 + innerC - cs; else if (a === 'STRETCH') cs = innerC;
      const ex = H ? cur : cc, ey = H ? cc : cur; const ax = c.transform.m02, ay = c.transform.m12;
      alChecked++;
      if (a !== 'BASELINE' && (Math.abs(ex - ax) > 1.5 || Math.abs(ey - ay) > 1.5)) alBad.push(`${n.name} > ${c.name}: expected ${ex.toFixed(1)},${ey.toFixed(1)} got ${ax.toFixed(1)},${ay.toFixed(1)}`);
      if (Math.abs(p - prim(c)) > 1.5) alBad.push(`${n.name} > ${c.name}: grow size ${p.toFixed(1)} vs ${prim(c).toFixed(1)}`);
      cur += p + g2;
    }
    if (n.type !== 'INSTANCE' && (!n.stackPrimarySizing || n.stackCounterSizing === 'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE')) {
      hugChecked++;
      const sumP = ch.reduce((t, c) => t + prim(c), 0) + gap * Math.max(0, ch.length - 1), maxC = ch.length ? Math.max(...ch.map(cross)) : 0;
      if (!n.stackPrimarySizing && Math.abs((H ? plS + prS : ptS + pbS) + sumP - (H ? W : Hh)) > 1.5) alBad.push(`${n.name}: hug primary ${(H ? W : Hh).toFixed(1)} vs content ${((H ? plS + prS : ptS + pbS) + sumP).toFixed(1)}`);
      if (n.stackCounterSizing === 'RESIZE_TO_FIT_WITH_IMPLICIT_SIZE' && Math.abs((H ? ptS + pbS : plS + prS) + maxC - (H ? Hh : W)) > 1.5) alBad.push(`${n.name}: hug counter ${(H ? Hh : W).toFixed(1)} vs content ${((H ? ptS + pbS : plS + prS) + maxC).toFixed(1)}`);
    }
  }
  (kids.get(id(n.guid)) || []).forEach(simulate);
}
// --- instance resolution ---
const gk = (g) => `${g.sessionID}:${g.localID}`;
const toMap = (arr) => { const m = new Map(); (arr || []).forEach((o) => { if (o.guidPath) m.set(o.guidPath.guids.map(gk).join('/'), o); }); return m; };
function look(R, g, field) { const out = {}; for (let i = R.length - 1; i >= 0; i--) { const e = R[i]; const v = e[field].get([...e.prefix, g].map(gk).join('/')); if (v) Object.assign(out, v); } return out; }
function eff(n, R) {
  if (!R) return n;
  const o = look(R, n.guid, 'ov'), d = look(R, n.guid, 'der'); const e = { ...n };
  for (const k of ['fillPaints', 'strokePaints', 'opacity', 'fontName', 'fontSize', 'visible']) if (o[k] !== undefined) e[k] = o[k];
  if (d.size) e.size = d.size; if (d.transform) e.transform = d.transform;
  if (o.textData) { e.textData = { ...n.textData, ...o.textData }; e.derivedTextData = d.derivedTextData || null; e._missing = !d.derivedTextData; }
  return e;
}
let instCount = 0, missingTxt = 0, badSym = 0;
// --- render ---
let defs = '', clipN = 0;
function draw(n0, ox, oy, R) {
  const n = eff(n0, R);
  if (n.visible === false) return '';
  const x = ox + n.transform.m02, y = oy + n.transform.m12, w = n.size ? n.size.x : 0, h = n.size ? n.size.y : 0;
  const op = n.opacity != null && n.opacity < 1 ? ` opacity="${n.opacity}"` : '';
  const rad = n.rectangleTopLeftCornerRadius || n.cornerRadius || 0;
  if (n.type === 'TEXT') {
    const d = n.derivedTextData; if (!d) { if (n._missing) missingTxt++; } if (!d) return `<text x="${x}" y="${y + n.fontSize}" font-family="Poppins" font-size="${n.fontSize}" fill="magenta">${n.textData.characters.replace(/[<&]/g, '')}</text>`;
    const base = n.fillPaints && n.fillPaints[0] ? col(n.fillPaints[0]) : 'black';
    const ov = new Map((n.textData.styleOverrideTable || []).map((s) => [s.styleID, s]));
    return `<g${op}>` + d.glyphs.map((g) => { const s = ov.get(g.styleID); const fill = s && s.fillPaints ? col(s.fillPaints[0]) : base; return `<path transform="translate(${x + g.position.x} ${y + g.position.y}) scale(${g.fontSize} ${-g.fontSize})" d="${cmdPath(B[g.commandsBlob].bytes)}" fill="${fill}"/>`; }).join('') + '</g>';
  }
  if (n.type === 'VECTOR') {
    const { strokeD, fillD } = netPath(B[n.vectorData.vectorNetworkBlob].bytes);
    let s = `<g transform="translate(${x} ${y})"${op}>`;
    if (fillD && n.fillPaints && n.fillPaints.length) s += `<path d="${fillD}" fill="${col(n.fillPaints[0])}"/>`;
    if (n.strokePaints && n.strokePaints.length) s += `<path d="${strokeD}" fill="none" stroke="${col(n.strokePaints[0])}" stroke-width="${n.strokeWeight}" stroke-linecap="${(n.strokeCap || 'NONE').toLowerCase().replace('none', 'butt')}" stroke-linejoin="${(n.strokeJoin || 'MITER').toLowerCase()}"${n.dashPattern ? ` stroke-dasharray="${n.dashPattern.join(' ')}"` : ''}/>`;
    return s + '</g>';
  }
  let kidsList = kids.get(id(n0.guid)) || []; let R2 = R;
  if (n.type === 'INSTANCE') {
    instCount++;
    const sw = R ? look(R, n0.guid, 'ov') : {};
    const symId = sw.overriddenSymbolID || n.symbolData.symbolID; const sym = byId.get(gk(symId));
    if (!sym) { badSym++; return ''; }
    if (sw.overriddenSymbolID) { for (const k of ['fillPaints', 'strokePaints', 'cornerRadius', 'rectangleTopLeftCornerRadius', 'borderStrokeWeightsIndependent', 'strokeWeight']) n[k] = sym[k]; const o2 = look(R, n0.guid, 'ov'); if (o2.fillPaints) n.fillPaints = o2.fillPaints; }
    R2 = [...(R || []).map((e) => ({ ...e, prefix: [...e.prefix, n0.guid] })), { prefix: [], ov: toMap(n.symbolData.symbolOverrides), der: toMap(n.derivedSymbolData) }];
    kidsList = kids.get(id(sym.guid)) || [];
  }
  let s = `<g${op}>`;
  for (const p of n.fillPaints || []) {
    if (p.type === 'SOLID') s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${col(p)}"/>`;
    if (p.type === 'IMAGE') s += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${Buffer.from(B[p.image.dataBlob].bytes).toString('base64')}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  if (n.strokePaints && n.strokePaints.length) {
    const c = col(n.strokePaints[0]);
    if (n.borderStrokeWeightsIndependent) { const t = n.borderTopWeight, r2 = n.borderRightWeight, b = n.borderBottomWeight, l = n.borderLeftWeight; if (t) s += `<rect x="${x}" y="${y}" width="${w}" height="${t}" fill="${c}"/>`; if (b) s += `<rect x="${x}" y="${y + h - b}" width="${w}" height="${b}" fill="${c}"/>`; if (l) s += `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="${c}"/>`; if (r2) s += `<rect x="${x + w - r2}" y="${y}" width="${r2}" height="${h}" fill="${c}"/>`; }
    else { const sw = n.strokeWeight; s += `<rect x="${x + sw / 2}" y="${y + sw / 2}" width="${w - sw}" height="${h - sw}" rx="${Math.max(0, rad - sw / 2)}" fill="none" stroke="${c}" stroke-width="${sw}"${n.dashPattern ? ` stroke-dasharray="${n.dashPattern.join(' ')}"` : ''}/>`; }
  }
  let inner = kidsList.map((c) => draw(c, x, y, R2)).join('');
  if (n.frameMaskDisabled === false) { const cid = `c${++clipN}`; defs += `<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}"/></clipPath>`; inner = `<g clip-path="url(#${cid})">${inner}</g>`; }
  return s + inner + '</g>';
}
const page = N.find((n) => n.type === 'CANVAS' && !n.internalOnly);
const tops = kids.get(id(page.guid)) || [];
// "@outdir": one SVG per screen frame (direct FRAME children of sections), named by screen ID → compare runs
if (process.argv[4] && process.argv[4].startsWith('@')) {
  const dir = process.argv[4].slice(1); fs.mkdirSync(dir, { recursive: true }); let k = 0;
  const secs = new Set(N.filter((n) => n.type === 'SECTION').map((n) => id(n.guid)));
  for (const t of N.filter((n) => n.type === 'FRAME' && n.parentIndex && secs.has(id(n.parentIndex.guid)))) {
    const m = /(?:^| \/ )(\d+(?:\.\d+)?[a-z]?)(?: · | \/ )/.exec(t.name); if (!m) continue;
    defs = ''; clipN = 0; simulate(t); const b = draw(t, -t.transform.m02, -t.transform.m12);
    fs.writeFileSync(`${dir}/${m[1]}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${t.size.x}" height="${t.size.y}" viewBox="0 0 ${t.size.x} ${t.size.y}"><defs>${defs}</defs>${b}</svg>`); k++;
  }
  console.log('screens written', k, '| AL mismatches', alBad.length, '| missing symbol', badSym); process.exit(0);
}
// filter: section name substring, or "=Exact node name" to render one node anywhere (e.g. "=Tab / History")
const only = process.argv[4]; const sel = only ? (only.startsWith('=') ? N.filter((n) => n.name === only.slice(1)).slice(0, 1) : tops.filter((t) => t.name.includes(only))) : tops;
sel.forEach(simulate);
const body = sel.map((t) => (only ? draw(t, -t.transform.m02, -t.transform.m12) : draw(t, 0, 0))).join('');
const W = only ? Math.max(...sel.map((t) => t.size.x)) : Math.max(...sel.map((t) => t.transform.m02 + t.size.x)), H = only ? Math.max(...sel.map((t) => t.size.y)) : Math.max(...sel.map((t) => t.transform.m12 + t.size.y));
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`);
console.log('AL children checked', alChecked, 'mismatches', alBad.length, '| hug frames', hugChecked, '| instances drawn', instCount, 'missing symbol', badSym, 'text overrides without glyph data', missingTxt); alBad.slice(0, 25).forEach((l) => console.log('  ', l));
