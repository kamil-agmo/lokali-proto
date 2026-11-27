/* Credits for any page (dd-credits-kamil). Reads window.DD_CREDITS (js/shared/credits-data.js, written by credits.py).
   - Always: one quiet line in the browser console ("Made with Design Department skills: ...").
   - Without the presenter shell: a small "Credits" pill in the bottom-left corner, on wide windows only (never over a phone
     layout); it fades back after a few seconds and opens credits.html.
   - Inside the presenter (a page in its frame, or the shell with its own Credits button): no pill. */
(function () {
  'use strict';
  var C = window.DD_CREDITS;
  if (!C || !C.line) return;
  var inFrame = false; try { inFrame = window.top !== window; } catch (e) { inFrame = true; }
  if (inFrame) return;   // a page shown inside the presenter: the shell credits it
  try { console.info('%cMade with Design Department skills%c\n' + C.line, 'font-weight:700', ''); } catch (e) {}
  if (document.getElementById('sideRight') || C.pill === false) return;   // the presenter shell has its own Credits button
  var me = document.currentScript && document.currentScript.src, href = me ? new URL('../../credits.html', me).href : 'credits.html';
  var css = document.createElement('style');
  css.textContent = '.dd-credits-pill{position:fixed;z-index:2147483000;left:16px;bottom:16px;display:none;align-items:center;gap:6px;padding:7px 12px 7px 10px;border-radius:999px;' +
    'font:600 12px/16px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em;color:#fff;text-decoration:none;background:rgba(15,23,42,.72);' +
    '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 4px 18px rgba(15,23,42,.18);opacity:1;transition:opacity .5s ease,transform .2s ease}' +
    '.dd-credits-pill:hover,.dd-credits-pill:focus-visible{opacity:1!important;transform:translateY(-1px)}.dd-credits-pill.is-quiet{opacity:.35}' +
    '.dd-credits-pill svg{width:14px;height:14px;flex:none}@media (min-width:900px){.dd-credits-pill{display:inline-flex}}@media print{.dd-credits-pill{display:none!important}}';
  var a = document.createElement('a');
  a.className = 'dd-credits-pill'; a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.title = C.line; a.setAttribute('aria-label', 'Credits: ' + C.line);
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.2v.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>Credits';
  function add() { document.head.appendChild(css); document.body.appendChild(a); setTimeout(function () { a.classList.add('is-quiet'); }, 4000); }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
