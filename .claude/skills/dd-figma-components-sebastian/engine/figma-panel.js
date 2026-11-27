/* =========================================================
   Copy to Figma — engine part 3 of 3: the side panel.
   A screen index (Module → Function → Screen, or Flow → Screen)
   beside the prototype, with Copy-to-Figma buttons per page,
   group and screen (config `copy`). Reads the project registry:

     MODULES = [{ key, name, note? }]                 navbar order (organise 'module'; optional headings for 'flow')
     FLOWS   = { key: { name, module?, note? } }      organise 'flow'
     SCREENS = [{ id, title? | screen + state?, module?, fn?, flow?, case?: 'positive'|'negative',
                  render() | template: '#id' }]

   Set FIGMA_CONFIG.panel = false to keep your own viewer and call
   FigmaPanel.copyPage(btn) / copyGroup(key, btn) / copyScreen(id, btn).
   ========================================================= */
'use strict';

const FigmaPanel = (() => {
  const C = () => figmaConfig();
  // The registry may be `const` (global lexical, not on window) or a window property.
  const G = { SCREENS: () => (typeof SCREENS !== 'undefined' ? SCREENS : window.SCREENS), MODULES: () => (typeof MODULES !== 'undefined' ? MODULES : window.MODULES), FLOWS: () => (typeof FLOWS !== 'undefined' ? FLOWS : window.FLOWS) };
  const g = (name) => G[name]();
  const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = { get(k) { try { return localStorage.getItem(`${C().storageKey}-${k}`); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(`${C().storageKey}-${k}`, v); } catch (e) { /* private mode */ } } };

  /* ---------- registry ---------- */
  function registry() {
    const SC = g('SCREENS');
    if (!Array.isArray(SC) || !SC.length) throw new Error('No SCREENS registry found. Define const SCREENS = [{ id, title, render }] before the engine.');
    const mods = (g('MODULES') || []).map((m) => ({ key: String(m.key != null ? m.key : m.n), name: m.name, note: m.note || m.srs || '' }));
    const flows = g('FLOWS') || {};
    const organise = C().organise === 'module' ? 'module' : 'flow';
    const screens = SC.map((s) => ({ ...s, title: s.title || [s.screen, s.state].filter(Boolean).join(' — ') || s.id, case: s.case || null }));
    const keyOf = (s) => String((organise === 'module' ? s.module : s.flow) != null ? (organise === 'module' ? s.module : s.flow) : 'Screens');
    const order = [...new Set(screens.map(keyOf))];
    if (organise === 'module' && mods.length) order.sort((a, b) => idx(mods, a) - idx(mods, b));
    const groups = order.map((key) => {
      const info = organise === 'module' ? mods.find((m) => m.key === key) || {} : flows[key] || {};
      const grp = { key, kind: organise, name: info.name || key, note: info.note || info.srs || '', module: organise === 'flow' ? String(info.module != null ? info.module : '') : '' };
      grp.screens = screens.filter((s) => keyOf(s) === key);
      if (grp.kind === 'flow' && !grp.module) { const m = grp.screens.find((s) => s.module != null); if (m) grp.module = String(m.module); }
      grp.section = C().sectionName ? C().sectionName(grp) : grp.name;
      return grp;
    });
    for (const grp of groups) for (const s of grp.screens) s.figName = C().screenName ? C().screenName(s, grp) : defaultName(s, grp);
    const flat = groups.flatMap((x) => x.screens);
    return { groups, screens: flat, mods };
  }
  const idx = (mods, k) => { const i = mods.findIndex((m) => m.key === k); return i < 0 ? 1e9 : i; };
  // "<Module or Flow> / <Function> / <Screen — State> · Positive|Negative" (skill §1)
  const defaultName = (s, grp) => `${[grp.name, s.fn, s.title].filter(Boolean).join(' / ')}${s.case ? ` · ${s.case === 'negative' ? 'Negative' : 'Positive'}` : ''}`;

  /* ---------- copy ---------- */
  function opts() {
    const on = (k) => store.get(`fig-${k}`) !== '0';
    return { derived: on('derived'), derivedSym: on('dsd'), hug: on('hug'), merge: on('merge'), names: on('names'), unify: on('unify'), containers: on('containers'), identity: on('identity'), states: on('states'), props: on('props'), propsOnly: store.get('fig-props-only') === '1', sidebarFrame: store.get('fig-sidebar-frame') === '1' };
  }
  async function trees(list, onProgress) { const out = []; for (const s of list) { out.push(await FX.screenNode(s)); if (onProgress) onProgress(out.length); } return out; }
  async function pageHtml(onProgress) {
    const R = registry(); let done = 0; const step = () => onProgress && onProgress(++done, R.screens.length);
    if (C().output === 'plain') return FN.toHtml(await trees(R.screens, step), opts());
    const sections = [];
    for (const grp of R.groups) sections.push({ key: grp.key, name: grp.section, screens: await trees(grp.screens, step) });
    return FN.toHtml(sections, { ...opts(), page: true });
  }
  async function listHtml(grp, list) {
    const t = await trees(list);
    return C().groupCopy === 'design' ? FN.toHtml([{ key: grp.key, name: grp.section, screens: t }], { ...opts(), page: true }) : FN.toHtml(t, opts());
  }
  async function run(btn, busyText, job, okText) {
    if (btn && btn.classList.contains('is-busy')) return;
    const label = btn && btn.querySelector('.fxp-label'); const old = label ? label.textContent : '';
    if (btn) btn.classList.add('is-busy'); if (label && busyText) label.textContent = busyText;
    try {
      const r = await job((t) => { if (label) label.textContent = t; });
      const sum = okText(r);
      if (FN.copyEvent(r.html)) notice(`${sum} Click the Figma canvas and press ⌘V.`, 12000);
      else noticeAction(`${sum} The browser needs one more click.`, 'Copy now', () => (FN.copyEvent(r.html) ? 'Copied. Click the Figma canvas and press ⌘V.' : 'Still blocked: click Copy now again.'));
      if (btn) { btn.classList.add('is-done'); setTimeout(() => btn.classList.remove('is-done'), 2200); }
      return r;
    } catch (e) { console.error(e); notice(`Copy failed: ${e.message}`, 12000); return null; } finally { if (btn) btn.classList.remove('is-busy'); if (label) label.textContent = old; }
  }
  const mb = (r) => `${(r.kb / 1024).toFixed(1)} MB`;
  function copyPage(btn) {
    return run(btn, 'Reading screens…', (set) => pageHtml((d, n) => set(d < n ? `Reading screens ${d}/${n}…` : 'Building components…')),
      (r) => (C().output === 'plain' ? `Copied ${registry().screens.length} screens as frames (${mb(r)}).` : `Design page copied: ${registry().screens.length} screens, ${r.stats.components} components in ${r.stats.sets} sets, ${r.stats.instances} instances (${mb(r)}). Open an empty Figma page,`));
  }
  function copyGroup(key, btn) {
    const grp = registry().groups.find((x) => x.key === String(key)); if (!grp) return notice(`No group ${key}`);
    return run(btn, 'Copying…', () => listHtml(grp, grp.screens), (r) => `Copied ${grp.screens.length} screens of ${grp.name} (${r.kb} KB).`);
  }
  function copyScreen(id, btn) {
    const R = registry(); const grp = R.groups.find((x) => x.screens.some((s) => s.id === id)); const s = grp && grp.screens.find((x) => x.id === id);
    if (!s) return notice(`No screen ${id}`);
    return run(btn, 'Copying…', () => listHtml(grp, [s]), (r) => `Copied ${s.id} ${s.title} (${r.kb} KB).`);
  }

  /* ---------- paste test ladder (console: figmaTest('0'…'E'), figmaTest('0c'|'0s')) ---------- */
  const STAGES = { A: { text: false, vectors: false, images: false }, B: { text: true, derived: false, vectors: false, images: false }, C: { text: true, derived: true, vectors: false, images: false }, D: { text: true, derived: true, vectors: true, images: false }, E: {} };
  async function figmaTest(stage) {
    let job;
    if (stage === '0') job = FN.controlHtml();
    else if (stage === '0c' || stage === '0s') job = Promise.resolve(FN.sampleHtml(stage === '0c' ? 'Instance' : 'Set'));
    else if (STAGES[stage]) {
      const dot = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="8" fill="#0D99FF"/></svg>');
      job = FX.screenNode({ id: `Test ${stage}`, title: 'Paste test', render: () => `<div style="display:inline-flex;flex-direction:column;gap:16px;padding:24px;background:#fff;border:1px solid #E6E6EA;border-radius:16px;font-family:inherit"><div style="display:flex;gap:12px"><div style="width:48px;height:48px;border-radius:12px;background:#0D99FF"></div><div style="width:48px;height:48px;border-radius:12px;background:#14AE5C"></div></div><div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:20px;line-height:28px;font-weight:600">${esc(C().name)}</span><span style="font-size:14px;line-height:20px">Auto layout test with a <b style="font-weight:700">bold run</b></span></div><div style="display:flex;align-items:center;gap:8px"><svg data-icon="check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span style="font-size:14px;line-height:20px">Icon</span></div><img src="${dot}" width="40" height="40" style="display:block"></div>` }).then((n) => FN.toHtml([n], STAGES[stage]));
    } else throw new Error('Stages: 0 A B C D E 0c 0s');
    const r = await job; const ok = FN.copyEvent(r.html);
    console.log(ok ? `Paste test ${stage} copied (${r.kb} KB): press ⌘V on the Figma canvas.` : 'Clipboard blocked: run it from a click, or use FigmaPanel.lastTest');
    FigmaPanel.lastTest = r.html; return ok;
  }

  /* ---------- preflight: what will paste badly (fonts, inputs) ---------- */
  function preflight(root) {
    const warn = []; const fams = new Map();
    const faces = new Set();
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { warn.push(`A stylesheet from ${sh.href} can't be read (cross-origin). Fonts in it are not inlined.`); continue; } for (const r of rules) if (r.type === 5 && /url\(\s*["']?data:/.test(r.style.getPropertyValue('src'))) faces.add(r.style.getPropertyValue('font-family').replace(/["']/g, '').trim().toLowerCase()); }
    root.querySelectorAll('*').forEach((el) => {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim())) return;
      const f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim(); fams.set(f, (fams.get(f) || 0) + 1);
    });
    for (const [f] of fams) if (!faces.has(f.toLowerCase()) && !C().glyphFallback) warn.push(`Font “${f}” is not inlined as a base64 TTF @font-face. Text still pastes, but Figma lays it out itself and needs “${C().fontFamily(f)}” installed. Fix: tools/inline-fonts.py.`);
    root.querySelectorAll('button, input, textarea, select').forEach((el) => { const p = el.parentElement; if (p && getComputedStyle(el).fontFamily !== getComputedStyle(p).fontFamily && !warn.some((w) => w.startsWith('Buttons'))) warn.push('Buttons/inputs don\'t inherit the font (Chrome default is Arial). Add: button, input, textarea, select { font-family: inherit; }'); });
    return warn;
  }

  /* ---------- UI ---------- */
  const FIG = '<svg class="fxp-fig" width="11" height="16" viewBox="0 0 38 57" aria-hidden="true"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83"/><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/></svg>';
  const CHEV = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const CSS = `
.fxp{--fxp-bg:#fff;--fxp-line:#E6E6EA;--fxp-ink:#1D1D22;--fxp-ink2:#5B5B66;--fxp-ink3:#8A8A96;--fxp-hover:#F4F4F6;--fxp-on:#EAF4FF;--fxp-accent:#0D7CE6;--fxp-neg:#C4232B;--fxp-negbg:#FDECEC;--fxp-stage:#EEEEF1}
.fxp [hidden]{display:none!important}
.fxp-stage{min-height:100vh;box-sizing:border-box;padding:32px 24px 32px 56px;background:var(--fxp-stage);overflow:auto}
.fxp-stage>*{margin-left:auto;margin-right:auto}
.fxp-drawer,.fxp-drawer *,.fxp-handle,.fxp-notice{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:0}
.fxp-drawer{position:fixed;inset:0 auto 0 0;width:340px;max-width:calc(100vw - 32px);background:var(--fxp-bg);border-right:1px solid var(--fxp-line);box-shadow:0 8px 32px rgba(20,20,30,.12);display:flex;flex-direction:column;z-index:2147483000;transform:translateX(-100%);transition:transform .2s ease;color:var(--fxp-ink);font-size:13px;line-height:18px}
.fxp.is-open .fxp-drawer{transform:none}
.fxp-handle{position:fixed;left:0;top:16px;z-index:2147482999;display:flex;align-items:center;gap:6px;padding:8px 10px 8px 8px;border:1px solid var(--fxp-line);border-left:0;border-radius:0 8px 8px 0;background:var(--fxp-bg);color:var(--fxp-ink);font-size:11px;font-weight:600;line-height:14px;cursor:pointer;box-shadow:0 2px 8px rgba(20,20,30,.08)}
.fxp-handle svg{transform:rotate(-90deg)}
.fxp-handle__id{color:var(--fxp-ink3);font-weight:500}
.fxp-head{padding:16px;border-bottom:1px solid var(--fxp-line);display:flex;flex-direction:column;gap:10px}
.fxp-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px}
.fxp-tag{font-size:11px;font-weight:500;color:var(--fxp-ink2);background:var(--fxp-hover);border-radius:4px;padding:1px 6px}
.fxp-x{margin-left:auto;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--fxp-ink2);font-size:18px;cursor:pointer}
.fxp-now{font-size:12px;color:var(--fxp-ink2);display:flex;gap:6px;min-width:0}.fxp-now b{color:var(--fxp-ink);font-weight:600;flex:none}.fxp-now span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fxp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:32px;padding:6px 12px;border:1px solid var(--fxp-line);border-radius:8px;background:var(--fxp-bg);color:var(--fxp-ink);font-size:12px;font-weight:500;line-height:16px;cursor:pointer;text-align:center}
.fxp-btn:hover{background:var(--fxp-hover)}
.fxp-btn--primary{background:var(--fxp-ink);border-color:var(--fxp-ink);color:#fff}.fxp-btn--primary:hover{background:#33333B}
.fxp-btn.is-busy{opacity:.7;cursor:progress}.fxp-btn.is-done .fxp-label::after{content:" ✓"}
.fxp-row{display:flex;gap:8px}.fxp-row>.fxp-btn{flex:1}
.fxp-filter{width:100%;height:32px;padding:0 10px;border:1px solid var(--fxp-line);border-radius:8px;font-size:12px;color:var(--fxp-ink);background:var(--fxp-bg)}
.fxp-list{flex:1;overflow:auto;padding:8px 8px 16px}
.fxp-mod{padding:14px 8px 4px;font-size:11px;font-weight:600;color:var(--fxp-ink3);text-transform:uppercase;letter-spacing:.04em}
.fxp-group{border-radius:8px}.fxp-group+.fxp-group{margin-top:2px}
.fxp-ghead{display:flex;align-items:center;gap:4px}
.fxp-gtoggle{flex:1;min-width:0;display:flex;align-items:flex-start;gap:6px;padding:8px;border:0;border-radius:6px;background:transparent;color:var(--fxp-ink);text-align:left;cursor:pointer}
.fxp-gtoggle:hover{background:var(--fxp-hover)}
.fxp-gtoggle svg{flex:none;margin-top:3px;transition:transform .15s}.fxp-group.is-closed .fxp-gtoggle svg{transform:rotate(-90deg)}
.fxp-gname{display:flex;flex-direction:column;min-width:0}.fxp-gname b{font-weight:600}.fxp-gname span{font-size:11px;color:var(--fxp-ink3)}
.fxp-group.is-closed .fxp-gbody{display:none}
.fxp-fn{padding:8px 8px 2px 26px;font-size:11px;font-weight:600;color:var(--fxp-ink2)}
.fxp-srow{display:flex;align-items:center;border-radius:6px}.fxp-srow:hover,.fxp-srow:focus-within{background:var(--fxp-hover)}
.fxp-scr{flex:1;min-width:0;display:flex;align-items:baseline;gap:8px;padding:6px 8px 6px 26px;color:var(--fxp-ink);text-decoration:none;border-radius:6px}
.fxp-scr.is-on{background:var(--fxp-on);color:var(--fxp-accent);font-weight:600}
.fxp-scr__id{flex:none;font-size:11px;color:var(--fxp-ink3);font-variant-numeric:tabular-nums}
.fxp-scr__t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fxp-neg{flex:none;font-size:10px;font-weight:600;color:var(--fxp-neg);background:var(--fxp-negbg);border-radius:4px;padding:0 5px}
.fxp-icbtn{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:6px;background:transparent;cursor:pointer;opacity:.0}
.fxp-srow:hover .fxp-icbtn,.fxp-ghead:hover .fxp-icbtn,.fxp-icbtn:focus-visible,.fxp-icbtn.is-busy,.fxp-icbtn.is-done{opacity:1}.fxp-icbtn:hover{background:#E6E6EA}
@media (hover:none){.fxp-icbtn{opacity:1}}
.fxp-foot{border-top:1px solid var(--fxp-line);padding:12px 16px;display:flex;flex-direction:column;gap:8px;font-size:11px;color:var(--fxp-ink3)}
.fxp-warn{margin:0;padding:8px 10px;border-radius:8px;background:#FFF6E0;color:#6B4E00;font-size:11px;line-height:16px;list-style:none;display:flex;flex-direction:column;gap:4px}
.fxp-adv summary{cursor:pointer}.fxp-adv label{display:inline-flex;align-items:center;gap:4px;margin:6px 10px 0 0;color:var(--fxp-ink2)}
.fxp-drawer :focus-visible,.fxp-handle:focus-visible{outline:2px solid var(--fxp-accent);outline-offset:1px}
.fxp-notice{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);max-width:min(560px,calc(100vw - 32px));padding:12px 16px;border-radius:10px;background:#1D1D22;color:#fff;font-size:13px;line-height:18px;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:2147483001;display:flex;gap:12px;align-items:center}
.fxp-notice.is-on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.fxp-notice button{flex:none;border:0;border-radius:6px;padding:6px 10px;background:#fff;color:#1D1D22;font-weight:600;cursor:pointer}
@media (prefers-reduced-motion:reduce){.fxp-drawer,.fxp-notice{transition:none}}`;

  let R = null; let root = null; const $ = (s) => root.querySelector(s);
  function notice(msg, ms = 6000) {
    let n = document.getElementById('fxp-notice');
    if (!n) { n = document.createElement('div'); n.id = 'fxp-notice'; n.className = 'fxp-notice'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
    n.textContent = msg; n.classList.add('is-on'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('is-on'), ms);
  }
  function noticeAction(msg, label, fn) {
    notice(msg, 20000); const n = document.getElementById('fxp-notice');
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => notice(fn())); n.appendChild(b);
  }
  const has = (k) => C().copy.includes(k);
  const closed = () => new Set(JSON.parse(store.get('closed-groups') || '[]'));
  function listHtml2() {
    const shut = closed(); const out = []; let lastMod = null;
    for (const grp of R.groups) {
      if (grp.kind === 'flow' && grp.module && grp.module !== lastMod) { const m = R.mods.find((x) => x.key === grp.module); out.push(`<div class="fxp-mod">${esc(m ? m.name : grp.module)}</div>`); lastMod = grp.module; }
      const neg = grp.screens.filter((s) => s.case === 'negative').length;
      const meta = [grp.note, `${grp.screens.length} screen${grp.screens.length > 1 ? 's' : ''}`, neg ? `${neg} negative` : ''].filter(Boolean).join(' · ');
      let body = ''; let lastFn = null;
      for (const s of grp.screens) {
        if (s.fn && s.fn !== lastFn) { body += `<div class="fxp-fn">${esc(s.fn)}</div>`; lastFn = s.fn; }
        body += `<div class="fxp-srow" data-search="${esc(`${s.id} ${s.title} ${s.fn || ''} ${grp.name}`.toLowerCase())}"><a class="fxp-scr" href="#${encodeURIComponent(s.id)}" data-id="${esc(s.id)}"><span class="fxp-scr__id">${esc(s.id)}</span><span class="fxp-scr__t">${esc(s.title)}</span>${s.case === 'negative' ? '<span class="fxp-neg">Negative</span>' : ''}</a>${has('screen') ? `<button class="fxp-icbtn" type="button" data-copy-screen="${esc(s.id)}" aria-label="Copy ${esc(s.id)} to Figma" title="Copy this screen to Figma">${FIG}</button>` : ''}</div>`;
      }
      out.push(`<div class="fxp-group${shut.has(grp.key) ? ' is-closed' : ''}" data-group="${esc(grp.key)}"><div class="fxp-ghead"><button class="fxp-gtoggle" type="button" data-toggle-group="${esc(grp.key)}" aria-expanded="${!shut.has(grp.key)}">${CHEV}<span class="fxp-gname"><b>${esc(grp.name)}</b><span>${esc(meta)}</span></span></button>${has('group') ? `<button class="fxp-icbtn" type="button" data-copy-group="${esc(grp.key)}" aria-label="Copy ${esc(grp.name)} to Figma" title="Copy this ${grp.kind} to Figma">${FIG}</button>` : ''}</div><div class="fxp-gbody">${body}</div></div>`);
    }
    return out.join('');
  }
  const SWITCHES = [['hug', 'Hug sizing'], ['merge', 'Merge optional slots'], ['names', 'Role layer names'], ['unify', 'One tree per set'], ['containers', 'Container mains'], ['identity', 'Item sets'], ['states', 'Generate states'], ['props', 'Component properties'], ['derived', 'Glyph cache'], ['dsd', 'Instance layout cache']];
  function mount() {
    const style = document.createElement('style'); style.id = 'fxp-css'; style.textContent = CSS; document.head.appendChild(style);
    root = document.createElement('div'); root.className = 'fxp'; root.id = 'fxp';
    const pageLabel = C().output === 'plain' ? 'Copy all screens to Figma' : 'Copy design page to Figma';
    root.innerHTML = `<div class="fxp-stage" id="fxp-stage" role="region" aria-label="Screen preview"></div>
<button class="fxp-handle" type="button" data-toggle aria-controls="fxp-drawer" aria-expanded="false" title="Screens ( \\ )">${CHEV}<span>SCREENS</span><span class="fxp-handle__id" id="fxp-handle-id"></span></button>
<aside class="fxp-drawer" id="fxp-drawer" aria-label="Screen index (prototype only)">
  <div class="fxp-head"><div class="fxp-title">${esc(C().name)} <span class="fxp-tag">Prototype</span><button class="fxp-x" type="button" data-toggle aria-label="Close screen index">×</button></div>
    <div class="fxp-now"><b id="fxp-now-id"></b><span id="fxp-now-title"></span></div>
    ${has('page') ? `<button class="fxp-btn fxp-btn--primary" type="button" data-copy-page title="${C().output === 'plain' ? 'Every screen as plain frames' : `${esc(C().universalSection)} + one section per ${C().organise}, with linked instances`}">${FIG}<span class="fxp-label">${pageLabel}</span></button>` : ''}
    ${has('screen') ? '<button class="fxp-btn" type="button" data-copy-current><span class="fxp-label">Copy this screen</span></button>' : ''}
    <input class="fxp-filter" type="search" placeholder="Filter screens" aria-label="Filter screens" id="fxp-filter"></div>
  <nav class="fxp-list" id="fxp-list"></nav>
  <div class="fxp-foot"><ul class="fxp-warn" id="fxp-warn" hidden></ul>
    <div class="fxp-row"><button class="fxp-btn" type="button" data-step="-1">← Prev</button><button class="fxp-btn" type="button" data-step="1">Next →</button></div>
    <span>← → step through screens · \\ open/close · Esc close</span>
    <details class="fxp-adv"><summary>Figma switches</summary>${SWITCHES.map(([k, l]) => `<label><input type="checkbox" data-switch="${k}"${store.get(`fig-${k}`) !== '0' ? ' checked' : ''}> ${l}</label>`).join('')}</details></div>
</aside>`;
    document.body.appendChild(root);
    $('#fxp-list').innerHTML = listHtml2();
    root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    $('#fxp-filter').addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); root.querySelectorAll('.fxp-srow').forEach((r) => { r.hidden = !!q && !r.dataset.search.includes(q); }); root.querySelectorAll('.fxp-group').forEach((gEl) => { if (q) gEl.classList.remove('is-closed'); gEl.hidden = !!q && ![...gEl.querySelectorAll('.fxp-srow')].some((r) => !r.hidden); }); });
    root.querySelectorAll('[data-switch]').forEach((cb) => cb.addEventListener('change', () => store.set(`fig-${cb.dataset.switch}`, cb.checked ? '1' : '0')));
    window.addEventListener('hashchange', () => show(current()));
    if (/[?&]open\b/.test(location.search)) setOpen(true);
    show(current());
  }
  const setOpen = (o) => { root.classList.toggle('is-open', o); $('.fxp-handle').setAttribute('aria-expanded', String(o)); if (o) { const on = $('.fxp-scr.is-on'); if (on) on.scrollIntoView({ block: 'nearest' }); } };
  const isOpen = () => root.classList.contains('is-open');
  const current = () => decodeURIComponent(location.hash.slice(1)) || R.screens[0].id;
  function show(id) {
    const s = R.screens.find((x) => x.id === id) || R.screens[0];
    let html; try { html = FX.renderHtml(s); } catch (e) { console.error(e); html = `<pre style="padding:16px;background:#FDECEC;color:#8A1C22;font:12px/16px ui-monospace,monospace;white-space:pre-wrap">Render error in ${esc(s.id)}:\n${esc(e.stack)}</pre>`; }
    $('#fxp-stage').innerHTML = html;
    $('#fxp-now-id').textContent = s.id; $('#fxp-now-title').textContent = s.title; $('#fxp-handle-id').textContent = s.id;
    root.querySelectorAll('.fxp-scr').forEach((a) => a.classList.toggle('is-on', a.dataset.id === s.id));
    document.title = `${s.id} ${s.title} — ${C().name}`;
    const w = preflight($('#fxp-stage')); const box = $('#fxp-warn'); box.hidden = !w.length; box.innerHTML = w.map((x) => `<li>${esc(x)}</li>`).join('');
    if (w.length) console.warn('[Figma preflight]', w.join('\n'));
    window.scrollTo(0, 0);
  }
  function step(d) { const i = R.screens.findIndex((s) => s.id === current()); location.hash = encodeURIComponent(R.screens[Math.max(0, Math.min(R.screens.length - 1, i + d))].id); }
  function onKey(e) {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); return; }
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    if (e.key === '\\') setOpen(!isOpen());
  }
  function onClick(e) {
    const t = (sel) => e.target.closest(sel);
    let b;
    if ((b = t('[data-copy-page]'))) return copyPage(b);
    if ((b = t('[data-copy-group]'))) return copyGroup(b.dataset.copyGroup, b);
    if ((b = t('[data-copy-screen]'))) return copyScreen(b.dataset.copyScreen, b);
    if ((b = t('[data-copy-current]'))) return copyScreen(current(), b);
    if ((b = t('[data-toggle-group]'))) { const k = b.dataset.toggleGroup; const el = b.closest('.fxp-group'); el.classList.toggle('is-closed'); b.setAttribute('aria-expanded', String(!el.classList.contains('is-closed'))); const s = closed(); el.classList.contains('is-closed') ? s.add(k) : s.delete(k); store.set('closed-groups', JSON.stringify([...s])); return; }
    if ((b = t('[data-step]'))) return step(Number(b.dataset.step));
    if (t('[data-toggle]')) return setOpen(!isOpen());
    if (t('.fxp-scr')) { setTimeout(() => setOpen(false), 120); return; }
    if ((b = t('#fxp-stage [data-go]'))) { e.preventDefault(); location.hash = encodeURIComponent(b.dataset.go); }
  }

  /* ---------- headless hook for tools/check.sh: ?figmaTest=page | group:<key> | screen:<id> ---------- */
  async function testHook() {
    const m = /[?&]figmaTest=([^&]+)/.exec(location.search); if (!m) return;
    const [k, key] = decodeURIComponent(m[1]).split(':');
    const pre = document.createElement('pre'); pre.id = 'figma-out'; pre.hidden = true;
    try {
      let r;
      if (k === 'page') r = await pageHtml();
      else { const RR = registry(); const grp = k === 'group' ? RR.groups.find((x) => x.key === key) : RR.groups.find((x) => x.screens.some((s) => s.id === key)); r = await listHtml(grp, k === 'group' ? grp.screens : grp.screens.filter((s) => s.id === key)); }
      pre.dataset.stats = JSON.stringify(r.stats); pre.dataset.kb = r.kb; pre.dataset.warn = JSON.stringify(preflight(document.getElementById('fxp-stage') || document.body)); pre.textContent = r.html;
    } catch (e) { pre.textContent = `ERROR ${e.stack}`; }
    document.body.appendChild(pre);
  }
  function init() {
    try { R = registry(); } catch (e) { console.error(e); document.body.insertAdjacentHTML('afterbegin', `<pre style="padding:16px;background:#FDECEC;color:#8A1C22;font:13px/18px ui-monospace,monospace;white-space:pre-wrap">${esc(e.message)}</pre>`); return; }
    if (C().panel !== false) mount();
    testHook();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
  window.figmaTest = figmaTest;
  return { registry, copyPage, copyGroup, copyScreen, pageHtml, figmaTest, preflight, opts, lastTest: null };
})();
