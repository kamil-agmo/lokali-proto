/* iPhone frame for the presenter shell (dd-iphone-david; iPhone Duo bundles the same file). Load it after js/shell/prototype.js and
   before js/shell/duo.js. It turns the presenter's plain screen box (#phone) into an iPhone: adds .phone--framed and the parts inside
   the screen (status bar with time, signal, Wi-Fi and battery; Dynamic Island; home indicator). Parts already in index.html (older
   projects) are kept, not added twice. The status bar turns white over a dark screen. Nothing here changes the pages themselves. */
(function () {
  'use strict';
  var phone = document.getElementById('phone'), frame = document.getElementById('screen');
  if (!phone || !frame) return;
  var scr = phone.querySelector('.phone__screen') || phone;
  phone.classList.add('phone--framed'); document.documentElement.classList.add('has-frame');
  function part(sel, html) { if (!scr.querySelector(sel)) scr.insertAdjacentHTML('beforeend', html); return scr.querySelector(sel); }
  part('.statusbar', '<div class="statusbar" aria-hidden="true"><span class="statusbar__time">9:41</span><span class="statusbar__icons"></span></div>');
  part('.island', '<span class="island" aria-hidden="true"></span>');
  part('.indicator', '<span class="indicator" aria-hidden="true"></span>');
  // signal bars, Wi-Fi and battery
  var icons = phone.querySelector('.statusbar__icons');
  if (icons && !icons.children.length) icons.innerHTML =
    '<svg class="sb-ico" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>' +
    '<svg class="sb-ico" viewBox="0 0 16 12" width="16" height="12" aria-hidden="true"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .5 10.6 10.6 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2Zm0 3.5c1.5 0 2.9.6 4 1.5l1.2-1.3A7.4 7.4 0 0 0 8 4a7.4 7.4 0 0 0-5.2 1.9L4 7.2a5.8 5.8 0 0 1 4-1.5Zm0 3.4c.6 0 1.2.2 1.7.6L8 11.6 6.3 9.7c.5-.4 1.1-.6 1.7-.6Z" fill="currentColor"/></svg>' +
    '<svg class="sb-ico" viewBox="0 0 27 13" width="27" height="13" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" fill-opacity=".45"/></svg>';
  if (window.Shell && Shell.fit) Shell.fit();   // the frame adds 21 px each way: fit again

  /* Status bar colour follows what is under it: white text on a dark colour, black on a light one. It reads the first solid colour
     under the status bar's time (a coloured header, a brand panel, the page), and the page's own background when a photo or video is
     there. Re-checked when the page scrolls, the theme changes or the frame changes shape. */
  var themeMo = null, sbTimer = 0;
  function lum(c) { var m = (c || '').match(/[\d.]+/g); return m && m.length >= 3 && (m[3] == null || +m[3] > .5) ? 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2] : null; }
  function sync() {
    sbTimer = 0;
    var dark = false;
    try {
      var d = frame.contentDocument, w = frame.contentWindow, L = lum(getComputedStyle(d.body).backgroundColor);
      if (L == null) L = lum(getComputedStyle(d.documentElement).backgroundColor);
      var t = phone.querySelector('.statusbar__time'), tr = t && t.getBoundingClientRect(), fr = frame.getBoundingClientRect(), k = fr.width / (w.innerWidth || 1);
      if (tr && tr.width && k) {
        var x = (tr.left + tr.width / 2 - fr.left) / k, y = (tr.top + tr.height / 2 - fr.top) / k;
        if (x >= 0 && y >= 0 && x < w.innerWidth && y < w.innerHeight) {
          var stack = d.elementsFromPoint(x, y);
          for (var i = 0; i < stack.length; i++) {
            var el = stack[i], cs = w.getComputedStyle(el);
            if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(el.tagName) || (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage))) break;   // a photo: keep the page's colour
            var l = lum(cs.backgroundColor); if (l != null) { L = l; break; }
          }
        }
      }
      if (L != null) dark = L < 110;
    } catch (e) {}
    if (phone.classList.contains('is-dark-screen') !== dark) phone.classList.toggle('is-dark-screen', dark);
  }
  function soon() { if (!sbTimer) sbTimer = requestAnimationFrame(sync); }
  function watch() {
    if (themeMo) themeMo.disconnect();
    try { var h = frame.contentDocument.documentElement; themeMo = new MutationObserver(soon); themeMo.observe(h, { attributes: true, attributeFilter: ['class', 'style'] });
      frame.contentWindow.addEventListener('scroll', soon, { passive: true }); frame.contentWindow.addEventListener('resize', soon); frame.contentDocument.addEventListener('transitionend', soon, true); } catch (e) {}
    sync();
  }
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { setTimeout(sync, 50); });
  addEventListener('resize', soon);
  frame.addEventListener('load', watch);
  new MutationObserver(soon).observe(phone, { attributes: true, attributeFilter: ['class', 'data-duo'] });
  watch();
  window.PhoneFrame = { sync: sync };
})();
