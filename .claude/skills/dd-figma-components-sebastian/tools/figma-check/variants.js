// Variant-tree check (department rule R2/R3): inside every variant set, all variants should share one layer tree
// (same names, same order, same hierarchy), so Figma can keep instance overrides when a designer swaps variants.
// Usage: node variants.js payload.html [setNameFilter]
const dec = require('./decode.js');
const r = dec(process.argv[2]); const filter = process.argv[3] || '';
const N = r.msg.nodeChanges;
const id = (g) => `${g.sessionID}:${g.localID}`;
const kids = new Map(); const byId = new Map();
N.forEach((n) => { byId.set(id(n.guid), n); if (n.parentIndex) { const p = id(n.parentIndex.guid); if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); } });
kids.forEach((a) => a.sort((x, y) => (x.parentIndex.position < y.parentIndex.position ? -1 : 1)));
// Layer tree as a string: name + type per node; instances stop (their layers live in their own main)
const tree = (n) => { const ch = n.type === 'INSTANCE' ? [] : kids.get(id(n.guid)) || []; return ch.map((c) => `${c.name}${ch.length && c.type !== 'INSTANCE' && (kids.get(id(c.guid)) || []).length ? `{${tree(c)}}` : ''}`).join(', '); };
let sets = 0, same = 0; const bad = [];
for (const s of N.filter((n) => n.isStateGroup)) {
  if (filter && !s.name.includes(filter)) continue;
  sets++;
  const vars = (kids.get(id(s.guid)) || []).filter((c) => c.type === 'SYMBOL');
  const trees = new Map(); vars.forEach((v) => { const t = tree(v); if (!trees.has(t)) trees.set(t, []); trees.get(t).push(v.name); });
  if (trees.size === 1) same++; else bad.push({ set: s.name, shapes: trees.size, trees: [...trees.entries()] });
}
console.log(`variant sets ${sets} | one shared layer tree ${same} | differing ${bad.length}`);
const verbose = process.argv.includes('-v');
for (const b of bad) {
  console.log(`  ${b.set}: ${b.shapes} layer trees`);
  if (verbose) b.trees.forEach(([t, names]) => console.log(`     [${names.slice(0, 3).join(' | ')}${names.length > 3 ? ` +${names.length - 3}` : ''}] ${t.slice(0, 220)}`));
}
const named = N.filter((n) => n.type !== 'SYMBOL' && n.type !== 'VECTOR' && n.parentIndex && (() => { let p = byId.get(id(n.parentIndex.guid)); while (p) { if (p.type === 'SYMBOL') return true; if (p.type === 'SECTION' || p.type === 'CANVAS') return false; p = p.parentIndex && byId.get(id(p.parentIndex.guid)); } return false; })());
const iconNamed = named.filter((n) => /^icon \//.test(n.name)).length;
console.log(`layers inside mains ${named.length} | still named "icon / …" ${iconNamed}`);
