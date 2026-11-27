/* Stepper: buttons change the value within data-min / data-max and fire "c-change". */
(function () {
  function sync(s) { var o = s.querySelector('output'), v = +o.textContent, mn = +(s.dataset.min || 0), mx = +(s.dataset.max || 99);
    s.querySelectorAll('[data-step]').forEach(function (b) { b.disabled = (+b.dataset.step < 0 && v <= mn) || (+b.dataset.step > 0 && v >= mx); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.c-stepper [data-step]'); if (!b) return; var s = b.closest('.c-stepper'), o = s.querySelector('output');
    o.textContent = Math.min(+(s.dataset.max || 99), Math.max(+(s.dataset.min || 0), +o.textContent + +b.dataset.step)); sync(s);
    s.dispatchEvent(new CustomEvent('c-change', { bubbles: true, detail: { value: +o.textContent } }));
  });
  document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('.c-stepper').forEach(sync); });
})();
