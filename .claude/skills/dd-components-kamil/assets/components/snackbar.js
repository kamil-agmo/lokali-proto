/* C.toast(message, { action, onAction, ms }): one at a time, auto-hides after 3 s (5 s with an action). */
(function () {
  window.C = window.C || {};
  var cur = null;
  window.C.toast = function (msg, o) {
    o = o || {}; if (cur) cur.remove();
    var style = document.body.getAttribute('data-c-toast') || 'md', t = document.createElement('div');
    t.className = 'c-toast c-toast--' + style; t.setAttribute('role', 'status');
    var s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
    if (o.action) { var b = document.createElement('button'); b.type = 'button'; b.textContent = o.action; b.onclick = function () { if (o.onAction) o.onAction(); hide(); }; t.appendChild(b); }
    document.body.appendChild(t); cur = t;
    function hide() { if (!t.isConnected) return; t.classList.add('is-out'); setTimeout(function () { t.remove(); if (cur === t) cur = null; }, 200); }
    setTimeout(hide, o.ms || (o.action ? 5000 : 3000));
  };
})();
