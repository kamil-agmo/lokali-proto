/* Chips: filter chips (aria-pressed) toggle on tap; inside [data-single] only one stays selected. Fires "c-change". */
document.addEventListener('click', function (e) {
  var c = e.target.closest('.c-chip[aria-pressed]'); if (!c) return; var g = c.parentNode, on = c.getAttribute('aria-pressed') !== 'true';
  if (g.hasAttribute('data-single')) g.querySelectorAll('.c-chip[aria-pressed]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
  c.setAttribute('aria-pressed', g.hasAttribute('data-single') ? 'true' : on);
  g.dispatchEvent(new CustomEvent('c-change', { bubbles: true, detail: { value: c.textContent.trim(), on: c.getAttribute('aria-pressed') === 'true' } }));
});
