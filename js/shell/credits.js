/* Credits (presenter shell): a small "Credits" button under the right-hand card; its note slides down from behind the card.
   SHELL.credits = { design: 'Name', made: [{ skill: 'Presenter', by: 'David' }, { skill: 'Kit', by: 'Kamil', verb: 'compiled by' }], thanks: ['Name'] }
   Written as one inline line: "Design by Name · Presenter by David · Dev mode by Kamil & Norman · Typography & Icons by Kamil · Kit compiled by Kamil".
   Skills made by exactly the same people share one "by"; "Thanks to" leaves out anyone already credited. Leave `credits` out for no button. */
(function () {
  'use strict';
  var C = (window.SHELL || {}).credits, aside = document.getElementById('sideRight');
  if (!C || !aside) return;

  function and(list) { return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' & ' + list[list.length - 1]; }
  function names(by) { return String(by || '').split(/\s*(?:,|&|\band\b)\s*/).filter(Boolean); }
  var parts = [], credited = {};
  if (C.design) { parts.push('Design by ' + C.design); names(C.design).forEach(function (n) { credited[n.toLowerCase()] = 1; }); }
  var groups = [], byKey = {};
  (C.made || []).forEach(function (m) {
    if (!m || !m.skill || !m.by) return;
    var ppl = names(m.by), verb = m.verb || 'by', key = verb + '|' + ppl.map(function (n) { return n.toLowerCase(); }).sort().join('|');
    ppl.forEach(function (n) { credited[n.toLowerCase()] = 1; });
    if (!byKey[key]) groups.push(byKey[key] = { verb: verb, by: and(ppl), skills: [] });
    if (byKey[key].skills.indexOf(m.skill) < 0) byKey[key].skills.push(m.skill);
  });
  groups.forEach(function (g) { parts.push(and(g.skills) + ' ' + g.verb + ' ' + g.by); });
  var thanks = (C.thanks || []).filter(function (n) { return !credited[String(n).toLowerCase()]; });
  if (thanks.length) parts.push('Thanks to ' + and(thanks));
  if (!parts.length) return;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  var box = el('div', 'credits'), drop = el('div', 'credits__drop'), clip = el('div', 'credits__clip'), note = el('div', 'credits__note');
  drop.id = 'creditsDrop'; drop.setAttribute('aria-hidden', 'true'); note.setAttribute('role', 'note');
  note.appendChild(el('h3', '', C.title || 'Credits'));
  note.appendChild(el('p', '', parts.join(' · ')));
  clip.appendChild(note); drop.appendChild(clip);
  var btn = el('button', 'credits__btn', C.button || 'Credits'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'creditsDrop');
  box.appendChild(drop); box.appendChild(btn); document.body.appendChild(box);

  function set(open) { drop.classList.toggle('is-open', open); drop.setAttribute('aria-hidden', String(!open)); btn.setAttribute('aria-expanded', String(open)); }
  function place() {   // 18 px of the box sit behind the card, so the note appears to come out from under it
    var r = aside.getBoundingClientRect();
    if (!r.width || getComputedStyle(aside).display === 'none') { box.style.display = 'none'; return; }
    box.style.display = ''; box.style.left = r.left + 'px'; box.style.width = r.width + 'px';
    // a card that reaches the bottom of the window (full-height panels, dd-desktop-kamil) has no room below it:
    // the button sits inside the card's bottom edge and the note opens upwards
    var full = r.bottom >= innerHeight - 24;
    box.classList.toggle('is-up', full);
    if (full) { box.style.top = 'auto'; box.style.bottom = Math.max(0, innerHeight - r.bottom) + 12 + 'px'; }
    else { box.style.bottom = ''; box.style.top = (r.bottom - 18) + 'px'; }
  }
  btn.addEventListener('click', function () { set(!drop.classList.contains('is-open')); });
  document.addEventListener('mousedown', function (e) { if (drop.classList.contains('is-open') && !e.target.closest('.credits')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drop.classList.contains('is-open')) set(false); });
  window.addEventListener('resize', place);
  if (window.ResizeObserver) new ResizeObserver(place).observe(aside);
  aside.addEventListener('transitionend', function (e) { if (e.target === aside) place(); });   // the card slid in or out (drawers)
  setTimeout(place, 0);
  window.ShellCredits = { text: function () { return parts.join(' · '); }, place: place };
})();
