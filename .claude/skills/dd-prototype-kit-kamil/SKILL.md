---
name: dd-prototype-kit-kamil
description: 'By Kamil · The one-stop start for the Design Department prototype kit: runs every Design Department skill in order (requirements or a brief, presenter shell, iPhone frame, design system, typography, icons, components, screens, admin, iPhone Duo if wanted, phone install, deploy, passwords), checks what a project already has, asks each question once as explained options, and ends with a sense check. Use when the user wants to start a new prototype, "set up everything", "run the kit", continue an unfinished one, or asks which Design Department skill to use next.'
metadata:
  author: Kamil
  credit: 'Kit'
  marker: '*'
  verb: 'compiled by'
  version: 1.6.0
  tier: Start
  summary: 'Runs every step in order, from brief to deployed prototype.'
  requires: 'dd-requirements-kamil, dd-presenter-david, dd-iphone-david, dd-dev-mode-kamil, dd-design-system-kamil, dd-typography-kamil, dd-ux-writing-kamil, dd-design-references-kamil, dd-localized-content-kamil, dd-accessibility-kamil, dd-icons-kamil, dd-components-kamil, dd-phone-install-kamil'
---

# Prototype kit (runs all the Design Department skills, in order)

**Made by Kamil**

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

One guided run from an idea to a deployed prototype. It decides the order, checks what is done, hands each step to its own skill and passes answers along. Why this order, and what each step hands to the next: `references/order-and-handoffs.md`.

## The steps

| # | Step | Skill |
|---|---|---|
| 1 | Brief and user story | dd-requirements-kamil if there are requirement files, else this skill |
| 1b | Design references: a direction from real apps, recorded in `DESIGN.md` | dd-design-references-kamil |
| 2 | Presenter shell, design brief, designer's name, add-on and device choice | dd-presenter-david |
| 2a | iPhone frame (unless iPhone Duo only or desktop only) | dd-iphone-david |
| 2b | Add-ons (only those chosen; dev mode before the design system, whose Rules check needs it) | dd-dev-mode-kamil, dd-designer-mode-kamil |
| 3 | Design system | dd-design-system-kamil |
| 3b | Typography | dd-typography-kamil |
| 3c | UX writing: voice, case and terms in `DESIGN.md` | dd-ux-writing-kamil |
| 4 | Icons | dd-icons-kamil |
| 5 | Components | dd-components-kamil |
| 5b | Localized content: market, language and names in `DESIGN.md`; data from `content.py gen` | dd-localized-content-kamil |
| 5c | Map (only if screens need one: store finder, nearby, tracking, map dashboard) | dd-map-kamil |
| 6 | Screens | this skill |
| 6b | Accessibility: check and fix contrast, tap size, names and labels | dd-accessibility-kamil |
| 7 | Admin panel (only if wanted): reads the app (or, admin only, the brief), proposes and builds the admin screens | dd-admin-panel-kamil (on dd-desktop-kamil) |
| 7b | iPhone Duo (only if wanted, with or without the iPhone; closed and open first) | dd-iphone-duo-kamil |
| 8 | Phone fit and install (needs every screen) | dd-phone-install-kamil |
| 9 | Deploy (only when asked) | this skill |
| 10 | Passwords left for later | dd-presenter-david (lock), dd-dev-mode-kamil (dev) |

**Admin only** (the client wants just the admin or web portal, no phone app): steps 1, 2 (Devices: Desktop only), 2b, 3-5, then 7 from the brief. Skip 2a, 6, 7b and 8: there are no phone screens.

## Step 0: where are we

1. **Find the project:** a named folder or the current one (`shell.config.js`, `pages/`); otherwise ask where to create it (suggest `./<AppName>`).
2. **Status:** `python3 <skill>/scripts/kit_status.py --project <project>` (done `[x]`, partly `[~]`, not started `[ ]`, skipped `[-]`).
3. **Ask which steps** (AskUserQuestion, `multiSelect`, every option explained): **Everything not done yet (Recommended)** · Look and feel only (typography, icons, components) · Make it shareable (phone install, deploy, passwords) · Add iPhone Duo · Pick steps myself. Name the done steps in the question.
4. **Say the plan in one line** and keep it as the task list.

## Running each step

1. Announce it in one line.
2. Load that skill now, not earlier (on claude.ai it may carry a prefix; if both `dd-presenter-david` and the old `kamilttd-presenter-dev-shell` exist, use `dd-presenter-david`).
3. Follow it, but **never ask again what an earlier step answered**: pass it in as the answer or the "(Recommended)" option (`references/order-and-handoffs.md`, the hand-off table).
4. Let it run its own last check, mark it done, move on. If it fails or the user stops, say exactly how to continue ("run the kit again; it picks up at icons").

## Step 1: brief and user story

Ask first whether there are requirement documents: **Yes** runs dd-requirements-kamil · **No** asks one round (kind of app, platform, audience, admin screens, iPhone Duo) and writes `USER_STORY.md` with 5-8 stories. An existing `REQUIREMENTS.md` skips both. Full questions: `references/order-and-handoffs.md`.

## Step 6: screens

Build from `USER_STORY.md` with the installed components (read only the `COMPONENTS.md` sections needed), type tokens and icon font. Wire each screen into the shell (page entry with plain `desc` and `parts`; lock guard, `embed.js`, `ProtoEmbed.report`). Unfinished parts say so on screen. Then run the shell's `check.py`, the components and icons `check`, `conform.py` (list only), and dev mode › Rules on every screen, including sheets and dialogs.

## Step 9: deploy (only when asked)

Bump the version and add the `CHANGELOG.md` entry (dd-presenter-david, "Version and changelog"); run `conform.py` (list only). Ask first (**Deploy now** with where it goes · **Not yet**). Use the project's hosting config (`firebase.json`, Netlify, Vercel), or ask where. Check the live URL loads and no scratch files went out; report the new version.

## Last step: make things make sense

Walk through it as a first-time viewer (lock screen, every page, phone and desktop width, admin, the Duo poses and rotate button if added) and fix what doesn't make sense:
- Page list, "On this screen" and each screen match `USER_STORY.md`; every story has a screen or is marked not built.
- One design system, type scale, icon set and component style throughout; dev mode › Rules shows only approved exceptions.
- Apple HIG basics (`dd-components-kamil/references/hig-rules.md`): tabs only navigate, empty screens give a next step, sign-in comes late, few alerts, nothing behind the camera.
- Nothing left from templates or demos.
- Admin pages stay desktop in every device mode.
- Content is local and consistent: `dd-localized-content-kamil/scripts/content.py scan --project <project>` finds no placeholders. Accessibility: `dd-accessibility-kamil/scripts/a11y_check.py check --project <project>` is clean or each finding is marked on purpose.
- Interface text reads as labels, one word per action: `dd-ux-writing-kamil/scripts/copy_check.py check --project <project>` has no findings left, or each is marked `data-copy-ok` on purpose.
- Credits: run `dd-credits-kamil/scripts/credits.py --project <project>` (credits.html, CREDITS.md, the presenter's button, a pill without the presenter); "Design by <designer>" first, only skills in use.

Then one short summary: each step in a line, the live link and password state, what was skipped and why, what could not be checked, how to continue.

## Keeping it light

Use `kit_status.py` instead of reading project files. Load each skill only when its step starts; never read their large assets. Screenshots only where a step's check asks.
