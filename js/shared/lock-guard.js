/* Include in the <head> of every screen, right after <script src="../shell.config.js">.
   When a screen is opened on its own (not inside the shell) and the password has not been entered this session, the visitor is sent
   to the lock screen first. Inside the shell the shell's own lock cover does this job.
   The storage key comes from shell.config.js, so changing the prefix there is enough. If the config is missing the guard stays out of the
   way (a missing config must never trap a visitor in a redirect loop). */
(function () {
  try {
    if (window.parent !== window) return;
    var S = window.SHELL, me = document.currentScript && document.currentScript.src;
    if (!S || !me || !S.password) return;   // no lock password yet: nothing to guard
    if (/\/pages\/lock\.html$/.test(location.pathname)) return;
    if (sessionStorage.getItem(S.prefix + '-unlocked')) return;
    location.replace(me.replace(/js\/shared\/lock-guard\.js.*$/, '') + 'pages/lock.html');
  } catch (e) {}
})();
