const dec = require('./decode.js');
const f = process.argv[2];
const r = dec(f);
const m = r.msg; const N = m.nodeChanges; const blobs = m.blobs || [];
console.log('prelude', r.prelude, 'ver', r.ver, 'meta', JSON.stringify(r.meta), 'nodes', N.length, 'blobs', blobs.length);
const id = (g) => `${g.sessionID}:${g.localID}`;
const byId = new Map(N.map((n) => [id(n.guid), n]));
const errs = []; const kids = new Map();
for (const n of N) {
  if (n.parentIndex) { const p = id(n.parentIndex.guid); if (!byId.has(p)) errs.push(`orphan ${n.name}`); if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n.parentIndex.position); }
  if (n.size && (!(n.size.x > 0) || !(n.size.y > 0))) errs.push(`bad size ${n.name} ${JSON.stringify(n.size)}`);
  for (const p of [...(n.fillPaints || []), ...(n.strokePaints || [])]) { if (p.color) for (const k of 'rgba') if (!(p.color[k] >= 0 && p.color[k] <= 1)) errs.push(`color ${n.name}`); if (p.image && !(p.image.dataBlob < blobs.length)) errs.push('img blob'); }
  if (n.vectorData && !(n.vectorData.vectorNetworkBlob < blobs.length)) errs.push('vec blob');
  if (n.derivedTextData) for (const g of n.derivedTextData.glyphs || []) if (!(g.commandsBlob < blobs.length)) { errs.push('glyph blob'); break; }
  for (const k of Object.keys(n.transform || {})) if (!Number.isFinite(n.transform[k])) errs.push(`transform ${n.name}`);
}
for (const [p, ks] of kids) { const s = [...ks].sort(); if (new Set(ks).size !== ks.length) errs.push(`dup keys under ${p}`);  }
const types = {}; N.forEach((n) => { types[n.type] = (types[n.type] || 0) + 1; });
console.log('types', JSON.stringify(types));
console.log('errors', errs.length, errs.slice(0, 10));
const al = N.filter((n) => n.stackMode && n.stackMode !== 'NONE');
console.log('AL frames', al.length, 'sample', JSON.stringify(al[2] && { name: al[2].name, stackMode: al[2].stackMode, stackSpacing: al[2].stackSpacing, pad: [al[2].stackVerticalPadding, al[2].stackPaddingRight, al[2].stackPaddingBottom, al[2].stackHorizontalPadding], j: al[2].stackPrimaryAlignItems, a: al[2].stackCounterAlignItems }));
const t = N.find((n) => n.type === 'TEXT' && n.textData.characterStyleIDs);
const t1 = N.find((n) => n.type === 'TEXT');
console.log('text', JSON.stringify({ name: t1.name, chars: t1.textData.characters, font: t1.fontName, fs: t1.fontSize, lh: t1.lineHeight, auto: t1.textAutoResize, glyphs: t1.derivedTextData && t1.derivedTextData.glyphs.length, base: t1.derivedTextData && t1.derivedTextData.baselines }));
if (t) console.log('runs', t.textData.characters.slice(0, 60), JSON.stringify(t.textData.styleOverrideTable));
module.exports = r;
