/* Presenter look around the phone frame: Airy (white, neutral greys). */
(function () {
  'use strict';
  var r = document.documentElement.style;
  r.setProperty('--bg', '#F3F3F1'); r.setProperty('--panel', '#FFFFFF'); r.setProperty('--ink', '#222222'); r.setProperty('--muted', '#6A6A6A'); r.setProperty('--line', '#EBEBEB');
  r.setProperty('--accent', '#37664A'); r.setProperty('--accent-strong', '#1C522C');
  r.setProperty('--font', '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif');
  var st = document.createElement('style');
  st.textContent = '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");' +
    '.side{background:color-mix(in srgb,var(--panel) 94%,transparent)!important;box-shadow:0 12px 40px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.04)!important}' +
    'body{background:var(--bg)!important}#screen{background:var(--bg)}';
  document.head.appendChild(st);
})();
