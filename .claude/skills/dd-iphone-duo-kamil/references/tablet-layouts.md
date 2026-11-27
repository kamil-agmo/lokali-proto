# Tablet layouts for the open inner display

The layouts are automatic: `js/shared/duo-auto.js` recognises each screen and marks it, `css/shared/duo.css` lays it out. Read this to check the result, override a screen (`<html data-tablet="...">`) or add a tweak in `css/shared/duo-tablet.css`.

## Sizes (by width, so the page reflows live while the phone opens or turns)

| Pose | Screen | Google window size class |
|---|---|---|
| Closed | 451 × 650 | compact (< 600): the phone layout, with the side rail |
| Open, vertical | 650 × 920 | **medium** (600–839) |
| Open, horizontal | 920 × 650 | **expanded** (840+), with the side rail |
| iPhone turned sideways | 874 × 402 | **expanded** width, compact height: tablet layouts apply, a compact tab bar stays at the bottom (centred, icon beside label, 46 px), content clear of the Dynamic Island (right; every turn goes 90° to the right) |
| Closed Duo turned sideways | 650 × 451 | **medium** layouts (with the 'layout' choice); the rail runs from under the status bar to above the camera (bottom-right) |

Tweaks use `@media (min-width: 600px)` and `@media (min-width: 840px)`, scoped with `html.duo-wide` so the iPhone and the closed Duo never change.

## How a screen is recognised (first match wins)

| Kind (`data-tl-kind`) | Recognised by | Medium | Expanded |
|---|---|---|---|
| `signin` / `signin-plain` | a password field; `signin` when a picture-only block sits beside its form | centred, max 420 | brand panel left, form right; `-plain`: centred, max 420 |
| `form` / `form-split` | two or more fields; `-split` when the form has a picture block (photo picker) | centred, max 560 | picker left (sticky), fields right; or max 560 |
| `detail` | a photo grid (6+ pictures with no words, over 2+ rows) beside other blocks | 4-column grid, blocks stacked | details in a 300 px left column that stays put, only the grid scrolls; a heading right before the grid stays above it |
| `grid` | a photo grid alone | 4 columns | 4 columns |
| `cards` | 4+ small repeated cards with a picture and words, over 2+ rows (products, places) | 3 columns | 4 columns, up to 880 wide |
| `feed` / `feed-pane` | 2+ big repeated cards with pictures (200+ px wide); `-pane` when the page has `<aside class="t-pane">` | 3 columns of cards | 4 columns up to 960; with a side panel: the feed + a full-height 320 px column with a faint divider, each with its own bar (Apple split view) |
| `hero` | the first block is a big picture, a video, or a swipe row of photos as wide as the screen, with details under it (a product, a post with comments, an article) | stacked, max 600 | pictures left (stay put, never taller than the screen), details or comments right, scrolling |
| `list` | 3+ full-width rows that each link to another screen (orders, mail, conversations) | like the phone: one readable column, a tap opens the page, a large title shrinks on scroll | list left (360, only it scrolls) with its own bar, the tapped row's screen right as its own column from the top with its own bar, level with the list's (Apple split view). The opened screen hides its tab bar and Back button, a large title shows already shrunk (only the list scrolls), and tapping a row opens it there instead of leaving the list |
| `chat` | a message box fixed at the bottom | thread and box, max 720 | same, beside the rail |
| `readable` | anything else | one centred column, max 600 | same |

**Arrangements** (Apple's ArrangementView) - for a main view with a secondary one that no screen kind covers, such as a player and its
transcript or up-next list. Mark it in the page: `<div data-arrange="split|overlay" [data-arrange-axis="horizontal"]>` with one child
`data-primary` and one `data-secondary`.

| | Closed (narrow) | Open, wider than tall | Open, taller than wide |
|---|---|---|---|
| `split` | the phone layout (stacked) | side by side, the secondary 40 % (min 280 px), staying put | stacked |
| `split` + `axis="horizontal"` | main view only | side by side | main view only |
| `overlay` | the phone layout | the secondary as a 360 px card, bottom-right, clear of the column | the secondary as a bottom card above the tab bar |

Choose `split` when the two are main and detail and neither may be covered; `overlay` when controls float over content that can be
partly covered. A hidden secondary (`hidden`) gives the main view all the room, and it does not jump to the middle. Never put navigation
(a list-detail screen, tab views) inside an arrangement.

On every kind, **stat tiles** (2+ short blocks with a number and no picture that wrap onto 2+ rows on the phone, as on a dashboard) get as many columns as fit, and a readable screen with tiles gets a wider column (880). A row of counts that already fits (a profile's Posts / Followers) is left alone.

## What a real iPhone Duo does (HTX Studio review, youtube.com/watch?v=o1qc29t04GI, 14:41-15:44)

- Apps not yet updated show as a phone-sized column in the middle of the inner screen (our `off`).
- Social feeds go from 2 columns to 3 or 4; opening a post puts the photos on the left and scrolling comments on the right (our `feed`, `hero`).
- Chat apps use separate sections: chat list left, conversation right (our `list`, open horizontally). Open vertically our lists behave like the phone - the designer preferred that to the stacked view.
- Shopping: other wide foldables show product photos left, details and reviews right; the reviewer calls this layout missing on the Duo (our `hero` does it).
- The outer screen's right-side control strip carries over: status bar and bottom navigation move to the right, freeing vertical space for more content (our side rail).

## Guidelines to follow

- **Google canonical layouts** (developer.android.com, "Canonical layouts", "Window size classes"): list-detail, feed, supporting pane (about 70 / 30).
- **Apple, iPhone Duo** (see `hig-study.md`; it was written from Apple's page, so re-read the page for exact wording): don't just stretch the iPhone layout; the inner display may show one extra level of hierarchy; same functions and state on both displays; even grid columns so content divides at the fold.

## When a screen is recognised wrongly

Set the kind on the page (`<html data-tablet="list">`), or `off`: the screen then shows the way the Duo shows an app with no tablet layout - the phone layout at phone width (402) centred on a dark screen, with its own bars and no side rail, or add a small tweak in `duo-tablet.css`. Rows that don't link anywhere (an order history with no detail screen) stay one readable column on purpose: there is nothing to open beside them.

## Tested on

- **OTW** (social feed, kit components): feed-pane, detail, form-split, signin, readable, hero (a post with swipe photos and comments), list (Activity rows open the post beside or below).
- **Leaf Market** (shop, plain HTML without the kit's components): cards, hero, detail with a grid title, feed, form, signin-plain, list (orders and messages open beside the list), chat, dashboard tiles, a post with a photo swipe row and comments, a screen set to off, readable. The plain word-only tab bar moved to the side rail with symbols.

## Lessons (each one was a real bug)

- **Keep the phone's look.** Don't change corner radii, gaps or colours only on the tablet view (rounded photos appeared only on the open Duo and looked wrong). Change the layout, not the style.
- **Place every child of a grid.** When you move blocks into columns, give each one a row; two auto-placed blocks in the same column overlap.
- **No sticky block above another block in the same column.** It slides over the one below while scrolling.
- **Selector strength.** `html.duo .page:has(#x) > *` beats a plain class: put the pane's own rule at the same strength, or it lands in the wrong column.
- **Side-panel content needs real behaviour or a note.** Follow buttons that only toggle on screen are fine in a prototype, but say so in the summary.
- **Check with numbers, then a screenshot.** Measure each column's left, top and width in the open-horizontal and open-vertical poses, then look at it.
- **Words make a card, not a photo.** Product cards (picture + name + price) once counted as a photo grid; a photo grid's tiles have no words.
- **Card grids before feeds.** On a wide screen, grid cards are as wide as feed cards, so check for a multi-column card grid first.
- **A grid's title travels with the grid.** Moving the grid into the right column without its heading leaves "My plants" stranded on the left.
- **Check what covers the screen before fixing it.** A title "cut off" at the top-left was behind the presenter's Navigation card in a narrow window, not under the screen corner.
- **One name per thing in a script.** A local `pane` for the feed's side panel hid the detail pane of the same name, so list-detail opened empty.
- **Leave what already fits.** Widening every row of numbers wrapped the profile counts in the narrow left column; only tiles that wrap on the phone get more columns.
- **Fit the content box, not the outer box.** Four 180 px feed columns did not fit the 765 px inside the padding; 176 px does, and still gives 3 when open vertically.
- **A picture beside scrolling text must fit the screen.** The post's photos ran 65 px past the bottom; the hero is capped at the screen height.
- **Tab bars float.** The kit's tab bar sits above the bottom edge, so "fixed at bottom: 0" missed it inside the detail pane; any bar within 48 px of the bottom (and every `.c-tabbar`) counts.
- **A tab bar left at the bottom covers the stack.** Open vertically the bars stay horizontal, so the stacked detail pane keeps room for the screen's own tab bar (measured, not guessed).
- **Hidden items do not count.** A Following tab hid 3 of 6 posts, the hidden ones failed the "big card" test and the feed fell back to one column; recognition now looks only at what is showing.
- **Pinned blocks follow the bar.** Once the title bar scrolls away, a side panel pinned under it leaves an empty gap; in the side poses pinned blocks stop near the top of the screen instead.
- **Only widen what is already wide.** The sticky "New posts" pill was stretched to the feed width with the stories and tabs; only blocks that already span their column (60%+) line up with the layout now.
- **Keep the phone's edges in a single column.** Forcing the tabs to the column width dropped their margins (they touched the edge) while the feed's grid padding pushed the photos in; beside a panel the column keeps the phone's insets and full-bleed photos.
- **Floating buttons belong to the content they act on.** "New post" was pinned to the screen edge, which is where the side panel sits; beside a panel it floats over the feed column corner instead.
- **A sideways phone is short.** A full-height tab bar covered a quarter of the sideways iPhone; compact height gets the compact bar. And a camera moved by turning the phone must be checked against the rail.
- **Side panels must fit short screens.** On the sideways iPhone the panel ran off the bottom under the tab bar; it is sized from where it starts and scrolls inside itself.
- **Vertical lists behave like the phone.** Stacking the opened item under the list locked the page, so the large title never shrank and the top looked empty; the designer chose phone behaviour for the open vertical Duo.
- **Tab bars float at their own width on tablet-wide screens.** A bar stretched across 650 px looked like a stretched phone bar.
- **One icon font per page.** Loading a second Material Symbols copy with only the rail's new icons replaced the page's own, and its icons showed as words; add names to the page's existing font link.
- **Pop-ups the rail opens live inside the rail.** A menu added to the page body re-ran the rail set-up, which closed the menu at once.
- **Bars appear in place on load.** The bar under the phone slid down from the top of the window on every load; it only slides when the phone changes.
- **The closed Duo is the closed Duo, sideways or not.** Its sideways pose also uses the wide layouts, so outer-display rules (sheets) key on `duo-outer`, not on the absence of `duo-wide`.
- **Each column has its own bar.** Apple's split view puts a bar over each column; one bar across both made the opened item look nested under the list. The item's top room is the list's minus how far down its column already starts (pages that pad the whole body).
- **A turning frame still shows the app upright.** A brand-colour fill during the sideways fold read as a purple flash; the page is counter-turned inside the frame and laid out as the pose it is becoming.
- **A corner camera must be equidistant from both edges.** Turning the phone swaps "from the top" and "from the right", so any difference shows as a jump when the turn lands; measure it on screen, not in the code.
- **Nothing goes under the camera, even when it opens.** A shrunk tab bar expanded downward under the sideways camera; it opens upward from where it sits instead.
- **Navigation screens keep their whole tab bar.** Only toolbar buttons overflow into "more"; when room is short the rail tightens (44 px tabs) before the tab bar shrinks. Re-measure gaps after changing them: a stale gap made the check shrink tabs that fitted.
- **Toolbar buttons keep their end.** Buttons from a bottom toolbar belong at the bottom of the column, above the tab bar, not up with the top bar's.
- **Opted-out screens still have a column.** A screen keeping its own bars sits left of the status column, or its tab bar runs under the time and camera.
- **Re-centre the camera when the rail changes width.** The rail went from 84 to 72 px and the camera stayed placed for 84, 6 px off its centre line; place it from the rail width (half the rail minus half the camera).
- **The tab bar is as slim as the buttons above it.** 48 px wide around 44 px tabs (about 92% fill, like Apple's rail); single buttons keep 48 px in a tight rail so every piece matches.
- **The selected tab sits on a vertical pill.** Apple's rail highlights the current tab with a pill about 1.3x taller than wide, reaching into the gaps; keep it inside the bar where the bar has little end room.
- **Side panels are columns, not cards.** Apple's split view (Mail on the Duo) runs each column the full height with a hairline between them and a bar per column; a panel of floating cards under the feed's bar read as part of the feed. Content that swaps into the panel (a post's comments) gets its own bar, level with the feed's.
- **Desktop pages have no device.** The frame rules key off the chosen device, so an admin page reached while the Duo was chosen showed the crease, the rounded corner and the device tabs; everything Duo-specific is hidden while the shell is full-window, by CSS so it holds however the page was reached.
- **A sheet-style top bar (Cancel … Save) keeps its title centred** in every pose, as on iPhone and iPad. Only bars with icon or Back buttons move the title to the left on the open screen.


## Feed side panel (fill it without asking)

**Fill every feed's side panel yourself, without asking** (the "one extra level" on the inner display). For each screen recognised as `feed`, add `<aside class="t-pane">` as the page's direct child with two cards built from content the app already has, never invented facts:
   - **People or makers** the feed shows (authors, shops, creators): `.t-card` > `h2` + `ul.t-people` with avatar, name, one line, and a `.t-follow` button that toggles.
   - **Topics** from the feed's own tags, categories or titles: `.t-card` > `h2` + `.t-tags` of `.t-tag` buttons.
   Pick the two headings that fit the app ("Suggested for you" + "Trending" for social; "Shops you like" + "Categories" for a store; "Writers" + "Topics" for articles). Fill them in the page's script from the same data the feed uses, so they change with it. Say in the summary which buttons only toggle on screen. The screen then shows as `feed-pane`; without a panel it shows 2 columns of cards, which is also a valid feed layout.
