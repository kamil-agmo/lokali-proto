# Changelog

## 0.33.4 · 2026-11-27
- Fixed: opened from disk (index.html / admin.html as a file), the left menu stayed on the first screen while you tapped through the phone. The screens labelled their "I'm on this page" message with the wrong prefix and the shell rejected file:// messages; both fixed (js/shared/embed.js, js/shell/prototype.js, js/pages/lock.js). Checked on all 38 app screens, from disk and from a server.

## 0.33.3 · 2026-11-27
- Presenter menu: the group holding the current screen always stays open, so the screen you are on (e.g. Booking details) is always visible and highlighted.
- Handoff: CLAUDE.md (imports the working rules in .claude/rules), Design Department skills copied to .claude/skills, HANDOFF.md.

## 0.33.2 · 2026-11-27
- Booking details (MIMS): same aerial mangrove photo as its Bookings card, with the hill edge; title 28/700; date and host, Bring and Receipt as open sections with hairlines (no boxes); row icons grey.

## 0.33.1 · 2026-11-27
- Eco green now matches the logo: #37664A (was #2F5D3A), strong #1C522C (the wordmark green). Impact lines, leaf icons, links and the money chart follow it. Brand red #D7263D stays for actions (white text on the logo rose would fail contrast).

## 0.33.0 · 2026-11-27
- Lokali logo from the brand files (assets/brand: mark in colour / white / black, wordmark in geometric and humanist, each green / white / black). Every "lokali" leaf + text wordmark (Home, Sign in, guest and host emails, Admin sign-in) now shows the humanist wordmark, white on dark backgrounds and green on light ones (one switch in js/lokali.js: L.wordmarkStyle).
- Browser tab icon (colour mark) and home-screen icon (assets/brand/app-icon.svg, apple-touch-icon.png: the mark on white) on the app, admin, credits and overview pages.

## 0.32.1 · 2026-11-27
- Large titles work again on tab main screens (Bookings, Inbox; host Calendar, Inbox, Listings, Menu): the big title shows at the top and shrinks into the small bar when scrolling. It started under the small bar, so only the small title ever showed.

## 0.32.0 · 2026-11-27
- Removed the reviewer notes: the "Show brief notes" switch (js/shell/notes.js), every dashed note on the screens (10 pages), the brief's section numbers on the experience page, their styles, and the stored switch setting. Suggestions stay recorded in REQUIREMENTS.md (Q11, Q13–Q15).
- Fixed: js/art.js opened with a comment that closed one line early, so every screen threw a script error and the illustrations did not load.

## 0.31.1 · 2026-11-27
- Presenter: the "Notes off" button now reads "Show brief notes" / "Hide brief notes" (it shows which parts are suggestions and the brief's section numbers).
- Presenter summary text (description + "On this screen") rewritten for Home, Results, Experience page, Choose date, Checkout, Confirmed, Booking details, Cancel, Chat, Write a review and Account to match the screens as they are now (it still described Check availability, Meet your guide, host replies on the listing, a trust strip and other removed parts).

## 0.31.0 · 2026-11-27
- MIMS on the rest of the guest flow (requirements checked first):
  - Booking details: no Share; "In 4 days" as plain text instead of a green Confirmed badge (booking is confirmed instantly, a Must); Cancel booking set apart as a danger action (own section, red outline, one line on the policy). Leave a review stays on past bookings (G10 met there).
  - Cancel: free-cancellation date shown once (on the policy bar); refund amount, Refund breakdown title and Keep booking in ink, no Canopy green.
  - Write a review: cut "Reviews help guests trust local hosts. 2 minutes."
  - Checkout: open summary (no dark ticket box), sentence-case Date / Time / Guests, total shown once in the breakdown and on Pay; cancellation as one title + one line; impact and "Payment held by Lokali" as plain lines; selected payment dot in ink.
  - Confirmed: next-step icons grey, Back to Explore in ink; Add to calendar marked as a suggestion (not in the brief).
- DESIGN.md: shadows only on things that float above scrolling content (search bar, tab bar, Map pill, overlapping profile photo).

## 0.30.2 · 2026-11-27
- Chat: the booking strip is docked under the header (full width, solid white, hairline divider) instead of a flat card floating over the messages with its shadow stripped by the Airy no-shadow rule.

## 0.30.1 · 2026-11-27
- Inbox: one list, newest first. Each thread ends with a plain status line saying what it is about: "Trip in 4 days · Sun, 6 Dec" (dark, upcoming), "Past trip · Sun, 22 Nov", "Enquiry · not booked". Cut: the "1 unread message" line (the dot and the tab badge already say it), the All / Trips / Enquiries switcher (4 threads), the big UPCOMING / ENQUIRIES / PAST headers and the coloured badges. Unread dot now follows the real unread state, in brand red like the tab badge.

## 0.30.0 · 2026-11-27
- Experience page, shorter (MIMS: not everything on one page): itinerary is text only (photos repeated What to expect); Impact story + Where your money goes merged into one Impact section (chart + one line); Getting there shows the map and "1 h 15 min from KL", the drive / bus / pickup options moved into the map sheet; cancellation is one line, "Free cancellation until Thu, 3 Dec, 5:00 PM", opening the dated timeline in a sheet; scrolled header tabs cut from 13 to 5 (Overview, Itinerary, Impact, Price, Reviews). Every brief field is still reachable.

## 0.29.12 · 2026-11-27
- My bookings in Airy: cut the "Next up" strip (same as the first card), the "Confirmed" badge (every booking is instant), the booking code (on booking details) and the Cancelled tab (cancelled bookings go under Past). Upcoming / Past as Home-style pills; upcoming bookings as Home cards (photo, host avatar, date, title, meta, no box); past trips as open rows with an outlined Leave a review pill.
- Chat: the safety reminder is a plain grey line like "Booking confirmed" (was an amber box); quick replies trimmed to "Running late" (bring and parking are answered on the experience page).

## 0.29.11 · 2026-11-27
- Account: Become a host shows her own photo with the blue verified-host tick she earns (was Pak Rahim's photo); line now "Share your place and skills and earn the verified host tick." Delete account moved to its own section, 48px below Sign out, with a one-line consequence.

## 0.29.10 · 2026-11-27
- Switches everywhere back to the iOS size (50x30): a colour rule had painted their invisible tap area, so they showed as 64x44.
- Account: Become a host stands out (soft grey block, hosting photo, red Start pill; Status / Open when in review / approved) because it changes the whole app. Delete account icon is now red like its text.

## 0.29.9 · 2026-11-27
- Results: Map / List switch is a white floating pill with a soft shadow, at the same height as the buttons in Home's tab bar (black is kept for selected chips only). Title "18 nature trips" is now "18 trips"; the filter chip already says Nature & eco-tours.

## 0.29.8 · 2026-11-27
- Account in the Host profile style: photo from her last trip (canopy walk) with the hill edge, round photo overlapping, Edit profile pill, 3 numbers (trips taken, review written, given back) with the impact note, Become a host as an open row, Settings / Help as open rows with 18/700 titles and plain grey icons. Removed: the large "Account" title, boxed cards, green icon tiles, mustard host text.

## 0.29.7 · 2026-11-27
- Host profile, direction A: river photo on top with the experience page's hill edge, round profile photo overlapping it, Message, 3 numbers (guests hosted, rating, reply time), what guests say about him (tags + one review), Q&A. Removed: intro video and the "I learned to paddle" quote.

## 0.29.6 · 2026-11-27
- Host profile in Airy: intro video full width on top (cover is the river, not the avatar photo again), name in 2 lines with a full-width Message pill, open stats, Q&A as open rows with grey icons. Cut: Share and the Experiences card (his only experience is the page you came from).

## 0.29.5 · 2026-11-27
- Experience page, scrolled header: Back and the full place name, with Share and Save moved into a More (⋯) menu. Unselected section tabs are grey, the selected one (text and underline) is brand red.
- DUPE pass: Guide row drops place and languages (already at the top), Impact story drops the line the money chart already shows, "Show all 128 reviews" is now "Show all reviews".
- Reviews heading shows the overall rating on the right: star, 4.96, (128).

## 0.29.4 · 2026-11-27
- Fixed: Guide on the experience page now opens Host profile (the screen was missing from the shell). Host new-booking email screen fixed the same way.
- Fixed: What to expect photos scroll sideways only; the last two photos were invisible until revealed and pushed the row taller.

## 0.29.3 · 2026-11-27
- Experience page: the Groups row and the How to get here rows start at the 24 px page margin like every other section (no inner padding).

## 0.29.2 · 2026-11-27
- What's included: one list with green ticks (no "Included" label, the title says it) and one grey line "Not included: transport to the jetty · dinner · tips".
- Icon gaps on the experience page set to two values: 6 px for small icons inside text, 12 px for icons that lead a row.

## 0.29.1 · 2026-11-27
- Experience page: no vertical line in What's included; "Meet your guide" is now "Guide" (title and section tab); Groups row icon without its grey tile; "Report this listing" is a quiet grey text link with space between the flag and the words.

## 0.29.0 · 2026-11-27
Experience page:
- Where your money goes: Canopy's ring chart (85% stays local) with a clear legend, in Airy greens.
- Price and cancellation: adult and child prices only (no boat), cancellation as a dated timeline (today → last free day → start).
- Reviews: two short quotes that open All reviews, no bars, no score block (the rating is at the top), no host reply.
- Getting there: tap the map to open it; Google Maps and Waze are offered there ("Open in…").
- Groups and companies: one row to the company enquiry with this experience filled in.
- What to expect: five photos in a scrolling row (dusk paddle, mangroves, fireflies, teh tarik, Pak Rahim); no illustration.
- Itinerary: each step has its own photo; the fireflies step shows a real night photo (the illustration did not draw).
- Earlier fixes: no section icons, no price under the title, duration once, grey-outlined buttons, red "4 left", grey icon tiles, no divider in What's included.

## 0.28.1 · 2026-11-27
- Experience page: sections split by a thin line like Home (no thick grey bands), 24 px page margin; Good to know rows (What to bring, Etiquette, Food, Accessibility) use the full width.

## 0.28.0 · 2026-11-27
Experience page, tighter (ideas from the Canopy copy, rebuilt in Airy):
- When the title scrolls away, the top bar shows the experience name.
- Meet your guide is one row (photo, name, verified, host since, place, languages) that opens the host profile, plus the chat button; the bio and the extra "View profile" button are gone (the profile has them).
- "Price and cancellation" is one section: no second Book now button (the bottom bar has it), no repeated "free cancellation" line, heading "Moderate policy".
- Reviews: no rating bars and no double star; two reviews with Pak Rahim's reply kept (host replies on the listing are a Must); guest photos live on All reviews.

## 0.27.2 · 2026-11-27
- Mangrove & fireflies main photo: mangroves at a purple-pink sunset (chosen by the designer), used on Home, Results, the listing, booking, checkout, emails and host screens.

## 0.27.1 · 2026-11-27
- Results: no tab bar (it is a step with Back); the Map button floats alone near the bottom, cards no longer hidden behind two layers.
- Results › Featured this month: no sort chips or filter button (the team's order stays as picked). Heading double space fixed.

## 0.27.0 · 2026-11-27
- Mangrove & fireflies (Pak Rahim, the complete story) leads Featured and every Results list.
- Results follows where you came from: Featured › See all → "Featured this month" (admin list, same order, no filters); More to explore › See all → "All experiences"; Search › Show → filtered results.

## 0.26.0 · 2026-11-27
- Search › Price per adult: slider, typed fields and the pop-up replaced by Home-style chips on the Search screen (Any price · Under RM 150 · RM 150–300 · RM 300+), bands set from Lokali's real prices; the result count updates on tap.
- Clear all now also resets the category and price chips.

## 0.25.5 · 2026-11-27
- Search › Price per adult: removed the price graph and the two repeated range labels; the slider and the Minimum / Maximum fields remain.

## 0.25.4 · 2026-11-27
- Search top says one thing once: the bar keeps only Close, "Where to?" (same words as Home's search pill) is the page title, and the field hint says what you can type: "Search places or experiences".

## 0.25.3 · 2026-11-27
- Search: removed the duplicate summary beside "Where?" (looked like current location) and "Category" (repeated the dark chip); "Near me" now shows "Petaling Jaya · your current location".

## 0.25.2 · 2026-11-27
- Search: even rows (18 px above and below each line), row titles 16/600 like list rows, "Search" title back to 16 px, search field is Home's pill with soft shadow, values in ink.
- Explore page `explore/search-ideas.html`: three search directions (Home-like, Photo cover, One step at a time).

## 0.25.1 · 2026-11-27
- Section lines like Home (hairline, 24 px inset) on Search (When, Who, Category, Price), Company enquiry, Booking confirmed, My booking, Host profile, Experience page, host Today, host Guest list and host Calendar. Search panels sit flat.
- Admin styling is paused; the app (guest + host) comes first.

## 0.25.0 · 2026-11-27
Home styling on every screen and every user, checked by an automatic audit until clean:
- Colours: icon tiles, avatars, tips and info boxes on light grey (no green/yellow tints); selected days, steps, progress and rating bars in near-black; switches near-black when on; one red (delete buttons use the brand red); chat send button red; admin main buttons red, admin active menu light grey.
- Type: only Home's sizes (11–16, 18, 20, 24, 28, 30); old 17 px body text → 15 px; 22 px titles → 24/20; 34–40 px numbers → 30.
- Shadows only on the search bar, hearts, photo buttons, the tab bar and overlays (sheets, dialogs, drawers); bottom action bars use a hairline.
- Wording: Results "18 nature trips"; Company page "Team days that give back" (as on Home).
- Last foreign names and towns localized (Chong Li Ying, Kavitha Rajan, Farid Ismail, Kelvin Ng; Bintulu, Kuala Terengganu…).

## 0.24.1 · 2026-11-27
- One chip everywhere, exactly Home's: 36 px pill, 13/500, hairline outline; selected = white on near-black (Results category, filter and sort chips no longer 44 px or green-tinted).
- "Top pick for your dates" on Results photos is a white pill instead of mustard yellow.

## 0.24.0 · 2026-11-27
- Airy for every user (guest, host, admin): no dark tops left (host Today, host intro, every admin page header and the admin dashboard are light).
- One shape family: every button, tab bar and segmented control is a pill; underline tabs became pill tabs (selected = dark, like Home's chips).
- One type scale, as on Home: page titles 28/700, section titles 18/700, sub-titles 16/600; admin titles 700.
- Photos keep rounded corners: host Today's next-experience photo, host intro photo (replaces the dark night illustration).
- Everyone is Malaysian: Emma Clarke → Aina Rahman (Petaling Jaya, same Aina who applies to host), Olivia Brown → Hidayah Salleh, Mark Thompson → Haziq Azman, Lukas Becker → Harith Zulkifli, Sophie Martin → Ong Mei Xin, Kenji Sato → Ganesh Pillai; foreign home towns → Malaysian towns; GBP estimates removed.
- Every experience card opens its own listing: title, photos, host, place, price, rating, group size and impact follow the chosen experience through Book, Sign in, Checkout and Confirmed (prices add up). Sections written only for Mangrove (story, itinerary, guide bio, reviews, FAQs) hide for the others; a reviewer note says so.

## 0.23.0 · 2026-11-27
- People photos match their names: Pak Rahim is an older fisherman (same man in his profile video), Kumar, Siti, Jaineh, Emma and Nur Aisyah re-shot. Photos load by link.
- New local hosts: Vinod Raj (reef, Pulau Tioman) and Bah Rusli (retreat, Royal Belum); Kumar keeps the Penang Hill canopy walk.
- Sign in before checkout only once per visit (Book → Sign in → Checkout; after that Book → Checkout).
- New screen: host emails for a new booking and a cancellation (Must), linked from host Bookings. 55 screens.
- Home category chips and Featured now come from Admin › Content (same names and order as admin).
- Suggestions marked in REQUIREMENTS.md: Q14 impact on Home, Q15 host profile, Q16 boat rental (not designed). Reviewer notes on Home, host profile and listing builder scope.

## 0.22.0 · 2026-11-27
- Airy on every phone screen: no card containers (sections sit flat, separated by space and a hairline); tinted info boxes become plain text with a side rule; host Today's next-experience card, the checkout summary and the email header turn light.
- Palette switch removed with all its code and tokens; one colour set (Airy). The presenter keeps a fixed neutral look (js/shell/theme.js).

## 0.21.0 · 2026-11-27
Brought in from the Canopy copy (teammate), rebuilt in Airy:
- Booking choice (date, time, guests, private boat) now carries through to Checkout and Confirmed; the sample booking shows only when nothing was chosen.
- Private boat: from "Book the whole boat" on the listing, dates that already have guests are greyed out.
- Company enquiry: fields show example text instead of filled values; new optional "Experience" field.
- Listing: What to bring, Etiquette, Food and dietary, Accessibility as rows that open sheets (allergy warning kept).
- New screen Host profile (suggestion, not in the brief), laid out like Account; opens from "View Pak Rahim's profile" in Meet your guide. The listing keeps its video.
- Pak Rahim replies "within an hour" everywhere, matching the profile.
- One bottom sheet style (large title, buttons pinned to the bottom) and one verified blue. 54 screens.

## 0.20.1 · 2026-11-27
- Card ratings: gold star icon, number stays black.
- More to explore tiles show the host face (26 px) with the verified tick.

## 0.20.0 · 2026-11-27
- Companies: the plain row at the bottom of Home is now a card with a photo, three facts (group size, activities, quote time) and a red "Plan a team day" button.
- More to explore: 16:9 tiles; fixed the grid running past the right edge (the one-line impact text was stretching the columns).

## 0.19.2 · 2026-11-27
- Home headline: "Small trips, real impact" (was "Travel that gives back").

## 0.19.1 · 2026-11-27
- Trust signals back on experience cards: one grey impact line with a leaf (one line, cut with … if long) and a blue verified tick on the host face.

## 0.19.0 · 2026-11-27
- Category chips on Home now filter in place: the dark highlight moves to the tapped chip, Featured shows that category's experiences with a count in the title, and More to explore hides. All restores the curated rows.

## 0.18.2 · 2026-11-27
- Featured: 32 px of the next card peeks in, and the row nudges left once the first time it is seen (off with reduced motion). No dots.

## 0.18.1 · 2026-11-27
- Home: removed the Pak Rahim quote card (not in the brief, sample text, did nothing).

## 0.18.0 · 2026-11-27
- Impact so far is now a background band, not a card: edge-to-edge photo that melts into the white page with long eased fades, numbers centred in white with shade only behind the text. No corners or border, so it no longer looks tappable.

## 0.17.0 · 2026-11-27
- Impact so far is now one banner photo (hands planting a seedling) with both numbers large in white on it, split by a thin line, a "Every booking adds to this" tag and a "Since 2025" lead line. Numbers count up on scroll.

## 0.16.0 · 2026-11-27
- Impact so far: each half now opens with a real photo (a woman at her craft stall for host earnings, young mangrove saplings for trees replanted), from Unsplash.

## 0.15.1 · 2026-11-27
- Card photos: removed the dark bottom fade, which showed square corners under the rounded photo.

## 0.15.0 · 2026-11-27
- Home lower half redesigned in the D style: hairline dividers between sections; host quote, impact and the companies row as outlined cards (radius 26); impact as one box split in two; "More to explore" as a 2-column grid of square tiles.
- One radius family on phone screens: photos and cards 26, small tiles 20, pills full.
- New calm cover photo on Home (the old one repeated the Belum retreat tile).

## 0.14.0 · 2026-11-27
- Home uses direction D: calm 16:9 cover photo under the status bar with "Travel that gives back" in white, search bar on the photo edge, dark "All" chip, wider featured cards.
- Hearts on experience cards: white circle, red when saved.
- Featured now matches the mock: one full-width card per view, 11:8 photo, reef first, larger title.

## 0.13.0 · 2026-11-27
- Smaller buttons on phone screens: main 44 px / 15, regular 40 px / 14, small 32 px / 13, icon buttons 36 px, inputs 46 px. Tap areas stay at least 44 px.
- Explore page `explore/home-directions.html` with four Home directions (A Postcard, B Cover story, C Calm feed, D Calm feed + 16:9 cover).

## 0.12.0 · 2026-11-27
- White page and neutral greys in every palette (text #222222, secondary #6A6A6A, lines #EBEBEB, fills #F7F7F7). Colour now comes from photos, brand red and the palette green.
- Larger featured cards on Home.

## 0.11.0 · 2026-11-27
- Brand red (bunga raya, #D7263D) on main buttons, search, active tab and saved hearts.
- Airy spacing on phone screens: 24 px margins, 40 px between sections; cards flat with a hairline.
- Cards: rating moved next to the price, impact line moved to the listing only.
- Home trimmed: category grid, "Where a booking goes", the companies block (now one link row) and the host promo removed; impact as plain numbers; host quote without a card; batik mark and "Updated today" removed; category chips as neutral outlines.

## 0.10.1 · 2026-11-27
- Lighter app background in all four palettes (forest #FAF7F0 → #FDFCF9). White cards keep their soft shadow.

## 0.10.0 · 2026-11-27
- Airy scale on all phone screens: smaller text (body 15, card titles 15, section titles 17), 20 px side margins, more space between sections.
- Lokali style on Home: "Travel that gives back" with a firefly glow, batik mark by the wordmark, colour-coded category chips, host quote from Pak Rahim; impact moved below the featured row.
- Experience cards show the host's face and "with <host> · place".

## 0.9.0 · 2026-11-27
- Calm pass on Home and the listing: light top on Home (no dark block), white impact cards, light tab bar with a soft green pill.
- Experience cards: only the rating and heart on the photo; impact line moved below the title as plain text.
- Brighter main photos for mangrove, canopy, Nyonya cooking and batik (from their own galleries).
- Listing: quick facts as two plain columns; section numbers in titles only show with Notes on; no line under the photo curve.

## 0.8.0 · 2026-11-27
- Interface text: explaining and chatty lines cut or shortened on all screens (list in COPY_REVIEW.md). Voice is now Neutral labels.
- Buttons name the next step ("Next: Business", "Go to checkout"); placeholders lose the "e.g." prefix.
- Reviewer notes hidden by default; Notes switch in the presenter shows them.

## 0.7.0 · 2026-11-27
- New style, Slow morning: lighter type, nothing heavier than semibold (600); small labels and tags at 500.
- Text greys in four steps (titles, body, secondary, footnotes), so footnotes no longer look as dark as titles.
- Softer shadow on the search bar.
- Left menu: "Host · Join" renamed to "Become a host".

## 0.6.0 · 2026-11-27
- "Back to lock screen" removed. Reloading the page now resets everything and opens the lock screen, then the first screen.

## 0.5.2 · 2026-11-27
- Right card: "Right now" block removed; it showed facts already on the screen.

## 0.5.1 · 2026-11-27
- Overview & sitemap moved out of the page list to its own page, `overview.html`; its links open screens in the prototype. Lock screen shows 53 screens.

## 0.5.0 · 2026-11-27
- One account, two modes (suggested, Q13): guest Account card changes with the host application (Become a host → In review → Switch to hosting), with a preview control for reviewers.
- Host Menu: "Switch to guest" explains it is the same account.
- Host sign-up step 1: details filled in from the Lokali account; note on the sign-in route for new hosts.
- Inboxes: a link between the guest and hosting inboxes.
- Q13 added to REQUIREMENTS.md, the overview page and USER_STORY.md.

## 0.4.1 · 2026-11-26
- One typeface: Montserrat removed, Inter everywhere.
- Admin review: action buttons wrap instead of pushing the page sideways at 1440 px.
- Admin approvals: no broken image in the applicant drawer.
- Star colour is now a token (`--star`); lock screen shows 54 screens.

## 0.4.0 · 2026-11-25
- Experience page: curved photo, price in header, quick-facts panel, "What to expect", sections as cards, photo itinerary.
- Search rebuilt (Airbnb structure, bottom sheets), results filter sheet, card refinements.
- iOS type scale on all phone screens.

## 0.3.0 · 2026-11-24
- Bold nature redesign rolled out to the remaining 45 screens (guest 13, host 16, admin 16): one focal message per screen, dark contour heroes, icon tiles, illustrations on success and empty states, scroll reveal.
- Accessibility re-checked: clean apart from the lock screen (no password yet). Fixed 3 heading levels and named the map preview link.
- Brief section numbers kept until final deploy.

## 0.2.2 · 2026-11-24
- Spacing audit against iOS layout guidance: 198 off-grid values snapped to the 4/8 pt grid (6→8, 10→12, 14→16 and so on).
- Navigation bar 52 → 44 pt; hero side margins 20 → 16 pt to match every other screen.
- Browser default button padding removed; spacing rules written into DESIGN.md.
- Fixed: the palette swatches change the area outside the phone frame too.

## 0.2.1 · 2026-11-24
- Accessibility pass (WCAG 2.2 AA, 44 × 44 targets): 440 findings → 0, plus 2 photo headers checked by eye.
- Darker muted text and status colours; 44 px icon buttons, chips, steppers, tabs, switches and standalone links on phone screens.
- Heading levels no longer skip; one h1 per screen; labels on fee policy fields; visible focus ring; impact stamps announced in words.
- Phone screens reflow at 200 % zoom (tab bar and checkout ticket fixed). Admin grows to 44 px controls on touch and narrow screens.

## 0.2.0 · 2026-11-24
- Bold nature direction: one focal message per screen, dark immersive heroes, display type.
- Floating dark pill tab bar and floating dark CTA bar on every phone screen.
- Icons sit in fixed square tiles (facts, list rows, KPIs) so they align everywhere.
- Illustration kit (js/art.js): river-at-dusk hero, 4 category scenes, success and trail scenes; contour and batik patterns.
- Impact visuals: stamps on cards, live count-up counters, animated money split.
- Redesigned: guest Home, Results, Experience page, Checkout; host Today; admin Dashboard.
- Fixed weekday badges that still showed the wrong day.

## 0.1.0 · 2026-11-24
- First prototype: 51 screens across Guest (mobile), Host (mobile) and Admin portal (desktop), plus an Overview & sitemap page.
- Brand tokens with four switchable palettes (Habitat Forest default), Montserrat + Inter, Phosphor icons.
- One booking story (LK-24817, Sun, 6 Dec 2026) consistent across guest, host and admin; weekdays checked against the 2026 calendar.
- Interface copy checked with the UX writing rules (sentence case, verb + noun buttons).
- REQUIREMENTS.md, USER_STORY.md, DESIGN.md and ADMIN_PLAN.md from the Vendor Brief and SOW sheet.
