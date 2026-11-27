---
name: dd-typography-kamil
description: 'By Kamil · Set up or convert a static HTML/CSS/JS prototype''s typography (font family, heading font, default size, type scale, weights, line height) as CSS tokens, loading only the weights used. Always asks first which font, with a picker of every Google Font, then size, scale and weights. Use when the user wants to pick or change fonts, a type scale, text sizes or weights, "make the text bigger", "use Inter / Poppins / SF Pro", typography tokens or lighter fonts.'
metadata:
  author: Kamil
  credit: 'Typography'
  marker: 'DESIGN.md::(?m)^## Typography'
  version: 1.0.0
  tier: Look & feel
  summary: 'Fonts, type scale and weights as tokens.'
  requires: ''
---

# Typography (tokens, light font loading)

**Made by Kamil**

Sets the type as **custom properties on `:root`** (`--font-body`, `--font-heading`, `--fs-*`, `--lh-*`, `--fw-*`), loads **only the weights used** (or the system font, 0 KB), and writes the choices into `DESIGN.md`. Dev mode shows the tokens as chips.

Two modes: **start of project** (recommended, Workflow B) or **convert** (Workflow A).

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: ask first (do not guess)

AskUserQuestion, recommended first, every option explained (full wording, the size table and the picker steps: `references/questions.md`). Read `DESIGN.md` first: the design system decides what's recommended (HIG → system font and HIG scale; Material → Roboto and Material scale). Show sizes measured with `scripts/typo.py measure`.

1. **Font** (always first, even if the user named one): Browse all Google Fonts (the picker) · System font · two fitting fonts with measured size; **Headings**: same or different.
2. **Default size** (16 recommended; say who each size suits), **Scale**, **Weights**, **Line height**.
3. **Emphasis**, **Text size** (scale with the user's setting), **Scope** (screens, or shell too).

**Font picker:** `python3 <skill>/scripts/font_picker.py --out <scratch dir> --app "<App>" --accent "<colour>" --recommend "<fonts>"`, serve it over http outside the project, open it, then read `window.fontChoice` when the user says done. On claude.ai, list 8-10 fonts instead.

Summarise the choices in one paragraph, then go ahead.

## Workflow B: start of a project

1. `python3 <skill>/scripts/typo.py tokens --font "<Font|system>" [--heading-font "<Font>"] --base 16 --scale <hig|material|1.25|1.2|1.333> --weights 400,600 --line 1.5`: prints the link, the tokens, base rules and the download size.
2. Link in every screen's `<head>`, tokens at the top of the screen stylesheet (`rem` if text follows the user's setting).
3. Write the choices into `DESIGN.md` under "## Typography".
4. A usage note at the top of the stylesheet: tokens only, never raw numbers; a new weight goes into the font link.
5. `typo.py check --project <project>` before reviews and deploys.

## Workflow A: convert

1. `typo.py check` first, then ask.
2. Generate tokens, add link and tokens, replace each value with the **nearest** token (say which moved more than 1 px); drop unused weights.
3. Verify in a browser: font loaded (`document.fonts.check('16px "<Font>"')`), body at the chosen size, headings right, no overflow, fields at least 16 px.
4. `typo.py check` again: zero values left, or explained.

## Tell the user

Font and why, default size and who it suits, the scale (role → px), weights and total KB, what changed on screen, how to add a weight.

## Last step: make things make sense

Apple's rules: no light weights for reading text, one or two typefaces, check at a larger text size.
- Size and scale suit the app's users; headings, body and captions read as a clear hierarchy.
- No overflow or awkward wrapping; loaded weights match used weights.

Report what changed and what you could not check. Background: `references/background.md`.
