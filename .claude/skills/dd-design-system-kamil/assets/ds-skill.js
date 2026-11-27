/* "Download design skill" (dev mode, inside the Design System panel): turns this prototype's design system into a Claude skill
   that developers give to their AI when building the real app, so the code follows the same rules.
   Built at click time from what the prototype already has, so it is never out of date:
     design-system.config.js (style, theme, scales, must / cannot, exceptions) · the screens' own stylesheets (colour tokens, light and dark)
     components.json + COMPONENTS.md (picked components and their snippets) · the screen's icon font · shell.config.js (screens)
   Downloads <name>-design-system.zip (a skill folder with SKILL.md, ready to upload to claude.ai or drop into .claude/skills/)
   (the SKILL.md is inside; unzip it to read or edit). Nothing leaves the browser. */
(function () {
  'use strict';
  var btn = document.getElementById('stddl'); if (!btn) return;
  var S = window.DESIGN_SYSTEM || window.UI_STANDARD || {}, SH = window.SHELL || {};
  var NAME = (SH.name || 'Prototype'), SLUG = NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-design-system';

  function get(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; }); }
  function vars(block) { var out = [], re = /(--[\w-]+)\s*:\s*([^;]+);/g, m; while ((m = re.exec(block))) out.push([m[1], m[2].trim()]); return out; }
  function tokens(css) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    var light = '', re = /(^|\})\s*:root\s*\{([^}]*)\}/g, m; while ((m = re.exec(css))) light += m[2] + ';';   // every top-level :root block
    var dark = ((css.match(/html\.dark\s*\{([^}]*)\}/) || css.match(/\[data-theme=["']?dark["']?\]\s*\{([^}]*)\}/) || css.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root[^{]*\{([^}]*)\}/) || [])[1]) || '';
    var d = {}; vars(dark).forEach(function (v) { d[v[0]] = v[1]; });
    return vars(light).map(function (v) { return [v[0], v[1], d[v[0]] || '']; });
  }
  function sections(md) {   // COMPONENTS.md: "## Name" sections -> { title, body }
    return md.split(/\n(?=## )/).slice(1).map(function (s) { var t = s.match(/^## (.+)/)[1]; return { title: t, body: s.replace(/^## .+\n/, '').trim() }; });
  }
  function iconInfo() {
    try { var l = document.getElementById('screen').contentDocument.querySelector('link[href*="Material+Symbols"]'); if (!l) return null;
      var h = decodeURIComponent(l.href), fam = (h.match(/family=Material Symbols (\w+)/) || h.match(/family=Material\+Symbols\+(\w+)/) || [])[1], names = (h.match(/icon_names=([\w,]+)/) || [])[1];
      return { family: 'Material Symbols ' + (fam || ''), names: names ? names.split(',') : [], href: l.getAttribute('href') }; } catch (e) { return null; }
  }
  function cssUrls() {   // the stylesheets the screen on show uses (same-origin only), or DESIGN_SYSTEM.tokenFiles
    if (S.tokenFiles && S.tokenFiles.length) return S.tokenFiles;
    try { var d = document.getElementById('screen').contentDocument;
      return [].slice.call(d.querySelectorAll('link[rel=stylesheet]')).map(function (l) { return l.href; }).filter(function (h) { return h.indexOf(location.origin) === 0 && !/phone\.css/.test(h); }); } catch (e) { return []; }
  }
  function bodyFont() { try { var d = document.getElementById('screen').contentDocument; return getComputedStyle(d.body).fontFamily; } catch (e) { return ''; } }

  var SP = /^--(sp|space|spacing|gap)(-|$)/, RD = /^--(r|radius|rounded|corner)(-|$)/;
  function build(css, compMd, picksJson) {
    var t = tokens(css), comps = sections(compMd), ic = iconInfo(), font = bodyFont(), L = [];
    var picks = []; try { picks = JSON.parse(picksJson).picks || []; } catch (e) {}
    var pages = SH.pages || {}, ids = Object.keys(pages);
    var desc = NAME + "'s design system: style, colour tokens (light and dark), typography, the only allowed spacing, rounding and text sizes, the component catalog with snippets, icons, and the must-do and cannot-do rules. Use whenever building, styling or reviewing any screen or component of " + NAME + ', adding a UI element, picking a colour or spacing value, or asking "what does ' + NAME + ' look like".';
    L.push('---', 'name: ' + SLUG, 'description: >', '  ' + desc, '---', '');
    L.push('# ' + NAME + ': design system', '');
    L.push('Exported from the ' + NAME + ' prototype (dev mode › Design System › Download design skill) on ' + new Date().toISOString().slice(0, 10) + '. The prototype is the reference: when this file and the prototype disagree, ask which one is right before coding.', '');
    L.push('**Build every screen of ' + NAME + ' to these rules.** Use the tokens below by name; never type a raw colour, spacing or size value that has a token or is off the scales.', '');
    L.push('## Design style', '', S.style || '', '', '## Theme', '', S.theme || '', '');
    if (t.length) {
      L.push('## Colour tokens', '', 'Defined as CSS custom properties. Dark values apply in dark mode (follow the system, with a manual switch).', '', '| Token | Light | Dark | Use |', '|---|---|---|---|');
      var use = {}; (S.colors || []).forEach(function (c) { use[c[0]] = c[1]; });
      t.filter(function (v) { return /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix|gradient|oklch/i.test(v[1]); }).forEach(function (v) { L.push('| `' + v[0] + '` | `' + v[1] + '` | ' + (v[2] ? '`' + v[2] + '`' : 'same') + ' | ' + (use[v[0]] || '') + ' |'); });
      L.push('');
    }
    L.push('## Typography', '', '- Font: `' + (font || 'system-ui') + '`', '- Text sizes (px), only these: ' + (S.fontSizes || []).join(' · '), '- Weights, only these: ' + (S.fontWeights || []).join(' · '), '');
    L.push('## Spacing and radius', '', '- Spacing (padding, gaps, vertical margins), only these px values: **' + (S.spacing || []).join(' · ') + '**' + (t.some(function (v) { return SP.test(v[0]); }) ? '. Tokens: ' + t.filter(function (v) { return SP.test(v[0]); }).map(function (v) { return '`' + v[0] + '` ' + v[1]; }).join(', ') : ''),
      '- Corner rounding, only: **' + (S.radius || []).join(' · ') + '** (full = pills and circles)' + (t.some(function (v) { return RD.test(v[0]); }) ? '. Tokens: ' + t.filter(function (v) { return RD.test(v[0]); }).map(function (v) { return '`' + v[0] + '` ' + v[1]; }).join(', ') : ''),
      '- Tap areas: at least **' + (S.minTap || 44) + ' × ' + (S.minTap || 44) + ' px** on phone screens' + (S.minTapDesktop ? ' and **' + S.minTapDesktop + ' px** on desktop (mouse) screens' : '') + '. The tap area may be larger than the visible control.', '');
    L.push('## Must do', ''); (S.must || []).forEach(function (r) { L.push('- ' + r); }); L.push('');
    L.push('## Cannot do', ''); (S.cannot || []).forEach(function (r) { L.push('- ' + r); }); L.push('');
    if ((S.exceptions || []).length) {
      L.push('## Approved exceptions', '', 'These bend a rule on purpose. Keep them as they are; do not "fix" them to match the scales.', '', '| Where | Rule bent | Why |', '|---|---|---|');
      S.exceptions.forEach(function (x) { L.push('| `' + x.where + '` | ' + (x.rule || 'any') + ' | ' + String(x.reason || '').replace(/\|/g, '/') + ' |'); });
      L.push('', 'Any new exception needs a reason and goes in this list; anything off the scales without one is a mistake.', '');
    }
    if (ic) L.push('## Icons', '', '- ' + ic.family + ' (icon font, not SVG files). Weight 400, 24 px optical size, outlined; filled only for the active state.', '- Load only the icons used (`icon_names=` in the Google Fonts link). In use now: ' + ic.names.map(function (n) { return '`' + n + '`'; }).join(', '), '- Never emoji or other icon sets.', '');
    if (comps.length) {
      L.push('## Component catalog', '', 'Reuse these; do not build a second version of any of them. Each was picked for ' + NAME + ' and already uses its colours and font.' + (picks.length ? ' Styles in use: ' + picks.map(function (p) { return p.id + ' (' + ({ ios: 'Apple', md: 'Material', fluent: 'Fluent', carbon: 'Carbon', ant: 'Ant' }[p.variant] || p.variant) + ')'; }).join(', ') + '.' : ''), '');
      comps.forEach(function (c) { L.push('### ' + c.title, '', c.body, ''); });
    }
    if (ids.length) {
      L.push('## Screens (from the prototype)', '', '| Screen | What it is |', '|---|---|');
      ids.forEach(function (id) { var p = pages[id]; L.push('| ' + p.title + (p.group ? ' (' + p.group + ')' : '') + ' | ' + (p.desc || '').replace(/\|/g, '/') + ' |'); });
      L.push('');
    }
    L.push('## Before handing over a screen', '', '- Every colour, spacing, radius and text size comes from the tokens and scales above.', '- Components come from the catalog; nothing rebuilt by hand.', '- Works in light and dark mode, and every tap area is at least ' + (S.minTap || 44) + ' px (' + (S.minTapDesktop || S.minTap || 44) + ' px on desktop screens).', '- Nothing on the Cannot do list appears.', '');
    return L.join('\n');
  }

  /* a tiny zip writer (stored, no compression): enough for a skill folder */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; } function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
      off += head.length + name.length + data.length;
    });
    var size = central.reduce(function (s, p) { return s + p.length; }, 0);
    return new Blob(parts.concat(central, [new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(size), u32(off), u16(0)))]), { type: 'application/zip' });
  }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }

  window.DesignSkill = { build: function () { return Promise.all([Promise.all(cssUrls().map(get)).then(function (a) { return a.join('\n'); }), get('COMPONENTS.md'), get('components.json')]).then(function (r) { return build(r[0], r[1], r[2]); }); } };
  btn.addEventListener('click', function () {
    if (!document.getElementById('devmode').classList.contains('is-on')) return;   // downloading is dev mode only
    var label = btn.lastChild, was = label.nodeValue; label.nodeValue = 'Preparing…'; btn.disabled = true;
    window.DesignSkill.build().then(function (md) {
      save(zip([{ name: SLUG + '/SKILL.md', text: md }]), SLUG + '.zip');
    }).finally(function () { label.nodeValue = was; btn.disabled = false; });
  });
})();
