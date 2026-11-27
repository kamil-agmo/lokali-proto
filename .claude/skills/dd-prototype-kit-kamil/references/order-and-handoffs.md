# Order and hand-offs

## Why the steps run in this order

| # | Step | Skill | Why here |
|---|---|---|---|
| 1 | **Brief and user story** | dd-requirements-kamil if there are requirement files, otherwise this skill | Everything else follows from what the app is and who it is for |
| 1b | **Design references** | dd-design-references-kamil | Before any styling: the picked direction in `DESIGN.md` steers the design system, components and screens |
| 2 | **Presenter shell and design brief** | dd-presenter-david | Creates the project, `shell.config.js` and `DESIGN.md` (design system, colours, mode) that later steps read; asks who designed it (credits) and which add-ons |
| 2b | **Add-ons** (only those chosen) | dd-dev-mode-kamil, dd-designer-mode-kamil | Dev mode before the design system, whose Rules check runs inside dev mode (a design system therefore needs dev mode); Designer mode can come any time |
| 3 | **Design system** | dd-design-system-kamil | Sets the only allowed spacing, rounding, text sizes and tap areas, so every later step builds on the scales; adds the Design System panel, the Rules check and the design skill download |
| 3b | **Typography** | dd-typography-kamil | Fonts and size tokens come before components, which use them; sizes come from the design system's text scale |
| 3c | **UX writing** | dd-ux-writing-kamil | Before components and screens, so every button, toast and empty state is written to one voice from the start; writes `## Writing` in `DESIGN.md` |
| 4 | **Icons** | dd-icons-kamil | The icon font comes before components and screens, which use it |
| 5 | **Components** | dd-components-kamil | Picked in the app's own colours, fonts and icons, so the gallery shows the real look |
| 5b | **Localized content** | dd-localized-content-kamil | Right before screens: names, prices and places come from one seed, so every screen agrees |
| 6 | **Screens** | (this skill) | Built from the user story with the installed components and tokens |
| 6b | **Accessibility** | dd-accessibility-kamil | After the screens exist: measures contrast and tap sizes on the real screens, fixes in the shared tokens |
| 7 | **Admin panel** (only if wanted) | dd-admin-panel-kamil, on dd-desktop-kamil | Needs the shell and the phone screens: it reads them to work out the admin screens. Admin only: it reads the brief instead, so it follows step 5 and steps 2a, 6, 7b and 8 are skipped |
| 7b | **iPhone Duo mode** (only if wanted) | dd-iphone-duo-kamil | Needs the screens: each one gets tablet layouts for the opened phone. Focus is closed and open (flat); folded poses only on request |
| 8 | **Phone fit and install** | dd-phone-install-kamil | Last before deploy: it patches every screen, so all screens must exist |
| 9 | **Deploy** | (this skill) | Only when the user asks for it; outward-facing |
| 10 | **Passwords** (if left for later) | dd-presenter-david (lock), dd-dev-mode-kamil (dev) | Set after the first successful deploy, then deploy again |

## What earlier steps already answered (pass it on, do not ask again)

| Already known from | Used by | As |
|---|---|---|
| Brief (app name, audience, platform) | shell | name, design system recommendation (iPhone → Apple HIG, Android → Material 3, productivity → Fluent 2, dashboards → Carbon) |
| `DESIGN.md` design system | design system | the preset (Apple, Material, Fluent, Carbon, Ant) |
| `design-system.config.js` scales | typography, components, screens | text sizes, weights, spacing and rounding: only values on the scales |
| `DESIGN.md` design system | typography | recommended font and scale (HIG → system font + HIG scale; Material → Roboto + Material scale; Fluent → Segoe UI; Carbon → IBM Plex) |
| `DESIGN.md` design system | icons | recommended library (Material/Android → Material Symbols; Apple → Phosphor or Material Rounded; Fluent → Material Symbols Outlined; Carbon / Ant → Material Symbols Sharp/Outlined) |
| `DESIGN.md` design system, colours | components | recommended style in the gallery (Apple / Material / Fluent / Carbon / Ant) and the brand colour the previews wear |
| Shell intake "admin screens: yes" | admin | run it; "no" → skip it without asking |
| Brief "Admin only" | shell, admin | Devices: Desktop only; admin panel works from the brief (`--source brief`); no iPhone, Duo or phone install |
| Brief or shell intake "iPhone Duo: yes" | iphone-duo | run it without asking again whether to have it; "no" → skip it without asking |
| Duo skill's sideways answer (`SHELL.duo.sideways`) | phone install | the installed app stays portrait for a "turn it upright" iPhone, and may turn when the iPhone shows a wide layout (install.py reads it) |
| `DESIGN.md` "## References" | design system, components, screens | the direction and what to avoid |
| `DESIGN.md` "## Content" | screens, admin panel | market, language, name mix, seeds |
| `DESIGN.md` "## Accessibility" | design system, screens | level and tap target size (44 or 48) |
| `DESIGN.md` "## Writing" | screens, admin panel, every skill writing UI text | voice, case, locale and terms; don't ask again |
| Shell intake add-ons | dev mode, designer mode | run the chosen ones without asking again; if a design system is wanted and dev mode was not chosen, say the Rules check needs dev mode and ask once |
| Shell intake passwords "later" | passwords | ask after the first deploy |

## Step 1 in full: brief and user story

**First ask whether there are requirement documents** (AskUserQuestion): **Yes, study them first (Recommended when the client sent anything)**: runs dd-requirements-kamil, which reads PDFs, Word, Excel, slides, notes and sketches and writes REQUIREMENTS.md and USER_STORY.md with every item traced to its source · **No, describe it here**: the short questions below. If `REQUIREMENTS.md` already exists, use it and skip both.

With requirement files, the brief's answers (app type, platform, audience, admin screens) come from REQUIREMENTS.md "Design implications"; only ask what it leaves open. Otherwise:


Ask in one AskUserQuestion round (explained options), then write `USER_STORY.md` in the project:
- **What kind of app?** e.g. Social / content · Shopping / booking · Productivity / tool · Dashboard / admin (Other = describe it). Each option says which design system and components it tends to suit.
- **Main platform?** iPhone first · Android first · Both equally · Desktop / web app. This drives the design-system recommendation in step 2.
- **Who is it for?** Most adults · Older users (50+) · Professionals / power users · Young people. This drives the default text size in step 3 (16 px, 18 px, 14-16 px, 16 px) and how dense the screens are.
- **Admin or desktop screens?** No · **Yes, beside the app** · **Admin only**: the client wants just the admin or web portal, no phone app. Decides step 7 (and, for admin only, skips the phone steps).
- **iPhone Duo (foldable) mode too?** **No, iPhone only (Recommended unless the client asked for foldables)**: a normal iPhone preview · **Yes**: adds iPhone | iPhone Duo tabs above the phone, closed and open frames with the opening animation, the side rail, and tablet layouts for the opened screen. Decides step 7b. With requirement files, ask this too unless they mention foldables or the iPhone Duo.

Then the stories: 5-8 short "As a ..., I want ..., so that ..." stories with acceptance criteria, written from the user's description (ask one plain-text question for the core features if they were not given). Show them in a short table and continue unless the user changes something.
