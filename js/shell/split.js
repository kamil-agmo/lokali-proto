/* Two links, one config: index.html shows the guest and host app, admin.html shows only the admin portal (a-* pages).
   Set window.SHELL_VIEW = 'admin' before loading this file for the admin link. Load right after shell.config.js. */
(function () {
  'use strict';
  var S = window.SHELL; if (!S) return;
  var admin = window.SHELL_VIEW === 'admin';
  function keep(id) { return (id.indexOf('a-') === 0) === admin; }
  Object.keys(S.pages).forEach(function (id) { if (!keep(id)) delete S.pages[id]; });
  S.tree = (S.tree || []).filter(function (n) { n.children = n.children.filter(keep); return n.children.length; });
  if (admin) { S.desktop = Object.assign({}, S.desktop, { dock: false }); S.startPage = 'a-login'; S.tag = 'Admin portal · Prototype v1'; }
})();
