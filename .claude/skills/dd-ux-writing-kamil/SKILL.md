---
name: dd-ux-writing-kamil
description: 'By Kamil · UX writing for prototypes: interface text (buttons, badges, banners, toasts, empty states, errors, labels, dialogs) written as short neutral labels in the style of Apple, Google and Microsoft writing guides, never chatty. Sets the voice in DESIGN.md, writes new screen text to the guide, and checks existing text with a script. Use when writing or reviewing UI copy, microcopy, button labels, error or empty-state text, toasts, tone of voice, or when text "sounds like chat".'
metadata:
  author: Kamil
  credit: 'UX writing'
  marker: 'DESIGN.md::(?m)^## Writing'
  version: 1.0.0
  tier: Look & feel
  summary: 'Interface text as short, clear labels.'
  requires: ''
---

# UX writing (interface text)

**Made by Kamil**

Interface text describes **states and actions**; it does not talk to the person. "Up to date", "Last downloaded v1.1.0", "Download 2 updates", not "Yours!", "You have v1.1.0", "Your kit is on its way". The rules follow the writing guides of Apple (Human Interface Guidelines, Writing), Google (Material Design, Writing) and Microsoft (Writing Style Guide): short, specific, consistent, action first. Full guide: `references/guide.md`.

**Make things make sense:** everything this skill produces must make sense to a first-time viewer; the last step checks it.

**Be brief:** questions, summaries and reports stay short: the answer first, one line per point, detail only when asked.

## Step 0: ask first (do not guess)

Read `DESIGN.md` first: an existing "## Writing" section is the answer, so don't ask again. Otherwise AskUserQuestion, recommended first, every option explained (full wording: `references/questions.md`):

1. **Voice:** Neutral labels (recommended) · Neutral with a light touch (help and onboarding may use "you") · Brand voice (from the brief).
2. **Capitalisation:** Sentence case (recommended; Google, Microsoft, iOS body) · Title Case for buttons and titles (macOS, older iOS).
3. **Spelling and dates:** British (23 Nov 2026) · American (Nov 23, 2026), from the brief's market.
4. **Key terms:** one word per action (Delete or Remove, Sign in or Log in), proposed from the screens.

Then write the answers into `DESIGN.md`:

```bash
python3 <skill>/scripts/copy_check.py section --project <project> --voice neutral --case sentence --locale en-GB --terms "Sign in,Delete,Settings"
```

## Writing new screens

Every string follows `references/guide.md`. The short version:

- **Buttons and links:** verb + noun, 1-3 words: "Download 2 updates", "Save draft", "Delete post". Never "OK", "Submit", "Click here", "Yes/No" alone.
- **Labels, badges, chips, meta lines:** nouns and states: "Up to date", "Last downloaded v1.1.0", "3 unread", "Updated 23 Nov".
- **Toasts and banners:** what happened, then what's next, joined with " · ": "Downloading 5 skills · setup steps in README.txt". No "Yay", "Oops", "Sorry".
- **Errors:** what went wrong + how to fix, no blame: "Download failed · check the connection and retry". **Empty states:** what will appear + the action: "No posts yet · Create post".
- **Confirmations:** the title names the action ("Delete 3 photos?"), the button repeats the verb ("Delete"), the other is "Cancel".
- **No** "you/your", "we/our", "please", "!" in interface text. Help, onboarding and documents may address the reader if the voice allows.
- Sentence case, numbers as digits, one term per thing everywhere.

## Checking text

```bash
python3 <skill>/scripts/copy_check.py check --project <project>          # report: chatty, vague buttons, title case, long labels, mixed terms, placeholder-only fields
python3 <skill>/scripts/copy_check.py check --project <project> --json   # for tools
```

It reads every page's visible text and the `aria-label`, `title`, `placeholder` and `alt` attributes, never edits. Mark a deliberate exception with `data-copy-ok` on the element. Rewrite what it finds, then run it again; the prototype kit runs it in its last check.

## Last step: make things make sense

Read every screen as someone new to the app: each button says what it does, each state is clear without a sentence around it, the same thing has the same name everywhere, nothing sounds like chat. Report what changed (before → after) and what was left on purpose.
