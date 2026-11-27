---
name: dd-credits-kamil
description: 'By Kamil · Credits for any prototype made with the Design Department kit - who designed it and who made each skill it uses - shown everywhere it makes sense - a credits.html page, CREDITS.md, a quiet console line, the presenter''s Credits button, a small Credits pill on pages without the presenter, and a Credits frame in the Figma paste. Always installed with the kit; other skills run it. Use when the user asks about credits, "who made this", adding their name as designer, thanking someone, or after adding a kit skill to a project.'
metadata:
  author: Kamil
  version: 1.0.0
  tier: Always
  summary: 'Shows who designed the prototype and who made each skill.'
  requires: ''
---

# Credits (always part of the kit)

**Made by Kamil**

Every prototype credits its designer and the people who made the skills it uses, with or without the presenter. Not picked by anyone: the kit, the skills site and every download include it, and the other skills run it after they install. It credits no one for itself.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## The line

> Design by Aisyah Rahman · Presenter & iPhone by David · Dev mode by Kamil & Norman · Designer mode, Typography & Icons by Kamil · Kit compiled by Kamil

"Design by" first (always asked: who designed it); skills made by exactly the same people share one "by", and only skills the project uses; "Thanks to" only for people not already credited. No "A … production" wording.

## Where it shows

| Place | When |
|---|---|
| `credits.html` (styled page, light and dark) | always; anyone with the link: `…/credits.html` |
| `CREDITS.md`, `credits.json` | always, in the project folder |
| Browser console: "Made with Design Department skills" | always, once per window |
| Presenter's Credits button (under the right card) | with dd-presenter-david (`credits` in `shell.config.js`; `credits: null` turns the button off) |
| Small "Credits" pill, bottom-left | pages without the presenter, windows 900 px or wider only; fades back after 4 s; `--no-pill` leaves it out |
| A "Credits" frame in the Figma paste | Designer mode's Copy all screens |

## Run

```bash
python3 <skill>/scripts/credits.py --project <project> [--design "<designer>"] [--thanks "<name>"]   # safe to run again
python3 <skill>/scripts/credits.py --project <project> --list                                         # only print the line
```

Design and thanks are remembered (in `shell.config.js` with the presenter, else `credits.json`). It links `js/shared/credits-data.js` and `js/shared/credits-badge.js` into every page once (`--no-link` to skip). Presenter, Designer mode, Dev mode, iPhone Duo and the prototype kit run it for you.

## A new skill gets credited

Its SKILL.md header needs `metadata: author` (the lead maker; co-makers in `contributors`), `credit` (its name in the credits) and `marker` (a file only it creates in a project; `glob::regex` looks inside files; `*` means always). Nothing here needs editing.

## Ask first

Who designed the prototype ("Design by"), if nobody has asked yet; anyone else to thank. Never guess a name.

## Last step: make things make sense

Open `credits.html` and one page: the line reads naturally, nobody is listed twice, only skills the prototype uses. Report the line.
