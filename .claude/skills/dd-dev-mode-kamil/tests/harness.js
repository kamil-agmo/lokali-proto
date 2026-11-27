/* Loads the animation exporters in Node (with a stubbed page) so the generators can be tested without a browser.
   Usage: node harness.js <out-dir> [spec.json]   - writes one file per format for the spec. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'assets', 'devmode', 'js') + path.sep;
const listeners = {};
global.window = { addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); }, dispatchEvent: (e) => { (listeners[e.type] || []).forEach((f) => f(e)); }, DevMode: null };
global.Event = class { constructor(t) { this.type = t; } };
global.document = { addEventListener() {}, getElementById: () => ({ addEventListener() {}, querySelector() { return {}; } }), createElement: () => ({}) };
window.DevMode = { parts: [], on() {}, esc: String, r1: (n) => Math.round(n * 10) / 10, doc: () => null, win: () => null, pinned: () => null, renderTop() {}, sectionTarget: () => null, tokName: () => '' };
for (const f of ['devanim.js', 'devanim2.js']) new Function('window', 'document', 'navigator', fs.readFileSync(root + f, 'utf8'))(window, document, {});
const A = window.DevMode.anim;
if (require.main === module) {
  const out = process.argv[2] || '.', spec = JSON.parse(fs.readFileSync(process.argv[3] || path.join(__dirname, 'spec.json'), 'utf8'));
  fs.mkdirSync(out, { recursive: true });
  const name = spec.name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
  fs.writeFileSync(path.join(out, name + 'Animations.swift'), A.gen.swift(spec));
  fs.writeFileSync(path.join(out, name + 'Animations.kt'), A.gen.kotlin(spec));
  fs.writeFileSync(path.join(out, spec.name + '-animations.mjs'), A.gen.rn(spec));
  fs.writeFileSync(path.join(out, spec.name.replace(/-/g, '_') + '_animations.dart'), A.gen.flutter(spec));
  fs.writeFileSync(path.join(out, spec.name + '.lottie.json'), A.gen.lottie(spec));
  const W = 40, H = 30, frames = [];
  for (let f = 0; f < 3; f++) { const px = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4, b = x >= f * 10 && x < f * 10 + 10 && y >= 8 && y < 20; px[o] = b ? 255 : x * 6; px[o + 1] = b ? 80 : y * 8; px[o + 2] = b ? 40 : 128; px[o + 3] = 255; } frames.push(px); }
  fs.writeFileSync(path.join(out, 'test.gif'), Buffer.from(A.gen.gif(frames, W, H, 10)));
  console.log('wrote 6 files to ' + out);
}
module.exports = A;
