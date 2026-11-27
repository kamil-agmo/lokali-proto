---
name: dd-components-kamil
description: 'By Kamil · Component library for static HTML/CSS/JS prototypes (tab bars, app bars, large titles, segmented controls, buttons, fields, search, switches, sliders, cards, lists, sheets, dialogs, snackbars, badges, skeletons) in five styles: Material 3, Apple iOS, Fluent 2, Carbon, Ant Design. A gallery shows them in the app''s colours to pick from; installs only the picks, with snippets. Use when the user wants Material or Apple components, a tab bar, navbar, app bar, bottom sheet, dialog or any standard UI component, or asks which style to use.'
metadata:
  author: Kamil
  credit: 'Components'
  marker: 'components.json'
  version: 1.0.0
  tier: Look & feel
  summary: '38 components in five styles, picked from a gallery.'
  requires: ''
---

# Components (picked from a live gallery)

**Made by Kamil**

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

38 components (navigation, actions, inputs, surfaces, feedback), each in five styles: **Material 3 Expressive**, **Apple iOS 27**, **Fluent 2**, **Carbon**, **Ant Design**. Dependency-free; they read the prototype's tokens (`--brand`, `--ink`, `--bg`, `--font-body`, `--sb` ...), so they wear the app's look. Only the picks are installed. Full list with ids, the questions, the gallery steps and the auto-wired behaviour: `references/catalogue-and-questions.md`.

## Step 0: ask first (do not guess)

Read `DESIGN.md` first (Apple HIG → Apple recommended, Material → Material). AskUserQuestion, recommended first, every option explained: **Style** (Apple, Material, Fluent/Carbon/Ant, or a mix) · **Pick how** (open the gallery, a starter set, or name them) · **Motion** (native-feeling, calm, none) · **Use where** (new screens, or also replace existing parts).

**Gallery:** `python3 <skill>/scripts/components.py gallery --out <scratch dir> --project <project> --app "<App>" --accent "<colour>"`, served over http outside the project; when the user says done, read `window.componentChoice` and repeat the picks in one line.

## Workflow

1. **Install the picks** (safe to run again):
   ```bash
   python3 <skill>/scripts/components.py install --project <project> --pick "tabbar:ios,appbar:ios,button:md,sheet:ios"   # md, ios, fluent, carbon, ant
   ```
   Writes `css/shared/components.css`, `js/shared/components.js`, `components.json`, `COMPONENTS.md` (snippets) and a "Components" section in `DESIGN.md`, links them in every screen, and adds their icons to the Material Symbols subset.
2. **Use the snippets** from `COMPONENTS.md` with the screen's real content; behaviour is wired automatically (sheets, dialogs, menus, tabs, toasts...).
3. **Replace existing parts** only if asked: one component at a time, keep content and shell wiring, list the changes per screen.
4. **Swap a style later:** `components.py swap --project <project> --component tabbar --to md`; adjust by hand where it says the markup differs.
5. **Check:** `components.py check --project <project>` (used but not installed, unused, mixed styles).
6. **Verify** at phone width: bars clear of the status bar and home indicator, large title shrinks, sheets and dialogs open and close, dark mode readable.

**Badges:** `data-badge="3"` (or `""` for a dot) on a tab, icon button or symbol, instead of a count written as text.

## Last step: make things make sense

- One style per component throughout, unless a mix was chosen on purpose.
- Icon-only buttons have an `aria-label`; the active tab matches the screen; sheet and dialog buttons say what they do.
- No demo text left ("Mountain escape").
- Apple's rules (`references/hig-rules.md`, read when building screens): tabs only navigate, never disabled; pressed states; at most 3 alert buttons with Cancel beside a destructive one; one sheet at a time; switches only in list rows. `c-tab--search` gives Apple's round search button; fields get a clear (x) button.

Report what was installed, where it is used, and what you could not check.

## Keep it light

Never read `assets/manifest.json`, `assets/gallery.html` or the component CSS/JS (about 65,000 tokens); the scripts handle them. Read only the `COMPONENTS.md` sections a screen needs. Background and the Duo side-rail rules: `references/background.md`.
