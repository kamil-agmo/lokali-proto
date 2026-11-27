---
name: dd-icons-kamil
description: 'By Kamil · Switch a static HTML/CSS/JS prototype''s icons (SVG, emoji, text symbols) to a light icon font. Always asks first which library (Material Symbols, Font Awesome, Flaticon, Bootstrap, Phosphor; SF Symbols cannot be used on the web), then style, size, fill and active state. Sets up a new project or converts an existing one. Use when the user wants Material, Google, Font Awesome, Bootstrap or Phosphor icons, "Apple-style icons", an icon font, lighter icons, or to replace SVG/emoji icons.'
metadata:
  author: Kamil
  credit: 'Icons'
  marker: 'DESIGN.md::(?m)^## Icons'
  version: 1.0.0
  tier: Look & feel
  summary: 'A light icon font: Material Symbols and others.'
  requires: ''
---

# Icon fonts (Material Symbols by default, subset)

**Made by Kamil**

Replaces a prototype's icons with an **icon font**. Default and lightest: **Google Material Symbols** with `icon_names=`, so only the icons used are downloaded (a few KB). Four other libraries: `references/libraries.md`. No build step, no SVG files.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Two modes

Set icons up **at the start** (recommended, right after dd-presenter-david): screens get real icons from the first line. Pick the mode after the library question:
- **Start of project** (no screens, or only the scaffold's samples): Workflow B.
- **Convert** (screens already have SVG, emoji or symbols): Workflow A.

## Step 0: ask first (do not guess)

**The library question always comes first, never skipped**, even when the user names one (then put theirs first as "(Recommended)"). AskUserQuestion, recommended option first, every option explained; on claude.ai ask the library alone, then the rest as a numbered list. Full options: `references/questions.md`.

1. **Library:** Google Material (Recommended) · Apple-like look (Phosphor or Bootstrap) · Flaticon UIcons · Font Awesome Free. Say SF Symbols can't be used on the web.
2. **Look:** style, weight, size (24 recommended), fill, as the library supports.
3. **Behaviour:** filled when active, other sizes allowed, screens only or shell too, grade (Material) or trimming (others). Logos stay images.

## Workflow A: convert (details: `references/workflows.md`)

1. `python3 <skill>/scripts/icons.py scan --project <project>` lists candidate icons (HTML and JS strings); logos and photos are not icons.
2. Map each to an icon name; show the mapping if any is a judgment call.
3. Material: `icons.py link --style rounded --opsz 24 --wght 400 --fill 0 --grade 0 [--fill-range] <names...>`; paste the `<link>` into every screen. Others: their section in `references/libraries.md`.
4. Add the CSS (`.ms`, `.ms--fill`); icons are `<span class="ms" aria-hidden="true">name</span>` inside a button with an `aria-label`.
5. Replace every icon, JS too; toggles switch a class, not the text.
6. Verify over http (font loaded, baseline size, no names showing as words, screenshot); re-run `scan`, then `icons.py check`.

## Workflow B: start of a project

1. `icons.py link ... --starter [extra names]` (15 common icons, about 6 KB).
2. Link and CSS in every screen, template screens included.
3. A usage note at the top of the screen stylesheet: how to write an icon; every new name goes into `icon_names`, alphabetical, in every page; JS-built icons need a `/* icons: ... */` comment.
4. `icons.py check --project <project>` before each review or deploy.

## Both workflows end with

- **Write the choice into `DESIGN.md`** under "## Icons": library, style, size, fill, active state, how to add one (later skills and the credits read it).
- **Tell the user** the library and size, any attribution (Flaticon), and that a new icon means adding its name to `icon_names`.

## Last step: make things make sense

- Every icon means what its button does and has an `aria-label`; no icon name shows as a word.
- Filled and outline follow one rule throughout.

Report what changed and what you could not check. Background and decisions: `references/background.md`.
