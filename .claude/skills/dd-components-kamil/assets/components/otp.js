/* Code input: auto-advance, backspace goes back, paste fills; fires "c-complete" with the code when every box is filled. */
(function () {
  function boxes(el) { return [].slice.call(el.closest('.c-otp').querySelectorAll('input')); }
  function done(el) { var g = el.closest('.c-otp'), code = boxes(el).map(function (b) { return b.value; }).join(''); if (code.length === boxes(el).length) g.dispatchEvent(new CustomEvent('c-complete', { bubbles: true, detail: { code: code } })); }
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.closest || !t.closest('.c-otp')) return; t.value = t.value.replace(/\D/g, '').slice(-1);
    var b = boxes(t), i = b.indexOf(t); if (t.value && b[i + 1]) b[i + 1].focus(); done(t);
  });
  document.addEventListener('keydown', function (e) { var t = e.target; if (e.key !== 'Backspace' || !t.closest || !t.closest('.c-otp') || t.value) return; var b = boxes(t), i = b.indexOf(t); if (b[i - 1]) { b[i - 1].focus(); b[i - 1].value = ''; } });
  document.addEventListener('paste', function (e) {
    var t = e.target; if (!t.closest || !t.closest('.c-otp')) return; var d = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (!d) return; e.preventDefault();
    boxes(t).forEach(function (b, i) { b.value = d[i] || ''; }); var b = boxes(t); (b[Math.min(d.length, b.length) - 1] || t).focus(); done(t);
  });
})();
