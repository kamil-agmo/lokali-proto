/* Slider: keeps the filled part of the track in step with the thumb. */
(function () {
  function fill(s) { var p = (s.value - (s.min || 0)) / ((s.max || 100) - (s.min || 0)) * 100; s.style.setProperty('--c-v', p + '%'); }
  document.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('c-slider')) fill(e.target); });
  document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('.c-slider').forEach(fill); });
})();
