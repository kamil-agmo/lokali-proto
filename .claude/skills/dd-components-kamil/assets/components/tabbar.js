/* Tab bar: tapping a tab marks it active (links still navigate). */
document.addEventListener('click', function (e) {
  var t = e.target.closest('.c-tabbar .c-tab'); if (!t) return;
  t.parentNode.querySelectorAll('.c-tab').forEach(function (x) { x.classList.toggle('is-on', x === t); x.toggleAttribute('aria-current', x === t); });
});
