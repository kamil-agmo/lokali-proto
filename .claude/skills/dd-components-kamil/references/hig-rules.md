# Apple HIG rules for prototypes (studied Oct 2026, all 173 HIG pages)

Short rules from Apple's Human Interface Guidelines that a web prototype can follow. Use them for the Apple (ios) style, and as good practice in any style. Source: developer.apple.com/design/human-interface-guidelines.

## Components
- **Tab bar**: moves between top-level sections only, never runs actions. Always visible on those sections, every tab labelled, never disabled or hidden (show an empty state inside instead). Badge only for critical news. Floats above content at the bottom.
- **Toolbar / top bar**: few items; extra actions go in a More menu. Standard Back and Close. Little tinting. Most-used action stays visible first.
- **Buttons**: every custom button has a pressed state. The preferred choice stands out by style (filled), not size. The primary style is never on a destructive action. Prefer capsule or circle shapes; main action full width at the bottom. Text when a word is clearer than an icon.
- **Alerts**: only for critical, actionable news; never for undoable actions or at launch. Title says the situation; up to 3 buttons; "OK" only when purely informational; a destructive button always comes with Cancel. No scrolling.
- **Action sheets**: choices about an action the person started; at most 4 buttons including Cancel; no scrolling.
- **Sheets**: one at a time. Single-view sheet: Cancel on the leading side, the action (Done/Save) on the trailing side; never Cancel, Done and Back together. Long or complex flows: use a full screen instead.
- **Menus**: title-case labels, no "a / the", "…" when more input follows, most-used first, icons only where they help. Context menus: hide unavailable items (do not dim), one submenu level at most, everything also reachable elsewhere.
- **Lists**: short row text, a visible tapped state, limit rows where possible. Switches only inside list rows; elsewhere a toggle button.
- **Segmented control**: few segments, equal widths, text or icons (not both), noun labels.
- **Search**: a main place if search matters; search as people type; show the scope; offer suggestions.
- **Progress**: show something straight away; a bar (with progress) rather than a spinner when the length is known; keep it moving; same place every time.
- **Popovers**: not on a phone-size screen; use a sheet.
- **Status bar**: content under it is covered by it; hide it only for full-screen media.

## Patterns
- **Modals**: only with a clear benefit; short; an obvious way to close; ask before closing if work would be lost; close one before opening another.
- **Feedback**: warn before unexpected, irreversible loss; confirm when something significant finishes; when something cannot be done, say why.
- **Empty screens**: always a clear next step.
- **Onboarding**: prefer small tips in context to a long flow; put off setup and permission requests until needed; ask for ratings only after real use.
- **Accounts**: ask for sign-in as late as possible and only if needed; offer account deletion inside the app.
- **Entering data**: offer choices instead of typing; get what the system already knows; say what is required.
- **Settings**: good defaults, as few settings as possible; change task options in place.
- **Launch screen**: looks almost like the first screen, no text, no branding.

## Foundations
- **Layout**: decide by available space (compact / regular), not device; same functions at every size; stay in the safe area; nothing behind the camera.
- **Colour**: one colour, one meaning; never colour alone (add a label, icon or shape); works in light, dark and increased contrast; accent colour sparingly.
- **Dark Mode**: follow the system appearance; an in-app light/dark switch is discouraged (fine as a presenter-only control). Soften pure white; raised surfaces slightly lighter in dark.
- **Accessibility**: contrast at least 4.5:1 for text; tap targets 44 x 44 pt with space between them; no time-boxed elements; option to stop flashing; gentle motion.
- **Typography**: avoid light weights, few typefaces, built-in text styles; layouts survive large text with little truncation.
- **Icons**: weight matches the text beside it; optically centred; a filled "selected" version only where needed; alt text for custom icons.
- **Motion**: purposeful and short; none on frequent actions.
- **Writing**: tone fits the moment; consistent capitalisation; plain words.
- **Branding**: content first; no logo everywhere; no branded launch screen.
- **Liquid Glass** (iOS 26+ look): glass is only for the layer floating above content (tab bars, toolbars, sheets), never the content; clear glass only over busy imagery, with dimming if text suffers; colour on glass sparingly.

## iPhone details (from the iOS sections)
- **Search tab**: when search is a main way in, give it its own round button at the trailing end of the tab bar, apart from the other tabs.
- **Sheet heights**: a sheet can rest at half height and drag up to full; show the grabber bar at the top whenever it can be resized (tap or drag it). Half height suits "most useful first, more on drag".
- **Menu top row**: a menu may open with its 3 or 4 most-used actions as an icon row above the list (Copy, Share, Like), the rest listed below, destructive last in red.
- **Large title**: a big left title at the top of a screen turns into a small centred title in the top bar once the content scrolls.
- **Clear button**: text fields show a small round x at the trailing end while they have text; empty fields show a hint (placeholder), not a label inside.
- **Page dots**: plain dots (minimal) just show position; dots on a pill (prominent) only when the dots are the main way to move between pages; a tap on either side moves one page.
