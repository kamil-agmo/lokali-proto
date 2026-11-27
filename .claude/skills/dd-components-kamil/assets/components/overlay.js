/* Sheets and dialogs: [data-c-open="id"] opens, [data-c-close] / backdrop tap / Esc / swipe down (sheets) closes. Focus moves in and back. */
(function () {
  var last = null;
  function open(el) { last = document.activeElement; el.hidden = false; el.classList.remove('is-closing'); var box = el.querySelector('.c-sheet__panel, .c-dialog__box, .c-drawer__panel, .c-asheet__group'); if (box) { box.setAttribute('tabindex', '-1'); setTimeout(function () { box.focus({ preventScroll: true }); }, 30); } }
  function close(el) { if (el.hidden) return; el.classList.add('is-closing'); setTimeout(function () { el.hidden = true; el.classList.remove('is-closing'); if (last) last.focus(); }, 200); }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-c-open]'); if (o) { var t = document.getElementById(o.getAttribute('data-c-open')); if (t) open(t); return; }
    var c = e.target.closest('[data-c-close]'); if (c) { var p = c.closest('.c-sheet, .c-dialog'); if (p) close(p); return; }
    if (e.target.classList && (e.target.classList.contains('c-sheet') || e.target.classList.contains('c-dialog') || e.target.classList.contains('c-drawer'))) close(e.target);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.c-sheet:not([hidden]), .c-dialog:not([hidden]), .c-drawer:not([hidden])').forEach(close); });
  var y0 = null, panel = null;
  document.addEventListener('touchstart', function (e) { panel = e.target.closest('.c-sheet__panel'); y0 = panel && panel.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 80) close(panel.parentNode); y0 = null; });
  window.C = window.C || {}; window.C.open = function (id) { var el = document.getElementById(id); if (el) open(el); }; window.C.close = function (id) { var el = document.getElementById(id); if (el) close(el); };
})();
