/* App bar: gets .is-scrolled once the page scrolls (tonal background on Material, hairline on Apple). */
(function () {
  function upd() { var y = window.scrollY > 4; document.querySelectorAll('.c-appbar').forEach(function (b) { b.classList.toggle('is-scrolled', y); }); }
  window.addEventListener('scroll', upd, { passive: true }); document.addEventListener('DOMContentLoaded', upd);
})();
