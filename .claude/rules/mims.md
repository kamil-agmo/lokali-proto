---
name: mims
description: "MIMS = \"make it make sense\": judge every element by its real use for this product, its data scale and the requirements; cut decoration that borrows a pattern without the reason behind it"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 401356a4-0c59-43d8-bba9-36556ce10d36
  modified: 2026-11-27T05:36:52.370Z
---

**Requirements first, before any verdict:** list the assumptions my verdicts rely on (e.g. "every booking is confirmed instantly", "a Calendar button belongs here") and check each against REQUIREMENTS.md, read for intent ([[read-intent]]). Each verdict then cites the requirement it serves or is marked "suggestion, not in the brief". The requirements block goes at the top of the report, not as an afterthought at the end.

When the user says **MIMS** (make it make sense), go through the screen(s) element by element and ask, for each one:
1. **What is it for?** Name the job it does for the user in one line. If I can't, it goes.
2. **Does that job work here?** A pattern borrowed from another product only earns its place if its reason holds for ours (scale, data, audience). Example: Airbnb's price histogram helps with thousands of listings; with ~64 Lokali experiences the bars are sparse and say nothing.
3. **Is it in the requirements?** Check REQUIREMENTS.md. If not, it is a suggestion at best: keep only if it clearly helps, and mark it.
4. **Is it decoration around the control that does the real work?** If another element already does the job (slider + fields filter price), the extra one goes.
5. **Does it lead the tester down the story we actually built?** Look at it as the person testing the prototype: what do they tap first, and where does it lead? The first and most prominent thing on any entry screen must open the complete path (Lokali: Pak Rahim's Mangrove & fireflies, the only fully written listing and the one the guest + host story follows). Never pick order or prominence for looks alone (I once led Featured with the reef for its colourful photo, which sent testers into a half-empty page); fix the looks another way (e.g. a vivid photo for the main item).
6. **Does it meet the requirements?** Always run a MATCH REQ pass ([[cptr]]) on the screen against REQUIREMENTS.md, read for intent ([[read-intent]]): name the requirement each part serves, flag parts that serve none (suggestions must be marked, e.g. Q-numbers), and flag requirements this screen should meet but doesn't.
7. **Does it follow the main style (Airy, Home is the reference)?** Check against [[airy-style]] / DESIGN.md: type sizes and weights, greys, red only for actions, gold star, pills, photo radius, no card containers, hairline sections, 24px margins. Flag every drift with the Home value it should be (e.g. "section title 20 → 18/700").
8. **Real-world size and colour:** would people actually see a control this size or colour in real apps? Measure it against the platform (iOS switch 51x31, buttons 44 tap height, Home's values); flag anything oversized or undersized. One control uses one colour (a destructive row has a red icon AND red text, never mixed).
9. **Weight matches consequence:** an action that changes the user's whole flow or mode (Become a host / Switch to hosting, sign out, delete) must look different from routine rows: highlight flow-changing actions (soft block, photo, red pill), mark destructive ones red; routine settings stay plain.
10. **Whose is it?** Every photo, name and badge must belong to the person and moment on screen: on the guest's own Account, show *her* photo, never a host's (Pak Rahim on "Become a host" made no sense). When an action earns something (the blue verified-host tick), show that reward on the user's own photo so the payoff is visible.
11. **Danger is set apart:** destructive actions (Delete account, cancel booking) never sit in the same group as routine rows; give them their own section with clear space above, red icon + text, and a one-line consequence ("Deletes your profile, messages and reviews for good").
12. **Does it belong on this page at all?** Not everything has to be chunked into one long page. For each section ask: does someone need it *here, at this moment*? If it is detail, reference, or a different task, move it behind a tap (its own page, a sheet, "Show all") and leave a one-line entry point. A brief listing items for a screen means "reachable from here", not "all stacked here" ([[read-intent]]). Example: the long experience page; reviews with host replies live on the All reviews page, not the listing.
13. **Labels say what they mean, counts tell the truth:** a group header or badge must answer "what is this item about?" on its own ("Upcoming" alone said nothing; "Trip in 4 days · Sun, 6 Dec" does). Any count or indicator must match the data (a "1 unread" line with 2 unread dots is a bug). Filters, tabs and group headers only earn a place at a scale that needs them (4 threads need none).
14. **If it floats, it must look like it floats; otherwise dock it.** Anything that stays put while content scrolls under it (sticky strip, FAB, bottom bar, tab bar) needs a visible elevation cue: solid background, soft shadow (or blur), a clear gap from the screen edges, and the same treatment as the other floaters (Home tab bar, Results Map pill). If it shouldn't look raised, dock it: attach it full-width to an edge (under the header / above the home bar) with a hairline divider. Never a flat, shadowless card sticking over scrolling content. Watch global "no shadow" rules that strip a floater's shadow (Chat booking strip, 2026-11-27).
15. **Does every exit go where it logically should?** Back returns to the screen the user came from (not Home or a tab root); Close returns to the opener; Done / Save lands on the result. Trace every entry point and click through it ([[flow-logic]]).
Also apply [[dupe]] (same thing or same meaning twice) as part of MIMS.

Report **briefly**: one line per element, then one short "Requirements" block, one short "Flow" block (exits that go to the wrong place) and one short "Airy" block (drifts only) — element → use (or none) → keep / cut / change. No long walk-through of the four questions; just the verdicts and the fix. Then do the cuts the user approves.

**Why:** the user defined MIMS from my explanation of the Search price graph (2026-11-27) and wants this reasoning applied whenever they ask to make things make sense, without having to ask "what's the use of it?" per element.

**Extended 2026-11-27:** the user asked that MIMS always include the requirements check and the Airy Home style check; later the same day, real-world sizing (an oversized Account switch) and weight-matches-consequence (Become a host buried as a plain row, mixed-colour Delete account).

**Sweep the siblings:** when I restyle one screen, run MIMS on the other screens in the same flow / tab bar before saying the style is done (I restyled Bookings, Account and Chat but left Inbox with giant uppercase headers and a big switcher, 2026-11-27).

**Keep the presenter in sync:** after changing a screen, update its shell.config.js desc + parts ("On this screen") in the same turn; the Summary panel went stale for 11 guest screens (2026-11-27).

**How to apply:** also run this quietly on anything I build; surface anything that fails before the user finds it. Related: [[airy-style]], [[espe]].
