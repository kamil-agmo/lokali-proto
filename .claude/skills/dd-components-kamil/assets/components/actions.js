/* FAB menu: the floating button opens and closes its actions; a choice, a tap outside or Esc closes it. */
(function () {
  function set(m, on) { var t = m.querySelector('.c-fabmenu__toggle'), it = m.querySelector('.c-fabmenu__items'); it.hidden = !on; t.setAttribute('aria-expanded', on); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.c-fabmenu__toggle'); if (t) { var m = t.closest('.c-fabmenu'); set(m, t.getAttribute('aria-expanded') !== 'true'); return; }
    if (e.target.closest('.c-fabmenu__items button')) { set(e.target.closest('.c-fabmenu'), false); return; }
    document.querySelectorAll('.c-fabmenu').forEach(function (m) { set(m, false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.c-fabmenu').forEach(function (m) { set(m, false); }); });
})();
