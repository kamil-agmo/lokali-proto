---
name: dupe
description: "DUPE = never show the same thing twice on one screen; run this check automatically on every screen I build or change, not only when the user says DUPE"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 401356a4-0c59-43d8-bba9-36556ce10d36
  modified: 2026-11-27T05:30:55.640Z
---

**Always on.** Before finishing any screen work (new screen, redesign, merge, style pass), check the screens touched for duplication, and fix it in the same turn. When the user says **DUPE**, do a full sweep of all screens.

What counts as a duplicate on one screen:
- the same feature twice (category chips at the top + a category grid lower down);
- the same fact twice (price or duration shown in two places; a selected value shown both as a summary label and as a tick/selected chip, e.g. "Kuala Selangor" top-right of an always-open "Where?" list that already ticks it);
- several links/buttons to the same place for the same intent;
- a label that can be misread as something else because it repeats nearby info (e.g. a selected place in the corner reads like "current location").
- **the same meaning in different words** — compare meaning, not wording. A screen title, a section heading and a field hint that all ask the same thing count as a duplicate (Search page: top bar "Search" + heading "Where?" + hint "Search destinations"). Keep one question; give each remaining label a different job (title = the question, hint = what you can type).

Fine repeats: list rows to their own detail pages; different intents to the same page (Back vs Keep booking); a summary value on a **collapsed** row (its only visible trace).

**Why:** the user keeps finding duplicates I added or left (Home chips + grid, Search "Kuala Selangor" + tick, "Nature" + selected chip) and expects me to catch them without being asked (2026-11-27).

**How to apply:** after editing, scan each touched screen top to bottom: "is anything here said or meant twice, in any words, or ambiguous?" Read titles, headings, hints, labels and buttons together as one sentence. Report what was removed. Related: [[espe]], [[cptr]], [[airy-style]].
