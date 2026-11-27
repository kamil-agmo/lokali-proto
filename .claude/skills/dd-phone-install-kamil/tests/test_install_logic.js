/* Tests the logic of assets/js/install.js in Node, with a small fake browser (no DOM library needed).
   Run:  node tests/test_install_logic.js
   Covers: which devices are offered the install, who is left alone (desktop, installed, inside a frame), the Android prompt path, the iOS steps sheet,
   "Not now" snoozing, the installed flag, install rows, and the settings. It does not test how the banner looks: check that on a phone-sized browser. */
const fs = require('fs'), path = require('path');
const code = fs.readFileSync(process.env.INSTALL_JS || path.join(__dirname, '..', 'assets', 'js', 'install.js'), 'utf8');   // INSTALL_JS: test another copy (for example a project's js/shared/install.js)

class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.attrs = {}; this.style = {}; this.className = ''; this.id = ''; this._html = ''; this._kids = {}; this.listeners = {}; this.parentNode = null; this.hidden = false; this.textContent = ''; this._cls = new Set(); }
  get classList() { const s = this._cls, self = this; return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c) }; }
  setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k]; } hasAttribute(k) { return k in this.attrs; }
  set innerHTML(v) {
    this._html = v; this._kids = {};
    ['data-no', 'data-go', 'data-close'].forEach((a) => { if (v.includes(a)) { const k = new El('button'); k.attrs[a] = ''; this._kids['[' + a + ']'] = k; } });
  }
  get innerHTML() { return this._html; }
  querySelector(sel) { if (this._kids[sel]) return this._kids[sel]; if (sel === 'img') return this._html.includes('<img') ? new El('img') : null; return null; }
  closest(sel) { const m = sel.match(/^\[(.+)\]$/); return m && m[1] in this.attrs ? this : null; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  click() { (this.listeners.click || []).forEach((f) => f({ target: this })); }
  focus() {}
}

function makeEnv(o = {}) {
  const timers = [], handlers = {}, store = Object.assign({}, o.storage || {}), regs = [];
  const head = new El('head'), body = new El('body');
  if (o.bannerAttr !== false) body.attrs['data-install-banner'] = '';
  const rows = (o.rows || []).map(() => { const r = new El('button'); r.attrs['data-install-row'] = ''; r.hidden = true; return r; });
  const win = { APP_INSTALL: o.config, SHELL: o.shell, addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); } };
  win.parent = o.inFrame ? {} : win;
  const doc = {
    currentScript: { src: 'http://site.test/js/shared/install.js' }, readyState: 'complete', documentElement: { hasAttribute: () => false }, body, head, activeElement: null,
    getElementById: (id) => head.children.find((c) => c.id === id) || null, createElement: (t) => new El(t),
    querySelectorAll: (sel) => (sel === '[data-install-row]' ? rows : []), addEventListener() {}
  };
  const nav = { userAgent: o.ua || '', maxTouchPoints: o.touch || 0, standalone: o.navStandalone,
    serviceWorker: { register: (url, opts) => { regs.push([url, opts && opts.scope]); return Promise.resolve(); } } };
  const loc = { search: o.search || '', origin: 'http://site.test' };
  const ls = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const mm = (q) => ({ matches: !!(o.standalone && /standalone/.test(q)) });
  const flush = () => { while (timers.length) timers.shift().f(); };
  new Function('window', 'document', 'navigator', 'location', 'localStorage', 'matchMedia', 'requestAnimationFrame', 'setTimeout', 'Date', code)(
    win, doc, nav, loc, ls, mm, (f) => f(), (f, ms) => timers.push({ f, ms }), Date);
  const fire = (t, e) => (handlers[t] || []).forEach((f) => f(e));
  return { win, doc, body, head, rows, regs, store, flush, fire, A: win.AppInstall };
}

const UA = {
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  fbios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]'
};

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + e.message); } }
function eq(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || 'values differ') + ': got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); }
const bannerOf = (e) => e.body.children.find((c) => c.className === 'ai-banner');
const sheetOf = (e) => e.body.children.find((c) => c.className === 'ai-sheet');

t('desktop browser is left alone: not eligible, no service worker, no banner', () => {
  const e = makeEnv({ ua: UA.mac }); e.flush();
  eq(e.A.eligible(), false); eq(e.A.platform(), 'desktop'); eq(e.regs.length, 0); eq(!!bannerOf(e), false);
});
t('Android phone: eligible, service worker registered at the site root, banner after the delay', () => {
  const e = makeEnv({ ua: UA.android }); eq(!!bannerOf(e), false, 'banner must wait for the delay'); e.flush();
  eq(e.A.eligible(), true); eq(e.A.platform(), 'android'); eq(e.regs, [['http://site.test/sw.js', 'http://site.test/']]); eq(!!bannerOf(e), true);
  eq(bannerOf(e).hasAttribute('role'), true);
});
t('Android: button says "How to install" until the browser offers the prompt, then "Install"', () => {
  const e = makeEnv({ ua: UA.android }); e.flush();
  const go = () => bannerOf(e).querySelector('[data-go]');
  eq(/How to install/.test(bannerOf(e).innerHTML), true);
  let prompted = 0; const ev = { preventDefault() {}, prompt() { prompted++; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  e.fire('beforeinstallprompt', ev);
  eq(e.A.canPrompt(), true);
  go().click(); eq(prompted, 1, 'the native prompt is shown once');
  eq(e.A.canPrompt(), false, 'a used prompt must not be reused');
  e.A.open(); eq(prompted, 1); eq(!!sheetOf(e), true, 'with no prompt left it falls back to the steps sheet');
});
t('iPhone: steps sheet mentions Share and Add to Home Screen', () => {
  const e = makeEnv({ ua: UA.iphone, bannerAttr: false }); e.A.open();
  const s = sheetOf(e); eq(!!s, true); eq(/Share/.test(s.innerHTML), true); eq(/Add to Home Screen/.test(s.innerHTML), true); eq(e.A.platform(), 'ios');
});
t('iPhone inside another app (Facebook): tells the visitor to open Safari first', () => {
  const e = makeEnv({ ua: UA.fbios, bannerAttr: false }); e.A.open();
  eq(/Open in Safari/.test(sheetOf(e).innerHTML), true);
});
t('iPadOS (reports itself as a Mac but has touch) counts as a tablet', () => {
  const e = makeEnv({ ua: UA.mac, touch: 5 }); eq(e.A.eligible(), true); eq(e.A.platform(), 'ios');
});
t('already installed (display-mode standalone) is left alone', () => {
  const e = makeEnv({ ua: UA.android, standalone: true }); e.flush(); eq(e.A.eligible(), false); eq(!!bannerOf(e), false);
});
t('already installed on iOS (navigator.standalone) is left alone', () => {
  const e = makeEnv({ ua: UA.iphone, navStandalone: true }); e.flush(); eq(e.A.eligible(), false); eq(!!bannerOf(e), false);
});
t('inside a frame (presenter shell) is left alone', () => {
  const e = makeEnv({ ua: UA.android, inFrame: true }); e.flush(); eq(e.A.eligible(), false); eq(!!bannerOf(e), false); eq(e.regs.length, 0);
});
t('?install forces it on a desktop browser (testing aid)', () => {
  const e = makeEnv({ ua: UA.mac, search: '?x=1&install' }); e.flush(); eq(e.A.eligible(), true); eq(!!bannerOf(e), true); eq(e.regs.length, 1);
});
t('"Not now" hides the banner and snoozes it for a week', () => {
  const e = makeEnv({ ua: UA.android, shell: { prefix: 'acme' } }); e.flush();
  bannerOf(e).querySelector('[data-no]').click();
  eq(Object.keys(e.store), ['acme-install-dismissed'], 'key uses the shell prefix');
  const again = makeEnv({ ua: UA.android, shell: { prefix: 'acme' }, storage: e.store }); again.flush(); eq(!!bannerOf(again), false, 'still snoozed');
  const old = makeEnv({ ua: UA.android, shell: { prefix: 'acme' }, storage: { 'acme-install-dismissed': String(Date.now() - 8 * 24 * 3600 * 1000) } }); old.flush(); eq(!!bannerOf(old), true, 'a week later it returns');
});
t('after the app is installed the banner never returns', () => {
  const e = makeEnv({ ua: UA.android }); e.flush(); e.fire('appinstalled', {});
  eq(Object.values(e.store), ['installed']);
  const later = makeEnv({ ua: UA.android, storage: e.store }); later.flush(); eq(!!bannerOf(later), false);
});
t('no data-install-banner means no banner, but the API still works', () => {
  const e = makeEnv({ ua: UA.android, bannerAttr: false }); e.flush(); eq(!!bannerOf(e), false); eq(e.A.eligible(), true);
});
t('[data-install-row] is shown only when installing is possible, and opens the flow', () => {
  const yes = makeEnv({ ua: UA.iphone, rows: [1], bannerAttr: false }); eq(yes.rows[0].hidden, false); yes.rows[0].click(); eq(!!sheetOf(yes), true);
  const no = makeEnv({ ua: UA.mac, rows: [1], bannerAttr: false }); eq(no.rows[0].hidden, true);
});
t('settings: custom text, name and delay are used', () => {
  const e = makeEnv({ ua: UA.android, config: { name: 'Acme', bannerDelayMs: 50, text: { title: 'Get Acme' } } });
  eq(e.flush === undefined, false); e.flush(); eq(/Get Acme/.test(bannerOf(e).innerHTML), true);
  e.A.open(); eq(/Acme appears on your home screen/.test(sheetOf(e).innerHTML), true);
});
t('custom steps (another language, new OS wording) replace the built-in ones; {share}, {menu} and {name} are filled in', () => {
  const cfg = { name: 'Acme', text: { stepsIos: ['Ketik {share} dahulu.', 'Pilih <b>Tambah ke Skrin Utama</b> untuk {name}.'], stepsAndroid: ['Buka menu {menu}.'] } };
  const ios = makeEnv({ ua: UA.iphone, bannerAttr: false, config: cfg }); ios.A.open();
  const h = sheetOf(ios).innerHTML;
  eq(/Ketik <svg/.test(h), true, '{share} becomes the icon'); eq(/untuk Acme\./.test(h), true, '{name} becomes the app name'); eq(/Add to Home Screen/.test(h), false, 'the built-in steps are gone');
  const droid = makeEnv({ ua: UA.android, bannerAttr: false, config: cfg }); droid.A.open();
  eq(/Buka menu <svg/.test(sheetOf(droid).innerHTML), true, '{menu} becomes the dots icon');
  const fb = makeEnv({ ua: UA.fbios, bannerAttr: false, config: { text: { openInSafari: 'Buka dalam Safari dahulu.', stepsIos: ['x'] } } }); fb.A.open();
  eq(/Buka dalam Safari dahulu\./.test(sheetOf(fb).innerHTML), true); eq(/inside another app/.test(sheetOf(fb).innerHTML), false);
});
t('names with HTML characters are escaped', () => {
  const e = makeEnv({ ua: UA.android, config: { name: '<b>x</b> & "y"' } }); e.flush();
  eq(/<b>x<\/b>/.test(bannerOf(e).innerHTML), false, 'raw tag must not appear'); eq(/&lt;b&gt;x&lt;\/b&gt;/.test(bannerOf(e).innerHTML), true);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
