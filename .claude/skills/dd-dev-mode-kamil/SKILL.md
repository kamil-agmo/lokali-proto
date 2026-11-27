---
name: dd-dev-mode-kamil
description: 'By Kamil, with Norman · Add dev mode to a dd-presenter-david prototype, for developers - an inspector (spacing, type, colour and tokens), Sections that outline each part of the screen, image downloads, and animation export to Flutter, SwiftUI, Compose, Lottie, CSS and more, behind a dev password. An add-on: asks first, as explained options. Use when the user wants developers to inspect or measure the prototype, a handoff for developers, "let devs check the spacing", design tokens shown on elements, or exporting images or animations as code.'
metadata:
  author: Kamil
  contributors: 'Norman'
  credit: 'Developer inspector'
  marker: 'devmode.config.js'
  version: 1.0.3
  tier: Share & hand-off
  summary: 'Inspector and code exports for developers.'
  requires: 'dd-presenter-david'
---

# Developer inspector (add-on for dd-presenter-david; its button in the prototype says "Inspect")

**Made by Kamil**, with Norman

An inspector and export toolbox in the presenter's right card, plugged into its add-on slot.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: ask first (do not guess)

If the kit or the presenter already chose dev mode, don't ask again. AskUserQuestion, options explained: **Dev mode** (yes / no) · **Dev password**: a different one typed now (Recommended, so reviewers can't switch it on) · after deploying · same as the lock password (every reviewer can open it). Never invent a password; say it's a soft gate.

## Install

```bash
python3 <skill>/scripts/install_devmode.py --project <project> --password "<dev password>"   # or --password-later
python3 <skill>/scripts/check_devmode.py   --project <project>
```

Copies the scripts and CSS, writes `devmode.config.js`, puts the Sections and Inspect buttons in the add-on slot, and refreshes the credits. Safe to re-run; your edited files are kept unless `--force`. Fix every error the check lists. Settings (`prefix`, token chips, `sections` selectors) and requirements: `references/inspector.md`. Credits live in the presenter's `shell.config.js`, not here.

Needs: http (not `file://`), a window at least **1380 px** wide (first thing to check when "the Inspect button is missing"), same-origin screens. `--password-later`: dev mode opens freely until a password is set after the first deploy.

## Verify

1. Over http at 1380 px+, unlock, press **Inspect**: a wrong password is rejected, the right one turns it green.
2. Hover an element: outlined, details with token chips; Shift + click pins.
3. **Sections:** sensible parts, clicking one isolates it.
4. **Live state:** the values the screen reports ("Liked 0") show under the download tools and change as the screen is used (the presenter's card no longer shows them).
5. **Download images:** count matches; one file and the zip download.
6. **Download animation:** pin a moving card; every format downloads (`tests/run_generators.sh` checks the generators without a browser).
7. "Back to lock screen" turns dev mode off.
7. Credits include Developer inspector.

Browser-pane tips: fetch changed files with `{ cache: 'reload' }`; use a 1440 × 900 viewport; screen capture is often blocked in embedded browsers.

## Last step: make things make sense

As a first-time developer: the button sits with the other add-ons, every panel label reads clearly, the tips explain each tool. Report what changed and what you could not check.

## Reference files

`references/inspector.md` (panel, tokens, Sections, images, settings) · `references/formats.md` (animation formats) · `references/extending.md` (`DevMode` API) · `references/background.md` (how it's built, limits).
