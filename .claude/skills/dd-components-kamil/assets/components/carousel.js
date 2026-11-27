/* Carousel + page indicator: dots under a carousel follow the swipe, and tapping a dot scrolls to that item. */
(function () {
  function dotsOf(c) { var n = c.nextElementSibling; return n && n.classList.contains('c-dots') ? n : null; }
  document.addEventListener('scroll', function (e) {
    var c = e.target; if (!c.classList || !c.classList.contains('c-carousel')) return; var d = dotsOf(c); if (!d) return;
    var items = [].slice.call(c.children), x = c.scrollLeft, i = 0; items.forEach(function (it, k) { if (it.offsetLeft - c.offsetLeft - 16 <= x + 4) i = k; });
    d.querySelectorAll('.c-dot').forEach(function (dot, k) { dot.classList.toggle('is-on', k === i); });
  }, true);
  document.addEventListener('c-change', function (e) {
    var d = e.target; if (!d.classList.contains('c-dots')) return; var c = d.previousElementSibling; if (!c || !c.classList.contains('c-carousel')) return;
    var it = c.children[e.detail.index]; if (it) c.scrollTo({ left: it.offsetLeft - c.offsetLeft - 16, behavior: 'smooth' });
  });
})();
