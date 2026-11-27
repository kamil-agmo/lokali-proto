/* Icon buttons with aria-pressed toggle on tap (like, bookmark, mute). */
document.addEventListener('click', function (e) {
  var b = e.target.closest('.c-icon[aria-pressed]'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
});
