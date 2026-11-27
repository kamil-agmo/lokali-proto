---
name: dd-accessibility-kamil
description: 'By Kamil · Accessibility for prototypes: checks every screen for colour contrast, tap target size, alt text, labels on icon buttons and fields, heading order, zoom and text size, focus and reduced motion (WCAG 2.2 AA with Apple and Google sizes), reports only what fails, and fixes it with the design system''s tokens. Use when the user asks for accessibility, a11y, WCAG, contrast, tap or touch target size, screen readers, VoiceOver or TalkBack, or before sharing a prototype with a client.'
metadata:
  author: Kamil
  credit: 'Accessibility'
  marker: 'DESIGN.md::(?m)^## Accessibility'
  version: 1.0.0
  tier: Look & feel
  summary: 'Contrast, tap size and alt text checks.'
  requires: ''
---

# Accessibility

**Made by Kamil**

A prototype that people can read, tap and hear. Targets: **WCAG 2.2 AA**, Apple's **44 × 44 pt** and Google's **48 × 48 dp** tap targets. The script does the measuring and prints only the failures, so the conversation stays short.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: ask first

Skip what `DESIGN.md` "## Accessibility" already answers. AskUserQuestion, recommended first, every option explained:

1. **Level:** WCAG 2.2 AA (recommended: the usual requirement) · AAA for text contrast (7 : 1; for older users or public-sector briefs).
2. **Tap targets:** 44 × 44 (recommended, Apple; iPhone-first) · 48 × 48 (Google; Android-first).
3. **Fix:** Report, then fix with tokens (recommended) · Report only.

Then `python3 <skill>/scripts/a11y_check.py section --project <project> --level AA --target 44`.

## Step 1: check

```bash
python3 <skill>/scripts/a11y_check.py check --project <project>          # code check + live check (contrast, tap size) in headless Chrome
python3 <skill>/scripts/a11y_check.py check --project <project> --static # code check only (no Chrome, e.g. claude.ai)
```

Code check: missing `alt`, icon-only buttons and links without a name, fields without a label, `lang`, heading order, zoom blocked, positive `tabindex`, autoplay. Live check (phone width 402 px): text contrast and targets smaller than the chosen size. Each finding names the page, the element and the fix; at most 8 per kind per page.

## Step 2: fix

Fix in the shared styles, not per screen: a darker token for low contrast (the design system's colours, `dd-design-system-kamil`), `min-width/min-height` or padding on small targets, `aria-label` on icon buttons in the interface's wording (`dd-ux-writing-kamil`), visible labels on fields. Details per finding: `references/fixes.md`. Run the check again until it is clean or each remaining finding is deliberate (`data-a11y-ok` on the element, with a reason in `DESIGN.md`).

## Last step: make things make sense

Read one main flow with the eyes of someone with low vision and someone using VoiceOver: every control has a name, text is readable on its background, nothing important is colour only, text still fits at 200 % zoom. Report fixed / left on purpose.
