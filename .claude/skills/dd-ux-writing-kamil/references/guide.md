# UX writing guide

The house rules for interface text in Design Department prototypes. They follow the same principles as Apple's Human Interface Guidelines (Writing), Google's Material Design (Writing) and Microsoft's Writing Style Guide, condensed for prototypes. Where the three differ, this guide picks one and says so.

## 1. Principles

1. **Describe, don't converse.** Interface text names states and actions. It is not a person talking. "Up to date", not "You're all set!".
2. **Short.** The fewest words that stay clear. Cut "please", "simply", "just", "in order to", "successfully".
3. **Specific.** Say what happens: "Delete post", not "OK". "Download 2 updates", not "Continue".
4. **Action first.** Start with the verb or the most important word: "Save changes", "3 unread".
5. **Consistent.** One word per thing and per action across every screen (see the terms in `DESIGN.md`).
6. **Calm.** No exclamation marks, no "Oops", "Whoops", "Yay", "Awesome", no blame ("You entered a wrong password" → "Wrong password").
7. **Accessible.** Text makes sense when read alone (screen readers, tooltips): no "Click here", no "Learn more" without the topic, no meaning carried only by colour or an icon.

## 2. Voice

| Voice (from `DESIGN.md`) | Interface text (buttons, badges, toasts, errors, labels) | Help, onboarding, documents |
|---|---|---|
| **Neutral labels** (default) | No "you/your", "we/our", "please", "!" | Neutral too: "Add a first post to see it here" |
| **Neutral with a light touch** | Same as neutral | May address the reader: "Add your first post" |
| **Brand voice** | Short and clear first; brand words only where they don't cost clarity | Brand voice |

## 3. Patterns by component

| Component | Pattern | Do | Don't |
|---|---|---|---|
| **Button** | Verb + noun, 1-3 words, ≤ 24 characters | "Save draft", "Download 2 updates", "Delete post" | "OK", "Submit", "Yes", "Click here", "Let's go!" |
| **Primary + secondary pair** | The primary names the action; the other is "Cancel" (or the opposite verb) | "Delete" / "Cancel" | "Yes" / "No" |
| **Link** | The destination or topic | "Setup steps", "Privacy policy" | "Click here", "Read more" alone |
| **Label, badge, chip** | Noun or state | "Up to date", "New", "Updated", "3 unread", "Draft" | "Yours", "You're up to date!" |
| **Meta line** | Facts joined with " · " | "v1.1.3 · 23 Nov · last downloaded v1.1.0" | "You have version 1.1.0 installed" |
| **Banner** | What changed · the action | "2 updates since last download · 21 Nov 2026" + "Download 2 updates" | "Hey! You've missed 2 updates" |
| **Toast / snackbar** | What happened · what's next; one line; an action button only if it undoes or opens | "Post deleted · Undo", "Downloading 5 skills · setup steps in README.txt" | "Your kit is on its way!" |
| **Error** | What went wrong · how to fix | "Download failed · check the connection and retry", "Wrong password" | "Oops! Something went wrong", "Error 500" alone, "You entered…" |
| **Empty state** | What will be here · the action | "No posts yet" + "Create post" | "Nothing here! Why not add something?" |
| **Confirmation dialog** | Title asks with the action and object; body states the consequence; buttons repeat the verb | "Delete 3 photos?" · "They can't be restored." · "Delete" / "Cancel" | "Are you sure?" · "OK" / "Cancel" |
| **Form label** | Noun, always visible | "Email", "Phone number" | Placeholder as the only label |
| **Placeholder** | An example, not an instruction | "name@company.com" | "Please enter your email" |
| **Helper / hint text** | The rule, short | "8+ characters, one number" | "Your password must be at least 8 characters long!" |
| **Tooltip** | What the control does, 1-5 words | "Zoom in", "Fit the map" | "Click this to zoom in" |
| **Heading / title** | Noun phrase naming the screen or section | "Download queue", "Skill details" | "Here's your download queue" |
| **Loading / progress** | The action in -ing form, or the count | "Packing…", "Uploading 3 of 16" | "Please wait while we…" |
| **Status** | Past tense or state | "Saved", "Sent", "Offline" | "Your changes have been saved successfully!" |

## 4. Mechanics

- **Capitalisation:** sentence case everywhere (Google, Microsoft, iOS body). Title Case only if `DESIGN.md` says so (macOS style), and then only buttons, menus and titles. Product and feature names keep their own case.
- **Punctuation:** no full stop on buttons, labels, badges, titles or one-line toasts; full stops in sentences of body and help text. Use " · " to join facts in one line. Ellipsis "…" (one character) only for an action that needs more input ("Rename…") or for ongoing progress ("Packing…").
- **Numbers:** digits always ("3 updates", "1 update"); singular and plural handled ("1 update", not "1 updates").
- **Dates and times:** from the locale in `DESIGN.md`: en-GB "23 Nov 2026", en-US "Nov 23, 2026"; short form without the year when the year is the current one ("23 Nov"). Relative times for recent events ("2 min ago"), absolute after a week.
- **Versions:** "v1.1.3"; arrows for changes "v1.1.0 → v1.1.3".
- **Abbreviations:** only common ones (KB, PDF, OK in data, not as a button).
- **Contractions:** fine in help text ("can't"), avoided in labels.
- **Symbols:** "›" for paths ("Customize › Skills"), "+" for add, "×" for counts or close.

## 5. Terms

Keep one word per concept, and write the list into `DESIGN.md`. Common pairs to settle:

| Pick one | Instead of |
|---|---|
| Sign in / Sign out | Log in, Login, Log out |
| Sign up | Register, Create account (as the button) |
| Delete (gone for good) · Remove (from a list, still exists) | Trash, Erase, Discard (unless meaning differs) |
| Settings | Preferences, Options, Config |
| Save | Apply, Done (when it saves) |
| Download / Upload | Get, Grab, Send up |
| Edit | Modify, Change |
| Search | Find, Look up |

## 6. Before → after (real examples)

| Before | After |
|---|---|
| yours | Up to date |
| you have v1.1.0 | Last downloaded v1.1.0 |
| 3 updates since your download on 21 Nov | 3 updates since last download · 21 Nov 2026 |
| see what | Show |
| Download these 3 | Download 3 updates |
| Your kit is on its way: 5 skills. Unzip it and follow README.txt. | Downloading 5 skills · setup steps in README.txt |
| X is needed by Y, so it stays in the queue. | Needed by Y · stays in the queue |
| Could not pack the kit | Download failed |
| Hover one to see what it does. | Hover a skill for details. |

## 7. Sources

- Apple, Human Interface Guidelines: Writing
- Google, Material Design: Writing (and Android UX writing guidance)
- Microsoft, Writing Style Guide (and Fluent 2 content design)

Read them for depth; this guide is the version Design Department prototypes follow.
