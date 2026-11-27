/* dd-desktop-kamil: admin (desktop) screens for the dd-presenter-david. Load after js/shell/prototype.js.
   A page (or its tree group) with device: 'desktop' in shell.config.js fills the window like a real desktop app (no frame).
   The side cards then run the full height of the window: slide-in drawers behind two edge tabs ("Navigation" / "Summary"),
   or docked columns on ultrawide windows. Desktop pages get html.in-desktop and --content-max (SHELL.desktop.contentMax,
   default 1440 px; null = full width).
   Hooks used: the shell's "<prefix>:show" event and window.Shell (fit, groupOf, frame, el, drawer: the presenter's js/shell/drawers.js). */
(function () {
  'use strict';
  var S = window.SHELL, Sh = window.Shell;
  if (!S || !Sh) { console.error('[dd-desktop-kamil] load admin-shell.js after js/shell/prototype.js (needs window.Shell).'); return; }
  var D = S.desktop || {}, shellEl = Sh.el, frame = Sh.frame, device = 'phone';
  var tabNav = document.getElementById('tabNav'), tabSum = document.getElementById('tabSum'), drawerBg = document.getElementById('drawerBg');
  if (!tabNav || !tabSum || !drawerBg || !Sh.drawer) { console.error('[dd-desktop-kamil] the presenter\'s drawers are missing: run install_admin.py.'); return; }

  function deviceOf(id) {
    var p = S.pages[id]; if (!p) return 'phone'; if (p.device) return p.device;
    var g = (S.tree || [])[Sh.groupOf(id)]; return (g && g.device) || 'phone';
  }
  function contentMax() { return D.contentMax === undefined ? 1440 : D.contentMax; }
  function markFrame() {   // the page inside: in-desktop instead of in-phone, plus --content-max
    try {
      var h = frame.contentDocument.documentElement, desk = device === 'desktop', m = contentMax();
      h.classList.toggle('in-phone', !desk); h.classList.toggle('in-desktop', desk);
      if (desk && m) h.style.setProperty('--content-max', m + 'px'); else h.style.removeProperty('--content-max');
    } catch (e) {}
  }
  function isWide() { return innerWidth / innerHeight >= (D.ultrawide || 2.1) || innerWidth >= (D.ultrawideMin || 2560); }
  var drawer = Sh.drawer;   // the presenter's drawers (js/shell/drawers.js) open and close the side cards
  function layout() {
    var drawers = device === 'desktop' && (D.dock === false || !isWide());
    shellEl.classList.toggle('is-drawers', drawers); tabNav.hidden = tabSum.hidden = !drawers;
    if (!drawers) drawer(null);
    Sh.fit();
  }
  function setDevice(dev) {
    if (dev === device) return;
    device = dev; shellEl.classList.toggle('is-desktop', dev === 'desktop'); shellEl.classList.toggle('is-fullwindow', dev === 'desktop');
    markFrame(); layout();
  }

  window.addEventListener(S.prefix + ':show', function (e) {
    setDevice(deviceOf(e.detail.id));
    if (shellEl.classList.contains('nav-open') && e.detail.changed) drawer(null);   // picking a page closes the Navigation drawer
  });
  frame.addEventListener('load', markFrame);
  window.addEventListener('resize', function (e) { if (e.isTrusted !== false) layout(); });
  if (Sh.current) setDevice(deviceOf(Sh.current()));
})();
