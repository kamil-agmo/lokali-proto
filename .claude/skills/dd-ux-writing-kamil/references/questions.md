# UX writing: the questions

Ask with AskUserQuestion, recommended option first, each option explained. Skip any question `DESIGN.md` "## Writing" already answers.

| Header | Question | Options (with the explanation to show) |
|---|---|---|
| `Voice` | How should the interface text sound? | **Neutral labels (Recommended)**: states and actions only ("Up to date", "Download 2 updates"); no "you", "we", "please" or "!" anywhere in the interface · **Neutral with a light touch**: the same for buttons, badges, toasts and errors; onboarding and help text may address the reader ("Add your first post") · **Brand voice**: follow the voice in the brief (name it), still short and clear; the checker then reports chatty words as notes, not warnings |
| `Case` | Which capitalisation? | **Sentence case (Recommended)**: "Download updates", like Google, Microsoft and iOS · **Title Case for buttons and titles**: "Download Updates", like macOS menus and older iOS; body text stays sentence case |
| `Locale` | Which spelling and date style? | **British (en-GB)**: colour, 23 Nov 2026 · **American (en-US)**: color, Nov 23, 2026 · Other: name the language (the rules still apply; the checker's word lists are English) |
| `Terms` | One word for each action: which ones? | Propose from the screens, e.g. **Sign in** (not Log in / Login) · **Delete** (not Remove / Trash) · **Settings** (not Preferences). multiSelect is not needed: list the proposed set as one option "Use these (Recommended)" and "Change some" |

After the answers, run `copy_check.py section` to write them into `DESIGN.md`, then summarise in one line.
