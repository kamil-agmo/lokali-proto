# Intake: the questions to ask before scaffolding

Ask these **before** running `scripts/scaffold.py`, as clickable options in rounds (below), and wait for the answers. Do not guess them and do not invent passwords: a prototype that goes out with a made-up password, a placeholder tagline or a Replay button that does nothing looks careless, and the user finds out when a reviewer does.

Run `scripts/suggest_theme.py --project <project>` first when the project already has screens: it reads the prototype's own CSS and proposes the accent colour (and, optionally, font, radius and page background). Show those as suggestions to confirm, not as answers.

## How to ask: clickable options, in rounds

**Always explain every option.** Each option's description says in plain words what it does and what changes for the prototype or its users, so the user can choose without reading anything else. Never offer a bare label.

Ask with the **AskUserQuestion** tool so the user picks instead of typing: **up to 4 questions per call, 2-4 options each**, "Other" is always added for a typed answer. Put the recommended option first with "(Recommended)" at the end of its label; headers are 12 characters or fewer. Each option's description says what it changes, so the user can decide without reading this file. Skip a question the user already answered in their message. Where the answer is free text (a name, a password, extra names), offer suggestions as options and let "Other" take the typed value; never invent a password.

If AskUserQuestion is not available (claude.ai), ask the same rounds as numbered lists, one message per round, recommendations in [brackets].

### Round 1: what is being built

| Header | Question | Options (first = recommended) | Goes to |
|---|---|---|---|
| `Design` | Which design guidelines should the screens follow? | **Material 3**: one seed colour builds the palette, rounded shapes, bottom nav, Android feel · **Apple HIG**: content first, translucent bars, large titles, iPhone feel · **Microsoft Fluent 2**: calm greys, small radii, strong focus, productivity feel · **IBM Carbon**: square, flat, dense, for dashboards. Other: custom brand guidelines (ask for the link/file), Ant, Polaris... or none. Recommend the one that fits the platform the user named. | `--design-system`, `DESIGN.md` |
| `Mode` | Light, dark or both? | **Light** · Dark · Both (with a switch) | `--color-mode` |
| `Intro` | Does the prototype open with an intro that reviewers can replay? | **Yes, replayable intro** (a Replay button in the left card) · No intro (no Replay button) · Restart only ("Restart from Home") | `--replay intro / none / restart` |

Key factors for each design system, and others to offer: `references/design-systems.md`.

### Round 2: name and colours

| Header | Question | Options | Goes to |
|---|---|---|---|
| `Name` | What is the product called? | 2-3 name ideas that fit the app, or the name the user already gave as Recommended. Other = type it | `--name` |
| `Colours` | Which colour theme? | **4 palettes suggested for this kind of app** (primary + secondary + background, hex in the description; see the table in `references/design-systems.md`). If the project has screens, the `suggest_theme.py` colour comes first. Other = type hex values | `--accent` (primary), `--color role|#hex` |
| `Logo` | What logo should the left card and lock screen show? | **Make a simple SVG logo for me** (you draw it, plus a light version for the dark lock screen) · I'll give a file (ask for the path next) · No logo, show the name as text | `--logo`, `--logo-lock` |
| `Subtitle` | Subtitle under the logo? | **Prototype v1** · Beta testing prototype · Concept demo · None. Other = type it | `--tag` |

### Round 3: lock screen and passwords

| Header | Question | Options | Goes to |
|---|---|---|---|
| `Password` | How should the lock password be set? | **Set later, after deploying**: no lock screen while building; you ask for it once the first deploy works · I'll type it now (ask for it next, in plain text) | `--password-later`, or `--password` |
| `Taglines` | Lock screen taglines (1-3 lines that rotate)? | **Write them for me** (show them in the summary) · I'll type them | `--tagline` |
| `Counters` | Counters on the lock screen? | **Make them up from the app** (e.g. "4 tabs", "30+ photos") · None · I'll give real numbers | `--stat` / `--no-stats` |
| `Footer` | Lock screen footer? | **"<team> prototype"** style suggestion · "Internal prototype" · None. Other = type it | `--footer` |

Only for "I'll type it now": ask in plain text for the lock password, and repeat that it is a soft gate.

### Round 4: credits, add-ons, look and devices

| Header | Question | Options | Goes to |
|---|---|---|---|
| `Designer` | Who designed this prototype? (the credits start with "Design by <name>") | **Type the name(s)** under Other · Leave it out · No Credits button at all | `--design`, `--design ""`, `--no-credits` |
| `Thanks` | Anyone else to thank? (the skill makers are credited automatically) | **No one else** · Type the names under Other, comma separated: shown as "Thanks to …" | `--thanks` (repeat) |
| `Add-ons` | Which add-ons should the prototype have? (multiSelect) | **Developer inspector** (Dev mode): for developers, an inspector (spacing, type, colour, tokens) and image and animation exports, behind a dev password · **Copy to Figma** (Designer mode): for designers, copy one screen or all screens into Figma with one ⌘V (auto layout, components) · None for now (both can be added later) | run dd-dev-mode-kamil / dd-designer-mode-kamil after scaffolding |
| `Shell look` | Should the shell (side cards, lock screen) match the prototype's font, radius and background? | **No, keep it neutral** (only the accent follows the brand) · Yes, match the prototype | `--font`, `--radius`, `--page-bg` |
| `Devices` | Which devices should the pages show in? (multiSelect) | **iPhone (Recommended)**: pages in an iPhone frame (dd-iphone-david) · **iPhone Duo**: the foldable iPhone; with iPhone also ticked, tabs switch between them; alone, Duo only (dd-iphone-duo-kamil, after the screens exist) · **Desktop**: desktop pages full-window like a web app (dd-desktop-kamil); for an admin side, dd-admin-panel-kamil reads the app (or the brief) and builds it; Desktop alone suits an admin-only project · Nothing ticked: pages show in a plain screen | run the chosen device skills after scaffolding |

After round 4, show a one-paragraph summary of every answer (including generated taglines and counters) and go ahead unless the user corrects something.

## What each answer changes (reference)

| Answer | Goes to | Notes |
|---|---|---|
| Product name | `name` | Browser tab title, left card (when there is no logo), lock screen footer. |
| Logo / lock logo | `logo`, `logoLock` | The lock screen is dark: a dark logo needs a light version. |
| Subtitle | `tag` | Empty hides it. |
| Colour theme | `theme.accent` + `DESIGN.md` | The primary colour is the shell's accent and lock screen tint; all roles go to `DESIGN.md` for the screens. |
| Design system | `DESIGN.md` | Key points the screens must follow. |
| Intro | `replay` | With "intro" the first screen must really play it on `?intro`. |
| Lock text | `lock.taglines`, `lock.stats`, `lock.footer` | |
| Password | `password` | "Later": `password: null` (no lock) and `passwordLater: true` until set. |
| Credits | `shell.config.js` `credits` | `design` from the answer, `thanks` (names already credited are left out), `made` filled by `scripts/credits.py` from the skills in use. |
| Shell look | `theme.font`, `fontUrl`, `radius`, `pageBg` | Off by default. |

## Running the scaffold

```bash
python3 <skill>/scripts/scaffold.py --dest <project> --strict \
  --name "Acme" --password "<lock password>" --design "<designer>" \
  --logo ./brand/logo.svg --logo-lock ./brand/logo-white.svg --tag "Prototype v1" \
  --accent "#7c3aed" --replay none --design-system material --color-mode light --color "primary|#7c3aed" --color "secondary|#ec4899" \
  --thanks "Aina" \
  --tagline "Solar, simplified." --tagline "Real-time, every time." --stat "14|+|years" --stat "3900|+|MWp" --footer "prototype"
```

or give the same answers in a JSON file (`--answers answers.json`; command-line flags win):

```json
{
  "name": "Acme", "password": "…", "design": "…", "tag": "Prototype v1",
  "logo": "./brand/logo.svg", "logoLock": "./brand/logo-white.svg", "accent": "#7c3aed",
  "replay": "intro", "introQuery": "?intro", "introLabel": "Replay intro",
  "taglines": ["Solar, simplified.", "Real-time, every time."],
  "stats": [{ "n": 14, "s": "+", "label": "years" }],
  "footer": "prototype",
  "theme": { "font": "\"Manrope\", system-ui, sans-serif", "fontUrl": "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap", "radius": 16, "pageBg": "#f8fafc" }
}
```

`--strict` refuses to run while any question is unanswered and prints which ones, so the answers cannot be skipped by accident. Without it the script fills a neutral default for anything missing and prints a note for each, which is only right for a throwaway demo.

Password later instead: replace `--password ...` with `--password-later`.

## After scaffolding

- **Suggest the icons next:** "Set up the icons now with dd-icons-kamil?" Setting them up before the screens are built is better than converting later.
- **Password later:** after the first successful deploy, ask for it (AskUserQuestion: "Set the password now?" with "Type it now (Recommended)" / "Keep it open for now"), write it into `shell.config.js` (delete `passwordLater`), deploy again and confirm the lock screen appears on the live URL.
- **Add-ons:** run the chosen add-on skills (dd-dev-mode-kamil asks for its own dev password; dd-designer-mode-kamil needs nothing). They refresh the credits.

- `scripts/check.py` warns about the leftovers: lock text that is still the template's placeholder, no accent, a missing logo file.
- If the answer to question 6 is "intro", the first screen must really play it when it loads with that query (and `ProtoEmbed.replay()` reloads it). With no intro, leave `replay` as `null`; do not keep a button that does nothing.
- The logo files are copied to `assets/` in the project; the config points at them with paths relative to the project root.
- Tell the user the password lives in `shell.config.js` and is a soft gate.
