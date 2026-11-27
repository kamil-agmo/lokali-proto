---
name: dd-iphone-david
description: 'By David · Show a dd-presenter-david prototype in an iPhone frame (iPhone 17 Pro, 402 x 874 screen) - the black frame, Dynamic Island, a status bar with time, signal, Wi-Fi and battery that turns white on dark screens, and the home indicator. A device skill: the presenter alone shows pages in a plain screen. Use when the user wants the prototype "in an iPhone", a phone frame, mockup frame, Dynamic Island or status bar, or iPhone and iPhone Duo side by side.'
metadata:
  author: David
  credit: 'iPhone'
  marker: 'shell.config.js::devices:\s*\[[^\]]*iphone'
  version: 1.0.1
  tier: Screens & devices
  summary: 'The iPhone frame, status bar and Dynamic Island.'
  requires: 'dd-presenter-david'
---

# iPhone (device skill for dd-presenter-david)

**Made by David**

Puts the presenter's screen inside an iPhone. The presenter owns the screen (where pages load, scaling, page list, summary); this skill only draws the device around it. Without any device skill the pages show in a plain card of the same size.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## What it adds

- The frame: 1.5 px edge + 9 px black bezel, screen corners 58 px, a soft shadow. Screen 402 x 874 (iPhone 17 Pro), from the presenter's `--phone-w` / `--phone-h`.
- Dynamic Island (95 x 37 px, 14 px from the top) and the home indicator. Pages keep clear of them (dd-phone-install-kamil sets the safe areas).
- Status bar: 9:41, signal, Wi-Fi and battery; white over a dark screen, black over a light one (it reads the colour under the time).

## Devices

`SHELL.devices` in `shell.config.js` lists the device skills shown, in order: `'iphone'` (this skill), `'duo'` (dd-iphone-duo-kamil). The iPhone | iPhone Duo tabs appear only when both are there. iPhone Duo only: leave this skill out (or `--remove` it); the Duo bundles the same frame files.

## Step 0: ask first

If the presenter or the prototype kit already asked which devices, do not ask again. Otherwise ask (AskUserQuestion, options explained): **iPhone (Recommended)**: pages in an iPhone frame · **iPhone and iPhone Duo**: tabs to switch (then run dd-iphone-duo-kamil) · **iPhone Duo only** (dd-iphone-duo-kamil, without this skill) · **No device**: a plain screen (desktop-only prototypes use dd-desktop-kamil).

## Install

```bash
python3 <skill>/scripts/install_iphone.py --project <project>           # safe to run again
python3 <skill>/scripts/install_iphone.py --project <project> --check   # only check the wiring
python3 <skill>/scripts/install_iphone.py --project <project> --remove  # iPhone out of the device list
```

It copies `css/shell/phone-frame.css` and `js/shell/phone-frame.js`, links them right after the presenter's own files (before `js/shell/duo.js`), adds `'iphone'` to `SHELL.devices`, and the credits pick it up ("iPhone by David").

## Verify

1. Serve over http and open `index.html`: the page sits in the black iPhone frame with the island, the status bar (time left, three icons right) and the home indicator.
2. Open a page with a dark header: the status bar turns white; on a light one it is black.
3. Nothing of the page is under the island or the indicator (`dd-iphone-duo-kamil/scripts/camera-check.js` checks overlaps).
4. Desktop pages (dd-desktop-kamil) still fill the window with no frame.

## Last step: make things make sense

Look at it as a first-time viewer: it reads as a real iPhone, nothing is cut off or hidden by the island. Report what changed and what you could not check.
