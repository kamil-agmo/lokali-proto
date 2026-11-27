/* Menus: [data-c-menu="id"] opens the menu next to its button; a choice, a tap outside or Esc closes it. Choices fire "c-select" on the menu. */
(function () {
  var open = null, opener = null;
  function close() { if (open) { open.hidden = true; if (opener) opener.setAttribute('aria-expanded', 'false'); open = null; } }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c-menu]');
    if (b) { var m = document.getElementById(b.getAttribute('data-c-menu')); if (!m) return; var was = open === m; close(); if (was) return;
      m.hidden = false; var r = b.getBoundingClientRect(), w = m.offsetWidth;
      m.style.top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8) + 'px'; m.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
      open = m; opener = b; b.setAttribute('aria-expanded', 'true'); var f = m.querySelector('[role="menuitem"]'); if (f) f.focus(); return; }
    var it = e.target.closest('.c-menu [role="menuitem"]');
    if (it) { it.closest('.c-menu').dispatchEvent(new CustomEvent('c-select', { bubbles: true, detail: { value: it.textContent.trim() } })); close(); return; }
    if (open && !e.target.closest('.c-menu')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('scroll', close, { passive: true });
})();
