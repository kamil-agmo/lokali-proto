# Lokali booking prototype — working rules

Static HTML/CSS/JS prototype (guest + host phone screens, admin desktop) for Lokali, a Malaysian booking platform for small, impact-led local experiences. Open `index.html` (app) or `admin.html` (admin) in a browser. Start with `HANDOFF.md` for where the work stands.

## How to work here (from the previous designer's memory — follow these)

The user's rules win over any skill. Commands the user types: **THINK**, **MIMS**, **DUPE**, **MATCH REQ**, "be brief".

@.claude/rules/be-brief.md
@.claude/rules/espe.md
@.claude/rules/mims.md
@.claude/rules/dupe.md
@.claude/rules/cptr.md
@.claude/rules/read-intent.md
@.claude/rules/airy-style.md
@.claude/rules/mock-rules.md
@.claude/rules/photos-as-links.md
@.claude/rules/admin-later.md
@.claude/rules/fablepus-skill.md

## Where things are

- `REQUIREMENTS.md` — the brief, traced; Q-numbers are open questions / suggestions. Check it first in every MIMS.
- `DESIGN.md` — the **Airy** style (Home is the reference): type scale, colours, shapes, shadows. "Canopy" = the teammate's older dark-green style, reference only.
- `CHANGELOG.md` — every change by version; bump `version` in `shell.config.js` with each entry.
- `shell.config.js` — page list, menu tree, and each screen's Summary panel text (`desc`, `parts`): keep it in sync when a screen changes.
- `pages/` — screens (`g-` guest, `h-` host, `a-` admin). `css/lokali.css` shared styles (Airy overrides at the end), `js/lokali.js` shared behaviour, `js/data.js` experiences and people.
- `assets/brand/` — logo files (mark + humanist/geometric wordmark); the app uses the humanist wordmark (`L.wordmarkStyle` in `js/lokali.js`).
- `explore/` — comparison mocks (must work opened from disk; see mock rules).
- `.claude/skills/` — the Design Department skills used to build this (presenter, iPhone frame, UX writing, localized content, etc.) plus Sebastian's deep-work skill.
