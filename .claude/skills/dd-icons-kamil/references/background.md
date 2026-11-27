# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing

- **Subset via `icon_names`** is what makes it light. Without it the font is ~300 KB+ per axis set. A missing name renders as plain text: that is the first thing to check when "an icon shows as a word".
- **Pin axes, don't range them,** unless a state needs it. Each extra range (e.g. `wght@100..700`) grows the file; `FILL 0..1` for active states is the usual exception.
- **`opsz` is not `font-size`.** `opsz` tunes stroke detail for a size; keep it at the baseline even when an icon is drawn smaller or larger, unless the user asks otherwise.
- **The family name follows the style:** `Material Symbols Outlined | Rounded | Sharp`. The CSS `font-family` must match the link.
