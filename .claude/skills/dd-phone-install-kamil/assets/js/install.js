/* Install as an app. On a phone or tablet that has not installed the app yet (and not inside a presenter frame) it offers to add it to the home screen:
     Chrome, Edge, Samsung Internet on Android: a real "Install" button (the browser's own install prompt)
     iPhone, iPad and anything else:            a short step-by-step sheet (Share > Add to Home Screen, or the browser menu)
   Where it shows:
     <body data-install-banner>           a dismissible card at the top, about 1.4 s after load ("Not now" hides it for a week)
     any element with [data-install-row]  hidden unless installing is possible; a tap runs the same flow (use it for an "Install as app" row)
   It also registers the service worker (sw.js) so browsers treat the site as installable.
   Optional settings, before this script:  window.APP_INSTALL = { name, icon, prefix, snoozeDays, bannerDelayMs, sw,
     text: { title, body, install, how, notNow, gotIt, sheetTitle, sheetBody, stepsIos, stepsAndroid, openInSafari, openInBrowser } }
   stepsIos / stepsAndroid are arrays of HTML strings that replace the built-in steps (use {share}, {menu} and {name} as placeholders), for another language or a new OS wording.
   Colours and font come from CSS variables: --install-accent, --install-accent-ink, --install-font.
   Testing aid: add ?install to the address to behave as if on a phone (desktop browsers, DevTools without device mode).
   API: window.AppInstall = { eligible(), open(), installed(), platform(), canPrompt(), banner() } */
(function () {
  'use strict';
  var C = window.APP_INSTALL || {}, T = C.text || {};
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/shared\/install\.js.*$/, '') : location.origin + '/';
  var prefix = C.prefix || (window.SHELL && window.SHELL.prefix) || 'app';
  var KEY = prefix + '-install-dismissed', SNOOZE = (C.snoozeDays || 7) * 24 * 3600 * 1000;
  var NAME = C.name || (window.SHELL && window.SHELL.name) || document.title || 'this app';
  var ICON = base + (C.icon || 'assets/icons/icon-192.png');
  var deferred = null, banner = null, sheet = null, opener = null;

  /* ---------- what kind of device is this ---------- */
  function ua() { return navigator.userAgent || ''; }
  function isIOS() { var u = ua(); return /iPad|iPhone|iPod/.test(u) || (u.indexOf('Mac') > -1 && navigator.maxTouchPoints > 1); }   // iPadOS pretends to be a Mac
  function isAndroid() { return /Android/.test(ua()); }
  function isMobile() { return isIOS() || isAndroid() || /Mobi/.test(ua()) || !!(navigator.userAgentData && navigator.userAgentData.mobile); }
  function forced() { return /[?&]install(=|&|$)/.test(location.search); }
  function installed() { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
  function inFrame() { return window.parent !== window; }
  function inAppBrowser() { return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|Snapchat|TikTok/i.test(ua()); }   // webviews inside other apps cannot add to the home screen
  function platform() { return isIOS() ? 'ios' : isAndroid() ? 'android' : isMobile() ? 'mobile' : 'desktop'; }
  function eligible() { return (isMobile() || forced()) && !installed() && !inFrame(); }

  /* ---------- remembering "not now" ---------- */
  function snoozed() { try { var v = localStorage.getItem(KEY); if (v === 'installed') return true; var t = +v; return !!t && Date.now() - t < SNOOZE; } catch (e) { return false; } }
  function remember(v) { try { localStorage.setItem(KEY, v || String(Date.now())); } catch (e) {} }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; sync(); });
  window.addEventListener('appinstalled', function () { deferred = null; remember('installed'); closeAll(); sync(); });
  if ('serviceWorker' in navigator && (isMobile() || forced()) && !inFrame()) {
    try { navigator.serviceWorker.register(base + (C.sw || 'sw.js'), { scope: base }).catch(function () {}); } catch (e) {}
  }

  /* ---------- look ---------- */
  var CSS = '.ai-banner,.ai-sheet{font-family:var(--install-font,system-ui,-apple-system,"Segoe UI",sans-serif);-webkit-font-smoothing:antialiased;color:#0f172a}' +
    '.ai-banner{position:fixed;z-index:2147483000;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));max-width:440px;margin:0 auto;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:20px;background:#fff;box-shadow:0 12px 40px rgba(15,23,42,.35);transform:translateY(-24px);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .25s ease}' +
    '.ai-banner.is-on{transform:none;opacity:1}' +
    '.ai-row{display:flex;gap:12px;align-items:center}.ai-icon{flex:none;width:48px;height:48px;border-radius:12px;box-shadow:0 1px 4px rgba(15,23,42,.2)}' +
    '.ai-txt b{display:block;font-size:16px;line-height:22px;font-weight:700}.ai-txt span{display:block;font-size:13px;line-height:18px;color:#475569}' +
    '.ai-act{display:flex;gap:8px}.ai-btn{flex:1;min-height:44px;padding:0 14px;border-radius:16px;font-family:inherit;font-size:14px;line-height:20px;font-weight:700;text-align:center;border:0;cursor:pointer}' +
    '.ai-btn--go{flex:1.5;background:var(--install-accent,#2563eb);color:var(--install-accent-ink,#fff)}.ai-btn--no{background:#f1f5f9;color:#334155}' +
    '.ai-sheet{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-end;justify-content:center;background:rgba(15,23,42,.5);opacity:0;transition:opacity .25s ease}' +
    '.ai-sheet.is-on{opacity:1}.ai-panel{width:min(100%,440px);max-height:88vh;overflow:auto;display:flex;flex-direction:column;gap:14px;padding:12px 20px calc(24px + env(safe-area-inset-bottom,0px));border-radius:28px 28px 0 0;background:#fff;transform:translateY(40px);transition:transform .35s cubic-bezier(.22,1,.36,1)}' +
    '.ai-sheet.is-on .ai-panel{transform:none}.ai-grab{align-self:center;width:40px;height:4px;border-radius:2px;background:#e2e8f0}' +
    '.ai-sheet h2{margin:0;font-size:20px;line-height:28px;font-weight:700}.ai-sheet p{margin:0;font-size:14px;line-height:20px;color:#475569}' +
    '.ai-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}.ai-steps li{display:flex;gap:12px;align-items:center;font-size:14px;line-height:20px}' +
    '.ai-steps i{flex:none;width:28px;height:28px;border-radius:50%;background:#eef2ff;color:var(--install-accent,#2563eb);font-family:inherit;font-size:13px;line-height:28px;font-weight:700;font-style:normal;text-align:center}' +
    '.ai-steps svg{vertical-align:-5px;margin:0 2px;color:var(--install-accent,#2563eb)}' +
    '@media (prefers-reduced-motion:reduce){.ai-banner,.ai-sheet,.ai-panel{transition:none}}';
  function addCss() { if (document.getElementById('ai-css')) return; var s = document.createElement('style'); s.id = 'ai-css'; s.textContent = CSS; document.head.appendChild(s); }
  var SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  var DOTS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- the steps sheet ---------- */
  function fill(s) { return String(s).replace(/\{share\}/g, SHARE).replace(/\{menu\}/g, DOTS).replace(/\{name\}/g, esc(NAME)); }   // custom steps are the developer's own HTML
  function steps() {
    var ios = isIOS(), out = [], custom = ios ? T.stepsIos : T.stepsAndroid;
    if (inAppBrowser()) out.push(ios ? (T.openInSafari || 'This page is open inside another app. Open the menu and choose <b>Open in Safari</b> first.')
                                     : (T.openInBrowser || 'This page is open inside another app. Open the menu and choose <b>Open in browser</b> first.'));
    if (custom && custom.length) return out.concat(custom.map(fill));
    return out.concat(ios ? [
      'Tap the Share button ' + SHARE + ' in the browser toolbar.', 'Scroll down and tap <b>Add to Home Screen</b>.',
      'Tap <b>Add</b>. ' + esc(NAME) + ' appears on your home screen and opens full screen.'
    ] : [
      'Tap the browser menu ' + DOTS + '.', 'Tap <b>Install app</b> or <b>Add to Home screen</b>.',
      'Confirm. ' + esc(NAME) + ' appears on your home screen and opens full screen.'
    ]);
  }
  function closeSheet() {
    if (!sheet) return; var s = sheet; sheet = null; s.classList.remove('is-on');
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
    if (opener && opener.focus) { try { opener.focus(); } catch (e) {} } opener = null;
  }
  function showSteps() {
    addCss(); if (sheet) return;
    opener = document.activeElement;
    sheet = document.createElement('div'); sheet.className = 'ai-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', T.sheetTitle || 'Install ' + NAME);
    sheet.innerHTML = '<div class="ai-panel"><span class="ai-grab"></span><h2>' + esc(T.sheetTitle || 'Install ' + NAME) + '</h2><p>' + esc(T.sheetBody || 'Add it to your home screen so it opens full screen, like a real app.') + '</p>' +
      '<ol class="ai-steps">' + steps().map(function (t, i) { return '<li><i>' + (i + 1) + '</i><span>' + t + '</span></li>'; }).join('') + '</ol>' +
      '<button type="button" class="ai-btn ai-btn--no" data-close>' + esc(T.gotIt || 'Got it') + '</button></div>';
    document.body.appendChild(sheet);
    sheet.addEventListener('click', function (e) { if (e.target === sheet || (e.target.closest && e.target.closest('[data-close]'))) closeSheet(); });
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (sheet) { sheet.classList.add('is-on'); var b = sheet.querySelector('[data-close]'); if (b && b.focus) b.focus(); } }); });
  }

  /* ---------- the action behind every install control ---------- */
  function open() {
    if (!eligible()) return;
    if (deferred) {
      var d = deferred; deferred = null;       // a captured prompt can be used once; Chrome sends a new event if it offers again
      try { d.prompt(); } catch (e) { showSteps(); return; }
      if (d.userChoice && d.userChoice.then) d.userChoice.then(function (r) { if (r && r.outcome === 'accepted') { remember('installed'); closeAll(); } sync(); });
      sync();
    } else showSteps();
  }

  /* ---------- the banner ---------- */
  function closeAll() {
    if (banner) { var b = banner; banner = null; b.classList.remove('is-on'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 350); }
    closeSheet();
  }
  function showBanner(ignoreSnooze) {
    if (!eligible() || banner || (!ignoreSnooze && snoozed())) return;
    addCss();
    banner = document.createElement('div'); banner.className = 'ai-banner'; banner.setAttribute('role', 'region'); banner.setAttribute('aria-label', T.title || 'Install ' + NAME);
    banner.innerHTML = '<div class="ai-row"><img class="ai-icon" src="' + esc(ICON) + '" alt="" width="48" height="48"><div class="ai-txt"><b>' + esc(T.title || 'Install ' + NAME) + '</b><span>' + esc(T.body || 'Add it to your home screen to open it full screen, like an app.') + '</span></div></div>' +
      '<div class="ai-act"><button type="button" class="ai-btn ai-btn--no" data-no>' + esc(T.notNow || 'Not now') + '</button><button type="button" class="ai-btn ai-btn--go" data-go>' + esc(deferred ? (T.install || 'Install') : (T.how || 'How to install')) + '</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('[data-no]').addEventListener('click', function () { remember(); closeAll(); });
    banner.querySelector('[data-go]').addEventListener('click', open);
    var img = banner.querySelector('img'); if (img) img.addEventListener('error', function () { img.style.display = 'none'; });
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (banner) banner.classList.add('is-on'); }); });
  }
  function sync() {
    if (banner) { var g = banner.querySelector('[data-go]'); if (g) g.textContent = deferred ? (T.install || 'Install') : (T.how || 'How to install'); }
    var rows = document.querySelectorAll('[data-install-row]');
    for (var i = 0; i < rows.length; i++) rows[i].hidden = !eligible();
  }

  window.AppInstall = {
    eligible: eligible, open: open, installed: installed, platform: platform, canPrompt: function () { return !!deferred; },
    banner: function () { showBanner(true); }
  };
  function ready() {
    var rows = document.querySelectorAll('[data-install-row]');
    for (var i = 0; i < rows.length; i++) rows[i].addEventListener('click', open);
    sync();
    if (document.documentElement.hasAttribute('data-install-banner') || (document.body && document.body.hasAttribute('data-install-banner'))) setTimeout(function () { showBanner(false); }, C.bannerDelayMs || 1400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
