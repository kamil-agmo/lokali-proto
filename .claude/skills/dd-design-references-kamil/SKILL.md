---
name: dd-design-references-kamil
description: 'By Kamil · Design references before designing: finds 3-5 real apps or sites that fit the brief, shows them side by side on a reference board with what to take and what to avoid, lets the user pick a direction, and records it in DESIGN.md so every screen follows it. Use at the start of a prototype or a new screen, or when the user wants references, inspiration, a moodboard, "what do similar apps do", or a design direction.'
metadata:
  author: Kamil
  credit: 'Design references'
  marker: 'DESIGN.md::(?m)^## References'
  version: 1.0.0
  tier: Start
  summary: 'Real designs to pick a direction.'
  requires: ''
---

# Design references

**Made by Kamil**

Good prototypes start from real, shipped design, not a template. This skill finds a few references that fit the brief, shows them side by side, and turns the pick into a direction in `DESIGN.md`. References inspire the layout, density, colour use and patterns; nothing is copied (no logos, artwork or screenshots go into the prototype).

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: ask first

Read `REQUIREMENTS.md` / `USER_STORY.md` / `DESIGN.md` first. AskUserQuestion, recommended first, every option explained:

1. **Scope:** Whole app look (recommended at the start) · One screen or flow (name it) · One component (e.g. a booking calendar).
2. **How many:** 3 (recommended: quick to compare) · 5 (wider range).
3. **Where from:** Apps in the same field (recommended) · Best-in-class apps from any field · Both. Named apps from the brief or the user always come first.

## Step 1: find (keep it lean)

Search the web (App Store / Google Play pages, the product's own site, public design galleries) for apps that match the scope. For each pick only: name, link, one image URL (a public screenshot), and three short notes: **Take** (what works), **Avoid** (what doesn't fit this brief), **Fits because** (the brief point it serves). Don't paste page text into the conversation; keep notes to one line each. Full search tips: `references/finding.md`.

## Step 2: show the board

Write the picks to a small JSON (format in `references/finding.md`), then:

```bash
python3 <skill>/scripts/make_board.py --data refs.json --out <scratch>/references.html
```

Open it in the browser (Claude Code) or share the file (claude.ai). Images load from their source; if one is blocked, the card shows the link instead. Then ask (AskUserQuestion): **which direction** (one reference, or a mix: "layout from A, colour use from B") and anything to avoid.

## Step 3: record the direction

```bash
python3 <skill>/scripts/make_board.py --data refs.json --pick "A,B" --note "Layout from A, calm colour from B" --design <project>/DESIGN.md
```

It writes `## References` in `DESIGN.md`: the chosen direction in one line, take / avoid per pick, and the links. Later steps (design system, components, screens) read it; say so in one line.

## Last step: make things make sense

Every reference fits the brief (users, platform, density), the direction is one clear sentence, and nothing copied ends up in the prototype. Report the direction and the board path.
