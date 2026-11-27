# Fixes by finding

| Kind | Rule | Fix |
|---|---|---|
| `contrast` | Text 4.5 : 1; large text (24 px, or 18.7 px bold) and icons 3 : 1 (AAA: 7 : 1 / 4.5 : 1) | Darken the text token or lighten the background token; never lower opacity on text. Check the dark theme too. |
| `target` | Tap target at least 44 × 44 (Apple) or 48 × 48 (Google); inline text links are exempt | `min-width` / `min-height` on the control, or padding; keep the visual size and grow the hit area with padding or a `::after` inset. |
| `alt` | Every `<img>` has `alt`; decorative images `alt=""` | Describe what the image shows in a few words ("Plate of nasi lemak"), not "image of". |
| `name` | Icon-only buttons and links need an accessible name | `aria-label` in label style ("Search", "Close", "Add to cart"). Icon fonts stay `aria-hidden="true"`. |
| `label` | Every field has a visible label (or `aria-label`), not just a placeholder | A `<label for>` above the field; the placeholder becomes an example. |
| `lang` | `<html lang="en">` (or `ms`) on every page | Add it. |
| `heading` | One `h1` per screen, no skipped levels | Retag; style with classes, not heading levels. |
| `zoom` | The viewport must not block zoom | Remove `maximum-scale=1` / `user-scalable=no`. |
| `tabindex` | No positive `tabindex` | Use DOM order; `tabindex="0"` only for custom controls. |
| `autoplay` | Media doesn't autoplay with sound | `muted` + controls, or a play button. |
| `motion` | Animations respect `prefers-reduced-motion` | A `@media (prefers-reduced-motion: reduce)` block that stops loops and long transitions. |

Exceptions: `data-a11y-ok` on the element, and one line in `DESIGN.md` "## Accessibility" saying why.
