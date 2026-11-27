/* Swipe actions: drag a .c-swipe row left to reveal its actions; it snaps open or shut; tapping elsewhere closes it. Buttons fire "c-swipe-action". */
(function () {
  var cur = null, x0 = 0, dx = 0, w = 0, openEl = null;
  function set(el, x) { el.querySelector('.c-swipe__row').style.transform = x ? 'translateX(' + x + 'px)' : ''; }
  document.addEventListener('pointerdown', function (e) { var s = e.target.closest('.c-swipe'); if (openEl && openEl !== s) { set(openEl, 0); openEl = null; } if (!s || e.target.closest('.c-swipe__btn')) return; cur = s; x0 = e.clientX; dx = 0; w = s.querySelector('.c-swipe__actions').offsetWidth; });
  document.addEventListener('pointermove', function (e) { if (!cur) return; dx = Math.min(0, Math.max(-w - 20, e.clientX - x0 + (openEl === cur ? -w : 0))); if (Math.abs(dx) > 6) { cur.classList.add('is-dragging'); set(cur, dx); } });
  document.addEventListener('pointerup', function () { if (!cur) return; cur.classList.remove('is-dragging'); var open = dx < -w / 2; set(cur, open ? -w : 0); openEl = open ? cur : null; cur = null; });
  document.addEventListener('click', function (e) { var b = e.target.closest('.c-swipe__btn'); if (!b) return; var s = b.closest('.c-swipe'); set(s, 0); openEl = null; s.dispatchEvent(new CustomEvent('c-swipe-action', { bubbles: true, detail: { action: b.textContent.trim() } })); });
})();
