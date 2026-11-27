/* Lock screen. Reads shell.config.js (brand, taglines, stats, password). The password is checked in the browser: a soft gate, not security.
   On success: inside the shell it tells the shell (<prefix>:unlocked); opened on its own it goes to the start page. */
(function () {
  'use strict';
  var S = window.SHELL, KEY = S.prefix + '-unlocked', reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  (function () {          // the lock screen takes its colours from SHELL.theme, so it looks like the prototype it guards
    var t = S.theme || {}, a = t.accent, r = document.documentElement.style;
    if (a) {
      r.setProperty('--lk-accent', 'color-mix(in srgb, ' + a + ' 62%, white)'); r.setProperty('--lk-accent-soft', 'color-mix(in srgb, ' + a + ' 28%, white)');
      r.setProperty('--lk-glow', 'color-mix(in srgb, ' + a + ' 55%, transparent)'); r.setProperty('--lk-btn-ink', t.accentStrong || 'color-mix(in srgb, ' + a + ' 78%, black)');
      if (!t.lockBg) { r.setProperty('--lk-bg', 'color-mix(in srgb, ' + a + ' 13%, #070b12)'); r.setProperty('--lk-bg-top', 'color-mix(in srgb, ' + a + ' 30%, #0b1220)'); }   // a dark tint of the accent
    }
    if (t.lockBg) { r.setProperty('--lk-bg', t.lockBg); r.setProperty('--lk-bg-top', 'color-mix(in srgb, ' + t.lockBg + ' 78%, white)'); }
    if (t.font) r.setProperty('--font', t.font);
    if (t.fontUrl) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = t.fontUrl; document.head.appendChild(l); }
  })();
  var form = $('form'), pw = $('pw'), field = $('field'), err = $('err'), lk = $('lk'), go = $('go');

  (function () {          // logo for the dark background if there is one (paths in the config are relative to the project root; this page is in pages/)
    var src = S.logoLock || S.logo; if (!src) return;
    var img = $('lkLogo'); img.src = /^(https?:|\/|data:)/.test(src) ? src : '../' + src; img.alt = S.name; img.hidden = false; $('brand').hidden = true;
  })();
  if (!S.logoLock && !S.logo) $('brand').textContent = S.name; $('tagline-sub').textContent = S.tag || ''; $('foot').textContent = S.name + (S.lock && S.lock.footer ? ' · ' + S.lock.footer : '');
  var tags = (S.lock && S.lock.taglines) || [];
  $('taglines').innerHTML = tags.map(function (t, i) { return '<p class="' + (i ? '' : 'is-on') + '">' + t + '</p>'; }).join('');
  $('stats').innerHTML = ((S.lock && S.lock.stats) || []).map(function (s) { return '<li><b data-n="' + s.n + '" data-s="' + (s.s || '') + '">0</b><span>' + s.label + '</span></li>'; }).join('');

  var items = document.querySelectorAll('#taglines p'), t = 0;
  if (!reduce && items.length > 1) setInterval(function () { items[t].classList.remove('is-on'); t = (t + 1) % items.length; items[t].classList.add('is-on'); }, 3400);
  document.querySelectorAll('.lk__stats b').forEach(function (b, i) {
    var to = +b.dataset.n, s = b.dataset.s || '', fmt = function (v) { return Math.round(v).toLocaleString() + s; };
    if (reduce) { b.textContent = fmt(to); return; }
    setTimeout(function () {
      var t0 = performance.now(), ms = 1400, safety = setTimeout(function () { b.textContent = fmt(to); }, ms + 400);
      (function step(now) { var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); b.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); else clearTimeout(safety); })(t0);
    }, 600 + i * 150);
  });

  var eye = $('eye');
  eye.addEventListener('click', function () {
    var show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
    eye.querySelector('.mi').textContent = show ? 'visibility_off' : 'visibility'; eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); pw.focus();
  });
  function bad() { err.hidden = false; field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad'); pw.focus(); pw.select(); }
  if (!S.password) { try { sessionStorage.setItem(KEY, '1'); } catch (x) {} setTimeout(proceed, 0); }   // no lock password yet: go straight in
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pw.value !== S.password) { bad(); return; }
    err.hidden = true; go.disabled = true; pw.blur();
    try { sessionStorage.setItem(KEY, '1'); } catch (x) {}
    lk.classList.add('is-open'); setTimeout(proceed, reduce ? 0 : 800);
  });
  pw.addEventListener('input', function () { err.hidden = true; field.classList.remove('is-bad'); });
  function proceed() {
    if (window.parent !== window) window.parent.postMessage({ type: S.prefix + ':unlocked' }, location.origin && location.origin !== 'null' ? location.origin : '*');
    else location.replace('../' + S.pages[S.startPage].src);
  }
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent || (location.origin !== 'null' && e.origin !== location.origin)) return;
    if (e.data && e.data.type === S.prefix + ':nudge') { field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad'); pw.focus(); }
  });
  if (!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) setTimeout(function () { pw.focus({ preventScroll: true }); }, 700);
  if (window.ProtoEmbed) ProtoEmbed.report('lock', [['Access', 'Password required']]);
})();
