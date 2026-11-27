/* Button group: one choice at a time (role="radio"); fires "c-change" with the chosen label. */
document.addEventListener('click', function (e) {
  var b = e.target.closest('.c-bgroup [role="radio"]'); if (!b) return;
  b.parentNode.querySelectorAll('[role="radio"]').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
  b.parentNode.dispatchEvent(new CustomEvent('c-change', { bubbles: true, detail: { value: b.textContent.trim() } }));
});
