/* Side-card drawers (presenter shell): two edge tabs ("Navigation" / "Summary") and a backdrop. When an add-on has no room
   for the side cards (dd-desktop-kamil's full-window desktop pages, dd-iphone-duo-kamil's open phone), the cards slide in from
   the window edges instead. The add-on decides when (it shows the tabs and places the cards); this file only opens and closes:
   Shell.drawer('nav' | 'sum' | null) toggles .nav-open / .sum-open on the shell, the tabs' aria-expanded and the backdrop.
   Load after js/shell/prototype.js. */
(function () {
  'use strict';
  var Sh = window.Shell, tabNav = document.getElementById('tabNav'), tabSum = document.getElementById('tabSum'), bg = document.getElementById('drawerBg');
  if (!Sh || !tabNav || !tabSum || !bg) return;
  var shellEl = Sh.el;
  function drawer(which) {   // 'nav', 'sum' or null (close)
    shellEl.classList.toggle('nav-open', which === 'nav'); shellEl.classList.toggle('sum-open', which === 'sum');
    tabNav.setAttribute('aria-expanded', String(which === 'nav')); tabSum.setAttribute('aria-expanded', String(which === 'sum'));
    bg.hidden = !which;
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 420);   // things placed beside the cards (Credits) follow
  }
  function isOpen() { return shellEl.classList.contains('nav-open') || shellEl.classList.contains('sum-open'); }
  tabNav.addEventListener('click', function () { drawer(shellEl.classList.contains('nav-open') ? null : 'nav'); });
  tabSum.addEventListener('click', function () { drawer(shellEl.classList.contains('sum-open') ? null : 'sum'); });
  bg.addEventListener('click', function () { drawer(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) drawer(null); });
  Sh.drawer = drawer; Sh.drawerOpen = isOpen;
})();
