---
name: mock-rules
description: "Mocks must work when opened from disk and must make the difference obvious; no iframe CSS injection, no CDN icons; verify via file:// before reporting"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 401356a4-0c59-43d8-bba9-36556ce10d36
  modified: 2026-11-27T07:26:15.505Z
---

Every comparison mock (explore/*.html) must:
1. **Work opened from disk (file://)**, which is how the user opens them. Never rely on editing an iframe's `contentDocument` (blocked cross-origin on file://, fails silently, all variants look identical) or on the preview server (`localhost:8768`, `_canopy`).
2. **Be self-contained:** draw the compared part as plain HTML/CSS in the mock itself, with the live page's sizes; icons as inline SVG, no CDN stylesheets or fonts. Photos may stay Unsplash links ([[photos-as-links]]).
3. **Show only the part being compared, big enough to see**: crop to that strip/section and zoom it; label each option in one line saying what changed.
4. **Be verified as the user sees it:** open the file:// URL (preview_start with url) and screenshot it; the pane shows disk files as a snapshot without web photos, so also check photos through the local server. Check the options visibly differ.

**Why:** the sticky-title mock (2026-11-27) injected CSS into iframes; from disk the injection failed and the user saw four identical headers, twice, and asked that mocks never have this problem again.

**How to apply:** for every new mock, and fix older iframe-injection mocks (listing-fixes.html, listing-long.html) when they're next used. Related: [[espe]], [[mims]].
