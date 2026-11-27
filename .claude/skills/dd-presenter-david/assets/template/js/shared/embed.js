/* Include on every screen, before </body>. Inside the presenter shell it adds the .in-phone class and gives the page three ways to talk
   to the shell. Opened on its own (for example on a real phone) it does nothing, and the page works as a normal website.
     ProtoEmbed.report('page-id', [['Label', 'value'], ...])  tells the shell which screen is showing (and extra facts for the right card)
     ProtoEmbed.reset()    start the prototype again: clear what the screens stored and reopen the start page (stays unlocked; Undo for a few seconds)
     ProtoEmbed.relock()   reset all progress and return to the lock screen (the page should ask for confirmation first)
     ProtoEmbed.replay()   run the shell's Replay action
   .in-phone lets a screen tell "inside the frame" (the shell draws a fake status bar, so leave room for it) from "on a real phone". */
(function () {
  'use strict';
  if (window.parent === window) return;
  var P = 'proto'; try { P = window.parent.SHELL.prefix || P; } catch (e) {}
  var TARGET = location.origin && location.origin !== 'null' ? location.origin : '*';   // the shell is same-origin; only fall back to * for file:// pages
  document.documentElement.classList.add('in-phone');
  // Appearance (presenter control): apply the stored light/dark choice and follow changes live
  var TK = null; try { var A = window.parent.SHELL.appearance; if (A) TK = A.key || P + '-theme'; } catch (e) {}
  function theme() { var v = ''; try { v = localStorage.getItem(TK) || ''; } catch (e) {} var h = document.documentElement; h.classList.remove('light', 'dark'); if (v) h.classList.add(v); }
  if (TK) { theme(); window.addEventListener('storage', function (e) { if (e.key === TK) theme(); }); }   // the dd-desktop-kamil add-on swaps it for in-desktop on desktop pages
  function send(type, extra) { var m = { type: P + ':' + type }; for (var k in extra) m[k] = extra[k]; window.parent.postMessage(m, TARGET); }
  window.ProtoEmbed = {
    report: function (id, facts) { send('page', { id: id, facts: facts || [] }); },
    reset: function () { send('reset'); },
    relock: function () { send('relock'); },
    replay: function () { send('replay'); }
  };
})();
