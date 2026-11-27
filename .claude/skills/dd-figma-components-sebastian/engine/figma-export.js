/* =========================================================
   Copy to Figma — engine part 1 of 3 (load order: figma.config.js,
   figma-assets.js, figma-export.js, figma-native.js, figma-panel.js).
   - figmaConfig(): per-project settings (FIGMA_CONFIG) over defaults
   - FX: serialises a rendered screen into a layout tree
     ({ type, x, y, w, h, layout, children… }) that FN encodes.
   ========================================================= */
'use strict';

/* ---------- per-project config (skill: "figma.config.js") ---------- */
const FIGMA_DEFAULTS = {
  name: 'Prototype',                 // panel title; also the clipboard fileKey (letters/digits only)
  storageKey: 'proto',               // localStorage prefix: <key>-fig-hug, <key>-closed-groups …
  frameWidth: 1440,                  // width of the hidden render host = Figma frame width (390 for a phone)
  organise: 'flow',                  // Q1: 'flow' (Flow → Screen) or 'module' (Module → Function → Screen)
  copy: ['page', 'group', 'screen'], // Q3: copy buttons in the panel (page = everything in one paste)
  output: 'design',                  // Q4: 'design' (components + instances) or 'plain' (frames only) for the page copy
  groupCopy: 'plain',                // group / screen copies: 'plain' frames, or 'design' (brings its own mains)
  universalSection: 'Universal Components',
  components: '*',                   // '*' = every data-component except frameOnly, or an explicit allowlist (R6)
  frameOnly: ['Frame', 'Screen', 'Card', 'Dialog', 'Drawer', 'Sheet', 'Table', 'PageHeader', 'Field', 'Section', 'Modal'],
  containers: ['Sidebar', 'Topbar', 'TabBar', 'Tabs', 'Segmented', 'FilterChips', 'Pagination', 'Breadcrumb'], // R5
  noUnify: null,                     // null = containers + tableRow (R2 unify skips these)
  variantProps: {                    // data-variant segments → named variant properties (R1: state/type/size only). A project list replaces this one.
    Button: ['Type', 'Size', 'State'], IconButton: ['Type', 'Size'], Input: ['Size', 'State'], Textarea: ['State'], Select: ['Size', 'State'],
    Checkbox: ['Checked', 'State'], Radio: ['Checked', 'State'], Toggle: ['On', 'State'], Chip: ['Type'], Badge: ['Tone'], StatusChip: ['Status'],
    Tab: ['State'], NavItem: ['State'], NavSubItem: ['State'], TabBarItem: ['State'], Segmented: ['Type'], Banner: ['Tone'], Toast: ['Tone'],
    Avatar: ['Size'], Count: ['Tone'], TableRow: ['State'], ListRow: ['Type'], StatTile: ['Tone'],
  },
  words: { sm: 'Small', md: 'Medium', lg: 'Large', xs: 'XSmall', on: 'On', off: 'Off' }, // value words for variant values
  tableRow: 'TableRow',              // rows get one set per screen: "Table row / <screen title>"
  openGroup: { container: 'Sidebar', item: 'NavItem', variant: 'group-open', property: 'Open group' }, // only with switch containers=0
  fontFamily: null,                  // (cssFamily) => Figma family name; default maps CSS generics (system-ui, monospace…)
  fontStyles: {},                    // { 'Inter': { 600: 'Semi Bold' } } where Figma's style name differs from Thin…Black
  styleFromFaces: true,              // Figma style = the inline face Chrome renders (600 → Bold if only 400/700 are inlined)
  normalLineHeight: { Poppins: 1.5, Inter: 1.21, Roboto: 1.172 }, // em, used for `line-height: normal` on loose text
  glyphFallback: null,               // family whose inline TTF draws glyphs for families without one (null = Figma lays it out)
  transformHtml: null,               // (html) => html, applied to every render (e.g. date formatting)
  sectionName: null,                 // (group) => Figma section name; group = { key, name, kind }
  screenName: null,                  // (screen, group) => Figma frame name
};
const FIGMA_GENERIC_FAMILIES = { 'system-ui': 'Inter', '-apple-system': 'Inter', blinkmacsystemfont: 'Inter', 'sans-serif': 'Inter', 'ui-sans-serif': 'Inter',
  'ui-monospace': 'Roboto Mono', monospace: 'Roboto Mono', 'sf mono': 'Roboto Mono', menlo: 'Roboto Mono', serif: 'Georgia', 'ui-serif': 'Georgia' };
function figmaConfig() {
  const u = (typeof FIGMA_CONFIG !== 'undefined' && FIGMA_CONFIG) || (typeof window !== 'undefined' && window.FIGMA_CONFIG) || {};
  const c = { ...FIGMA_DEFAULTS, ...u };
  c.words = { ...FIGMA_DEFAULTS.words, ...(u.words || {}) };
  c.variantProps = { ...(u.variantProps || FIGMA_DEFAULTS.variantProps) }; // a project list replaces the defaults
  c.normalLineHeight = { ...FIGMA_DEFAULTS.normalLineHeight, ...(u.normalLineHeight || {}) };
  c.openGroup = { ...FIGMA_DEFAULTS.openGroup, ...(u.openGroup || {}) };
  if (!c.noUnify) c.noUnify = [...c.containers, c.tableRow];
  c.fileKey = String(c.fileKey || c.name).replace(/[^A-Za-z0-9]+/g, '') || 'Prototype';
  if (!c.fontFamily) c.fontFamily = (f) => FIGMA_GENERIC_FAMILIES[String(f || '').toLowerCase()] || f || 'Inter';
  return c;
}
function figmaAssets() {
  if (typeof FIGMA_ASSETS !== 'undefined') return FIGMA_ASSETS;
  if (typeof ASSETS !== 'undefined' && ASSETS.figmaSchema) return ASSETS; // build.py projects that inline assets themselves
  throw new Error('FIGMA_ASSETS missing: add <script src="figma-assets.js"> before the engine');
}

const FX = (() => {
  const px = (v) => parseFloat(v) || 0;
  const r2 = (n) => Math.round(n * 100) / 100;
  function color(str) {
    const m = /rgba?\(([^)]+)\)/.exec(str || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    return { r: r2(p[0] / 255), g: r2(p[1] / 255), b: r2(p[2] / 255), a: r2(a) };
  }
  function shadows(str) {
    if (!str || str === 'none') return [];
    const out = [];
    const re = /(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?/g;
    let m;
    while ((m = re.exec(str))) {
      const c = color(m[1]);
      if (!c) continue;
      out.push({ type: m[6] ? 'INNER_SHADOW' : 'DROP_SHADOW', color: c, x: +m[2], y: +m[3], blur: +m[4], spread: +(m[5] || 0) });
    }
    return out;
  }
  function radius(cs, w, h) {
    const one = (v) => (String(v).includes('%') ? (Math.min(w, h) * parseFloat(v)) / 100 : px(v));
    return [one(cs.borderTopLeftRadius), one(cs.borderTopRightRadius), one(cs.borderBottomRightRadius), one(cs.borderBottomLeftRadius)].map((v) => Math.min(v, Math.min(w, h) / 2));
  }
  function borders(cs) {
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({ w: cs[`border${s}Style`] === 'none' ? 0 : px(cs[`border${s}Width`]), c: color(cs[`border${s}Color`]), dashed: cs[`border${s}Style`] === 'dashed' || cs[`border${s}Style`] === 'dotted' }));
    const any = sides.find((s) => s.w > 0 && s.c);
    if (!any) return null;
    return { color: any.c, dashed: any.dashed, weights: sides.map((s) => (s.c ? s.w : 0)) };
  }
  const INLINE = new Set(['inline']);
  const isTextOnly = (el) => {
    if (el.nodeType === 3) return true;
    if (el.nodeType !== 1) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'svg' || tag === 'img' || tag === 'input' || tag === 'textarea') return false;
    if (tag === 'br') return true;
    const cs = getComputedStyle(el);
    if (!INLINE.has(cs.display)) return false;
    if (color(cs.backgroundColor) || borders(cs)) return false;
    return [...el.childNodes].every(isTextOnly);
  };
  const hasText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim());
  function textStyle(cs) {
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    return {
      family: fam, weight: Number(cs.fontWeight) || 400, italic: cs.fontStyle === 'italic', size: px(cs.fontSize),
      lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight), letterSpacing: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing),
      color: color(cs.color) || { r: 0, g: 0, b: 0, a: 1 }, underline: (cs.textDecorationLine || '').includes('underline'), strike: (cs.textDecorationLine || '').includes('line-through'),
      upper: cs.textTransform === 'uppercase',
    };
  }
  function runsOf(el) {
    const runs = [];
    const walk = (n) => {
      if (n.nodeType === 3) {
        const t = n.data.replace(/\s+/g, ' ');
        if (t) runs.push({ text: t, style: textStyle(getComputedStyle(n.parentElement)) });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') runs.push({ text: '\n', style: textStyle(getComputedStyle(n.parentElement)) });
        else n.childNodes.forEach(walk);
      }
    };
    el.childNodes.forEach(walk);
    // trim leading/trailing spaces of the whole string
    if (runs.length) { runs[0].text = runs[0].text.replace(/^ +/, ''); const l = runs[runs.length - 1]; l.text = l.text.replace(/ +$/, ''); }
    return runs.filter((r) => r.text);
  }
  // Measured text lines (for the SVG copy): words grouped by the line they sit on.
  function textNodesOf(el) { const out = []; const w = (n) => { if (n.nodeType === 3) out.push(n); else if (n.nodeType === 1 && n.tagName !== 'SVG') n.childNodes.forEach(w); }; el.childNodes.forEach(w); return out; }
  function lineBoxes(tns, origin) {
    const words = [];
    for (const tn of tns) {
      const st = textStyle(getComputedStyle(tn.parentElement));
      const re = /\S+/g; let m;
      while ((m = re.exec(tn.data))) {
        const rg = document.createRange(); rg.setStart(tn, m.index); rg.setEnd(tn, m.index + m[0].length);
        const rc = rg.getClientRects()[0];
        if (!rc || rc.width === 0) continue;
        words.push({ t: st.upper ? m[0].toUpperCase() : m[0], top: rc.top, bottom: rc.bottom, left: rc.left, right: rc.right, st, gap: m.index > 0 && /\s/.test(tn.data[m.index - 1]) });
      }
    }
    const lines = [];
    for (const w of words) {
      let ln = lines[lines.length - 1];
      if (!ln || w.top - ln.top0 > (ln.h0 * 0.5)) { ln = { left: w.left, top: w.top, bottom: w.bottom, top0: w.top, h0: w.bottom - w.top, segs: [] }; lines.push(ln); }
      ln.top = Math.min(ln.top, w.top); ln.bottom = Math.max(ln.bottom, w.bottom); ln.left = Math.min(ln.left, w.left); ln.right = Math.max(ln.right || w.right, w.right);
      const last = ln.segs[ln.segs.length - 1];
      const sp = last && (w.gap || w.left - last.right > 1) ? ' ' : '';
      if (last && JSON.stringify(last.st) === JSON.stringify(w.st)) { last.t += sp + w.t; last.right = w.right; }
      else { if (last && sp) last.t += ' '; ln.segs.push({ t: w.t, st: w.st, right: w.right }); }
    }
    return lines.map((l) => ({ x: r2(l.left - origin.left), w: r2((l.right || l.left) - l.left), top: r2(l.top - origin.top), bottom: r2(l.bottom - origin.top), segs: l.segs.map((g) => ({ text: g.t, style: g.st })) }));
  }
  function textNode(name, rect, base, runs, cs, prect) {
    const text = runs.map((r) => r.text).join('');
    if (!text.trim()) return null;
    const lh = base.lineHeight || base.size * 1.2;
    return { type: 'TEXT', name: name || text.slice(0, 32), x: r2(rect.left - prect.left), y: r2(rect.top - prect.top), w: r2(rect.width), h: r2(rect.height), text, style: base, runs, align: ({ center: 'CENTER', right: 'RIGHT', end: 'RIGHT', justify: 'JUSTIFIED' })[cs.textAlign] || 'LEFT', multiline: rect.height > lh * 1.5 };
  }
  function nameOf(el) {
    const ly = el.getAttribute && el.getAttribute('data-layer'); // explicit, stable layer name (department rule R3)
    if (ly) return ly;
    const ic = el.getAttribute && el.getAttribute('data-icon');
    if (ic) return `icon / ${ic}`;
    const c = el.getAttribute && el.getAttribute('data-component');
    if (c) { const v = el.getAttribute('data-variant'); return v ? `${c} / ${v}` : c; }
    const cls = (el.className && el.className.baseVal === undefined ? el.className : '').split(/\s+/).filter(Boolean)[0];
    return cls || el.tagName.toLowerCase();
  }
  // SVG shapes, read while the SVG is live: computed fill/stroke + screen matrix → frame pixels.
  function shapePath(el, tag) {
    const v = (a) => (el[a] && el[a].baseVal && typeof el[a].baseVal.value === 'number' ? el[a].baseVal.value : parseFloat(el.getAttribute(a)) || 0);
    if (tag === 'path') return el.getAttribute('d');
    if (tag === 'line') return `M${v('x1')} ${v('y1')}L${v('x2')} ${v('y2')}`;
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = v('cx'), cy = v('cy'), rx = tag === 'circle' ? v('r') : v('rx'), ry = tag === 'circle' ? v('r') : v('ry');
      if (!rx || !ry) return null;
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    if (tag === 'rect') {
      const x = v('x'), y = v('y'), w = v('width'), h = v('height');
      if (!w || !h) return null;
      let rx = el.hasAttribute('rx') ? v('rx') : el.hasAttribute('ry') ? v('ry') : 0, ry = el.hasAttribute('ry') ? v('ry') : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    if (tag === 'polyline' || tag === 'polygon') {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4) return null;
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i + 1 < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      return tag === 'polygon' ? `${d}Z` : d;
    }
    return null;
  }
  function svgShapes(svg, rect, w, h) {
    const out = [];
    const ox = rect.left + rect.width / 2 - w / 2, oy = rect.top + rect.height / 2 - h / 2;
    for (const el of svg.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon,text')) {
      if (el.closest('defs,clipPath,mask,symbol,title,pattern,marker')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const tag = el.tagName.toLowerCase();
      if (tag === 'text') {
        const txt = el.textContent.replace(/\s+/g, ' ').trim();
        if (!txt) continue;
        const r = el.getBoundingClientRect();
        const st = textStyle(cs); st.color = color(cs.fill) || st.color;
        out.push({ kind: 'text', text: txt, x: r2(r.left - ox), y: r2(r.top - oy), w: r2(r.width), h: r2(r.height), style: st });
        continue;
      }
      const d = shapePath(el, tag);
      const m = el.getScreenCTM();
      if (!d || !m) continue;
      const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
      const withOp = (c, op) => (c ? { ...c, a: r2(c.a * (op === '' ? 1 : Number(op))) } : null);
      const fill = withOp(color(cs.fill), cs.fillOpacity), stroke = px(cs.strokeWidth) > 0 ? withOp(color(cs.stroke), cs.strokeOpacity) : null;
      if (!fill && !stroke) continue;
      const dash = cs.strokeDasharray && cs.strokeDasharray !== 'none' ? cs.strokeDasharray.split(/[\s,]+/).map((x) => px(x) * k).filter((x) => x > 0) : null;
      out.push({ kind: 'shape', name: tag, d, m: [m.a, m.b, m.c, m.d, m.e - ox, m.f - oy], fill, stroke, sw: r2(px(cs.strokeWidth) * k), cap: cs.strokeLinecap, join: cs.strokeLinejoin, evenodd: cs.fillRule === 'evenodd', dash, opacity: Number(cs.opacity) < 1 ? Number(cs.opacity) : undefined });
    }
    return out;
  }
  const JUST = { 'flex-start': 'MIN', start: 'MIN', normal: 'MIN', left: 'MIN', center: 'CENTER', 'flex-end': 'MAX', end: 'MAX', right: 'MAX', 'space-between': 'SPACE_BETWEEN' };
  const ALIGN = { 'flex-start': 'MIN', start: 'MIN', 'self-start': 'MIN', center: 'CENTER', 'flex-end': 'MAX', end: 'MAX', 'self-end': 'MAX', baseline: 'BASELINE', stretch: 'MIN', normal: 'MIN' };

  function node(el, prect, parentLayout) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 0.5 && rect.height < 0.5) return null;
    const tag = el.tagName.toLowerCase();
    const base = { name: nameOf(el), x: r2(rect.left - prect.left), y: r2(rect.top - prect.top), w: r2(rect.width), h: r2(rect.height) };
    const comp = el.getAttribute('data-component');
    if (comp) { base.comp = comp; base.variant = el.getAttribute('data-variant') || ''; }
    if (el.getAttribute('data-layer')) base.layer = el.getAttribute('data-layer');
    // 11.2 component properties: data-prop-text / data-prop-bool / data-prop-swap="Property name" bind this layer
    const pr = {}; ['text', 'bool', 'swap'].forEach((k) => { const v = el.getAttribute(`data-prop-${k}`); if (v) pr[k] = v; });
    if (Object.keys(pr).length) base.props = pr;
    if (el.getAttribute('data-prop-mode')) base.propMode = el.getAttribute('data-prop-mode'); // test knob: "only" = assignments without overrides
    if (tag === 'svg' && el.getAttribute('data-icon')) base.icon = el.getAttribute('data-icon');
    if (parentLayout && parentLayout !== 'NONE' && (cs.position === 'absolute' || cs.position === 'fixed')) base.abs = true;
    if (Number(cs.flexGrow) > 0) base.grow = 1;
    if (parentLayout && parentLayout !== 'NONE' && cs.alignSelf && !['auto', 'normal', 'stretch'].includes(cs.alignSelf)) base.self = ALIGN[cs.alignSelf] || null;
    if (Number(cs.opacity) < 1) base.opacity = Number(cs.opacity);
    if (tag === 'svg') {
      const clone = el.cloneNode(true);
      const col = cs.color;
      const mtx = /matrix\(([^)]+)\)/.exec(cs.transform || '');
      if (mtx) {
        const [a, b] = mtx[1].split(',').map(Number);
        const ang = Math.round((Math.atan2(b, a) * 180) / Math.PI);
        const w0 = px(el.getAttribute('width')) || rect.width, h0 = px(el.getAttribute('height')) || rect.height;
        if (ang) { base.rot = ang; base.x = r2(rect.left + rect.width / 2 - w0 / 2 - prect.left); base.y = r2(rect.top + rect.height / 2 - h0 / 2 - prect.top); base.w = w0; base.h = h0; }
      }
      clone.setAttribute('width', base.w); clone.setAttribute('height', base.h);
      let s = clone.outerHTML.replace(/currentColor/g, col);
      if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      try { base.shapes = svgShapes(el, rect, base.w, base.h); } catch (e) { base.shapes = []; console.warn('svg shapes', e); }
      return { ...base, type: 'SVG', svg: s };
    }
    if (tag === 'input' || tag === 'textarea') {
      const val = el.value || el.getAttribute('value') || '';
      const txt = val || el.placeholder || '';
      if (!txt) return null;
      const st = textStyle(cs);
      if (!val) st.color = { r: 0.44, g: 0.44, b: 0.49, a: 1 };
      const t = { type: 'TEXT', ...base, text: txt, style: st, runs: [{ text: txt, style: st }], align: 'LEFT', multiline: false };
      const ch = st.size * 1.4, top = (rect.height - ch) / 2;
      t.lines = [{ x: px(cs.paddingLeft), top: r2(top), bottom: r2(top + ch), segs: [{ text: txt, style: st }] }];
      return t;
    }
    if (tag === 'img') return { ...base, type: 'IMAGE', src: el.currentSrc || el.src, radius: radius(cs, rect.width, rect.height), nat: [el.naturalWidth || Math.round(rect.width), el.naturalHeight || Math.round(rect.height)] };
    // Pure text element → TEXT node
    if (hasText(el) && [...el.childNodes].every(isTextOnly) && !color(cs.backgroundColor) && !borders(cs) && px(cs.paddingLeft) + px(cs.paddingTop) === 0) {
      const t = textNode(base.name, rect, textStyle(cs), runsOf(el), cs, prect);
      if (t) { t.lines = lineBoxes(textNodesOf(el), rect); if (base.abs) t.abs = true; if (base.grow) t.grow = 1; if (base.self) t.self = base.self; if (base.layer) t.layer = base.layer; if (base.props) t.props = base.props; }
      return t;
    }
    // FRAME
    const f = { ...base, type: 'FRAME', children: [] };
    const bg = color(cs.backgroundColor); if (bg) f.fill = bg;
    const b = borders(cs); if (b) f.border = b;
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => (cs[`border${k}Style`] === 'none' ? 0 : px(cs[`border${k}Width`])));
    if (bw.some((v) => v > 0)) f.bw = bw; // includes transparent borders (they still take space)
    const rad = radius(cs, rect.width, rect.height); if (rad.some((v) => v > 0)) f.radius = rad;
    let sh = shadows(cs.boxShadow);
    // "inset 0 0 0 1px colour" rings are borders drawn with box-shadow → real INSIDE stroke in Figma (takes no layout space)
    const ring = !f.border && sh.find((e) => e.type === 'INNER_SHADOW' && !e.x && !e.y && !e.blur && e.spread > 0);
    if (ring) { f.border = { color: ring.color, dashed: false, ring: true, weights: [ring.spread, ring.spread, ring.spread, ring.spread] }; if (!f.bw) f.bw = [0, 0, 0, 0]; sh = sh.filter((e) => e !== ring); }
    if (sh.length) f.effects = sh;
    if (cs.overflow !== 'visible' || cs.overflowX !== 'visible') f.clip = true;
    const isFlex = cs.display === 'flex' || cs.display === 'inline-flex';
    let layout = 'NONE';
    if (isFlex) {
      layout = cs.flexDirection.startsWith('column') ? 'VERTICAL' : 'HORIZONTAL';
      f.layout = { mode: layout, gap: px(layout === 'VERTICAL' ? cs.rowGap : cs.columnGap), pad: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)], justify: JUST[cs.justifyContent] || 'MIN', align: ALIGN[cs.alignItems] || 'MIN', wrap: cs.flexWrap === 'wrap', crossGap: px(layout === 'VERTICAL' ? cs.columnGap : cs.rowGap) };
      if (f.layout.align === 'BASELINE' && layout === 'VERTICAL') f.layout.align = 'MIN';
    }
    // children (elements + loose text inside layout containers)
    for (const c of el.childNodes) {
      if (c.nodeType === 3) {
        if (!c.data.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(c);
        const rr = rg.getBoundingClientRect();
        const t = textNode('text', rr, textStyle(cs), [{ text: c.data.replace(/\s+/g, ' ').trim(), style: textStyle(cs) }], cs, rect);
        if (t) {
          t.lines = lineBoxes([c], rr);
          // Range rects are glyph boxes; the anonymous flex/block item is the line box → use line-height
          const st0 = textStyle(cs); const LH = st0.lineHeight || st0.size * normalLH(st0.family);
          if (LH > 0 && t.lines.length) {
            const nl = t.lines.length, ch = rr.height - (nl - 1) * LH, d = (LH - ch) / 2;
            if (Math.abs(d) > 0.3) { t.y = r2(t.y - d); t.h = r2(nl * LH); t.lines.forEach((l) => { l.top = r2(l.top + d); l.bottom = r2(l.bottom + d); }); }
          }
          f.children.push(t);
        }
      } else if (c.nodeType === 1) {
        const n = node(c, rect, layout);
        if (n) f.children.push(n);
      }
    }
    // Auto layout only when children really sit in sequence; otherwise keep absolute positions.
    if (layout !== 'NONE') {
      const flow = f.children.filter((c) => !c.abs);
      const marg = [...el.children].some((c) => { const s = getComputedStyle(c); return ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].some((k) => Math.abs(px(s[k])) > 0.5) || s.marginLeft === 'auto'; });
      let ok = !marg && !f.layout.wrap;
      if (ok && f.layout.justify === 'MIN' && flow.length) {
        const H = layout === 'HORIZONTAL';
        let pos = H ? f.layout.pad[3] : f.layout.pad[0];
        for (const c of flow) { const p = H ? c.x : c.y; if (Math.abs(p - pos) > 2) { ok = false; break; } pos = p + (H ? c.w : c.h) + f.layout.gap; }
      }
      if (!ok) { delete f.layout; f.children.forEach((c) => { delete c.abs; }); }
      else {
        const H = layout === 'HORIZONTAL';
        const bw = f.bw || [0, 0, 0, 0];
        // Figma has no per-child cross alignment: wrap align-self children in a full-height (or full-width) frame that aligns them
        f.children = f.children.map((c) => {
          if (c.abs || !c.self || c.self === f.layout.align || c.self === 'BASELINE') return c;
          const top = f.layout.pad[0] + bw[0], left = f.layout.pad[3] + bw[3];
          const w = H ? c.w : f.w - left - f.layout.pad[1] - bw[1], h = H ? f.h - top - f.layout.pad[2] - bw[2] : c.h;
          const x = H ? c.x : left, y = H ? top : c.y;
          const inner0 = { ...c, x: r2(c.x - x), y: r2(c.y - y) }; delete inner0.self; delete inner0.grow;
          return { type: 'FRAME', name: 'align', x, y, w, h, stretch: true, grow: c.grow, children: [inner0], layout: { mode: H ? 'VERTICAL' : 'HORIZONTAL', gap: 0, pad: [0, 0, 0, 0], justify: c.self, align: 'MIN', wrap: false, crossGap: 0 } };
        });
        const flow2 = f.children.filter((c) => !c.abs);
        const inner = H ? f.h - f.layout.pad[0] - f.layout.pad[2] : f.w - f.layout.pad[1] - f.layout.pad[3];
        flow2.forEach((c) => { const cross = H ? c.h : c.w; if (!c.stretch && Math.abs(cross - inner) < 1.5 && f.layout.align === 'MIN') c.stretch = true; });
      }
    }
    return f;
  }

  // `line-height: normal` in em for a family (config normalLineHeight), 0 when unknown
  let NLH = null;
  const normalLH = (fam) => { const f = String(fam || '').toLowerCase(); for (const [k, v] of Object.entries(NLH || {})) if (k.toLowerCase() === f) return v; return 0; };
  // A screen's HTML: render() or a <template> (SCREENS entry { template: '#id' }), then config transformHtml
  function renderHtml(scr) {
    const C = figmaConfig();
    let html;
    if (typeof scr.render === 'function') html = scr.render();
    else if (scr.template) { const t = document.querySelector(scr.template); if (!t) throw new Error(`Screen ${scr.id}: template ${scr.template} not found`); html = t.innerHTML; }
    else throw new Error(`Screen ${scr.id} has no render() or template`);
    return C.transformHtml ? C.transformHtml(html, scr) : html;
  }
  async function screenNode(scr) {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const C = figmaConfig(); NLH = C.normalLineHeight;
    const host = document.createElement('div');
    host.className = 'fx-export-host';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `position:absolute;left:-30000px;top:0;width:${scr.frameWidth || C.frameWidth}px;pointer-events:none`;
    host.innerHTML = renderHtml(scr);
    document.body.appendChild(host);
    const root = host.firstElementChild;
    const rr = root.getBoundingClientRect();
    const n = node(root, rr, null);
    host.remove();
    n.x = 0; n.y = 0; n.name = scr.figName || `${scr.id} · ${scr.title}`; n.screenTitle = scr.title; // table-row sets: "Table row / <screen title>"
    return n;
  }
  async function payload(screens, sectionName) {
    const out = [];
    for (const s of screens) out.push(await screenNode(s));
    return { format: 'figma-layout/1', exportedAt: new Date().toISOString(), sections: [{ name: sectionName, screens: out }] };
  }
  async function copy(json, label) {
    const text = JSON.stringify(json);
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (e) { copied = false; }
    if (!copied) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = `figma-layout-${label.replace(/[^a-z0-9.]+/gi, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
    }
    return { copied, kb: Math.round(text.length / 1024) };
  }
  /* ---------- SVG (paste straight onto the Figma canvas) ---------- */
  const xml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rgb = (c) => `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
  const idOf = (n) => xml(String(n || 'layer').replace(/\s+/g, ' ').slice(0, 60));
  function roundRect(x, y, w, h, r) {
    const [tl, tr, br, bl] = (r || [0, 0, 0, 0]).map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
    if (tl === tr && tr === br && br === bl) return { tag: 'rect', attrs: `x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"${tl ? ` rx="${r2(tl)}"` : ''}` };
    const d = `M${x + tl},${y}H${x + w - tr}${tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : ''}V${y + h - br}${br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : ''}H${x + bl}${bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : ''}V${y + tl}${tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : ''}Z`;
    return { tag: 'path', attrs: `d="${d}"` };
  }
  function shadowFilter(id, e, defs) {
    const c = e.color;
    defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>${e.spread ? `<feMorphology radius="${Math.abs(e.spread)}" operator="${e.spread > 0 ? 'dilate' : 'erode'}" in="SourceAlpha" result="effect"/>` : ''}<feOffset dx="${e.x}" dy="${e.y}"/><feGaussianBlur stdDeviation="${r2(e.blur / 2)}"/><feColorMatrix type="matrix" values="0 0 0 0 ${r2(c.r)} 0 0 0 0 ${r2(c.g)} 0 0 0 0 ${r2(c.b)} 0 0 0 ${r2(c.a)} 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter>`);
  }
  let uid = 0;
  const parts0name = (n) => (n.text || n.name || 'text').replace(/\s+/g, ' ').slice(0, 40);
  function svgOf(n, ox, oy, defs) {
    const x = ox + n.x, y = oy + n.y;
    const op = n.opacity != null ? ` opacity="${n.opacity}"` : '';
    if (n.type === 'TEXT') {
      const lines = n.lines && n.lines.length ? n.lines : [{ x: 0, top: 0, bottom: n.h, segs: [{ text: n.text, style: n.style }] }];
      const parts = lines.map((l) => {
        const fs = Math.max(...l.segs.map((g) => g.style.size || 14));
        const base = l.bottom - fs * 0.35;
        const tsp = l.segs.map((g) => { const st = g.style; return `<tspan font-family="${xml(st.family)}" font-size="${st.size}" font-weight="${st.weight}"${st.italic ? ' font-style="italic"' : ''} fill="${rgb(st.color)}"${st.color.a < 1 ? ` fill-opacity="${st.color.a}"` : ''}${st.letterSpacing ? ` letter-spacing="${st.letterSpacing}"` : ''}${st.underline ? ' text-decoration="underline"' : st.strike ? ' text-decoration="line-through"' : ''}>${xml(g.text)}</tspan>`; }).join('');
        // Figma's SVG import rounds weights (500→Regular, 600→Bold); keep the real weight in the layer name
        const w = l.segs[0].style.weight;
        const wTag = w !== 400 && w !== 700 ? ` · w${w}` : '';
        return `<text id="${idOf((parts0name(n)) + wTag)}" x="${r2(x + l.x)}" y="${r2(y + base)}" xml:space="preserve">${tsp}</text>`;
      });
      return parts.length > 1 ? `<g id="${idOf(n.name)}"${op}>${parts.join('')}</g>` : (op ? parts[0].replace('<text ', `<text${op} `) : parts[0]);
    }
    if (n.type === 'SVG') {
      const m = /<svg([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(n.svg);
      if (!m) return '';
      const attrs = m[1];
      const vb = (/viewBox="([^"]+)"/.exec(attrs) || [0, `0 0 ${n.w} ${n.h}`])[1].split(/[\s,]+/).map(Number);
      const keep = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].map((k) => { const mm = new RegExp(`\\s${k}="([^"]*)"`).exec(attrs); return mm ? ` ${k}="${mm[1]}"` : ''; }).join('');
      const sx = n.w / (vb[2] || n.w), sy = n.h / (vb[3] || n.h);
      const rot = n.rot ? `rotate(${n.rot} ${r2(x + n.w / 2)} ${r2(y + n.h / 2)}) ` : '';
      return `<g id="${idOf(n.name)}"${op} transform="${rot}translate(${r2(x)} ${r2(y)}) scale(${r2(sx)} ${r2(sy)}) translate(${-vb[0]} ${-vb[1]})"${keep}>${m[2]}</g>`;
    }
    if (n.type === 'IMAGE') return `<image id="${idOf(n.name)}" x="${r2(x)}" y="${r2(y)}" width="${r2(n.w)}" height="${r2(n.h)}" preserveAspectRatio="xMidYMid meet" xlink:href="${n.src}"/>`;
    // FRAME → group with a background shape
    let shape = '';
    if (n.fill || n.border || n.effects) {
      const rr = roundRect(x, y, n.w, n.h, n.radius);
      let filt = '';
      const ds = (n.effects || []).find((e) => e.type === 'DROP_SHADOW');
      if (ds) { const fid = `s${++uid}`; shadowFilter(fid, ds, defs); filt = ` filter="url(#${fid})"`; }
      const fill = n.fill ? ` fill="${rgb(n.fill)}"${n.fill.a < 1 ? ` fill-opacity="${n.fill.a}"` : ''}` : ' fill="none"';
      shape = `<${rr.tag} ${rr.attrs}${fill}${filt}/>`;
      if (n.border) {
        const [t, r, b, l] = n.border.weights;
        const col = rgb(n.border.color), dash = n.border.dashed ? ' stroke-dasharray="4 4"' : '';
        if (t === r && r === b && b === l && t > 0) {
          const inset = roundRect(x + t / 2, y + t / 2, n.w - t, n.h - t, (n.radius || [0, 0, 0, 0]).map((v) => Math.max(0, v - t / 2)));
          shape += `<${inset.tag} ${inset.attrs} fill="none" stroke="${col}" stroke-width="${t}"${dash}/>`;
        } else {
          if (n.border.dashed) {
            const ln = (x1, y1, x2, y2, w) => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${col}" stroke-width="${w}" stroke-dasharray="4 4"/>`;
            if (t) shape += ln(x, y + t / 2, x + n.w, y + t / 2, t);
            if (b) shape += ln(x, y + n.h - b / 2, x + n.w, y + n.h - b / 2, b);
            if (l) shape += ln(x + l / 2, y, x + l / 2, y + n.h, l);
            if (r) shape += ln(x + n.w - r / 2, y, x + n.w - r / 2, y + n.h, r);
          } else {
          if (t) shape += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(n.w)}" height="${t}" fill="${col}"/>`;
          if (b) shape += `<rect x="${r2(x)}" y="${r2(y + n.h - b)}" width="${r2(n.w)}" height="${b}" fill="${col}"/>`;
          if (l) shape += `<rect x="${r2(x)}" y="${r2(y)}" width="${l}" height="${r2(n.h)}" fill="${col}"/>`;
          if (r) shape += `<rect x="${r2(x + n.w - r)}" y="${r2(y)}" width="${r}" height="${r2(n.h)}" fill="${col}"/>`;
          }
        }
      }
    }
    const kids = (n.children || []).map((c) => svgOf(c, x, y, defs)).join('');
    if (!shape && !kids) return '';
    if (!shape && n.children && n.children.length === 1 && !op) return kids;
    return `<g id="${idOf(n.name)}"${op}>${shape}${kids}</g>`;
  }
  function toSvg(screens) {
    const defs = []; uid = 0;
    let x = 0; const gap = 120; let H = 0;
    const body = screens.map((sc) => { const root = { ...sc, x: 0, y: 0, fill: sc.fill || { r: 1, g: 1, b: 1, a: 1 } }; const g = svgOf(root, x, 0, defs); x += sc.w + gap; H = Math.max(H, sc.h); return g; }).join('');
    const W = x - gap;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${r2(W)}" height="${r2(H)}" viewBox="0 0 ${r2(W)} ${r2(H)}" fill="none">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${body}</svg>`;
  }
  async function copyText(text, fname) {
    try { await navigator.clipboard.writeText(text); return { copied: true, kb: Math.round(text.length / 1024) }; } catch (e) { /* fall through */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: fname.endsWith('.svg') ? 'image/svg+xml' : 'application/json' }));
    a.download = fname; document.body.appendChild(a); a.click(); a.remove();
    return { copied: false, kb: Math.round(text.length / 1024) };
  }
  return { payload, copy, screenNode, renderHtml, toSvg, copyText };
})();

