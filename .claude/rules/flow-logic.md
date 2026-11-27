---
name: flow-logic
description: "Every Back / Close / Done must go where the user logically came from in the flow, never jump to Home; check it on every screen built or changed and in every MIMS"
metadata:
  type: feedback
---

**Always on, and part of MIMS.** For every screen I build or change, and every screen in a MIMS pass, trace the flow: where can a user arrive from, and where does each Back / Close / Done / Cancel / Keep / Save take them?

Rules:
- **Back returns to the screen the user came from** (the previous step in the flow), not to a tab's root or Home. A screen with several entry points goes back to the one actually used (history), with a sensible fallback to its parent in the flow.
- **Forward-only steps don't loop back into a finished flow:** after paying, Back from Confirmed goes to the experience or My bookings, never to Checkout.
- **Close (×) on a modal step** returns to the screen that opened it.
- **Done / Save / Submit** lands on the screen that shows the result (e.g. Save slot → Calendar with the new slot), not Home.
- **Tab root screens have no Back.**
- Check the presenter menu too: opening a screen from the menu must still give a sensible Back.

**Why:** the user found back buttons that jumped to the homepage instead of the previous screen (2026-11-27) and asked me to learn it: flows must behave logically, and MIMS must include it.

**How to apply:** in every MIMS add a "Flow" block: list each screen's entry points and each exit button with its target; flag anything that jumps out of the flow. Test by clicking through in the browser, not only by reading code. Related: [[mims]], [[dupe]].
