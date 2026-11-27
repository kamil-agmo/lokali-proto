# Components: catalogue, questions, gallery, wiring

## The 38 components

| Group | Components (id) |
|---|---|
| Navigation | Tab bar (`tabbar`) · App bar / navigation bar (`appbar`) · Large title that shrinks on scroll (`largetitle`) · Segmented control / tabs (`segmented`) · Toolbar (`toolbar`) · Side menu (`drawer`) · Page indicator (`pagedots`) |
| Actions | Buttons (`button`) · Floating action button (`fab`) · Icon buttons (`iconbutton`) · Chips / filters (`chips`) · Menu (`menu`) · Action choices: Apple action sheet / Material FAB menu (`actions`) · Button group (`buttongroup`) |
| Inputs | Text field (`textfield`) · Text area (`textarea`) · Search bar (`search`) · Switch (`switch`) · Checkbox and radio (`checkbox`) · Slider (`slider`) · Stepper (`stepper`) · Dropdown / select (`select`) · Date and time (`datetime`) · Code input (`otp`) |
| Surfaces | Card (`card`) · List rows (`list`) · Swipe actions (`swipe`) · Bottom sheet (`sheet`) · Dialog / alert (`dialog`) · Tooltip and popover (`tooltip`) · Expandable sections (`accordion`) · Carousel (`carousel`) · Avatars and badges (`avatar`) |
| Feedback | Snackbar / toast (`snackbar`) · Notice banner (`banner`) · Progress and loading (`progress`) · Skeleton loading (`skeleton`) · Empty state (`emptystate`) |

## The questions, in full

| Header | Question | Options (with the explanation to show) |
|---|---|---|
| `Style` | Which look should the components have? (4 options max: offer the best fit for the app first, and mention that Fluent 2, Carbon and Ant Design are in the gallery too) | **Apple iOS 27**: floating glass bars, capsule buttons, large titles; at home on iPhone · **Material 3 Expressive**: tinted surfaces, pill indicators, shape-morphing buttons; at home on Android · **Fluent 2 / Carbon / Ant Design**: calm, square-ish enterprise styles for productivity, dashboards and admin (choose which in the gallery) · **Mix, per component**: choose each one in the gallery. Recommend the one matching DESIGN.md (Apple HIG → Apple, Material → Material, Fluent → Fluent, Carbon → Carbon). |
| `Pick how` | How do you want to choose the components? | **Open the gallery (Recommended)**: a page with every component live in both styles, in your app's colours; tap "Use this" on the ones you want · **Install a starter set**: tab bar, app bar, large title, buttons, text field, list, bottom sheet, dialog and snackbar in the chosen style, no browsing · **I'll name them**: type the components you want |
| `Motion` | How much movement should components have? | **Native-feeling (Recommended)**: springy switches, sliding sheets, shrinking titles, as on a real phone · **Calm**: same components, shorter and softer animations · **None**: no animation (also what people with "reduce motion" on always get) |
| `Use where` | Where should the components go? | **New screens from now on (Recommended)**: install them and use the snippets as screens are built · **Also replace in existing screens**: swap the prototype's current tab bar, top bars, buttons and similar for the picked components (I will list each change) |

## The gallery (for "Open the gallery" or "Mix")

1. Build it with the project's tokens, so previews wear the app's brand:
   ```bash
   python3 <skill>/scripts/components.py gallery --out <scratch dir> --project <project> --app "<App name>" --accent "<brand colour>"
   ```
   Keep it out of the project folder so it is never deployed. If components were installed before, the page starts with those picks.
2. Serve the folder over http in the background and open `components.html` in the browser pane (or in the person's browser). Tell them in one line: look at both styles, press **Use this** on the ones they like (or "Use Material/Apple for all"), then **Add to prototype** at the bottom, then say "done".
3. When they say done, read `window.componentChoice` → `{ picks: [{ id, variant }] }` with the browser JavaScript tool. If it is empty, ask them which ones they picked. Repeat the picks back in one line (names and styles) before installing.
4. Stop the gallery's server when finished.

## What is wired automatically

**Use the snippets** from `COMPONENTS.md` in screens. Replace the demo text, icons and links with the screen's real content. Behaviour is wired automatically: tab bar active state, app bar scroll state, large-title collapse, segmented thumb, slider fill, sheets, dialogs, side menu and action sheet (`data-c-open="id"`, `data-c-close`, Esc, backdrop, swipe down), menus (`data-c-menu="id"`), popovers (`data-c-pop="id"`), FAB menu, chips and button groups (fire `c-change`), stepper limits, code input auto-advance and paste (`c-complete`), carousel + page dots, swipe actions (`c-swipe-action`), dismissible banners (`data-c-dismiss`), text-area counters, `C.toast('Saved', { action: 'Undo' })`. With "Calm" motion, add `--c-ease`/`--c-spring` overrides or shorter durations in the page CSS; with "None", set `transition: none; animation: none` for `[class*="c-"]`.
