/* Appearance: System | Light | Dark in the left card (Apple HIG: apps follow the system light/dark setting, so the switch lives in the
   presenter, not inside the app). Off unless shell.config.js has  appearance: true  (key <prefix>-theme) or  appearance: { key: '...' }.
   Stores '' (follow the system), 'light' or 'dark'; screens get html.light / html.dark (embed.js applies it on load and live).
   On a real phone (no shell) nothing is stored, so the screens follow the system. */
(function () {
  var S = window.SHELL || {}, A = S.appearance; if (!A) return;
  var KEY = (A && A.key) || (S.prefix || 'proto') + '-theme', box = document.querySelector('.side__actions');
  if (!box) return;
  var wrap = document.createElement('div'); wrap.className = 'appear'; wrap.setAttribute('role', 'radiogroup'); wrap.setAttribute('aria-label', 'Appearance');
  wrap.innerHTML = '<span class="appear__label">Appearance</span><span class="appear__seg">' +
    [['', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(function (o) { return '<button type="button" role="radio" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</span>';
  box.parentNode.insertBefore(wrap, box);
  function get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function apply(v) {
    try { var h = document.getElementById('screen').contentDocument.documentElement; h.classList.remove('light', 'dark'); if (v) h.classList.add(v); } catch (e) {}
    wrap.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-v') === v)); });
  }
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var v = b.getAttribute('data-v'); try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (er) {}
    apply(v);
  });
  var f = document.getElementById('screen'); if (f) f.addEventListener('load', function () { apply(get()); });
  apply(get());
})();
