/* Text area: keeps the "n/max" counter up to date. */
document.addEventListener('input', function (e) {
  var t = e.target; if (t.tagName !== 'TEXTAREA' || !t.closest('.c-area')) return; var c = t.closest('.c-area').querySelector('.c-area__count');
  if (c) c.textContent = t.value.length + (t.maxLength > 0 ? '/' + t.maxLength : '');
});
