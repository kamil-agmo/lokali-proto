---
name: dd-admin-panel-kamil
description: 'By Kamil · Work out and build an admin panel - from a phone prototype (reads its screens, finds every list, action, form, count, sign-in and report) or, for admin-only projects with no phone app, from the brief (REQUIREMENTS.md / USER_STORY.md from dd-requirements-kamil); proposes the admin screens with the evidence for each (dashboard, management tables, users, moderation, approvals, orders, reports, settings, activity log), asks which to build, then builds them as desktop pages. Uses dd-desktop-kamil. Use when the user wants an admin panel, back office, CMS, portal, dashboard, moderation, "the admin side" of an app, or a client wants only the admin or web portal.'
metadata:
  author: Kamil
  credit: 'Admin panel'
  marker: 'ADMIN_PLAN.md'
  version: 1.1.0
  tier: Screens & devices
  summary: 'Builds the admin panel from your app or your brief.'
  requires: 'dd-presenter-david, dd-desktop-kamil'
---

# Admin panel

**Made by Kamil**

The admin side of an app follows from the app: every list someone posts to needs a table to manage it, every report button needs a moderation queue, every sign-in needs a users screen, every number on a screen belongs on a dashboard. This skill reads the phone prototype (or, when the client wants **only the admin**, the brief), proposes the admin screens with the evidence for each, and builds the ones the user picks. The pages show on **dd-desktop-kamil** (full window, drawers, content width). No phone frame is needed in either case.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## 0. Ask first: app or admin only

If the project has phone screens, it is an app: go on. If it has none, or the brief says desktop or web only, ask (AskUserQuestion, every option explained):

- **Admin for the phone app (Recommended when phone screens exist):** read the screens; each admin screen mirrors something on the phone, and rows link to their phone screen.
- **Admin only (Recommended when there are no phone screens):** the client wants just the admin or web portal; work from the brief. Needs `REQUIREMENTS.md` / `USER_STORY.md`: if they are missing, run **dd-requirements-kamil** first (or write a short brief with the user).

## 1. Read the app or the brief (read-only)

```bash
python3 <skill>/scripts/inventory.py --project <project>                   # auto: the screens, or the brief when there are none, the brief says desktop / admin only, or the pages are only starters; writes ADMIN_PLAN.md
python3 <skill>/scripts/inventory.py --project <project> --source brief    # admin only: the brief, even if there are screens
python3 <skill>/scripts/inventory.py --project <project> --out -           # print only
```

**Admin only:** it reads the features, screen inventory, roles and stories, and suggests a management table per thing the brief says to manage, plus users, approvals, orders, reports, settings and the activity log, each citing the requirement it comes from, and lists the roles. Read the brief yourself too: name things in its words, and add what a keyword scan misses.

**From the app:** it lists, per phone screen: repeated items (feeds, lists, grids), actions, form fields, counts, sign-in; the admin screens they suggest with the evidence; and the stories in `USER_STORY.md` / `REQUIREMENTS.md` about managing, reporting, approving or blocking. Then **read the screens and the brief yourself**: the script finds evidence, you name things in the app's own words (posts, orders, members) and add what it cannot see (JavaScript-rendered lists, roles in the brief). Rewrite `ADMIN_PLAN.md` as the plan.

## 2. Propose, then ask

Show a short table: **admin screen · why (the phone screen, story or requirement it comes from) · what it holds · actions**. Typical set (`references/patterns.md`):

- **Dashboard:** the app's numbers as KPI cards, a trend, items needing attention.
- **One management table per thing users create** (posts, comments, orders): search, filters, bulk actions; row actions mirror the phone actions (hide, remove, feature).
- **Users:** status, joined, activity; verify, suspend, reset.
- **Moderation queue** (when the app can report, block or hide): reason, reporter, decision, history.
- **Approvals, orders and payments, settings, activity log** when the evidence is there.

Ask (AskUserQuestion, every option explained): **Screens** (multiSelect from the plan; recommended: dashboard + the main management table + users) · **Roles** (one admin, owner and moderator, or the roles in the brief) · **Layout** (sidebar on the left, recommended; or a top bar). Never build screens nobody asked for.

## 3. Build

1. Install the desktop device if it is not there: dd-desktop-kamil (`install_admin.py`). Admin only: the presenter needs no device skill; every page is desktop.
2. Each admin screen is a normal shell page in a tree group `{ label: 'Admin', device: 'desktop', children: [...] }` with `desc` and `parts`, the prototype's design system and brand. Sample data: from the app, the same data the phone screens show (the post on the phone is the row in the table); admin only, realistic data from the brief's "Content and data" (fields, formats, sample values).
3. **Link:** from the app, a row opens its phone screen (`parent.location.hash = '<page-id>'`) where that helps the story. Admin only, link the admin screens to each other instead (row → detail page, dashboard card → its table). Either way the dashboard's "needs review" goes to its queue.
4. Desktop rules from dd-desktop-kamil: main content `max-width: var(--content-max, none); margin-inline: auto`; state in `sessionStorage`; actions that only work on screen say so.
5. Run the shell's `check.py`, then `dd-credits-kamil/scripts/credits.py` (Admin panel joins the credits).

## Last step: make things make sense

Walk through as an admin who has never seen the app: each screen's purpose is clear from its title, every table row matches something on the phone (admin only: every Must requirement has a screen), every action that needs a decision has a place in the admin. Report the screens built and what was left out.
