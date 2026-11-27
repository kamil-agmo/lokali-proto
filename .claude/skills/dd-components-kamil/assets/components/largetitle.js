/* Large title: maps scroll position to --c-p (0 expanded → 1 collapsed) and adds .is-collapsed at the end. */
(function () {
  function upd() {
    document.querySelectorAll('.c-large').forEach(function (h) {
      // --c-large-drop: how far the header scrolls before it sticks; --c-large-fade: how far the large title takes to fade (defaults to the drop)
      var cs = getComputedStyle(h), drop = parseFloat(cs.getPropertyValue('--c-large-drop')) || 52, fade = parseFloat(cs.getPropertyValue('--c-large-fade')) || drop, p = Math.min(1, Math.max(0, window.scrollY / fade));
      h.style.setProperty('--c-p', p.toFixed(3)); h.classList.toggle('is-collapsed', p >= 1);
    });
  }
  window.addEventListener('scroll', upd, { passive: true }); document.addEventListener('DOMContentLoaded', upd);
})();
