# iPhone Duo: the questions, in full

Ask with **AskUserQuestion** (recommended option first with "(Recommended)", headers of 12 characters or fewer). **Always explain every option**: what it does and what it changes. If AskUserQuestion is not available, ask the same as a numbered list.

**First, and on its own: which phones should the prototype show?** If the answer is iPhone only, stop here (dd-iphone-david covers it). If the shell's intake (round 4) or the prototype kit already asked, use that answer and do not ask again.

| Header | Question | Options (with the explanation to show) |
|---|---|---|
| `Phones` | Which phones should the prototype show? | **iPhone only (Recommended unless the client asked for foldables)**: no Duo; a normal iPhone preview (dd-iphone-david) · **iPhone and iPhone Duo**: iPhone \| iPhone Duo tabs above the phone; run dd-iphone-david first, then this skill · **iPhone Duo only**: no iPhone and no device tabs; the prototype opens on the closed Duo, with the open frames, the opening animation, the side rail and tablet layouts |

Only after a yes, one more round:

| Header | Question | Options (with the explanation to show) |
|---|---|---|
| `Screens` | Which screens should get tablet layouts when the phone is open? | **All phone screens, automatically (Recommended)**: every screen is recognised and laid out like a tablet app (side panel, list-detail, split forms, readable columns); nothing to set up per screen · **Only the screens I name**: those get the automatic layouts; the others say `data-tablet="off"` and show the phone layout · **None for now**: frames, animation and side rail only; every screen says `data-tablet="off"` |
| `Rail` | Should the screens use the side rail when the phone is closed or open horizontally? | **Yes, side rail (Recommended for iPhone Duo)**: Apple asks iPhone Duo apps for a side rail; the top bar icons, toolbar and tab bar move into a 72 px column on the side, the selected tab shown as a vertical pill · **No rail, bars stay top and bottom**: for a prototype standing in for a Pixel Fold or another Android foldable, which keep the phone's top bar and bottom bar; sets `<html data-rail="off">` on every screen |
| `Half-open` | Should the half-open (book) pose be available? | **No, closed and open only (Recommended)**: simpler to present; the half-open code stays in, switched off, and can be turned on later · **Yes, add half-open**: a Half-open tick appears; content is kept clear of the fold in the middle, which every screen must be checked for |
| `Sideways` | When a viewer turns the iPhone (or the closed Duo) sideways with the rotate button, what should it show? | **A "turn your phone upright" screen (Recommended for apps made for portrait)**: a styled screen in the brand colour with a turning rotate icon and "<App> is designed for portrait use", the way portrait-only apps behave; nothing in the screens changes · **The app's own wide layout**: the screens re-lay out for the wide, short phone (tablet layouts, bars at the bottom, clear of the Dynamic Island); pick this when landscape use is part of the design · **Upright screen on the iPhone, wide layout on the closed Duo**: the phone stays portrait-only while the wider closed Duo gets its tablet layouts |
| `Default` | (iPhone and iPhone Duo only) Which device should the presentation start on? | **iPhone (Recommended)**: viewers see the normal phone first and can switch with the tabs · **iPhone Duo, open**: opens straight on the open horizontal Duo, for a foldable-first pitch |
