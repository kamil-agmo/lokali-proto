/* Page indicator: tapping a dot marks it and fires "c-change" with its index (a carousel listens and scrolls). */
document.addEventListener('click', function (e) {
  var d = e.target.closest('.c-dots .c-dot'); if (!d) return; var all = [].slice.call(d.parentNode.querySelectorAll('.c-dot'));
  all.forEach(function (x) { x.classList.toggle('is-on', x === d); x.setAttribute('aria-selected', x === d); });
  d.parentNode.dispatchEvent(new CustomEvent('c-change', { bubbles: true, detail: { index: all.indexOf(d) } }));
});
