---
name: dd-presenter-david
description: 'By David · Present a static HTML/CSS/JS prototype on a desktop: the screen where pages load (device skills frame it: dd-iphone-david, dd-iphone-duo-kamil), page list, "On this screen" card, password lock screen and reset, version and changelog, credits, light/dark control, and a slot for add-ons (dd-dev-mode-kamil for developers, dd-designer-mode-kamil for Figma). Asks first, as clickable options, for design system, colours, name, logo, texts, password and who designed it. Use when the user wants to present or share a prototype "in a phone", add a password or lock screen, list its screens, or "make it presentable".'
metadata:
  author: David
  credit: 'Presenter'
  marker: 'shell.config.js'
  version: 1.2.0
  tier: Start
  summary: 'Page list, summary, lock screen, credits; devices plug in.'
  requires: ''
---

# Presenter

**Made by David**

A small shell (no build step, no libraries) for presenting a prototype on a desktop. It owns the screen where pages load; device skills draw the device around it. Everything it shows comes from one file, `shell.config.js`.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## What you get

- **Left card:** grouped page list and "Replay"; logo, subtitle and version link at the top, with a quiet **Reset** icon beside the logo.
- **Centre:** the screen (402 × 874), scaled to fit. Plain on its own; a device skill frames it (see Devices).
- **Right card:** the screen's title, purpose and parts ("On this screen"). The live values a screen reports (`ProtoEmbed.report`) are not shown to viewers; they reach add-ons through the `<prefix>:facts` event and `Shell.facts()`, and dev mode shows them as **Live state**. Its top row is the **add-on slot** (`#addons`, hidden while empty).
- **Lock screen** over an `inert` shell; closing the tab locks it again (there is no "Back to lock screen" button). **Reset** starts the prototype again while staying unlocked: it clears what the screens stored, reopens the start page with a fresh load, and shows "Prototype reset · Undo" for 5 seconds (screens can call `ProtoEmbed.reset()`).
- **Credits** button under the right card (`references/credits.md`).

Neutral look with one accent from the brand colour; it never touches the screens (`references/architecture.md`). The lock is a soft gate: the password sits in a JS file, so never call it security. Not for apps with a backend.

## Devices (each its own skill, installed only when chosen)

- **dd-iphone-david:** the iPhone frame, status bar and Dynamic Island.
- **dd-iphone-duo-kamil:** the foldable iPhone; with dd-iphone-david, tabs switch between them; alone, Duo only.
- **dd-desktop-kamil:** desktop pages full-window, no frame. **dd-admin-panel-kamil** reads the app and builds its admin panel on it.

`SHELL.devices` lists the device skills shown (their installers fill it). None: pages show in a plain screen, and `check.py` notes it.

## Add-ons (each its own skill, installed only when chosen)

- **dd-dev-mode-kamil:** for developers: inspector, Sections, image and animation export, own dev password.
- **dd-designer-mode-kamil:** for designers: copy one screen or all screens into Figma with one ⌘V (auto layout, components).
- **dd-figma-components-sebastian** (separate, by Sebastian): one ⌘V into Figma as native auto layout with components, variants and properties. Designer mode uses its engine on presenter prototypes; on its own it works on prototypes whose screens sit in one page.
- **dd-desktop-kamil** (desktop screens), **dd-iphone-duo-kamil** (foldable mode), **dd-design-system-kamil** (its button) use the same hooks (`<prefix>:show`, `window.Shell`). Pass round 4's answers on so they are not asked twice.

## Step 0: ask first, as clickable options (do not guess)

Ask with **AskUserQuestion** in **four rounds** (up to 4 questions each, recommended option first, every option explained: what it does and what it changes). Full wording and effects: `references/intake.md`; design systems: `references/design-systems.md`.

1. **What is being built:** design system, light/dark mode, intro.
2. **Name and colours:** product name, colour theme (run `scripts/suggest_theme.py --project <project>` first if screens exist), logo, subtitle.
3. **Lock screen:** password now or after the first deploy; taglines; counters; footer.
4. **Credits, add-ons, devices:** who designed it ("Design by"), anyone to thank, add-ons (Dev mode, Designer mode), shell matching the prototype's font, devices (iPhone, iPhone Duo, desktop).

Never invent a password. On claude.ai (no AskUserQuestion) ask the same rounds as numbered lists. Summarise the answers in one paragraph, then go ahead.

## Workflow

1. **Scaffold** (`--strict` refuses to run until every answer is in; existing files are kept unless `--force`):
   ```bash
   python3 <skill>/scripts/scaffold.py --dest <project> --strict --name "<Product>" --password "<lock password>" --design "<designer>" \
     --design-system <material|hig|fluent|carbon|custom|none> --color-mode <light|dark|both> --color "primary|#..." [--thanks "<name>"] \
     --logo <file|none> [--logo-lock <file>] --tag "<subtitle>" --accent "<#colour>" --replay <none|intro|restart> \
     --tagline "<line>" ... --stat "<n>|<suffix>|<label>" ... --footer "<text>"
   ```
   `--password-later` sets the password after deploying; `--no-credits` drops the Credits button.
2. **Describe the screens** in `shell.config.js`: `pages` (group, title, src, desc, parts), `tree` (accordion order, every page once), `startPage`, `replay`, lock text.
3. **Wire every screen:** in `<head>` `../shell.config.js` then `../js/shared/lock-guard.js`; before `</body>` `../js/shared/embed.js` and `ProtoEmbed.report('<page-id>', [...])`. Links go through the shell (`parent.location.hash = '<page-id>'`); see `assets/template/pages/home.html`.
4. **Check:** `python3 <skill>/scripts/check.py --project <project>`; fix every error.
5. **Verify in a browser** over http at 1380 px or wider: lock, links, reset, direct URLs, credits (`references/architecture.md`, "Browser checks").
6. **Devices, then add-ons:** run the chosen device skills (dd-iphone-david first, then dd-iphone-duo-kamil, dd-desktop-kamil; dd-admin-panel-kamil once the phone screens exist), then the add-ons; they refresh the credits.
7. **Suggest icons next** (dd-icons-kamil), before screens are built.
8. **Tell the user:** soft-gate password (or not set yet), `shell.config.js` to edit, `DESIGN.md` for the brief.
9. **Password left for later:** after the first successful deploy, ask for it, set `password`, delete `passwordLater`, deploy again. Until then warn on every deploy that anyone with the link can open it.

## Version and changelog

`version` in `shell.config.js` shows as "v1.2.3" under the tag and links to `CHANGELOG.md`. Bump it on every deploy: **+0.0.1** small fix, **+0.1** layout change or new screen, **+1.0** redesign or new flow (several changes: the largest bump once). Add the entry first: newest on top, `## <version> · <date>`, one line per change. New projects start at 0.1.0; an existing shared one without a version starts at 1.0.0.

## Last step: make things make sense

Light/dark: screens follow the system appearance; with a dark mode (`html.dark`) set `appearance: true` (System | Light | Dark in the left card). No light/dark switch inside the screens unless asked.

As a first-time viewer, check:
- The page list, "On this screen" and the screen tell the same story.
- Lock text, password state and credits read right; credits name the designer and only skills in use.
- The version link opens `CHANGELOG.md`, whose newest entry matches.

Report what changed and what you could not check.

## Reference files

`references/intake.md` (questions and scaffold command) · `references/architecture.md` (files, protocol, browser checks, colours, frame) · `references/lock-and-reset.md` · `references/design-systems.md` · `references/credits.md` · `references/background.md` (decisions, extending).
