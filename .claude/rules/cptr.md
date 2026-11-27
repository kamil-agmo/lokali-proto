---
name: cptr
description: "MATCH REQ (old name CPTR) = compare prototype to requirement; check every requirement against the screens and report what is met, partial or missing"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 401356a4-0c59-43d8-bba9-36556ce10d36
  modified: 2026-11-27T02:38:21.947Z
---

When the user says **MATCH REQ** (renamed from CPTR on 2026-11-27; CPTR still works), compare the prototype to the requirements: go through REQUIREMENTS.md (features by priority, user stories, screen list, policies) and check each item against the actual screens. Report met / partial / missing, with the screen as evidence. If there are several versions (e.g. a teammate's copy), check each and say who missed what.

**Why:** the user wants a repeatable requirement-coverage check, named like [[espe]].

**How to apply:** report only (no edits) unless asked; keep it short per [[be-brief]]; list gaps first, ranked by priority (Must before Should).
