# iPhone Duo: HIG study (reference for a future skill)

Handed over from another session on 2026-10-22. Source: Apple HIG "Designing for iPhone Duo" (published 9 Sep 2026),
https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo. Re-read the page for exact wording before building.

## 1. Device
- Two displays, each with its own front camera, plus a centre hinge.
- Outer display (closed): wider and shorter than other iPhones; camera in the corner, always visible.
- Inner display (open): camera behind the display, hidden until active.
- Poses: partly folded like a book, flat on a surface, standing on its edges.
- Still iPhone: normal iOS HIG patterns apply.

## 2. Adaptive layout (not one design per pose)
- Compact width on outer, regular width on inner; let the existing layout expand.
- Size classes, layout margins, safe areas; no fixed widths or display-specific dependencies. Preview poses in Xcode Device Hub.
- Same functionality and state across displays; inner may show one extra level of hierarchy (Mail: list OR email closed; list + email open).
- Games: fill the screen in every pose; change aspect ratio rather than letter/pillarbox; if unavoidable, add artwork in the padding.

## 3. Vertical controls (biggest change)
- Tab bar, toolbar, navigation buttons, status bar and Dynamic Island move to the SIDE on the outer display and on the inner display in landscape. Exception: inner display in portrait keeps horizontal bars.
- Split View multitasking on inner: each app puts its controls on its outer edge; same side in RTL.
- Content area is asymmetric; safe areas keep side controls off content.
- Keep controls' relative positions consistent across poses.
- Side toolbar order: top = primary navigation (Back/Close), then prominent actions (Done); keep original groupings.
- Items overflow bottom-to-top; set visibility priority (ToolbarItemVisibilityPriority / UIBarButtonItemVisibilityPriority); keep frequent and badged items visible longest.
- Don't override default bar placement.
- Full width is fine for immersive, non-scrolling UIs (Calculator) if nothing conflicts with the Dynamic Island / status bar; can mix full-width header with inset scrolling content.
- Group with ToolbarItemGroup / UIBarButtonItemGroup; no manual spacing.
- Keep controls next to the content they affect.
- Every non-text toolbar item needs a title AND a symbol; minimise text buttons.
- Short on space: navigation-focused views keep the tab bar and overflow toolbar items; task-focused views minimise the tab bar (ToolbarVerticalCompressionBehavior / UIVerticalBarCompressionBehavior).
- System overflow menu only; ellipsis reserved for it.

## 4. Reserved regions
- Outer front camera: always present; expands into the Dynamic Island for Live Activities.
- Inner front camera: only while active; UI moves aside.
- Folding region: only when partially folded; splits the inner display, excluding the centre.
- Alerts, context menus, sheets move off the fold automatically; custom views use ReservedRegion / UIView.ReservedRegion.
- Grids: prefer an even number of columns so content divides at the fold.
- Folding: small adjustments, not rearrangement.

## 5. Split views and arrangement views
- Split view expands on inner, collapses to one pane on outer (NavigationSplitView / UISplitViewController).
- ArrangementView / UIArrangementViewController: primary + secondary.
  - Split arrangement: side by side when wider than tall, stacked when taller; axes can be limited.
  - Overlay arrangement: layered; when partially folded they move to each side; secondary can collapse.
- HStack/VStack-like → split; ZStack-like → overlay.
- Keep navigation (split views, tab views) outside arrangement views.

## Related
Apple Design Resources, Screenshot specifications, Designing for iOS, Layout; "Preparing your app for iPhone Duo"; videos "Design for iPhone Duo", "Raise the bar with iPhone Duo", "Strike a pose with adaptive layouts on iPhone Duo".

## Skill idea (not started; wait for the user)
Adapt a static HTML/CSS/JS prototype for iPhone Duo: outer (wide/short, corner camera) and inner frames with poses (open, partly folded, landscape); side-mounted tab bar/toolbar where the HIG says so; reserved regions (camera, fold); even-column grids that split at the fold; consistent controls across poses; per-layout checklist. Fits the kit next to dd-presenter-david (frames) and dd-components-kamil (side-mounted bar variants).

## Decisions in the OTW prototype

- **2026-10-22: Half-open (partly folded) mode is switched OFF for now** — not needed yet. Nothing was deleted:
  - Turn it back on: set `HALF_OPEN = true` in `OTW/js/shell/duo.js`. The Half-open tick reappears in the bar above the frame.
  - Still in place: the `half` device (920 × 760), the shaded fold band (`css/shell/duo.css`), the fold-aware layouts (`html.duo-half` in `css/shared/duo.css`: two columns split at the fold, titles, forms and the "New posts" pill kept in the left half, profile grid split 2 + 2), and the open/close animation for it.
  - While it is off, a link with `?device=half` shows open horizontal instead.
  - Why it matters later: it is the only pose where the HIG's reserved fold region applies, so bring it back before testing layouts that must avoid the fold.

## Apple session: "Raise the bar with iPhone Duo" (youtube.com/watch?v=2y6xvya0b8M, studied 2026-10-26)

- The outer display is wider and shorter, so navigation bar, toolbar and tab bar share ONE region on the side, turned onto a vertical
  axis; they stay there when the Duo opens horizontally. Open vertically keeps horizontal bars.
- The region may hold a toolbar, a tab bar or both. In split views only the detail column gets it. Sheets: on the outer display a sheet
  with a toolbar gets a vertical bar; on the inner display sheets are centred and keep horizontal bars (a sheet placed right gets a
  vertical bar, placed left does not). The region stays on the same side in right-to-left languages.
- Order top to bottom: primary navigation (Back / Close), then prominent actions (Done, a filled accent circle), then the remaining
  items, keeping their groups; top and bottom bar items share the one bar. Keep placement consistent across poses.
- Vertical bars have a fixed width, so items show symbol-only; give every item a title AND a symbol. Text-only items (Edit) and items
  that switch between text and symbol stay horizontal, with the title top-left. Custom views stay horizontal unless built for vertical.
- Prefer symbols: show counts as a badge on the symbol; keep a control horizontal when its text carries information (a cart total).
- Custom views: hide titles / shorten when vertical; the bar has no background (except with Reduce Transparency), so keep content
  legible; flexible spacers collapse to zero, fixed spacers keep their size.
- Overflow: the sideways outer display, the keyboard and picture-in-picture take room. Navigation-focused views compress the toolbar
  first (tab bar stays); task-focused views minimise the tab bar. One system overflow menu ("..." is reserved for it); items leave
  bottom-up unless given high / low priority; frequent actions and badged items stay longest.
- Opt out of the vertical bar for single-page bottom-heavy layouts and control-heavy sheets.

## Apple's four companion sessions (studied 2026-10-26; summaries in our own words)

Marks: **[in skill]** already built in · **[on request]** build only when a project asks · **[not for prototypes]** skip.

### "Prepare your app for iPhone Duo" (youtube.com/watch?v=qsd-VwqmZvI)
- An app with no Duo work still runs: closed, it uses the area left of the status/camera column; open, it shows at a familiar phone size. **[in skill]** (`off`, and opted-out screens sit left of the column)
- Lay out by the space you get (size classes / width), never by device type or orientation; resizable apps are most of the work. **[in skill]** (width-based layouts)
- Bars sit outside the safe area; content belongs inside it, backgrounds may run under the bars. Safe areas and margins are uneven: content may sit closer to the control side. **[in skill]** (72 px column)
- Side controls can be on the LEFT: in landscape and when the app is the left one of two side by side. Never assume equal left and right insets. **[on request]** (split-screen preview)
- Controls near the screen corners should follow the corner curve (concentric). **[in skill]** for sheets on the closed Duo.
- Apple's simulator can open, close, rotate and fold the phone; our presenter shell does the same with its tabs and rotate button. **[in skill]**

### "Design for iPhone Duo" (youtube.com/watch?v=do3UqxfYc3I)
- Poses: in the hand, folded like a book, set down like a laptop, standing on its edges. **[on request]** except closed and open flat.
- Closed: wider and shorter, so controls, status bar and Dynamic Island move to the right edge (thumb reach); content gets a normal-proportioned area to the left. **[in skill]**
- Mapping: navigation to the top of the column, bottom toolbar buttons to its bottom, tab bar bottom-aligned; items too wide for the column stay in the top bar. **[in skill]**
- Too little room: items collapse into one overflow menu. **[in skill]**
- Asymmetric layouts: centre content in the area left of the controls, not the whole screen (standard insets do it). Immersive, non-scrolling screens may run full width with content inset. **[in skill]**
- Open: don't stretch the phone app; show more of the hierarchy (sidebar, two columns, list-detail). Same features in every pose. **[in skill]**
- A special layout for one pose is optional (laptop: media on top, controls on the bottom half), never with features only that pose has. **[on request]**
- Sheets: vertical bar on the closed Duo by default; a sheet with a single button may drop it and then stops short of the camera. Open: horizontal bars. **[in skill]** (vertical bar; single-button option not built)
- Folded: sheets, alerts, menus and buttons are nudged off the fold. **[on request]**
- Two apps side by side by dragging one to the side; the left app gets its controls on the left edge; a video can be pinned to the top. **[on request]**

### "Strike a pose with adaptive layouts" (youtube.com/watch?v=d1xi9GAfSRI)
- Reserved regions: the fold (divides the screen, only while folded) and the camera (covers a small area, only while active). **[in skill]** for the camera column; fold **[on request]**.
- Displacement (folded): move an element to the region that suits it - top for viewing, bottom for tapping - keep it near its source, move groups together; scrolling content (feeds, articles, lists) is never displaced. **[on request]**
- Split views folded: an even 50/50 split with a larger gap at the hinge. Prefer even column counts. **[in skill]** (even grids); fold split **[on request]**
- Arrangements: a main + secondary view. Split = side by side when wider, stacked when taller, axis can be limited (then only the main view on the other shape); overlay = layered, the secondary can collapse; folded, each goes to a side. HStack/VStack-like layouts -> split, ZStack-like -> overlay; main/detail -> split, controls over readable content -> overlay. Don't put navigation inside one. **[in skill]** (`data-arrange`; folded behaviour on request)

### "Leverage multiple displays and scenes" (youtube.com/watch?v=Biqw19XiqQY)
- Apps can read the hinge (closed / partly open / open, and the exact angle) for effects such as a wallpaper zoom. **[not for prototypes]**
- Apps must work at half the inner screen (split-screen multitasking); a second window can't be opened on the closed screen. **[on request]**
- Camera apps can show extra UI on the outer screen (a teleprompter, a preview for the person being photographed). **[not for prototypes]**
