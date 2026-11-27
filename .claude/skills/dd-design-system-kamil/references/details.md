# Design system: details

## The parts

| Part | Who sees it | What it does |
|---|---|---|
| `design-system.config.js` | the designer | style, theme, scales, tap minimums, colours, must do, cannot do, exceptions |
| **Design System** button (beside Dev mode) | everyone or dev only (`show`) | opens `pages/design-system.html` in a wide panel |
| **Rules** button (beside Sections) | dev mode | amber outlines where a screen differs from the system, with the allowed values; approved exceptions in dashed blue with their reason |
| **Download design skill** (inside the panel) | dev mode only, always | a `<app>-design-system.zip` with a SKILL.md: style, colour tokens (light/dark), type, scales, must/cannot, exceptions, icons, components with snippets, screens, a hand-over checklist |

## The questions, in full

| Header | Question | Options |
|---|---|---|
| `Base` | Which design system should the rules start from? | **The one in DESIGN.md (Recommended)**: e.g. "Apple HIG: spacing 4-48, text 11-34 (Dynamic Type), tap areas 44 pt" · **Material 3**: 4 dp grid, M3 type scale, 48 dp touch targets · **Fluent 2 / Carbon / Ant Design**: their scales, for productivity and back-office apps · (Other: describe custom values) |
| `Who sees` | Who can open the Design System panel? | **Everyone, view only (Recommended)**: presenters and clients can read the rules; only dev mode can download them · **Dev mode only**: clients never see it |
| `Screens` | What about the screens that already exist? | **List the differences, then fix them (Recommended)**: show what is off the scales, then move values to the nearest step and re-check every screen · **Only list them**: change nothing; the Rules check shows them · **Leave them**: rules apply to new screens only |
| `Tap` | Smallest tap area? (only ask if the app has desktop/admin screens or the user mentioned it) | **From the design system (Recommended)**: e.g. 44 pt Apple, 48 dp Material on phone screens, 24 px on desktop (mouse) screens · **44 everywhere**: strict accessibility (WCAG AAA) · **24 everywhere**: the legal minimum (WCAG 2.2 AA), for dense desktop tools |

Explain in one line when asking about tap areas: the rule is about the area a finger can hit, not the visible size, so a control can look smaller if its tap area is big enough.
