---
name: dd-phone-install-kamil
description: 'By Kamil · Make a static HTML/CSS/JS mobile prototype fit a real phone and install as a home-screen app: status-bar and safe-area spacing (no gap at the top, nothing under the notch or home bar), the first screen full screen on a phone, a manifest with icons, a service worker, and an install banner or row. Use when a prototype looks wrong on a phone (a gap, overlap or cut-off at the top or bottom), or for "add to home screen", "install as app", PWA, standalone or an app icon. Not for tablet or desktop layouts.'
metadata:
  author: Kamil
  credit: 'Install on phone'
  marker: 'manifest.webmanifest'
  version: 1.0.1
  tier: Share & hand-off
  summary: 'Fits real phones and installs to the home screen.'
  requires: ''
---

# Install on phone

**Made by Kamil**

What changes when a prototype is opened on an actual phone:
1. **Fit:** room for the status bar and home indicator: no content under the notch, no empty band at the top.
2. **Full screen:** on a phone the first screen opens by itself, with no frame.
3. **Install:** manifest, icons and a service worker, plus a banner or row explaining how to add it to the home screen.

Plain files, no build step. Works with or without dd-presenter-david (the only link is the `html.in-phone` class, which keeps the frame's 62 px top room). Not for tablet or desktop layouts, offline use or app stores. Install needs https (localhost counts).

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: look, then ask (do not guess)

Look first: the entry page, whether `index.html` is a presenter shell, the app name and brand colour (`shell.config.js`, `DESIGN.md`), any logo. Then AskUserQuestion, what you found as the recommended answer, every option explained (wording: `references/questions.md`): **App name** · **Icon** (found logo, a square icon, or a lettered one) · **Colours** · **On a phone** (first screen full screen, or the frame) · **Install tip** (banner, banner and row, or none). Install nothing before the answers.

## Workflow

1. **Icon:** a transparent logo as `--mark`; a square icon of 512 px or more as `--icon`; a lettered icon: a small SVG letter as `--mark` with the brand colour as `--icon-bg`.
2. **Install** (safe to run again):
   ```bash
   python3 <skill>/scripts/install.py --project <project> --name "<App name>" --theme-color "#2563eb" --mark <logo.svg> --icon-bg "#ffffff"
   ```
   Options: `--short-name` (12 characters or fewer), `--icon-bg2`, `--start-url`, `--entry`, `--status-bar black-translucent` (dark or full-bleed iPhone screens), `--no-redirect`, `--skip-dir`, `--force`.
3. **Check:** `python3 <skill>/scripts/check.py --project <project>`: fix every `ERROR`, read each `warning`; the `review:` lines are places in the project's CSS for you to decide.
4. **Convert the screens:** top bars and content start use `var(--sb)`, bottom bars and sheets add `var(--safe-b)`, full height uses `100dvh` (`references/real-phone-fit.md`). Work through the `review:` list.
5. **Optional install row** on a settings or profile screen: `assets/snippets/install-row.html` (hidden unless installing is possible).
6. **Verify** at about 375 × 812 over http: `/` opens the start screen without a frame, `/?shell` shows it; the banner appears after about 1.4 s (`?install` forces it), its steps open, "Not now" sticks after a reload; every changed screen looks right. Real iPhone and Android over https are the only true test: say so.
7. **Tell the user** what changed, which `review:` lines are left, that the real-device check is theirs (both install paths, one line each), that an installed phone keeps the old icon until re-added, and that "Not now" hides the banner for a week.

How `--sb` and `--safe-b` are worked out (frame, browser tab, installed app) and why `viewport-fit=cover` matters: `references/real-phone-fit.md`.

## Last step: make things make sense

Launch screen (Apple HIG): almost like the first screen, no text or logo.
- At a real phone width nothing hides under the notch or home indicator, and there's no empty band at the top.
- The banner or row appears only where installing is possible, with the visitor's platform's steps.

Report what changed and what you could not check.

## Reference files

`references/questions.md` · `references/real-phone-fit.md` (variables, retrofitting, gaps, `100dvh`, fields, redirect, real phones) · `references/install-flows.md` (what each platform shows, banner, row, testing) · `references/icons-and-manifest.md` (icons, `--mark` vs `--icon`, maskable zone, manifest, hosting) · `references/background.md` (decisions, limits, what goes where). Tests: `node tests/test_install_logic.js`.
