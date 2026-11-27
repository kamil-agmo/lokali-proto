/* Popover: [data-c-pop="id"] opens a popover under the button; tap outside or Esc closes it. */
(function () {
  var open = null;
  function close() { if (open) { open.hidden = true; open = null; } }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c-pop]');
    if (b) { var p = document.getElementById(b.getAttribute('data-c-pop')); if (!p) return; var was = open === p; close(); if (was) return;
      p.hidden = false; var r = b.getBoundingClientRect(), w = p.offsetWidth;
      p.style.top = (r.bottom + 8) + 'px'; p.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px'; open = p; return; }
    if (open && !e.target.closest('.c-pop')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
