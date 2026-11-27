/* Clear button (Apple HIG): a round x at the end of a text field or search field while it has text; tapping it empties the field.
   Automatic for .c-field inputs (not passwords) and .c-search inputs; call C.clearButtons(root) after adding fields later. */
(function () {
  window.C = window.C || {};
  function add(root) {
    (root || document).querySelectorAll('.c-field input:not([type=password]), .c-search input').forEach(function (inp) {
      if (inp._cClr) return; inp._cClr = 1;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'c-clear'; b.setAttribute('aria-label', 'Clear'); b.innerHTML = '<span class="c-ico" aria-hidden="true">close</span>';
      inp.parentNode.classList.add('c-clearable'); inp.parentNode.appendChild(b);
      function upd() { b.hidden = !inp.value; }
      inp.addEventListener('input', upd);
      b.addEventListener('click', function (e) { e.preventDefault(); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); });
      upd(); setTimeout(upd, 0);   // values filled in by the page's own script
    });
  }
  window.C.clearButtons = add;
  document.addEventListener('DOMContentLoaded', function () { add(); });
})();
