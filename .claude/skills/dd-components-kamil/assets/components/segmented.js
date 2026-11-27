/* Segmented control / tabs: moves the thumb or underline to the chosen item and fires a "c-change" event with its index. */
(function () {
  function place(seg) {
    var on = seg.querySelector('.c-seg__item.is-on') || seg.querySelector('.c-seg__item'), th = seg.querySelector('.c-seg__thumb');
    if (!th) { th = document.createElement('span'); th.className = 'c-seg__thumb'; seg.appendChild(th); }
    if (!on) return; var md = seg.classList.contains('c-seg--md'), w = md ? on.offsetWidth * .5 : on.offsetWidth;
    th.style.width = w + 'px'; th.style.transform = 'translateX(' + (on.offsetLeft + (on.offsetWidth - w) / 2) + 'px)'; th.style.left = '0';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.c-seg__item'); if (!b) return; var seg = b.parentNode, items = [].slice.call(seg.querySelectorAll('.c-seg__item'));
    items.forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); }); place(seg);
    seg.dispatchEvent(new CustomEvent('c-change', { bubbles: true, detail: { index: items.indexOf(b) } }));
  });
  function all() { document.querySelectorAll('.c-seg').forEach(place); }
  document.addEventListener('DOMContentLoaded', all); window.addEventListener('resize', all); window.addEventListener('load', all);
  // the bar can change width without the window resizing (a layout that narrows it, a foldable opening): follow it
  if (window.ResizeObserver) { var ro = new ResizeObserver(function (es) { es.forEach(function (e) { place(e.target); }); }); var watch = function () { document.querySelectorAll('.c-seg').forEach(function (s) { if (!s._ro) { s._ro = 1; ro.observe(s); } }); }; document.addEventListener('DOMContentLoaded', watch); window.addEventListener('load', watch); }
})();
